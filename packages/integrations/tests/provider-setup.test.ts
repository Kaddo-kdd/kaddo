import { describe, it, expect } from 'vitest'
import {
  createMockAdapter,
  createDefaultRegistry,
  MOCK_ADAPTER_ID,
  validateConfigAgainstSchema,
  type ConfigFieldSchema,
} from '../src/index.js'

describe('VS-103A — Provider descriptor', () => {
  it('mock adapter exposes complete provider metadata', () => {
    const adapter = createMockAdapter()
    const m = adapter.metadata
    expect(m.id).toBe('mock')
    expect(m.displayName).toBe('Mock Work Source')
    expect(m.description).toBeTruthy()
    expect(m.icon).toBe('mock')
    expect(m.configSchema).toBeDefined()
    expect(m.secretSchema).toBeDefined()
  })

  it('mock adapter configSchema uses select field type', () => {
    const adapter = createMockAdapter()
    const schema = adapter.metadata.configSchema!
    expect(schema.simulate).toBeDefined()
    expect(schema.simulate.type).toBe('select')
    expect(schema.simulate.options?.length).toBeGreaterThan(0)
    expect(schema.simulate.label).toBe('Simulation mode')
  })

  it('mock adapter secretSchema uses password field type', () => {
    const adapter = createMockAdapter()
    const schema = adapter.metadata.secretSchema!
    expect(schema.token).toBeDefined()
    expect(schema.token.type).toBe('password')
    expect(schema.token.label).toBe('API Token')
    expect(schema.token.required).toBe(false)
  })

  it('mock adapter declares capabilities', () => {
    const adapter = createMockAdapter()
    expect(adapter.capabilities.workItems.list).toBe(true)
    expect(adapter.capabilities.workItems.read).toBe(true)
    expect(adapter.capabilities.workItems.import).toBe(true)
  })

  it('registry is the provider catalog source', () => {
    const registry = createDefaultRegistry()
    const adapters = registry.list()
    expect(adapters.length).toBeGreaterThanOrEqual(2)
    const mock = adapters.find((a) => a.id === MOCK_ADAPTER_ID)
    expect(mock).toBeDefined()
    expect(mock!.metadata.displayName).toBeTruthy()
    expect(mock!.metadata.icon).toBeTruthy()
  })

  it('registry resolves adapter by id for form generation', () => {
    const registry = createDefaultRegistry()
    const adapter = registry.get('mock')
    expect(adapter).toBeDefined()
    expect(adapter!.metadata.configSchema).toBeDefined()
    expect(adapter!.metadata.secretSchema).toBeDefined()
    expect(adapter!.capabilities).toBeDefined()
  })
})

