import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { runResourcesCreate, runResourcesUpdate, runResourcesDelete } from '../src/commands/resources.js'
import { getResource } from '../src/core/resources.js'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-rescmd2-')) }
function init(dir: string) {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), ['project:', '  name: t', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
}
function capture(): { lines: string[]; restore: () => void } {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => { lines.push(a.join(' ')) })
  return { lines, restore: () => spy.mockRestore() }
}

describe('WI-037 — resources CLI CRUD', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); init(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('create (flags) writes a canonical resource via Core (AC-01)', async () => {
    const cap = capture()
    await runResourcesCreate({ title: 'Supabase Main', type: 'database', provider: 'supabase', json: true }, dir)
    cap.restore()
    const res = JSON.parse(cap.lines.join('\n'))
    expect(res.id).toBe('RES-supabase-main')
    expect(getResource(dir, 'RES-supabase-main')!.resourceType).toBe('database')
  })

  it('update changes a field without losing others (AC-02)', async () => {
    await runResourcesCreate({ title: 'DB', type: 'database', json: true }, dir)
    runResourcesUpdate('RES-db', { provider: 'supabase', purpose: 'Main DB' }, dir)
    const got = getResource(dir, 'RES-db')!
    expect(got.provider).toBe('supabase')
    expect(got.purpose).toBe('Main DB')
  })

  it('delete with --yes removes the resource; references listed (AC-03)', async () => {
    await runResourcesCreate({ title: 'Orders DB', type: 'database', json: true }, dir)
    fs.mkdirSync(path.join(dir, 'knowledge/delivery/work-items/ready'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/delivery/work-items/ready/WI-900.md'), ['---', 'id: WI-900', 'title: X', 'type: feature', 'status: ready', 'resources:', '  - id: RES-orders-db', '    role: affected', '---', '', '# X', ''].join('\n'))

    const cap = capture()
    await runResourcesDelete('RES-orders-db', { yes: true }, dir)
    cap.restore()
    expect(cap.lines.join('\n')).toContain('WI-900')  // referenced-by shown
    expect(getResource(dir, 'RES-orders-db')).toBeNull()
    // The WI is untouched.
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/work-items/ready/WI-900.md'))).toBe(true)
  })
})
