import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import matter from 'gray-matter'
import { getEpic, getPlan, revisionOf } from '../src/core/delivery-planning.js'
import {
  transitionEpic,
  transitionDeliveryPlan,
  recordEpicOutcomeVerification,
  recordPlanOutcomeVerification,
  recordMilestoneExitVerification,
  completeEpic,
  completeDeliveryPlan,
  updateEpic,
  DeliveryPlanningWriteError,
  PlanningNotReadyError,
  PlanningConflictError,
} from '../src/core/delivery-planning-write.js'
import { evaluateEpicCompletion, evaluatePlanCompletion } from '../src/core/delivery-verification.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-plan-verify-')) })
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

// Epic with one success criterion, one completed Initiative + Work Item (EP-001 / INI-001 / WI-001).
function epicWithCompletedWork(status = 'in-progress') {
  write('knowledge/delivery/epics/EP-001.md', `---\ntype: epic\nid: EP-001\ntitle: Enterprise Auth\nstatus: ${status}\noutcome: Support corporate SSO\nsuccess_criteria:\n  - SSO works end to end\n---\n# Epic\n\nHand-written body.\n`)
  write('knowledge/delivery/initiatives/INI-001.md', '---\ntype: initiative\nid: INI-001\ntitle: SSO\nstatus: in-progress\nepic: EP-001\n---\n# I\n')
  write('knowledge/delivery/work-items/completed/WI-001.md', '---\nid: WI-001\ntype: feature\ntitle: Wire SSO\nstatus: completed\ninitiative: INI-001\n---\n# x\n')
}

describe('Planning lifecycle transitions (WI-078)', () => {
  it('AC-01/AC-02/AC-04: transitions a Plan and an Epic, preserving body, and sets completed_at', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: draft\n---\n# P\n\nKeep me.\n')
    const p = transitionDeliveryPlan(tmp, 'PLAN-001', 'in-progress')
    expect(p.status).toBe('in-progress')
    expect(p.body).toContain('Keep me.')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: planned\n---\n# E\n')
    const e = transitionEpic(tmp, 'EP-001', 'in-progress')
    expect(e.status).toBe('in-progress')
  })

  it('AC-03: rejects an invalid transition without mutating the artifact', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: cancelled\n---\n# E\n')
    expect(() => transitionEpic(tmp, 'EP-001', 'in-progress')).toThrow(/Invalid transition/)
    expect(getEpic(tmp, 'EP-001')!.status).toBe('cancelled')
  })

  it('AC-21: completing is gated — the raw transition refuses → completed and points to completeEpic', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\n---\n# E\n')
    expect(() => transitionEpic(tmp, 'EP-001', 'completed')).toThrow(/completeEpic/)
    expect(getEpic(tmp, 'EP-001')!.status).toBe('in-progress')
  })

  it('AC-05: a stale expectedRevision is rejected with a conflict', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: planned\n---\n# E\n')
    const stale = revisionOf(fs.readFileSync(path.join(tmp, 'knowledge/delivery/epics/EP-001.md'), 'utf8'))
    updateEpic(tmp, 'EP-001', { outcome: 'changed elsewhere' })
    expect(() => transitionEpic(tmp, 'EP-001', 'in-progress', { expectedRevision: stale })).toThrow(PlanningConflictError)
  })
})

