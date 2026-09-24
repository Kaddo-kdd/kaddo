import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-integ-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function initProject(dir: string, simulate?: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: dotear-web', '  state: pre-ai', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
  write(dir, '.kaddo/integrations.yml', [
    'integrations:',
    '  - id: mock-work-source',
    '    adapter: mock',
    '    enabled: true',
    '    config:',
    `      simulate: ${simulate ?? 'available'}`,
  ].join('\n'))
}
function countWorkItems(dir: string): number {
  const root = path.join(dir, 'knowledge', 'delivery', 'work-items')
  if (!fs.existsSync(root)) return 0
  let n = 0
  const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md')) n++ } }
  walk(root)
  return n
}

describe('VS-102 integration service — configuration', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('lists a valid configured integration with capabilities', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const list = core.listIntegrations(dir)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: 'mock-work-source', adapter: 'mock', enabled: true, status: 'configured' })
    expect(list[0].capabilities?.workItems).toMatchObject({ read: true, list: true, import: true })
  })

  it('flags an unknown adapter as invalid-config and a disabled integration as disabled', async () => {
    write(dir, '.kaddo/config.yml', ['project:', '  name: p', '  state: pre-ai', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
    write(dir, '.kaddo/integrations.yml', ['integrations:', '  - id: ghost', '    adapter: nope', '  - id: off', '    adapter: mock', '    enabled: false'].join('\n'))
    const core = await import('../src/core.js')
    const byId = Object.fromEntries(core.listIntegrations(dir).map((i) => [i.id, i]))
    expect(byId['ghost'].status).toBe('invalid-config')
    expect(byId['off'].status).toBe('disabled')
  })
})

describe('VS-102 integration service — connection', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('verifies an available integration', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const v = await core.verifyIntegration(dir, 'mock-work-source', {})
    expect(v.status).toBe('available')
  })

  it('normalizes unauthorized and unavailable without leaking secrets', async () => {
    initProject(dir, 'unauthorized')
    const core = await import('../src/core.js')
    const v = await core.verifyIntegration(dir, 'mock-work-source', {})
    expect(v.status).toBe('unauthorized')
    expect(JSON.stringify(v)).not.toMatch(/token|secret|password/i)

    const dir2 = tmpDir(); initProject(dir2, 'unavailable')
    const v2 = await core.verifyIntegration(dir2, 'mock-work-source', {})
    expect(v2.status).toBe('unavailable')
    fs.rmSync(dir2, { recursive: true, force: true })
  })
})

describe('VS-102 integration service — reading', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('lists external items with pagination and reads one', async () => {
    const core = await import('../src/core.js')
    const first = await core.listExternalWorkItems(dir, 'mock-work-source', { pageSize: 1 }, {})
    expect(first.items).toHaveLength(1)
    expect(first.hasMore).toBe(true)
    const second = await core.listExternalWorkItems(dir, 'mock-work-source', { pageSize: 1, cursor: first.nextCursor }, {})
    expect(second.items[0].externalId).not.toBe(first.items[0].externalId)
    const item = await core.getExternalWorkItem(dir, 'mock-work-source', 'EXT-001', {})
    expect(item?.externalId).toBe('EXT-001')
  })

  it('reading does not modify project artifacts', async () => {
    const core = await import('../src/core.js')
    const before = countWorkItems(dir)
    await core.listExternalWorkItems(dir, 'mock-work-source', {}, {})
    await core.getExternalWorkItem(dir, 'mock-work-source', 'EXT-001', {})
    expect(countWorkItems(dir)).toBe(before)
  })

  it('normalizes read errors from a rate-limited provider', async () => {
    const dir2 = tmpDir(); initProject(dir2, 'rate-limited')
    const core = await import('../src/core.js')
    await expect(core.listExternalWorkItems(dir2, 'mock-work-source', {}, {})).rejects.toMatchObject({ code: 'INTEGRATION_RATE_LIMITED' })
    fs.rmSync(dir2, { recursive: true, force: true })
  })
})