describe('VS-103A — Schema validation', () => {
  const schema: Record<string, ConfigFieldSchema> = {
    baseUrl: { type: 'url', required: true, label: 'Base URL' },
    name: { type: 'string', required: true, label: 'Name', placeholder: 'e.g. My Project' },
    port: { type: 'number', required: false, label: 'Port' },
    active: { type: 'boolean', required: false, label: 'Active' },
    mode: {
      type: 'select', required: true, label: 'Mode',
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
    },
    tags: {
      type: 'multi-select', required: false, label: 'Tags',
      options: [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }],
    },
    token: { type: 'password', required: true, label: 'Token' },
  }

  it('passes for valid config', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://example.com', name: 'test', mode: 'a', token: 'secret123' },
      schema,
    )
    expect(findings).toEqual([])
  })

  it('reports required fields that are missing', () => {
    const findings = validateConfigAgainstSchema({}, schema)
    const fields = findings.map((f) => f.field)
    expect(fields).toContain('baseUrl')
    expect(fields).toContain('name')
    expect(fields).toContain('mode')
    expect(fields).toContain('token')
    expect(fields).not.toContain('port')
    expect(fields).not.toContain('active')
    expect(fields).not.toContain('tags')
  })

  it('reports required fields that are empty strings', () => {
    const findings = validateConfigAgainstSchema({ baseUrl: '', name: '  ', mode: 'a', token: 't' }, schema)
    expect(findings.some((f) => f.field === 'baseUrl')).toBe(true)
    expect(findings.some((f) => f.field === 'name')).toBe(true)
  })

  it('validates URL fields', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'not-a-url', name: 'test', mode: 'a', token: 't' },
      schema,
    )
    expect(findings.some((f) => f.field === 'baseUrl' && /URL/.test(f.message))).toBe(true)
  })

  it('accepts valid URLs', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://jira.company.com', name: 'test', mode: 'a', token: 't' },
      schema,
    )
    expect(findings.filter((f) => f.field === 'baseUrl')).toEqual([])
  })

  it('validates number fields', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://x.com', name: 'test', mode: 'a', token: 't', port: 'abc' as unknown as number },
      schema,
    )
    expect(findings.some((f) => f.field === 'port')).toBe(true)
  })

  it('validates boolean fields', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://x.com', name: 'test', mode: 'a', token: 't', active: 'yes' as unknown as boolean },
      schema,
    )
    expect(findings.some((f) => f.field === 'active')).toBe(true)
  })

  it('validates select fields against options', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://x.com', name: 'test', mode: 'z', token: 't' },
      schema,
    )
    expect(findings.some((f) => f.field === 'mode' && /options/.test(f.message))).toBe(true)
  })

  it('validates multi-select fields', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://x.com', name: 'test', mode: 'a', token: 't', tags: ['x', 'invalid'] },
      schema,
    )
    expect(findings.some((f) => f.field === 'tags' && /invalid/.test(f.message))).toBe(true)
  })

  it('rejects non-array multi-select values', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://x.com', name: 'test', mode: 'a', token: 't', tags: 'x' },
      schema,
    )
    expect(findings.some((f) => f.field === 'tags' && /array/.test(f.message))).toBe(true)
  })

  it('skips optional fields when absent', () => {
    const findings = validateConfigAgainstSchema(
      { baseUrl: 'https://x.com', name: 'test', mode: 'a', token: 't' },
      schema,
    )
    expect(findings).toEqual([])
  })

  it('validates mock adapter config against its own schema', () => {
    const adapter = createMockAdapter()
    const findings = validateConfigAgainstSchema(
      { simulate: 'available' },
      adapter.metadata.configSchema!,
    )
    expect(findings).toEqual([])
  })

  it('rejects invalid mock adapter config', () => {
    const adapter = createMockAdapter()
    const findings = validateConfigAgainstSchema(
      { simulate: 'invalid-mode' },
      adapter.metadata.configSchema!,
    )
    expect(findings.some((f) => f.field === 'simulate')).toBe(true)
  })
})

describe('VS-103A — Provider extensibility', () => {
  it('new adapter appears in registry catalog without Admin changes', () => {
    const registry = createDefaultRegistry()
    const before = registry.list().length

    const fakeAdapter = {
      id: 'fake-jira',
      metadata: {
        id: 'fake-jira',
        displayName: 'Fake Jira',
        version: '1.0.0',
        description: 'A fake Jira adapter for testing',
        icon: 'jira',
        configSchema: {
          baseUrl: { type: 'url' as const, required: true, label: 'Jira URL' },
          projectKey: { type: 'string' as const, required: true, label: 'Project Key' },
        },
        secretSchema: {
          apiToken: { type: 'password' as const, required: true, label: 'API Token' },
        },
      },
      capabilities: { workItems: { list: true, read: true, import: true } },
      verifyConnection: async () => ({ status: 'available' as const, checkedAt: new Date().toISOString() }),
      listWorkItems: async () => ({ items: [], hasMore: false }),
      getWorkItem: async () => null,
    }

    registry.register(fakeAdapter)
    expect(registry.list().length).toBe(before + 1)
    expect(registry.get('fake-jira')?.metadata.displayName).toBe('Fake Jira')
    expect(registry.get('fake-jira')?.metadata.configSchema?.baseUrl.type).toBe('url')
    expect(registry.get('fake-jira')?.metadata.secretSchema?.apiToken.type).toBe('password')
  })
})