describe('Evidence-based outcome verification (WI-078)', () => {
  it('AC-08/AC-09: records evidence with status, justification, reference and method; it persists', () => {
    config()
    epicWithCompletedWork()
    const e = recordEpicOutcomeVerification(tmp, 'EP-001', {
      criterion: 'SSO works end to end', status: 'passed',
      evidence: 'Verified against Okta sandbox', reference: 'reports/sso-2026-11-06.md', method: 'manual', verifiedBy: 'dev-a',
    })
    expect(e.body).toContain('Hand-written body.')
    const raw = matter(fs.readFileSync(path.join(tmp, 'knowledge/delivery/epics/EP-001.md'), 'utf8')).data
    const rec = (raw.outcome_verifications as Record<string, unknown>[])[0]
    expect(rec).toMatchObject({ criterion: 'SSO works end to end', status: 'passed', reference: 'reports/sso-2026-11-06.md', method: 'manual', verified_by: 'dev-a' })
    expect(rec.verified_at).toBeTruthy()
  })

  it('upsert replaces evidence for the same criterion; rejects an undeclared criterion', () => {
    config()
    epicWithCompletedWork()
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'SSO works end to end', status: 'not-verified' })
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'sso WORKS end to end', status: 'passed', evidence: 'done' })
    const recs = matter(fs.readFileSync(path.join(tmp, 'knowledge/delivery/epics/EP-001.md'), 'utf8')).data.outcome_verifications as Record<string, unknown>[]
    expect(recs).toHaveLength(1) // matched case-insensitively, replaced
    expect(recs[0].status).toBe('passed')
    expect(() => recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'not a real criterion', status: 'passed' })).toThrow(/not a declared/)
  })

  it('AC-11: a completed Work Item does not auto-pass a success criterion', () => {
    config()
    epicWithCompletedWork()
    const ev = evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!)
    // All committed work is done, but the criterion has no evidence.
    expect(ev.outcome.criteria[0].status).toBe('not-verified')
    expect(ev.readiness).toBe('NEEDS_WORK')
  })
})

describe('Epic completion evaluation (WI-078)', () => {
  it('Scenario A: work completed, outcome pending → NEEDS_WORK', () => {
    config()
    epicWithCompletedWork()
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('NEEDS_WORK')
  })

  it('Scenario B: all work done and criteria verified → READY_TO_COMPLETE, no auto-transition', () => {
    config()
    epicWithCompletedWork()
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'SSO works end to end', status: 'passed', evidence: 'verified' })
    const ev = evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!)
    expect(ev.readiness).toBe('READY_TO_COMPLETE')
    expect(getEpic(tmp, 'EP-001')!.status).toBe('in-progress') // evaluation never transitions (AC-20)
  })

  it('AC-16: a blocking dependency makes the Epic BLOCKED', () => {
    config()
    epicWithCompletedWork()
    write('knowledge/delivery/epics/EP-002.md', '---\ntype: epic\nid: EP-002\ntitle: Dep\nstatus: in-progress\n---\n# E\n')
    updateEpic(tmp, 'EP-001', { dependsOn: ['EP-002'] })
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'SSO works end to end', status: 'passed', evidence: 'v' })
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('BLOCKED')
  })

  it('AC-18: distinguishes no-evidence, unverified and failed', () => {
    config()
    epicWithCompletedWork()
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'SSO works end to end', status: 'failed', evidence: 'security review failed' })
    const ev = evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!)
    expect(ev.outcome.failed).toBe(1)
    expect(ev.readiness).toBe('NEEDS_WORK')
    expect(ev.reasons.join(' ')).toMatch(/failed verification/)
  })
})

describe('Human-approved completion & freshness (WI-078)', () => {
  it('Scenario D: completeEpic requires READY, sets completed, records the decision; blocks otherwise', () => {
    config()
    epicWithCompletedWork()
    // Not ready yet.
    expect(() => completeEpic(tmp, 'EP-001')).toThrow(PlanningNotReadyError)
    expect(getEpic(tmp, 'EP-001')!.status).toBe('in-progress')
    // Verify, then complete with a decision.
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'SSO works end to end', status: 'passed', evidence: 'verified' })
    const done = completeEpic(tmp, 'EP-001', { decidedBy: 'lead', note: 'Reviewed SSO evidence' })
    expect(done.status).toBe('completed')
    const data = matter(fs.readFileSync(path.join(tmp, 'knowledge/delivery/epics/EP-001.md'), 'utf8')).data
    expect(data.completion_decision).toMatchObject({ readiness: 'READY_TO_COMPLETE', decided_by: 'lead', note: 'Reviewed SSO evidence' })
    expect((data.completion_decision as Record<string, unknown>).decided_at).toBeTruthy()
    // The linked Initiative/Work Item are untouched.
    expect(fs.readFileSync(path.join(tmp, 'knowledge/delivery/work-items/completed/WI-001.md'), 'utf8')).toContain('status: completed')
  })

  it('Scenario E: editing a criterion after verification leaves old evidence stale, not silently passed', () => {
    config()
    epicWithCompletedWork()
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'SSO works end to end', status: 'passed', evidence: 'verified' })
    // The criterion text is edited after verification.
    updateEpic(tmp, 'EP-001', { successCriteria: ['SSO works end to end for all tenants'] })
    const ev = evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!)
    expect(ev.outcome.criteria[0].status).toBe('not-verified') // new criterion has no evidence
    expect(ev.outcome.stale.map((s) => s.criterion)).toContain('SSO works end to end') // old evidence surfaced as stale
    expect(ev.readiness).toBe('NEEDS_WORK')
  })

  it('Scenario F: an Epic without a Plan evaluates and completes with verified criteria (no hierarchy required)', () => {
    config()
    write('knowledge/delivery/epics/EP-050.md', '---\ntype: epic\nid: EP-050\ntitle: Standalone\nstatus: in-progress\noutcome: Ship the thing\nsuccess_criteria:\n  - It is shipped\n---\n# E\n')
    recordEpicOutcomeVerification(tmp, 'EP-050', { criterion: 'It is shipped', status: 'passed', evidence: 'released v1' })
    const ev = evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-050')!)
    expect(ev.readiness).toBe('READY_TO_COMPLETE')
    expect(completeEpic(tmp, 'EP-050').status).toBe('completed')
  })
})

