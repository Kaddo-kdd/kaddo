import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-reswrite-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function init(dir: string, withModules = false) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: rw', '  state: new', '  structure: ' + (withModules ? 'multirepo' : 'monorepo'), 'team:', '  size: small'].join('\n'))
  if (withModules) {
    write(dir, '.kaddo/modules.yml', ['modules:', '  - id: orders-api', '    name: orders-api', '    path: packages/orders-api', '  - id: billing-worker', '    name: billing-worker', '    path: packages/billing-worker'].join('\n'))
  }
}

describe('WI-036 — Resource management Core', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('createResource persists a canonical artifact; getResource reads it back (AC-01, AC-04)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    const res = core.createResource(dir, { title: 'Supabase Main', resourceType: 'database', provider: 'supabase', scope: { type: 'system' } })
    expect(res.id).toBe('RES-supabase-main')
    expect(res.path).toBe('knowledge/tech/resources/supabase-main.md')
    const got = core.getResource(dir, 'RES-supabase-main')!
    expect(got.title).toBe('Supabase Main')
    expect(got.resourceType).toBe('database')
    expect(got.scope).toEqual({ type: 'system', module: null })
  })

  it('never persists credential values — only reference names (AC-05)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    core.createResource(dir, { title: 'DB', resourceType: 'database', authentication: { mode: 'external', refs: ['SUPABASE_ACCESS_TOKEN', 'PWD=secret123'] } })
    const got = core.getResource(dir, 'RES-db')!
    expect(got.authRefs).toEqual(['SUPABASE_ACCESS_TOKEN'])
    const raw = fs.readFileSync(path.join(dir, got.path), 'utf-8')
    expect(raw).not.toContain('secret123')
  })

  it('detects duplicate titles (AC-08)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    core.createResource(dir, { title: 'DB', resourceType: 'database' })
    expect(() => core.createResource(dir, { title: 'DB', resourceType: 'api' })).toThrow(/already exists/)
  })

  it('validates modules against .kaddo/modules.yml (AC-06, AC-07)', async () => {
    init(dir, true)
    const core = await import('../src/core.js')
    const ok = core.createResource(dir, { title: 'Orders DB', resourceType: 'database', scope: { type: 'module', module: 'orders-api' } })
    expect(ok.findings.filter((f) => f.level === 'error')).toEqual([])
    const got = core.getResource(dir, ok.id)!
    expect(got.scope).toEqual({ type: 'module', module: 'orders-api' })

    const bad = core.createResource(dir, { title: 'Weird', resourceType: 'service', modules: ['unknown-api'] })
    expect(bad.findings.some((f) => f.message.includes('unknown-api'))).toBe(true)
  })

  it('updateResource is no-lossy (keeps unknown keys + body) (AC-02)', async () => {
    init(dir)
    write(dir, 'knowledge/tech/resources/db.md', ['---', 'type: project-resource', 'id: RES-db', 'title: DB', 'resource_type: database', 'provider: supabase', 'custom_key: keep-me', '---', '', '# Purpose', '', 'Original purpose.', ''].join('\n'))
    const core = await import('../src/core.js')
    core.updateResource(dir, 'RES-db', { accessInterfaces: [{ type: 'cli', tool: 'supabase' }] })
    const raw = fs.readFileSync(path.join(dir, 'knowledge/tech/resources/db.md'), 'utf-8')
    expect(raw).toContain('custom_key: keep-me')   // unknown key preserved
    expect(raw).toContain('Original purpose.')      // body preserved
    const got = core.getResource(dir, 'RES-db')!
    expect(got.interfaces.map((i) => i.type)).toEqual(['cli'])
  })

  it('deleteResource previews references, then removes only the resource (AC-03, AC-12)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    core.createResource(dir, { title: 'Orders DB', resourceType: 'database' })
    write(dir, 'knowledge/delivery/work-items/ready/WI-900.md', ['---', 'id: WI-900', 'title: X', 'type: feature', 'status: ready', 'resources:', '  - id: RES-orders-db', '    role: affected', '---', '', '# X', ''].join('\n'))

    const preview = core.deleteResource(dir, 'RES-orders-db')
    expect(preview.deleted).toBe(false)
    expect(preview.preview!.references).toEqual([{ kind: 'work-item', id: 'WI-900', role: 'affected', path: 'knowledge/delivery/work-items/ready/WI-900.md' }])
    expect(core.getResource(dir, 'RES-orders-db')).toBeTruthy()  // not deleted yet

    const done = core.deleteResource(dir, 'RES-orders-db', { confirm: true })
    expect(done.deleted).toBe(true)
    expect(core.getResource(dir, 'RES-orders-db')).toBeNull()
    // The WI reference is left intact (no hidden side effects).
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/work-items/ready/WI-900.md'))).toBe(true)
  })
})