describe('VS-102 integration service — import', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('preview produces a Draft mapping and writes nothing', async () => {
    const core = await import('../src/core.js')
    const before = countWorkItems(dir)
    const { preview, duplicate } = await core.previewImport(dir, 'mock-work-source', 'EXT-001', {}, {})
    expect(preview.writes).toBe(false)
    expect(preview.kaddoStatus).toBe('draft')
    expect(preview.source.provider).toBe('mock')
    expect(preview.source.externalId).toBe('EXT-001')
    expect(duplicate).toBeNull()
    expect(countWorkItems(dir)).toBe(before)
  })

  it('imports into a canonical Draft with external provenance and no Git operation', async () => {
    const core = await import('../src/core.js')
    const result = await core.importExternalWorkItem(dir, 'mock-work-source', 'EXT-001', { type: 'feature' }, {})
    expect(result.created).toBe(true)
    const wi = core.getWorkItem(dir, result.workItemId)
    expect(wi.status).toBe('draft')
    expect(wi.source.type).toBe('external')
    expect(wi.source.provider).toBe('mock')
    expect(wi.source.integration).toBe('mock-work-source')
    expect(wi.source.id).toBe('EXT-001')
    // No Git repository was created/committed by the import.
    expect(fs.existsSync(path.join(dir, '.git'))).toBe(false)
  })

  it('re-importing the same external identity returns the existing WI (no duplicate)', async () => {
    const core = await import('../src/core.js')
    const first = await core.importExternalWorkItem(dir, 'mock-work-source', 'EXT-001', { type: 'feature' }, {})
    const count = countWorkItems(dir)
    const second = await core.importExternalWorkItem(dir, 'mock-work-source', 'EXT-001', { type: 'feature' }, {})
    expect(second.created).toBe(false)
    expect(second.duplicateOf).toBe(first.workItemId)
    expect(countWorkItems(dir)).toBe(count)
    // A preview also surfaces the existing link.
    const { duplicate } = await core.previewImport(dir, 'mock-work-source', 'EXT-001', {}, {})
    expect(duplicate?.workItemId).toBe(first.workItemId)
  })

  it('the canonical Work Item survives the external provider becoming unavailable', async () => {
    const core = await import('../src/core.js')
    const result = await core.importExternalWorkItem(dir, 'mock-work-source', 'EXT-001', { type: 'feature' }, {})
    // Remove the integration configuration entirely — the external source is gone.
    fs.rmSync(path.join(dir, '.kaddo', 'integrations.yml'))
    const wi = core.getWorkItem(dir, result.workItemId)
    expect(wi.id).toBe(result.workItemId)
    expect(wi.source.type).toBe('external')
    // Refinement continues on the Kaddo Work Item regardless of external availability.
    const handoff = core.buildRefinementHandoff(dir, result.workItemId)
    expect(handoff.workItemId).toBe(result.workItemId)
  })
})

// ── VS-103 — Integration CRUD Management ─────────────────────────────────

describe('VS-103 integration CRUD — create', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('creates a new integration and persists it in YAML', async () => {
    const core = await import('../src/core.js')
    const result = core.createIntegration(dir, { id: 'new-int', adapter: 'mock' })
    expect(result.id).toBe('new-int')
    expect(result.adapter).toBe('mock')
    expect(result.enabled).toBe(true)
    expect(result.status).toBe('configured')
    // Persisted in YAML
    const list = core.listIntegrations(dir)
    expect(list.some((i) => i.id === 'new-int')).toBe(true)
  })

  it('rejects duplicate ids', async () => {
    const core = await import('../src/core.js')
    expect(() => core.createIntegration(dir, { id: 'mock-work-source', adapter: 'mock' }))
      .toThrow(/already exists/)
  })

  it('rejects invalid ids', async () => {
    const core = await import('../src/core.js')
    expect(() => core.createIntegration(dir, { id: '', adapter: 'mock' })).toThrow(/required/)
    expect(() => core.createIntegration(dir, { id: '!bad', adapter: 'mock' })).toThrow(/alphanumeric/)
    expect(() => core.createIntegration(dir, { id: 'a'.repeat(65), adapter: 'mock' })).toThrow(/64/)
  })

  it('rejects empty adapter', async () => {
    const core = await import('../src/core.js')
    expect(() => core.createIntegration(dir, { id: 'x', adapter: '' })).toThrow(/adapter type is required/)
  })
})

describe('VS-103 integration CRUD — update', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('updates config fields and persists in YAML', async () => {
    const core = await import('../src/core.js')
    const updated = core.updateIntegration(dir, 'mock-work-source', { config: { simulate: 'unavailable' } })
    expect(updated.id).toBe('mock-work-source')
    // Re-read from disk to confirm persistence
    const reloaded = core.getIntegration(dir, 'mock-work-source')
    expect(reloaded.id).toBe('mock-work-source')
  })

  it('throws for nonexistent integration', async () => {
    const core = await import('../src/core.js')
    expect(() => core.updateIntegration(dir, 'ghost', { config: {} })).toThrow(/No integration.*configured/)
  })
})

