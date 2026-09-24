import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import {
  parseIntegrationsConfig,
  serializeIntegrationsConfig,
  integrationConfigFromInput,
  resolveAllCredentials,
  createLocalSecretProvider,
  createEnvSecretProvider,
  createCompositeResolver,
  secretRefKey,
  type IntegrationConfig,
} from '../src/index.js'

function tmpDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'kaddo-mgmt-'))
  mkdirSync(join(d, '.kaddo'), { recursive: true })
  return d
}

function writeYaml(dir: string, data: unknown): void {
  writeFileSync(join(dir, '.kaddo', 'integrations.yml'), stringifyYaml(data), 'utf-8')
}

function readYaml(dir: string): unknown {
  return parseYaml(readFileSync(join(dir, '.kaddo', 'integrations.yml'), 'utf-8'))
}

describe('VS-103 — Integration Management', () => {
  let dir: string

  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  describe('Config serialization', () => {
    it('round-trips a config with secrets and credentials', () => {
      const configs: IntegrationConfig[] = [{
        id: 'company-jira',
        adapter: 'mock',
        enabled: true,
        config: { baseUrl: 'https://example.com', project: 'KAD' },
        credentials: { token: { env: 'JIRA_TOKEN' } },
        secrets: { apiKey: 'company-jira.apiKey' },
        timeoutMs: 5000,
      }]
      const serialized = serializeIntegrationsConfig(configs)
      const parsed = parseIntegrationsConfig(serialized, { adapterIds: new Set(['mock']) })
      expect(parsed.integrations).toHaveLength(1)
      expect(parsed.integrations[0].id).toBe('company-jira')
      expect(parsed.integrations[0].credentials.token.env).toBe('JIRA_TOKEN')
      expect(parsed.integrations[0].secrets.apiKey).toBe('company-jira.apiKey')
      expect(parsed.integrations[0].config.baseUrl).toBe('https://example.com')
    })

    it('integrationConfigFromInput fills defaults', () => {
      const config = integrationConfigFromInput({ id: 'test', adapter: 'mock' })
      expect(config.enabled).toBe(true)
      expect(config.credentials).toEqual({})
      expect(config.secrets).toEqual({})
      expect(config.config).toEqual({})
    })
  })

  describe('Secrets parsing', () => {
    it('accepts valid secret references', () => {
      const result = parseIntegrationsConfig({
        integrations: [{ id: 'x', adapter: 'mock', secrets: { token: 'x.token', apiKey: 'x.apiKey' } }],
      }, { adapterIds: new Set(['mock']) })
      expect(result.findings.filter((f) => f.level === 'blocking')).toHaveLength(0)
      expect(result.integrations[0].secrets).toEqual({ token: 'x.token', apiKey: 'x.apiKey' })
    })

    it('rejects secret values that look like actual credentials', () => {
      const result = parseIntegrationsConfig({
        integrations: [{ id: 'x', adapter: 'mock', secrets: { token: 'ghp_abcdefg1234567890abcdefg1234567890ab' } }],
      }, { adapterIds: new Set(['mock']) })
      expect(result.findings.some((f) => f.level === 'blocking' && f.message.includes('actual credential'))).toBe(true)
    })
  })

  describe('SecretProvider — local', () => {
    it('stores and retrieves a secret', async () => {
      const sp = createLocalSecretProvider(dir)
      await sp.set('my.secret', 'value123')
      expect(await sp.get('my.secret')).toBe('value123')
      expect(await sp.exists('my.secret')).toBe(true)
    })

    it('returns undefined for missing keys', async () => {
      const sp = createLocalSecretProvider(dir)
      expect(await sp.get('nonexistent')).toBeUndefined()
      expect(await sp.exists('nonexistent')).toBe(false)
    })

    it('deletes a secret', async () => {
      const sp = createLocalSecretProvider(dir)
      await sp.set('key', 'val')
      await sp.delete('key')
      expect(await sp.exists('key')).toBe(false)
    })

    it('does not write secrets to integrations.yml', async () => {
      const sp = createLocalSecretProvider(dir)
      await sp.set('my-int.token', 'super-secret')
      // The secrets file is separate from integrations.yml
      const secretsPath = join(dir, '.kaddo', '.secrets.json')
      expect(existsSync(secretsPath)).toBe(true)
      const secretsContent = readFileSync(secretsPath, 'utf-8')
      expect(secretsContent).toContain('super-secret')
      // integrations.yml should NOT contain the secret value
      const ymlPath = join(dir, '.kaddo', 'integrations.yml')
      if (existsSync(ymlPath)) {
        const ymlContent = readFileSync(ymlPath, 'utf-8')
        expect(ymlContent).not.toContain('super-secret')
      }
    })
  })

  describe('SecretProvider — env', () => {
    it('resolves from environment variables', async () => {
      const sp = createEnvSecretProvider({ MY_TOKEN: 'env-value' })
      expect(await sp.get('MY_TOKEN')).toBe('env-value')
      expect(await sp.exists('MY_TOKEN')).toBe(true)
    })

    it('is read-only', async () => {
      const sp = createEnvSecretProvider({})
      await expect(sp.set('x', 'y')).rejects.toThrow('read-only')
      await expect(sp.delete('x')).rejects.toThrow('read-only')
    })
  })

  describe('Composite resolver', () => {
    it('tries local first, then env', async () => {
      const local = createLocalSecretProvider(dir)
      await local.set('ref', 'local-value')
      const env = createEnvSecretProvider({ ref: 'env-value' })
      const resolver = createCompositeResolver(local, env)
      // Local wins
      expect(await resolver.resolve('ref')).toBe('local-value')
    })

    it('falls back to env when local is empty', async () => {
      const local = createLocalSecretProvider(dir)
      const env = createEnvSecretProvider({ ENV_VAR: 'from-env' })
      const resolver = createCompositeResolver(local, env)
      expect(await resolver.resolve('ENV_VAR')).toBe('from-env')
    })
  })

  describe('resolveAllCredentials', () => {
    it('merges env-var credentials and secret-provider references', async () => {
      const local = createLocalSecretProvider(dir)
      await local.set('x.apiKey', 'secret-val')
      const resolver = createCompositeResolver(local)

      const integration: IntegrationConfig = {
        id: 'x', adapter: 'mock', enabled: true,
        config: {}, credentials: { token: { env: 'MY_TOKEN' } },
        secrets: { apiKey: 'x.apiKey' },
      }

      const { credentials, missing } = await resolveAllCredentials(
        integration, resolver, { MY_TOKEN: 'env-token' },
      )
      expect(credentials.token).toBe('env-token')
      expect(credentials.apiKey).toBe('secret-val')
      expect(missing).toHaveLength(0)
    })

    it('reports missing secrets', async () => {
      const resolver = createCompositeResolver(createLocalSecretProvider(dir))
      const integration: IntegrationConfig = {
        id: 'x', adapter: 'mock', enabled: true,
        config: {}, credentials: {}, secrets: { token: 'x.token' },
      }
      const { missing } = await resolveAllCredentials(integration, resolver, {})
      expect(missing).toContain('x.token')
    })
  })

  describe('secretRefKey', () => {
    it('produces a deterministic reference', () => {
      expect(secretRefKey('company-jira', 'token')).toBe('company-jira.token')
    })
  })

  describe('Adapter metadata — configSchema and secretSchema', () => {
    it('mock adapter exposes schemas', async () => {
      const { createDefaultRegistry } = await import('../src/index.js')
      const registry = createDefaultRegistry()
      const mock = registry.get('mock')!
      expect(mock.metadata.configSchema).toBeDefined()
      expect(mock.metadata.configSchema!.simulate).toBeDefined()
      expect(mock.metadata.configSchema!.simulate.type).toBe('select')
      expect(mock.metadata.secretSchema).toBeDefined()
      expect(mock.metadata.secretSchema!.token).toBeDefined()
      expect(mock.metadata.secretSchema!.token.type).toBe('password')
    })
  })

  describe('Security', () => {
    it('secret values never appear in serialized config', () => {
      const configs: IntegrationConfig[] = [{
        id: 'x', adapter: 'mock', enabled: true, config: {},
        credentials: {}, secrets: { token: 'x.token' },
      }]
      const serialized = JSON.stringify(serializeIntegrationsConfig(configs))
      expect(serialized).not.toContain('super-secret')
      expect(serialized).toContain('x.token')
    })

    it('secret values never appear in YAML output', () => {
      const configs: IntegrationConfig[] = [{
        id: 'x', adapter: 'mock', enabled: true, config: {},
        credentials: {}, secrets: { token: 'x.token' },
      }]
      const yaml = stringifyYaml(serializeIntegrationsConfig(configs))
      expect(yaml).not.toContain('actual-password')
      expect(yaml).toContain('x.token')
    })

    it('secret provider file is separate from config', async () => {
      const sp = createLocalSecretProvider(dir)
      await sp.set('test.token', 'real-secret-value')
      writeFileSync(join(dir, '.kaddo', 'integrations.yml'), 'integrations: []')
      const ymlContent = readFileSync(join(dir, '.kaddo', 'integrations.yml'), 'utf-8')
      expect(ymlContent).not.toContain('real-secret-value')
    })
  })
})
