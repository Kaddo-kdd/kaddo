import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-depint-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

// function calcOldScore → sp_OldCredit → OLD_CREDIT_RULES: the table must retire LAST.
const CHAIN = [
  '---',
  'id: DEP-010',
  'type: deprecation-plan',
  'title: Retire legacy credit scoring',
  'targets:',
  '  - id: DEP-TGT-FN',
  '    type: function',
  '    locator: legacy/credit.ts#calcOldScore',
  '    lifecycle: candidate',
  '  - id: DEP-TGT-SP',
  '    type: database-object',
  '    locator: dbo.sp_OldCredit',
  '    lifecycle: candidate',
  '    depends_on_removal: [DEP-TGT-FN]',
  '  - id: DEP-TGT-TBL',
  '    type: database-object',
  '    locator: dbo.OLD_CREDIT_RULES',
  '    lifecycle: candidate',
  '    depends_on_removal: [DEP-TGT-SP]',
  '---',
  '',
].join('\n')

describe('WI-048 — Discovery + Dependency Intelligence', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('orders a transitive chain function→SP→table, table last (AC-06)', async () => {
    write(dir, 'knowledge/legacy/deprecations/DEP-010.md', CHAIN)
    const core = await import('../src/core.js')
    const plan = core.getDeprecationPlan(dir, 'DEP-010')!
    const { waves, blocked } = core.deriveRemovalWaves(plan)
    expect(blocked).toHaveLength(0)
    expect(waves).toEqual([['DEP-TGT-FN'], ['DEP-TGT-SP'], ['DEP-TGT-TBL']])
    // The table is never in the first wave.
    expect(waves[0]).not.toContain('DEP-TGT-TBL')
  })

  it('marks blocked targets for cycles and dangling deps, without dropping the rest', async () => {
    const core = await import('../src/core.js')
    // Cycle A↔B plus a healthy C.
    const planCycle = core.getDeprecationPlan(dir, 'x') // placeholder, replaced below
    expect(planCycle).toBeNull()

    write(dir, 'knowledge/legacy/deprecations/DEP-011.md', [
      '---', 'id: DEP-011', 'type: deprecation-plan', 'title: Bad', 'targets:',
      '  - id: A', '    type: function', '    locator: a#a', '    lifecycle: candidate',
      '    depends_on_removal: [B]',
      '  - id: B', '    type: function', '    locator: b#b', '    lifecycle: candidate',
      '    depends_on_removal: [A]',
      '  - id: C', '    type: function', '    locator: c#c', '    lifecycle: candidate',
      '    depends_on_removal: [GHOST]',
      '---', '',
    ].join('\n'))
    const plan = core.getDeprecationPlan(dir, 'DEP-011')!
    const { waves, blocked } = core.deriveRemovalWaves(plan)
    // C's only dep is dangling, so C is orderable (dangling dep is reported, not enforced).
    expect(waves.flat()).toContain('C')
    expect(blocked.some((b) => b.target === 'C' && /unknown target: GHOST/.test(b.reason))).toBe(true)
    // A and B form a cycle → blocked, not ordered.
    expect(blocked.some((b) => b.target === 'A' && /cycle/i.test(b.reason))).toBe(true)
    expect(blocked.some((b) => b.target === 'B' && /cycle/i.test(b.reason))).toBe(true)
    expect(waves.flat()).not.toContain('A')
  })

  it('derives high confidence from observed + inferred no-usage, never from absence (AC-05)', async () => {
    const core = await import('../src/core.js')
    // Endpoint: static=0 (observed), runtime=0/90d (observed), external=none-known (inferred).
    const endpoint = core.parseTarget({
      id: 'DEP-TGT-EP', type: 'route', locator: 'POST /legacy/credit', lifecycle: 'candidate',
      usage_evidence: {
        static: { status: 'no-usage', quality: 'observed-fact', detail: '0 references' },
        runtime: { status: 'no-usage', quality: 'observed-fact', detail: '0 calls / 90d' },
        external_consumers: { status: 'no-usage', quality: 'inferred', detail: 'none known' },
      },
    })!
    const a = core.deriveUnusedConfidence(endpoint.usageEvidence)
    expect(a.confidence).toBe('high')
    expect(a.requiresHumanConfirmation).toBe(true) // never auto-remove
    // database + human_review were not evaluated — must be surfaced, not treated as no-usage.
    expect(a.rationale.join(' ')).toMatch(/[Nn]ot evaluated/)
  })

  it('caps at medium when a signal is explicitly unknown', async () => {
    const core = await import('../src/core.js')
    const t = core.parseTarget({
      id: 'DEP-TGT-U', type: 'function', locator: 'z#z', lifecycle: 'candidate',
      usage_evidence: {
        static: { status: 'no-usage', quality: 'observed-fact' },
        runtime: { status: 'no-usage', quality: 'observed-fact' },
        external_consumers: { status: 'unknown', quality: 'unknown', detail: 'cannot tell' },
      },
    })!
    expect(core.deriveUnusedConfidence(t.usageEvidence).confidence).toBe('medium')
  })

  it('returns insufficient-evidence when nothing strong points to no-usage (no unused-by-absence)', async () => {
    const core = await import('../src/core.js')
    const empty = core.parseTarget({ id: 'DEP-TGT-E', type: 'function', locator: 'e#e' })!
    const a = core.deriveUnusedConfidence(empty.usageEvidence)
    expect(a.confidence).toBe('insufficient-evidence')
    expect(a.requiresHumanConfirmation).toBe(true)
  })

  it('flags usage-found as in-use (not a candidate)', async () => {
    const core = await import('../src/core.js')
    const t = core.parseTarget({
      id: 'DEP-TGT-IU', type: 'function', locator: 'u#u',
      usage_evidence: { runtime: { status: 'usage-found', quality: 'observed-fact', detail: '12 calls today' } },
    })!
    const a = core.deriveUnusedConfidence(t.usageEvidence)
    expect(a.confidence).toBe('in-use')
    expect(a.requiresHumanConfirmation).toBe(false)
  })

  it('eligibility only lists targets whose dependents are already retired', async () => {
    const core = await import('../src/core.js')
    // SP depends on FN; until FN is retired, SP is not eligible.
    write(dir, 'knowledge/legacy/deprecations/DEP-012.md', [
      '---', 'id: DEP-012', 'type: deprecation-plan', 'title: Partial', 'targets:',
      '  - id: FN', '    type: function', '    locator: f#f', '    lifecycle: removed-devtest',
      '  - id: SP', '    type: database-object', '    locator: sp', '    lifecycle: candidate',
      '    depends_on_removal: [FN]',
      '  - id: TBL', '    type: database-object', '    locator: tbl', '    lifecycle: candidate',
      '    depends_on_removal: [SP]',
      '---', '',
    ].join('\n'))
    const plan = core.getDeprecationPlan(dir, 'DEP-012')!
    const eligible = core.targetsEligibleForRemoval(plan)
    expect(eligible).toContain('SP')   // FN already retired
    expect(eligible).not.toContain('TBL') // SP not retired yet
    expect(eligible).not.toContain('FN')  // already retired
  })

  it('planIntelligence projects waves, eligibility and per-target assessment', async () => {
    write(dir, 'knowledge/legacy/deprecations/DEP-010.md', CHAIN)
    const core = await import('../src/core.js')
    const plan = core.getDeprecationPlan(dir, 'DEP-010')!
    const intel = core.planIntelligence(plan)
    expect(intel.waves.waves[0]).toEqual(['DEP-TGT-FN'])
    const fn = intel.targets.find((t) => t.id === 'DEP-TGT-FN')!
    expect(fn.blockedBy).toEqual([]) // no deps
    const tbl = intel.targets.find((t) => t.id === 'DEP-TGT-TBL')!
    expect(tbl.blockedBy).toEqual(['DEP-TGT-SP']) // SP not retired
  })
})