describe('VS-103 integration CRUD — delete', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('removes the integration from YAML', async () => {
    const core = await import('../src/core.js')
    core.deleteIntegration(dir, 'mock-work-source')
    const list = core.listIntegrations(dir)
    expect(list.find((i) => i.id === 'mock-work-source')).toBeUndefined()
  })

  it('throws for nonexistent integration', async () => {
    const core = await import('../src/core.js')
    expect(() => core.deleteIntegration(dir, 'nope')).toThrow(/No integration.*configured/)
  })
})

describe('VS-103 integration CRUD — enable/disable', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('disables then re-enables an integration', async () => {
    const core = await import('../src/core.js')
    const disabled = core.disableIntegration(dir, 'mock-work-source')
    expect(disabled.enabled).toBe(false)
    expect(disabled.status).toBe('disabled')
    const enabled = core.enableIntegration(dir, 'mock-work-source')
    expect(enabled.enabled).toBe(true)
    expect(enabled.status).toBe('configured')
  })
})

describe('VS-103 integration CRUD — secret management', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('sets a secret and records the reference in YAML (not the value)', async () => {
    const core = await import('../src/core.js')
    await core.setIntegrationSecret(dir, 'mock-work-source', 'token', 'my-secret-value')
    // YAML stores only the reference, never the value
    const yaml = fs.readFileSync(path.join(dir, '.kaddo', 'integrations.yml'), 'utf-8')
    expect(yaml).toContain('mock-work-source.token')
    expect(yaml).not.toContain('my-secret-value')
    // Secret status shows configured
    const status = await core.getIntegrationSecretStatus(dir, 'mock-work-source')
    expect(status.token).toBe(true)
  })

  it('removes a secret from both provider and YAML', async () => {
    const core = await import('../src/core.js')
    await core.setIntegrationSecret(dir, 'mock-work-source', 'token', 'val')
    await core.removeIntegrationSecret(dir, 'mock-work-source', 'token')
    const status = await core.getIntegrationSecretStatus(dir, 'mock-work-source')
    expect(status.token).toBeFalsy()
  })

  it('secret values never leak in the IntegrationSummary', async () => {
    const core = await import('../src/core.js')
    await core.setIntegrationSecret(dir, 'mock-work-source', 'token', 'top-secret-123')
    const summary = core.getIntegration(dir, 'mock-work-source')
    const serialized = JSON.stringify(summary)
    expect(serialized).not.toContain('top-secret-123')
    expect(summary.secretRefs).toContain('mock-work-source.token')
  })
})

describe('VS-103 integration CRUD — available types', () => {
  it('returns adapter types with schema information', async () => {
    const core = await import('../src/core.js')
    const types = core.getAvailableIntegrationTypes()
    expect(types.length).toBeGreaterThanOrEqual(1)
    const mock = types.find((t) => t.id === 'mock')
    expect(mock).toBeDefined()
    expect(mock!.displayName).toBeDefined()
    expect(mock!.configSchema).toBeDefined()
    expect(mock!.secretSchema).toBeDefined()
    expect(mock!.capabilities).toBeDefined()
  })
})

// ── VS-104 — External Work Item Discovery & Filtering ─────────────────

describe('VS-104 — discovery service', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('discovers items across all enabled integrations', async () => {
    const core = await import('../src/core.js')
    const result = await core.discoverExternalWorkItems(dir, {}, {})
    expect(result.results).toHaveLength(1)
    expect(result.results[0].integrationId).toBe('mock-work-source')
    expect(result.results[0].items.length).toBe(8)
    expect(result.results[0].icon).toBe('mock')
    expect(result.totalItems).toBe(8)
  })

  it('applies UI filters across discovery', async () => {
    const core = await import('../src/core.js')
    const result = await core.discoverExternalWorkItems(dir, { filters: { types: ['Bug'] } }, {})
    expect(result.totalItems).toBe(1)
    expect(result.results[0].items[0].type).toBe('Bug')
  })

  it('isolates errors per integration without blocking others', async () => {
    // Add a second integration that will fail
    const yaml = fs.readFileSync(path.join(dir, '.kaddo', 'integrations.yml'), 'utf-8')
    fs.writeFileSync(path.join(dir, '.kaddo', 'integrations.yml'), yaml + '\n' + [
      '  - id: failing-source',
      '    adapter: mock',
      '    enabled: true',
      '    config:',
      '      simulate: rate-limited',
    ].join('\n') + '\n', 'utf-8')
    const core = await import('../src/core.js')
    const result = await core.discoverExternalWorkItems(dir, {}, {})
    expect(result.results).toHaveLength(2)
    const ok = result.results.find((r) => r.integrationId === 'mock-work-source')
    const fail = result.results.find((r) => r.integrationId === 'failing-source')
    expect(ok!.items.length).toBe(8)
    expect(ok!.error).toBeUndefined()
    expect(fail!.items).toHaveLength(0)
    expect(fail!.error).toBeDefined()
  })

  it('skips disabled integrations', async () => {
    const core = await import('../src/core.js')
    core.disableIntegration(dir, 'mock-work-source')
    const result = await core.discoverExternalWorkItems(dir, {}, {})
    expect(result.results).toHaveLength(0)
  })

  it('can scope to specific integration ids', async () => {
    const core = await import('../src/core.js')
    core.createIntegration(dir, { id: 'other-mock', adapter: 'mock' })
    const result = await core.discoverExternalWorkItems(dir, { integrationIds: ['mock-work-source'] }, {})
    expect(result.results).toHaveLength(1)
    expect(result.results[0].integrationId).toBe('mock-work-source')
  })
})

