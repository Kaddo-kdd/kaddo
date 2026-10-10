import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-depwrite-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function init(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: dw', '  state: legacy', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
}

describe('WI-049 — Deprecation mutation contract (Core)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); init(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('createPlan assigns sequential DEP ids and rejects duplicates by title', async () => {
    const core = await import('../src/core.js')
    const p1 = core.createPlan(dir, { title: 'Retire A' })
    expect(p1.id).toBe('DEP-001')
    const p2 = core.createPlan(dir, { title: 'Retire B' })
    expect(p2.id).toBe('DEP-002')
    expect(() => core.createPlan(dir, { title: 'Retire A' })).toThrow(/already exists/)
  })

  it('addTarget derives DEP-TGT ids and rejects an invalid lifecycle/type', async () => {
    const core = await import('../src/core.js')
    core.createPlan(dir, { title: 'P' })
    const t = core.addTarget(dir, 'DEP-001', { type: 'function', locator: 'a#a' })
    expect(t.targetId).toBe('DEP-TGT-001')
    expect(() => core.addTarget(dir, 'DEP-001', { type: 'bogus-type', locator: 'b', lifecycle: 'nope' })).toThrow()
  })

  it('updateTarget is no-lossy: preserves unknown target keys and other targets', async () => {
    const core = await import('../src/core.js')
    core.createPlan(dir, { title: 'P' })
    // Inject a target with an unknown custom key directly, then update via Core.
    const file = path.join(dir, 'knowledge/legacy/deprecations')
    const planFile = fs.readdirSync(file)[0]
    const full = path.join(file, planFile)
    const raw = fs.readFileSync(full, 'utf-8').replace(
      'targets: []',
      ['targets:',
        '  - id: DEP-TGT-001',
        '    type: function',
        '    locator: a#a',
        '    lifecycle: candidate',
        '    custom_note: keep-me',
      ].join('\n'),
    )
    fs.writeFileSync(full, raw)

    core.updateTarget(dir, 'DEP-001', 'DEP-TGT-001', { lifecycle: 'usage-validated' })
    const after = fs.readFileSync(full, 'utf-8')
    expect(after).toContain('custom_note: keep-me') // unknown key preserved
    expect(after).toContain('lifecycle: usage-validated')
  })

  it('removeTarget previews dependents without confirm; removes only with confirm', async () => {
    const core = await import('../src/core.js')
    core.createPlan(dir, { title: 'P' })
    core.addTarget(dir, 'DEP-001', { id: 'FN', type: 'function', locator: 'f#f' })
    core.addTarget(dir, 'DEP-001', { id: 'SP', type: 'database-object', locator: 'sp', dependsOnRemoval: ['FN'] })

    const preview = core.removeTarget(dir, 'DEP-001', 'FN')
    expect(preview.removed).toBe(false)
    expect(preview.preview!.dependents).toEqual(['SP'])
    expect(core.getDeprecationPlan(dir, 'DEP-001')!.targetCount).toBe(2)

    const done = core.removeTarget(dir, 'DEP-001', 'FN', { confirm: true })
    expect(done.removed).toBe(true)
    expect(core.getDeprecationPlan(dir, 'DEP-001')!.targetCount).toBe(1)
  })

  it('throws typed NOT_FOUND for a missing plan or target', async () => {
    const core = await import('../src/core.js')
    expect(() => core.addTarget(dir, 'DEP-404', { type: 'function', locator: 'x' })).toThrow(/not found/)
    core.createPlan(dir, { title: 'P' })
    expect(() => core.updateTarget(dir, 'DEP-001', 'DEP-TGT-404', { lifecycle: 'disabled' })).toThrow(/not found/)
  })
})
