import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import matter from 'gray-matter'
import { getEpic, getPlan, computeEpicProgress, revisionOf } from '../src/core/delivery-planning.js'
import {
  updateDeliveryPlan,
  recordMilestoneExitVerification,
  recordEpicOutcomeVerification,
  recordPlanOutcomeVerification,
  completeEpic,
  DeliveryPlanningWriteError,
  PlanningConflictError,
  PlanningNotReadyError,
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
function readPlanData() { return matter(fs.readFileSync(path.join(tmp, 'knowledge/delivery/plans/PLAN-001.md'), 'utf8')).data }
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-adj-')) })
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

// A Plan with one milestone (RM-01) that carries an unknown custom field, plus verified exit evidence.
function planWithMilestoneEvidence() {
  write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-01\n    title: Foundation\n    exit_criteria:\n      - Baseline approved\n    custom_field: keep-me\n---\n# P\n')
  recordMilestoneExitVerification(tmp, 'PLAN-001', 'RM-01', { criterion: 'Baseline approved', status: 'passed', evidence: 'ADR-001' })
}

describe('Adjustment 1 — milestone evidence preservation (WI-078)', () => {
  it('editing a milestone title keeps its exit-criteria evidence and unknown fields', () => {
    config(); planWithMilestoneEvidence()
    updateDeliveryPlan(tmp, 'PLAN-001', { milestones: [{ id: 'RM-01', title: 'Foundation (renamed)', exitCriteria: ['Baseline approved'] }] })
    const ms = (readPlanData().milestones as Record<string, unknown>[])[0]
    expect(ms.title).toBe('Foundation (renamed)')
    expect(ms.custom_field).toBe('keep-me')
    expect(Array.isArray(ms.exit_verifications)).toBe(true)
    expect((ms.exit_verifications as Record<string, unknown>[])[0].status).toBe('passed')
  })

  it('reordering milestones preserves each one\'s evidence', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-01\n    title: A\n    exit_criteria:\n      - a done\n  - id: RM-02\n    title: B\n    exit_criteria:\n      - b done\n---\n# P\n')
    recordMilestoneExitVerification(tmp, 'PLAN-001', 'RM-01', { criterion: 'a done', status: 'passed', evidence: 'x' })
    updateDeliveryPlan(tmp, 'PLAN-001', { milestones: [
      { id: 'RM-02', title: 'B', exitCriteria: ['b done'] },
      { id: 'RM-01', title: 'A', exitCriteria: ['a done'] },
    ] })
    const ms = readPlanData().milestones as Record<string, unknown>[]
    expect(ms.map((m) => m.id)).toEqual(['RM-02', 'RM-01'])
    const rm01 = ms.find((m) => m.id === 'RM-01')!
    expect((rm01.exit_verifications as Record<string, unknown>[])[0].status).toBe('passed')
  })

  it('editing an exit criterion keeps the prior evidence (traceable) but the evaluator marks it stale', () => {
    config(); planWithMilestoneEvidence()
    updateDeliveryPlan(tmp, 'PLAN-001', { milestones: [{ id: 'RM-01', title: 'Foundation', exitCriteria: ['Baseline approved and signed'] }] })
    const ms = (readPlanData().milestones as Record<string, unknown>[])[0]
    expect(Array.isArray(ms.exit_verifications)).toBe(true) // trail is kept, not silently deleted
    const ev = evaluatePlanCompletion(tmp, getPlan(tmp, 'PLAN-001')!)
    const m = ev.milestones![0]
    expect(m.outcome.criteria[0].status).toBe('not-verified') // the new criterion has no evidence
    expect(m.outcome.stale.map((s) => s.criterion)).toContain('Baseline approved')
  })

  it('removing a milestone that carries evidence requires an explicit decision', () => {
    config(); planWithMilestoneEvidence()
    expect(() => updateDeliveryPlan(tmp, 'PLAN-001', { milestones: [] })).toThrow(/exit-criteria evidence/)
    // Still present after the rejected write.
    expect((readPlanData().milestones as unknown[]).length).toBe(1)
    // Explicit confirmation removes it.
    const after = updateDeliveryPlan(tmp, 'PLAN-001', { milestones: [] }, { allowMilestoneEvidenceLoss: true })
    expect(after.milestones).toHaveLength(0)
  })
})

describe('Adjustment 2 — duplicate / ambiguous criteria (WI-078)', () => {
  it('does not share evidence between colliding criteria; recording is rejected and readiness is not met', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\nsuccess_criteria:\n  - It works\n  - It works\n---\n# E\n')
    expect(() => recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'It works', status: 'passed', evidence: 'x' })).toThrow(/more than one/)
    const ev = evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!)
    expect(ev.outcome.ambiguous).toBe(2)
    expect(ev.outcome.criteria.every((c) => c.ambiguous && c.status === 'not-verified')).toBe(true)
    expect(ev.readiness).toBe('NEEDS_WORK')
  })
})