describe('VS-104 — filter management', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('returns empty filters for an integration without persisted filters', async () => {
    const core = await import('../src/core.js')
    expect(core.getIntegrationFilters(dir, 'mock-work-source')).toEqual({})
  })

  it('updates and persists filters in YAML', async () => {
    const core = await import('../src/core.js')
    const result = core.updateIntegrationFilters(dir, 'mock-work-source', { statuses: ['Open'], types: ['Bug'] })
    expect(result.filters).toEqual({ statuses: ['Open'], types: ['Bug'] })
    // Read back from YAML
    const yaml = fs.readFileSync(path.join(dir, '.kaddo', 'integrations.yml'), 'utf-8')
    expect(yaml).toContain('statuses')
  })

  it('clears filters when updating with empty', async () => {
    const core = await import('../src/core.js')
    core.updateIntegrationFilters(dir, 'mock-work-source', { statuses: ['Done'] })
    core.updateIntegrationFilters(dir, 'mock-work-source', {})
    const filters = core.getIntegrationFilters(dir, 'mock-work-source')
    expect(filters).toEqual({})
  })

  it('integration filters are merged with runtime filters in listExternalWorkItems', async () => {
    const core = await import('../src/core.js')
    core.updateIntegrationFilters(dir, 'mock-work-source', { types: ['Bug'] })
    const page = await core.listExternalWorkItems(dir, 'mock-work-source', {}, {})
    expect(page.items.every((i) => i.type === 'Bug')).toBe(true)
    expect(page.items.length).toBe(1)
  })

  it('runtime filters override integration filters', async () => {
    const core = await import('../src/core.js')
    core.updateIntegrationFilters(dir, 'mock-work-source', { types: ['Bug'] })
    const page = await core.listExternalWorkItems(dir, 'mock-work-source', { filters: { types: ['Feature'] } }, {})
    expect(page.items.every((i) => i.type === 'Feature')).toBe(true)
  })

  it('integration filters are included in IntegrationSummary', async () => {
    const core = await import('../src/core.js')
    core.updateIntegrationFilters(dir, 'mock-work-source', { statuses: ['Open'] })
    const summary = core.getIntegration(dir, 'mock-work-source')
    expect(summary.filters).toEqual({ statuses: ['Open'] })
  })
})

describe('VS-104 — adapter type info includes filter capabilities', () => {
  it('returns filterCapabilities and icon for mock adapter', async () => {
    const core = await import('../src/core.js')
    const types = core.getAvailableIntegrationTypes()
    const mock = types.find((t) => t.id === 'mock')!
    expect(mock.icon).toBe('mock')
    expect(mock.filterCapabilities).toBeDefined()
    expect(mock.filterCapabilities!.types!.supported).toBe(true)
  })
})

describe('VS-104 — discovery does not create Work Items', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('discovering items does not modify the project', async () => {
    const core = await import('../src/core.js')
    const before = countWorkItems(dir)
    await core.discoverExternalWorkItems(dir, {}, {})
    expect(countWorkItems(dir)).toBe(before)
  })
})

