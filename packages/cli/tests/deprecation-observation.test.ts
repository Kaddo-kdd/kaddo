import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-depobs-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

describe('WI-051 — Soft Deprecation + Observation', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('enforces the soft-deprecation lifecycle ordering (no skipping to removal) (AC-07)', async () => {
    const core = await import('../src/core.js')
    expect(core.isValidLifecycleTransition('soft-deprecated', 'disabled')).toBe(true)
    expect(core.isValidLifecycleTransition('disabled', 'removed-devtest')).toBe(true)
    expect(core.isValidLifecycleTransition('removed-devtest', 'production-ready')).toBe(true)
    expect(core.isValidLifecycleTransition('production-changed', 'observing')).toBe(true)
    expect(core.isValidLifecycleTransition('observing', 'completed')).toBe(true)
    // Cannot jump straight from soft-deprecated to completed/removed.
    expect(core.isValidLifecycleTransition('soft-deprecated', 'completed')).toBe(false)
    expect(core.isValidLifecycleTransition('soft-deprecated', 'removed-devtest')).toBe(false)
  })

  it('becomes eligible only when window elapsed AND all exit criteria met — never auto-removed (AC-09)', async () => {
    const core = await import('../src/core.js')
    const target = core.parseTarget({
      id: 'T', type: 'function', locator: 'f#f', lifecycle: 'soft-deprecated',
      soft_deprecation: {
        strategy: 'deprecation-warning', started_at: '2026-01-01', observation_window_days: 30,
        exit_criteria: [{ description: 'no runtime hits', met: true }, { description: 'consumers migrated', met: true }],
      },
    })!
    // Before the window elapses: not eligible even though criteria are met.
    const early = core.observationStatus(target, new Date('2026-01-15'))
    expect(early.windowElapsed).toBe(false)
    expect(early.eligibleForRemovalReview).toBe(false)
    // After the window with all criteria met: eligible for REVIEW (not removal).
    const after = core.observationStatus(target, new Date('2026-03-01'))
    expect(after.windowElapsed).toBe(true)
    expect(after.allCriteriaMet).toBe(true)
    expect(after.eligibleForRemovalReview).toBe(true)
    expect(after.reasons.join(' ')).toMatch(/human decision/i)
  })

  it('stays ineligible when a criterion is unmet, and never fakes eligibility without criteria', async () => {
    const core = await import('../src/core.js')
    const unmet = core.parseTarget({
      id: 'U', type: 'route', locator: 'POST /x', lifecycle: 'soft-deprecated',
      soft_deprecation: { started_at: '2026-01-01', observation_window_days: 10, exit_criteria: [{ description: 'x', met: false }] },
    })!
    const s = core.observationStatus(unmet, new Date('2026-06-01'))
    expect(s.windowElapsed).toBe(true)
    expect(s.eligibleForRemovalReview).toBe(false)
    expect(s.reasons.join(' ')).toMatch(/not all met/i)

    // Window elapsed but NO criteria declared → not eligible (absence is never "all met").
    const noCriteria = core.parseTarget({
      id: 'N', type: 'function', locator: 'n#n', lifecycle: 'soft-deprecated',
      soft_deprecation: { started_at: '2026-01-01', observation_window_days: 10 },
    })!
    const ns = core.observationStatus(noCriteria, new Date('2026-06-01'))
    expect(ns.eligibleForRemovalReview).toBe(false)
    expect(ns.reasons.join(' ')).toMatch(/No exit criteria/i)
  })

  it('an undeclared observation window is simply not eligible, with an explanation', async () => {
    const core = await import('../src/core.js')
    const t = core.parseTarget({ id: 'P', type: 'function', locator: 'p#p', lifecycle: 'candidate' })!
    const s = core.observationStatus(t)
    expect(s.declared).toBe(false)
    expect(s.eligibleForRemovalReview).toBe(false)
  })

  it('deprecated-retained is a terminal outcome that does NOT block the plan waves (AC-13 reinforced)', async () => {
    const core = await import('../src/core.js')
    // FN retained; SP depends on FN's removal. Retained counts as retired → SP unblocks.
    write(dir, 'knowledge/legacy/deprecations/DEP-020.md', [
      '---', 'id: DEP-020', 'type: deprecation-plan', 'title: Retain + retire', 'targets:',
      '  - id: FN', '    type: database-object', '    locator: dbo.AUDIT', '    lifecycle: deprecated-retained',
      '  - id: SP', '    type: function', '    locator: f#f', '    lifecycle: candidate',
      '    depends_on_removal: [FN]',
      '---', '',
    ].join('\n'))
    const plan = core.getDeprecationPlan(dir, 'DEP-020')!
    const retained = plan.targets.find((t) => t.id === 'FN')!
    expect(core.isRetainedOutcome(retained)).toBe(true)
    // SP is eligible because its dependency FN is retained (not blocking).
    expect(core.targetsEligibleForRemoval(plan)).toContain('SP')
    // Waves still resolve (no blocked targets).
    expect(core.deriveRemovalWaves(plan).blocked).toHaveLength(0)
  })

  it('environmentSummary distinguishes Dev/Test removal from production', async () => {
    const core = await import('../src/core.js')
    const t = core.parseTarget({
      id: 'E', type: 'route', locator: 'POST /y', lifecycle: 'removed-devtest',
      environments: { development: 'removed', test: 'removed', production: 'active' },
    })!
    const env = core.environmentSummary(t)
    expect(env.removedInDevTest).toBe(true)
    expect(env.productionActive).toBe(true)
  })

  it('planIntelligence surfaces observation per target', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/legacy/deprecations/DEP-021.md', [
      '---', 'id: DEP-021', 'type: deprecation-plan', 'title: Obs', 'targets:',
      '  - id: T', '    type: function', '    locator: f#f', '    lifecycle: soft-deprecated',
      '    soft_deprecation:', '      started_at: "2026-01-01"', '      observation_window_days: 30',
      '      exit_criteria:', '        - description: migrated', '          met: true',
      '---', '',
    ].join('\n'))
    const plan = core.getDeprecationPlan(dir, 'DEP-021')!
    const intel = core.planIntelligence(plan)
    const t = intel.targets.find((x) => x.id === 'T')!
    expect(t.observation.declared).toBe(true)
    expect(t.observation.criteriaTotal).toBe(1)
  })
})