describe('WI-069 — non-secret connection profiles', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('persists connection coordinates and reads them back by environment/interface (AC-02, AC-03)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    core.createResource(dir, {
      title: 'Orders DB', resourceType: 'database',
      connectionProfiles: [{
        environment: 'production', interface: 'sql',
        coordinates: [
          { key: 'host', value: 'db.internal.example.com' },
          { key: 'port', value: '5432' },
          { key: 'database', value: 'orders' },
          { key: 'username', value: 'orders_rw' },
        ],
      }],
    })
    const got = core.getResource(dir, 'RES-orders-db')!
    expect(got.connectionProfiles).toHaveLength(1)
    const p = got.connectionProfiles[0]
    expect(p.environment).toBe('production')
    expect(p.interface).toBe('sql')
    expect(p.coordinates).toEqual([
      { key: 'host', value: 'db.internal.example.com' },
      { key: 'port', value: '5432' },
      { key: 'database', value: 'orders' },
      { key: 'username', value: 'orders_rw' },
    ])
  })

  it('rejects a secret-looking coordinate with a clear, value-free error — and writes nothing (AC-13, AC-14)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    expect(() => core.createResource(dir, {
      title: 'Leaky DB', resourceType: 'database',
      connectionProfiles: [{ environment: 'production', coordinates: [{ key: 'password', value: 'hunter2-very-secret' }] }],
    })).toThrow(/looks like a secret/i)
    try {
      core.createResource(dir, {
        title: 'Leaky DB 2', resourceType: 'database',
        connectionProfiles: [{ coordinates: [{ key: 'token', value: 'ghp_abcdefghijklmnopqrstuvwxyz0123456789' }] }],
      })
    } catch (e) {
      // The message names the field, never the value.
      expect((e as Error).message).toContain('token')
      expect((e as Error).message).not.toContain('ghp_')
    }
    // Nothing was persisted for the rejected resources.
    expect(fs.existsSync(path.join(dir, 'knowledge/tech/resources/leaky-db.md'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge/tech/resources/leaky-db-2.md'))).toBe(false)
  })

  it('redacts a hand-authored secret coordinate on read, never exposing the value (AC-04)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    write(dir, 'knowledge/tech/resources/hand.md', [
      '---', 'type: project-resource', 'id: RES-hand', 'title: Hand', 'resource_type: database',
      'connection_profiles:', '  - environment: production', '    coordinates:',
      '      host: db.example.com', '      api_key: sk-supersecretvalue0123456789',
      '---', '', '# Purpose', '', 'x', '',
    ].join('\n'))
    const got = core.getResource(dir, 'RES-hand')!
    const coords = got.connectionProfiles[0].coordinates
    expect(coords.find((c) => c.key === 'host')!.value).toBe('db.example.com')
    const apiKey = coords.find((c) => c.key === 'api_key')!
    expect(apiKey.value).not.toContain('supersecret')
    expect(apiKey.value).toBe(core.REDACTED_COORDINATE)
  })

  it('preserves existing connection profiles when another field is updated (AC-15)', async () => {
    init(dir)
    const core = await import('../src/core.js')
    core.createResource(dir, {
      title: 'Keep DB', resourceType: 'database',
      connectionProfiles: [{ environment: 'production', coordinates: [{ key: 'host', value: 'keep.example.com' }] }],
    })
    // Update only the provider — no connectionProfiles passed.
    core.updateResource(dir, 'RES-keep-db', { provider: 'acme' })
    const got = core.getResource(dir, 'RES-keep-db')!
    expect(got.provider).toBe('acme')
    expect(got.connectionProfiles[0].coordinates).toEqual([{ key: 'host', value: 'keep.example.com' }])
  })

  it('looksLikeSecretCoordinate flags credentials but allows plain config', async () => {
    const core = await import('../src/core.js')
    expect(core.looksLikeSecretCoordinate('password', 'anything')).toBe(true)
    expect(core.looksLikeSecretCoordinate('api_key', 'x')).toBe(true)
    expect(core.looksLikeSecretCoordinate('token', 'ghp_abcdefghijklmnopqrstuvwxyz0123')).toBe(true)
    expect(core.looksLikeSecretCoordinate('host', 'db.example.com')).toBe(false)
    expect(core.looksLikeSecretCoordinate('port', '5432')).toBe(false)
    expect(core.looksLikeSecretCoordinate('username', 'app_rw')).toBe(false)
  })
})