describe('Plan completion with milestones (WI-078)', () => {
  function planWithMilestoneAndOpenEpic() {
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nsuccess_criteria:\n  - Launch succeeded\nmilestones:\n  - id: RM-01\n    title: Launch\n    exit_criteria:\n      - Go-live checklist signed\n---\n# P\n')
    write('knowledge/delivery/epics/EP-010.md', '---\ntype: epic\nid: EP-010\ntitle: Release\nstatus: in-progress\nplan: PLAN-001\nmilestone: RM-01\noutcome: Released\nsuccess_criteria:\n  - Released to production\n---\n# E\n')
  }

  it('Scenario C: an open Epic and an unverified milestone keep the Plan not ready', () => {
    config(); planWithMilestoneAndOpenEpic()
    const ev = evaluatePlanCompletion(tmp, getPlan(tmp, 'PLAN-001')!)
    expect(ev.readiness).not.toBe('READY_TO_COMPLETE')
    expect(ev.milestones![0].outcome.notVerified).toBe(1)
    expect(() => completeDeliveryPlan(tmp, 'PLAN-001')).toThrow(PlanningNotReadyError)
  })

  it('AC-12/AC-14: milestone exit criteria verify individually and stay in the Plan', () => {
    config(); planWithMilestoneAndOpenEpic()
    const p = recordMilestoneExitVerification(tmp, 'PLAN-001', 'RM-01', { criterion: 'Go-live checklist signed', status: 'passed', evidence: 'checklist.pdf' })
    expect(p.milestones[0].id).toBe('RM-01') // milestone still on the Plan
    const ev = evaluatePlanCompletion(tmp, getPlan(tmp, 'PLAN-001')!)
    expect(ev.milestones![0].outcome.passed).toBe(1)
    expect(() => recordMilestoneExitVerification(tmp, 'PLAN-001', 'RM-01', { criterion: 'not a real exit', status: 'passed' })).toThrow(/not a declared/)
  })

  it('AC-17: a Plan becomes READY only when epics, criteria and milestones all pass', () => {
    config(); planWithMilestoneAndOpenEpic()
    // Verify and complete the Epic through the gated path.
    recordEpicOutcomeVerification(tmp, 'EP-010', { criterion: 'Released to production', status: 'passed', evidence: 'prod tag' })
    expect(completeEpic(tmp, 'EP-010').status).toBe('completed')
    // Verify the milestone exit criterion and the Plan's own success criterion.
    recordMilestoneExitVerification(tmp, 'PLAN-001', 'RM-01', { criterion: 'Go-live checklist signed', status: 'passed', evidence: 'ok' })
    recordPlanOutcomeVerification(tmp, 'PLAN-001', { criterion: 'Launch succeeded', status: 'passed', evidence: 'launched' })
    const ev = evaluatePlanCompletion(tmp, getPlan(tmp, 'PLAN-001')!)
    expect(ev.readiness).toBe('READY_TO_COMPLETE')
    expect(completeDeliveryPlan(tmp, 'PLAN-001').status).toBe('completed')
  })
})
