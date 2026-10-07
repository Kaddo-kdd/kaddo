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
