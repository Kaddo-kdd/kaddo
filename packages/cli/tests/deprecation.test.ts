import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-dep-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

// A canonical Deprecation Plan with targets of several types and a dependency chain
// (function → stored proc → table): the table must retire LAST.
const PLAN = [
  '---',
  'id: DEP-001',
  'type: deprecation-plan',
  'title: Retire legacy credit scoring',
  'status: active',
  'targets:',
  '  - id: DEP-TGT-001',
  '    type: function',
  '    locator: packages/legacy/src/credit.ts#calcOldScore',
  '    title: calcOldScore',
  '    lifecycle: soft-deprecated',
  '    environments:',
  '      development: removed',
  '      test: removed',
  '      production: active',
  '    assessment:',
  '      unused_confidence: high',
  '      blast_radius: low',
  '      reversibility: easy',
  '    depends_on_removal: []',
  '  - id: DEP-TGT-002',
  '    type: database-object',
  '    locator: dbo.sp_OldCredit',
  '    lifecycle: candidate',
  '    resource: RES-main-database',
  '    depends_on_removal:',
  '      - DEP-TGT-001',
  '  - id: DEP-TGT-003',
  '    type: database-object',
  '    locator: dbo.OLD_CREDIT_RULES',
  '    lifecycle: candidate',
  '    resource: RES-main-database',
  '    depends_on_removal:',
  '      - DEP-TGT-002',
  '---',
  '',
  '# Purpose',
  '',
  'Retire the legacy VB credit scoring path safely.',
  '',
].join('\n')

describe('WI-047 — Deprecation Core Model', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('discovers plans under knowledge/legacy/deprecations and reads targets (AC-01, AC-02)', async () => {
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', PLAN)
    const core = await import('../src/core.js')

    const plans = core.getDeprecationPlans(dir)
    expect(plans).toHaveLength(1)
    expect(plans[0].id).toBe('DEP-001')
    expect(plans[0].targetCount).toBe(3)
    expect(plans[0].lifecycleCounts).toEqual({ 'soft-deprecated': 1, candidate: 2 })

    const plan = core.getDeprecationPlan(dir, 'DEP-001')!
    expect(plan.purpose).toContain('legacy VB credit scoring')
    const t1 = plan.targets.find((t) => t.id === 'DEP-TGT-001')!
    expect(t1.type).toBe('function')
    expect(t1.locator).toBe('packages/legacy/src/credit.ts#calcOldScore')
    expect(t1.assessment.unusedConfidence).toBe('high')
    const t2 = plan.targets.find((t) => t.id === 'DEP-TGT-002')!
    expect(t2.type).toBe('database-object')
    expect(t2.resource).toBe('RES-main-database')
    expect(t2.dependsOnRemoval).toEqual(['DEP-TGT-001'])
  })

  it('tracks per-environment state independently of the global lifecycle (AC-08)', async () => {
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', PLAN)
    const core = await import('../src/core.js')
    const plan = core.getDeprecationPlan(dir, 'DEP-001')!
    const t1 = plan.targets.find((t) => t.id === 'DEP-TGT-001')!
    expect(t1.lifecycle).toBe('soft-deprecated')
    expect(t1.environments).toEqual({ development: 'removed', test: 'removed', production: 'active' })
  })

  it('rejects a target marked completed/production-changed while an environment is still active (AC-08)', async () => {
    const core = await import('../src/core.js')
    const completedButActive = core.parseTarget({
      id: 'DEP-TGT-X', type: 'route', locator: 'POST /legacy/credit',
      lifecycle: 'completed', environments: { production: 'active' },
    })!
    const findings = core.validateTarget(completedButActive)
    expect(findings.some((f) => f.severity === 'error' && /still active/.test(f.message))).toBe(true)

    const prodChangedButActive = core.parseTarget({
      id: 'DEP-TGT-Y', type: 'route', locator: 'POST /legacy/credit',
      lifecycle: 'production-changed', environments: { production: 'active' },
    })!
    expect(core.validateTarget(prodChangedButActive).some((f) => f.severity === 'error')).toBe(true)
  })

  it('accepts deprecated-retained as a terminal outcome without flagging it (AC-13)', async () => {
    const core = await import('../src/core.js')
    const retained = core.parseTarget({
      id: 'DEP-TGT-R', type: 'database-object', locator: 'dbo.AUDIT_LOG',
      lifecycle: 'deprecated-retained', environments: { production: 'active' },
    })!
    expect(core.validateTarget(retained)).toHaveLength(0)
  })

  it('enforces lifecycle transitions; absence-of-reference never jumps straight to removal', async () => {
    const core = await import('../src/core.js')
    expect(core.isValidLifecycleTransition('candidate', 'usage-validated')).toBe(true)
    expect(core.isValidLifecycleTransition('candidate', 'removed-devtest')).toBe(false)
    expect(core.isValidLifecycleTransition('soft-deprecated', 'deprecated-retained')).toBe(true)
    expect(core.isValidLifecycleTransition('completed', 'observing')).toBe(false)
    expect(core.isValidLifecycleTransition('candidate', 'bogus')).toBe(false)
  })

  it('flags dependency integrity problems (unknown / self reference)', async () => {
    const plan = [
      '---', 'id: DEP-002', 'type: deprecation-plan', 'title: Bad deps', 'targets:',
      '  - id: DEP-TGT-A', '    type: function', '    locator: a.ts#a', '    lifecycle: candidate',
      '    depends_on_removal: [DEP-TGT-GHOST, DEP-TGT-A]',
      '---', '',
    ].join('\n')
    write(dir, 'knowledge/legacy/deprecations/DEP-002.md', plan)
    const core = await import('../src/core.js')
    const detail = core.getDeprecationPlan(dir, 'DEP-002')!
    const findings = core.validatePlan(detail)
    expect(findings.some((f) => /unknown target: DEP-TGT-GHOST/.test(f.message))).toBe(true)
    expect(findings.some((f) => /own removal/.test(f.message))).toBe(true)
  })

  it('ignores targets without an id and preserves unknown=unknown (no silent degradation)', async () => {
    const core = await import('../src/core.js')
    expect(core.parseTarget({ type: 'function' })).toBeNull()
    const t = core.parseTarget({ id: 'DEP-TGT-Z', type: 'function', locator: 'z.ts#z' })!
    // No assessment declared → stays null, never fabricated as "none"/"unused".
    expect(t.assessment).toEqual({ unusedConfidence: null, blastRadius: null, reversibility: null })
  })
})
