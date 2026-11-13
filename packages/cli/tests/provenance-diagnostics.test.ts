import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getInitiative } from '../src/core/initiative.js'
import { initiativeProvenanceDiagnostics, initiativeProvenanceIssues, evaluateInitiativeById } from '../src/core/initiative-verification.js'
import { computePlanningInsights } from '../src/core/planning-insights.js'

// WI-082 — provenance diagnostics. A candidate's materialized_as is a 1:1 field. Missing and mismatched
// single references stay confirmed integrity defects (blocking); an ambiguous/non-canonical historical value
// (e.g. "AN-005, AN-006, AN-007") is diagnosed honestly — never claimed missing, never rewritten, never
// counted as validated, and never flipped to ready by recognizing its shape.

let tmp: string
function w(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config() {
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
function wi(id: string, extra = '') {
  w(`knowledge/delivery/work-items/completed/${id}.md`, `---\nid: ${id}\ntype: feature\ntitle: ${id}\nstatus: completed\n${extra}---\n# ${id}\n`)
}
function initiative(id: string, candidates: string) {
  w(`knowledge/delivery/initiatives/${id}.md`, `---\ntype: initiative\nid: ${id}\ntitle: ${id}\nstatus: in-progress\ncandidates:\n${candidates}---\n# ${id}\n\n## Success Criteria\n\n- Something verifiable\n`)
}
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-prov-')) })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

function diagFor(id: string) {
  const ini = getInitiative(tmp, id)!
  return initiativeProvenanceDiagnostics(tmp, ini)
}

describe('initiativeProvenanceDiagnostics (WI-082)', () => {
  it('Scenario C: a valid single canonical reference produces no integrity issue', () => {
    config()
    wi('WI-500', 'initiative: INI-500\n')
    initiative('INI-500', '  - id: C1\n    title: Valid\n    materialized_as: WI-500\n')
    const d = diagFor('INI-500')
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ category: 'valid_single_reference', severity: 'info', workItemId: 'WI-500' })
    expect(initiativeProvenanceIssues(tmp, getInitiative(tmp, 'INI-500')!)).toEqual([])
  })

  it('Scenario D: a missing single canonical reference is a blocking integrity defect', () => {
    config()
    initiative('INI-500', '  - id: C1\n    title: Gone\n    materialized_as: WI-999\n')
    const d = diagFor('INI-500')
    expect(d[0]).toMatchObject({ category: 'missing_reference', severity: 'blocking' })
    expect(d[0].message).toContain('WI-999')
    // readiness stays conservative (BLOCKED), never ready.
    expect(evaluateInitiativeById(tmp, 'INI-500')!.readiness).toBe('BLOCKED')
  })

  it('Scenario E: an ambiguous historical composite reference is a warning, not a false "missing"', () => {
    config()
    initiative('INI-500', '  - id: C1\n    title: Legacy\n    materialized_as: AN-005, AN-006, AN-007\n')
    const d = diagFor('INI-500')
    expect(d[0]).toMatchObject({ category: 'ambiguous_legacy_reference', severity: 'warning' })
    // It must NOT claim a single Work Item with that literal id is missing.
    expect(d[0].message).not.toMatch(/missing Work Item AN-005, AN-006, AN-007/)
    // No blocking integrity issue is raised for the composite.
    expect(initiativeProvenanceIssues(tmp, getInitiative(tmp, 'INI-500')!)).toEqual([])
    // And the artifact is never rewritten (read-only).
    const before = fs.readFileSync(path.join(tmp, 'knowledge/delivery/initiatives/INI-500.md'), 'utf8')
    diagFor('INI-500'); diagFor('INI-500')
    expect(fs.readFileSync(path.join(tmp, 'knowledge/delivery/initiatives/INI-500.md'), 'utf8')).toBe(before)
  })

  it('AC-15: an ambiguous reference does not enable completion, but is not BLOCKED either (soft-block)', () => {
    config()
    // A fully-verified Initiative EXCEPT for one ambiguous reference: it must land in NEEDS_WORK, not READY.
    wi('WI-600', 'initiative: INI-600\n')
    initiative('INI-600', '  - id: C1\n    title: Valid\n    materialized_as: WI-600\n  - id: C2\n    title: Legacy\n    materialized_as: AN-1, AN-2\n')
    const ev = evaluateInitiativeById(tmp, 'INI-600')!
    expect(ev.readiness).not.toBe('READY_TO_COMPLETE')
    expect(ev.readiness).not.toBe('BLOCKED')
    expect(ev.readiness).toBe('NEEDS_WORK')
    expect(ev.reasons.join(' ')).toMatch(/ambiguous|non-canonical/i)
  })

  it('Scenario F: a Work Item associated with another Initiative is a blocking mismatch', () => {
    config()
    wi('WI-510', 'initiative: INI-OTHER\n')
    initiative('INI-500', '  - id: C1\n    title: Elsewhere\n    materialized_as: WI-510\n')
    const d = diagFor('INI-500')
    expect(d[0]).toMatchObject({ category: 'association_mismatch', severity: 'blocking', workItemId: 'WI-510' })
    expect(evaluateInitiativeById(tmp, 'INI-500')!.readiness).toBe('BLOCKED')
  })

  it('Scenario G (AC-16): coverage distinguishes declared materialization from validated references', () => {
    config()
    wi('WI-500', 'initiative: INI-500\n')
    initiative('INI-500', [
      '  - id: C1\n    title: Valid\n    materialized_as: WI-500\n',      // validated
      '  - id: C2\n    title: Missing\n    materialized_as: WI-999\n',    // declared, unresolved
      '  - id: C3\n    title: Legacy\n    materialized_as: X-1, X-2\n',   // declared, unresolved (ambiguous)
      '  - id: C4\n    title: Pending\n',                                  // not materialized
    ].join(''))
    const ins = computePlanningInsights(tmp)
    expect(ins.coverage).toMatchObject({ totalCandidates: 4, materialized: 3, validated: 1, unresolved: 2, pending: 1 })
    // The ambiguous one surfaces as a warning provenance signal; only the genuinely missing one is blocking.
    const prov = ins.attention.filter((a) => a.type === 'provenance')
    expect(prov.filter((a) => a.severity === 'blocking')).toHaveLength(1)
    expect(prov.filter((a) => a.severity === 'warning' && a.category === 'ambiguous_legacy_reference')).toHaveLength(1)
    // Blocking indicator counts the missing reference, not the ambiguous one.
    expect(ins.indicators.blockingIssues).toBe(1)
  })

  it('AC-08: provenance signals carry structured impact and next-step guidance from Core', () => {
    config()
    initiative('INI-500', '  - id: C1\n    title: Legacy\n    materialized_as: A, B, C\n')
    const ins = computePlanningInsights(tmp)
    const sig = ins.attention.find((a) => a.type === 'provenance')!
    expect(sig.impact).toBeTruthy()
    expect(sig.nextStep).toBeTruthy()
  })
})