describe('Adjustment 5 — exceptions never hide defects (WI-078)', () => {
  function epicReadyExceptOneCriterion() {
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\nsuccess_criteria:\n  - Core works\n  - Security reviewed\ncompletion_exceptions:\n  - id: EX-1\n    criterion: Security reviewed\n    status: accepted\n    reason: Deferred to v2 by security lead\n---\n# E\n')
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'Core works', status: 'passed', evidence: 'verified' })
  }

  it('an accepted exception with a reason waives its criterion → READY_WITH_EXCEPTIONS', () => {
    config(); epicReadyExceptOneCriterion()
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('READY_WITH_EXCEPTIONS')
  })

  it('an exception without a reason is not honored', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\nsuccess_criteria:\n  - Core works\n  - Security reviewed\ncompletion_exceptions:\n  - id: EX-1\n    criterion: Security reviewed\n    status: accepted\n---\n# E\n')
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'Core works', status: 'passed', evidence: 'v' })
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('NEEDS_WORK')
  })

  it('an exception cannot waive a blocking dependency (stays BLOCKED)', () => {
    config()
    write('knowledge/delivery/epics/EP-002.md', '---\ntype: epic\nid: EP-002\ntitle: Dep\nstatus: in-progress\n---\n# E\n')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\ndepends_on:\n  - EP-002\nsuccess_criteria:\n  - Core works\ncompletion_exceptions:\n  - id: EX-1\n    criterion: Core works\n    status: accepted\n    reason: waive\n---\n# E\n')
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('BLOCKED')
  })
})

describe('Adjustment 4/5 — integrity, empty plan, and readiness consistency (WI-078)', () => {
  it('an invalid dependency reference makes the Epic BLOCKED (integrity, not waivable)', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\ndepends_on:\n  - EP-404\nsuccess_criteria:\n  - Core works\n---\n# E\n')
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'Core works', status: 'passed', evidence: 'v' })
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('BLOCKED')
  })

  it('a Plan with verified criteria but no Epics or Work Items is not ready (no verifiable deliverables)', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nsuccess_criteria:\n  - Launched\n---\n# P\n')
    recordPlanOutcomeVerification(tmp, 'PLAN-001', { criterion: 'Launched', status: 'passed', evidence: 'done' })
    const ev = evaluatePlanCompletion(tmp, getPlan(tmp, 'PLAN-001')!)
    expect(ev.readiness).toBe('NEEDS_WORK')
    expect(ev.reasons.join(' ')).toMatch(/no verifiable deliverables|committed Work Items/i)
  })

  it('structural preconditions can be met while canonical evaluation is NEEDS_WORK (evidence pending)', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\nsuccess_criteria:\n  - Core works\n---\n# E\n')
    write('knowledge/delivery/initiatives/INI-001.md', '---\ntype: initiative\nid: INI-001\ntitle: I\nstatus: in-progress\nepic: EP-001\n---\n# I\n')
    write('knowledge/delivery/work-items/completed/WI-001.md', '---\nid: WI-001\ntype: feature\ntitle: W\nstatus: completed\ninitiative: INI-001\n---\n# x\n')
    // Old structural precondition is satisfied (criteria declared + committed work complete + no deps)...
    expect(computeEpicProgress(tmp, getEpic(tmp, 'EP-001')!).readiness.meetsCompletionPreconditions).toBe(true)
    // ...but the canonical, evidence-based evaluation is NEEDS_WORK because the criterion is unverified.
    expect(evaluateEpicCompletion(tmp, getEpic(tmp, 'EP-001')!).readiness).toBe('NEEDS_WORK')
  })
})

describe('Adjustment 3 — concurrency on verification and completion (WI-078)', () => {
  it('a stale expectedRevision is rejected when recording evidence and when completing', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\noutcome: Ship\nsuccess_criteria:\n  - Core works\n---\n# E\n')
    const stale = revisionOf(fs.readFileSync(path.join(tmp, 'knowledge/delivery/epics/EP-001.md'), 'utf8'))
    recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'Core works', status: 'passed', evidence: 'v' }) // advances revision
    expect(() => recordEpicOutcomeVerification(tmp, 'EP-001', { criterion: 'Core works', status: 'failed' }, { expectedRevision: stale })).toThrow(PlanningConflictError)
    expect(() => completeEpic(tmp, 'EP-001', {}, { expectedRevision: stale })).toThrow(PlanningConflictError)
    // With the fresh revision, completion proceeds (evaluation is READY).
    const fresh = revisionOf(fs.readFileSync(path.join(tmp, 'knowledge/delivery/epics/EP-001.md'), 'utf8'))
    expect(completeEpic(tmp, 'EP-001', { decidedBy: 'lead' }, { expectedRevision: fresh }).status).toBe('completed')
  })
})