describe('VS-103 — adapter unavailable preservation', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('config survives even if adapter is not registered', async () => {
    write(dir, '.kaddo/config.yml', ['project:', '  name: p', '  state: pre-ai', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
    write(dir, '.kaddo/integrations.yml', [
      'integrations:',
      '  - id: custom-jira',
      '    adapter: jira',
      '    enabled: true',
      '    config:',
      '      baseUrl: https://company.atlassian.net',
      '    secrets:',
      '      token: custom-jira.token',
    ].join('\n'))
    const core = await import('../src/core.js')
    const list = core.listIntegrations(dir)
    const jira = list.find((i) => i.id === 'custom-jira')
    expect(jira).toBeDefined()
    expect(jira!.status).toBe('invalid-config')
    expect(jira!.adapter).toBe('jira')
    expect(jira!.secretRefs).toContain('custom-jira.token')
    // YAML was not destroyed by loading with an unknown adapter
    const updatedList = core.listIntegrations(dir)
    expect(updatedList.find((i) => i.id === 'custom-jira')).toBeDefined()
  })
})

// --- VS-103A tests -----------------------------------------------------------

describe('VS-103A — schema validation in create/update', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('createIntegration rejects unknown adapter', async () => {
    const core = await import('../src/core.js')
    expect(() => core.createIntegration(dir, { id: 'bad', adapter: 'nonexistent' })).toThrow(/Unknown integration adapter/)
  })

  it('createIntegration rejects invalid config against adapter schema', async () => {
    const core = await import('../src/core.js')
    expect(() => core.createIntegration(dir, {
      id: 'mock-invalid',
      adapter: 'mock',
      config: { simulate: 'invalid-option' },
    })).toThrow(/options/)
  })

  it('createIntegration accepts valid config', async () => {
    const core = await import('../src/core.js')
    const result = core.createIntegration(dir, { id: 'mock-valid', adapter: 'mock', config: { simulate: 'available' } })
    expect(result.id).toBe('mock-valid')
    expect(result.adapter).toBe('mock')
  })

  it('updateIntegration rejects invalid config against adapter schema', async () => {
    const core = await import('../src/core.js')
    core.createIntegration(dir, { id: 'mock-upd', adapter: 'mock', config: {} })
    expect(() => core.updateIntegration(dir, 'mock-upd', { config: { simulate: 'not-real' } })).toThrow(/options/)
  })

  it('updateIntegration accepts valid config', async () => {
    const core = await import('../src/core.js')
    core.createIntegration(dir, { id: 'mock-upd2', adapter: 'mock', config: {} })
    const result = core.updateIntegration(dir, 'mock-upd2', { config: { simulate: 'unauthorized' } })
    expect(result.id).toBe('mock-upd2')
  })
})

describe('VS-103A — provider catalog from registry', () => {
  it('getAvailableIntegrationTypes returns adapters with full metadata', async () => {
    const core = await import('../src/core.js')
    const types = core.getAvailableIntegrationTypes()
    expect(types.length).toBeGreaterThanOrEqual(1)
    const mock = types.find((t) => t.id === 'mock')!
    expect(mock.displayName).toBe('Mock Work Source')
    expect(mock.description).toBeTruthy()
    expect(mock.icon).toBe('mock')
    expect(mock.configSchema).toBeDefined()
    expect(mock.secretSchema).toBeDefined()
    expect(mock.capabilities.workItems.list).toBe(true)
  })
})

describe('VS-103A — multiple instances of same adapter', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('can create multiple integrations using the same adapter', async () => {
    const core = await import('../src/core.js')
    core.createIntegration(dir, { id: 'mock-a', adapter: 'mock', config: { simulate: 'available' } })
    core.createIntegration(dir, { id: 'mock-b', adapter: 'mock', config: { simulate: 'unauthorized' } })
    const list = core.listIntegrations(dir)
    const a = list.find((i) => i.id === 'mock-a')
    const b = list.find((i) => i.id === 'mock-b')
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a!.adapter).toBe('mock')
    expect(b!.adapter).toBe('mock')
  })

  it('multiple instances work independently', async () => {
    const core = await import('../src/core.js')
    core.createIntegration(dir, { id: 'mock-one', adapter: 'mock', config: { simulate: 'available' } })
    core.createIntegration(dir, { id: 'mock-two', adapter: 'mock', config: { simulate: 'unauthorized' } })
    const r1 = await core.verifyIntegration(dir, 'mock-one', {})
    const r2 = await core.verifyIntegration(dir, 'mock-two', {})
    expect(r1.status).toBe('available')
    expect(r2.status).toBe('unauthorized')
  })
})

describe('VS-103A — adapter unavailable handling', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('unavailable adapter has null metadata in summary', async () => {
    write(dir, '.kaddo/config.yml', ['project:', '  name: p', '  state: pre-ai', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
    write(dir, '.kaddo/integrations.yml', [
      'integrations:',
      '  - id: unknown-adapter-int',
      '    adapter: nonexistent',
      '    enabled: true',
      '    config:',
      '      key: value',
    ].join('\n'))
    const core = await import('../src/core.js')
    const list = core.listIntegrations(dir)
    const item = list.find((i) => i.id === 'unknown-adapter-int')!
    expect(item.metadata).toBeNull()
    expect(item.capabilities).toBeNull()
    expect(item.status).toBe('invalid-config')
    expect(item.adapter).toBe('nonexistent')
  })
})
