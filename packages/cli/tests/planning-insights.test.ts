import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { computePlanningInsights } from '../src/core/planning-insights.js'

let tmp: string
function w(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config() {
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-insights-')) })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

/** A representative planning project: a Plan+milestone, two Epics (one blocked by the other), an
 * Initiative with a pending + a materialized candidate, a shared+completed WI, an independent WI, and a
 * second Initiative whose candidate points at a missing WI (broken provenance). */
function seed() {
  config()
  w('knowledge/delivery/plans/PLAN-001.md', [
    '---', 'type: delivery-plan', 'id: PLAN-001', 'title: Roadmap', 'status: in-progress',
    'objective: Ship it.',
    'milestones:', '  - id: M1', '    title: Foundation', '    exit_criteria:', '      - Benchmark reviewed',
    'success_criteria:', '  - All milestones closed',
    'risks:', '  - Capacity risk in Q3',
    '---', '# Roadmap', '',
  ].join('\n'))
  w('knowledge/delivery/epics/EP-001.md', [
    '---', 'type: epic', 'id: EP-001', 'title: Perf', 'status: in-progress', 'plan: PLAN-001', 'milestone: M1',
    'outcome: Fast.', 'success_criteria:', '  - Outcome verified', 'depends_on:', '  - EP-002',
    '---', '# Epic', '',
  ].join('\n'))
  w('knowledge/delivery/epics/EP-002.md', [
    '---', 'type: epic', 'id: EP-002', 'title: Base', 'status: in-progress', 'plan: PLAN-001',
    '---', '# Epic', '',
  ].join('\n'))
  w('knowledge/delivery/initiatives/INI-001.md', [
    '---', 'type: initiative', 'id: INI-001', 'title: Auth', 'status: in-progress', 'epic: EP-001',
    'candidates:',
    '  - id: WI-CANDIDATE-001', '    title: Pending', // pending
    '  - id: WI-CANDIDATE-002', '    title: SSO', '    materialized_as: WI-900', // materialized
    '---', '# Auth', '', '## Success Criteria', '', '- SSO works end to end', '',
  ].join('\n'))
  // Shared, completed WI: associated to INI-001 (and via INI to EP-001) AND carries epic: EP-001.
  w('knowledge/delivery/work-items/completed/WI-900.md', [
    '---', 'id: WI-900', 'type: feature', 'title: SSO', 'status: completed',
    'initiative: INI-001', 'epic: EP-001', 'source: initiative', 'source_id: WI-CANDIDATE-002', 'source_initiative: INI-001',
    '---', '# x', '',
  ].join('\n'))
  // Independent WI (no plan/epic/initiative), in progress.
  w('knowledge/delivery/work-items/in-progress/WI-700.md', [
    '---', 'id: WI-700', 'type: feature', 'title: Standalone', 'status: in-progress',
    '---', '# x', '',
  ].join('\n'))
  // Second Initiative with a dangling materialized candidate (broken provenance).
  w('knowledge/delivery/initiatives/INI-002.md', [
    '---', 'type: initiative', 'id: INI-002', 'title: Legacy', 'status: in-progress',
    'candidates:', '  - id: WI-CANDIDATE-001', '    title: Gone', '    materialized_as: WI-999',
    '---', '# Legacy', '',
  ].join('\n'))
}

describe('computePlanningInsights (WI-081)', () => {
  it('empty project yields zeroed, non-throwing insights (Scenario A, AC-04)', () => {
    config()
    const ins = computePlanningInsights(tmp)
    expect(ins.delivery.associated.total).toBe(0)
    expect(ins.delivery.independent.total).toBe(0)
    expect(ins.coverage.totalCandidates).toBe(0)
    expect(ins.outcome.total).toBe(0)
    expect(ins.attention).toEqual([])
    expect(ins.indicators).toEqual({ blockingIssues: 0, outcomeNeedsVerification: 0, milestonesNeedingReview: 0 })
  })

  it('dedupes a Work Item shared by Initiative and Epic; separates independent WIs (AC-03, AC-05)', () => {
    seed()
    const ins = computePlanningInsights(tmp)
    // WI-900 is reachable via INI-001 and via epic:EP-001, but counted ONCE in the associated universe.
    expect(ins.delivery.associated.total).toBe(1)
    expect(ins.delivery.associated.byState.completed).toBe(1)
    // The standalone WI is its own universe, never forced into a hierarchy.
    expect(ins.delivery.independent.total).toBe(1)
    expect(ins.delivery.independent.byState['in-progress']).toBe(1)
  })

  it('keeps coverage, delivery and outcome separate (AC-02); coverage counts candidates', () => {
    seed()
    const ins = computePlanningInsights(tmp)
    expect(ins.coverage).toEqual({ totalCandidates: 3, materialized: 2, pending: 1 })
    // Outcome is evidence-based and distinct from delivery: no criterion has recorded evidence yet.
    expect(ins.outcome.passed).toBe(0)
    expect(ins.outcome.notVerified).toBeGreaterThanOrEqual(3) // PLAN + EP-001 + INI-001 criteria
    expect(ins.indicators.outcomeNeedsVerification).toBe(ins.outcome.failed + ins.outcome.notVerified + ins.outcome.manualReview + ins.outcome.ambiguous)
    expect(ins.indicators.outcomeNeedsVerification).toBeGreaterThan(0)
  })

  it('surfaces structured attention signals with provenance and links (AC-11, AC-12, AC-15)', () => {
    seed()
    const ins = computePlanningInsights(tmp)
    const byType = (t: string) => ins.attention.filter((a) => a.type === t)
    // Pending candidate is a coverage signal (info), not a universal blocker.
    const pend = byType('pending-candidates')
    expect(pend.length).toBe(1)
    expect(pend[0]).toMatchObject({ severity: 'info', artifactId: 'INI-001', link: '/initiatives/INI-001' })
    // Broken candidate->WI provenance is blocking.
    const prov = byType('provenance')
    expect(prov.some((a) => a.artifactId === 'INI-002' && a.severity === 'blocking')).toBe(true)
    // Unfinished dependency becomes a dependency signal on EP-001.
    expect(byType('dependency').some((a) => a.artifactId === 'EP-001')).toBe(true)
    // Declared risk is a separate category (info), never a fabricated score.
    expect(byType('declared-risk').some((a) => a.artifactId === 'PLAN-001' && a.severity === 'info')).toBe(true)
    // Unverified outcomes are flagged.
    expect(byType('unverified-outcome').length).toBeGreaterThan(0)
    // Blocking indicator reflects at least the provenance block.
    expect(ins.indicators.blockingIssues).toBeGreaterThanOrEqual(1)
    // Deterministic order: blocking first.
    expect(ins.attention[0].severity).toBe('blocking')
  })

  it('flags milestone exit criteria needing review without inferring from Epic status (AC-16)', () => {
    seed()
    const ins = computePlanningInsights(tmp)
    const m1 = ins.milestones.find((m) => m.id === 'M1' && m.planId === 'PLAN-001')!
    expect(m1).toBeTruthy()
    expect(m1.epics).toBe(1) // EP-001 references milestone M1
    expect(m1.needsReview).toBe(true) // exit criterion has no evidence
    expect(ins.indicators.milestonesNeedingReview).toBeGreaterThanOrEqual(1)
  })

  it('is read-only: computing twice does not change artifacts (AC-18)', () => {
    seed()
    const before = fs.readFileSync(path.join(tmp, 'knowledge/delivery/initiatives/INI-001.md'), 'utf8')
    computePlanningInsights(tmp)
    computePlanningInsights(tmp)
    const after = fs.readFileSync(path.join(tmp, 'knowledge/delivery/initiatives/INI-001.md'), 'utf8')
    expect(after).toBe(before)
  })
})
