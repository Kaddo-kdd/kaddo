import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  discoverDeliveryPlans,
  discoverEpics,
  getEpic,
  getPlan,
  nextPlanId,
  nextEpicId,
  epicsInPlan,
  initiativesInEpic,
  workItemsInEpic,
  computeEpicProgress,
  computePlanProgress,
  validatePlanningGraph,
} from '../src/core/delivery-planning.js'
import { createInitiative, updateInitiative } from '../src/core/initiative-write.js'
import { getInitiative } from '../src/core/initiative.js'
import { buildGraph } from '../src/core/graph.js'
import { loadConfig } from '../src/core/config.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}

beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-plan-')) })
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

describe('Delivery Planning Core (WI-074)', () => {
  it('AC-01/AC-02: parses a Delivery Plan with milestones and an Epic with its relations', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: Technical Roadmap\nstatus: in-progress\nmilestones:\n  - id: RM-08\n    title: Performance & Concurrency\n    exit_criteria:\n      - Benchmark evidence reviewed\n      - Worker isolation verified\nsuccess_criteria:\n  - All milestones closed\n---\n# Plan\n')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: Runtime Performance\nstatus: in-progress\nplan: PLAN-001\nmilestone: RM-08\nrelated_capabilities:\n  - Independent Runtime Execution\n---\n# Epic\n')
    const plan = getPlan(tmp, 'PLAN-001')!
    expect(plan.milestones).toHaveLength(1)
    expect(plan.milestones[0].exitCriteria).toEqual(['Benchmark evidence reviewed', 'Worker isolation verified'])
    const epic = getEpic(tmp, 'EP-001')!
    expect(epic.plan).toBe('PLAN-001')
    expect(epic.milestone).toBe('RM-08')
    expect(discoverDeliveryPlans(tmp)).toHaveLength(1)
    expect(discoverEpics(tmp)).toHaveLength(1)
  })

  it('AC-03/AC-04: an Initiative associates with an Epic and declares owners/contributors', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\n---\n# E\n')
    write('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: Host-side Workers\nstatus: in-progress\nepic: EP-001\nowners:\n  - developer-a\ncontributors:\n  - developer-b\n---\n# I\n')
    const inis = initiativesInEpic(tmp, 'EP-001')
    expect(inis).toHaveLength(1)
    expect(inis[0].owners).toEqual(['developer-a'])
    expect(inis[0].contributors).toEqual(['developer-b'])
  })

  it('AC-06/AC-07: progress derives from real Work Item state, Planning and Delivery kept separate', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\n---\n# E\n')
    write('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: I\nstatus: in-progress\nepic: EP-001\ncandidates:\n  - id: WI-CANDIDATE-1\n    title: C1\n    materialized_as: WI-900\n  - id: WI-CANDIDATE-2\n    title: C2\n---\n# I\n')
    write('knowledge/delivery/work-items/completed/WI-900.md', '---\nid: WI-900\ntype: feature\ntitle: Done\nstatus: completed\ninitiative: INI-010\n---\n# x\n')
    write('knowledge/delivery/work-items/in-progress/WI-901.md', '---\nid: WI-901\ntype: feature\ntitle: Doing\nstatus: in-progress\nepic: EP-001\n---\n# x\n')
    const prog = computeEpicProgress(tmp, getEpic(tmp, 'EP-001')!)
    // Planning coverage (candidates) is separate from delivery (WI states).
    expect(prog.planning).toEqual({ initiatives: 1, candidates: 2, materialized: 1, remaining: 1 })
    expect(prog.delivery.total).toBe(2)
    expect(prog.delivery.byState.completed).toBe(1)
    expect(prog.delivery.byState['in-progress']).toBe(1)
  })

  it('AC-08: an Epic is not "complete" just because its Work Items are — human approval required', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\nsuccess_criteria:\n  - Outcome verified\n---\n# E\n')
    write('knowledge/delivery/work-items/completed/WI-900.md', '---\nid: WI-900\ntype: feature\ntitle: Done\nstatus: completed\nepic: EP-001\n---\n# x\n')
    const prog = computeEpicProgress(tmp, getEpic(tmp, 'EP-001')!)
    expect(prog.delivery.completed).toBe(1)
    expect(prog.readiness.committedWorkComplete).toBe(true)
    expect(prog.readiness.humanApprovalRequired).toBe(true) // never auto-complete
  })

  it('AC-09: detects invalid references and dependency cycles', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: A\nstatus: in-progress\nplan: PLAN-404\ndepends_on:\n  - EP-002\n---\n# A\n')
    write('knowledge/delivery/epics/EP-002.md', '---\ntype: epic\nid: EP-002\ntitle: B\nstatus: in-progress\ndepends_on:\n  - EP-001\n---\n# B\n')
    const findings = validatePlanningGraph(tmp)
    expect(findings.some((f) => f.kind === 'invalid_reference' && f.message.includes('PLAN-404'))).toBe(true)
    expect(findings.some((f) => f.kind === 'dependency_cycle')).toBe(true)
  })

  it('AC-09: a pending (unfinished) dependency is a warning, not an invalid reference', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: A\nstatus: in-progress\ndepends_on:\n  - EP-002\n---\n# A\n')
    write('knowledge/delivery/epics/EP-002.md', '---\ntype: epic\nid: EP-002\ntitle: B\nstatus: in-progress\n---\n# B\n')
    const findings = validatePlanningGraph(tmp)
    expect(findings.some((f) => f.kind === 'pending_dependency' && f.level === 'warning' && f.subject === 'EP-001')).toBe(true)
    expect(findings.some((f) => f.kind === 'invalid_reference')).toBe(false)
  })

  it('AC-13: a project with no plans/epics behaves normally (empty discovery, no findings)', () => {
    config()
    write('knowledge/delivery/work-items/completed/WI-001.md', '---\nid: WI-001\ntype: feature\ntitle: X\nstatus: completed\n---\n# x\n')
    expect(discoverDeliveryPlans(tmp)).toEqual([])
    expect(discoverEpics(tmp)).toEqual([])
    expect(validatePlanningGraph(tmp)).toEqual([])
  })

  it('AC-15: plan progress derives epics/initiatives/work items without a stored list', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-01\n    title: M1\n---\n# P\n')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\nplan: PLAN-001\n---\n# E\n')
    write('knowledge/delivery/work-items/in-progress/WI-901.md', '---\nid: WI-901\ntype: feature\ntitle: W\nstatus: in-progress\nepic: EP-001\n---\n# x\n')
    expect(epicsInPlan(tmp, 'PLAN-001').map((e) => e.id)).toEqual(['EP-001'])
    expect(workItemsInEpic(tmp, 'EP-001').map((w) => w.id)).toEqual(['WI-901'])
    const prog = computePlanProgress(tmp, getPlan(tmp, 'PLAN-001')!)
    expect(prog.epics.total).toBe(1)
    expect(prog.delivery.total).toBe(1)
    expect(prog.milestones).toEqual([{ id: 'RM-01', title: 'M1', exitCriteria: 0 }])
  })

  // --- Invariant regression tests (WI-074 design approval) ---

  it('INV-1: a Work Item with both epic and initiative(→same epic) is counted once (no double count)', () => {
    config()
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\n---\n# E\n')
    write('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: I\nstatus: in-progress\nepic: EP-001\n---\n# I\n')
    // Belongs via BOTH direct epic and its initiative.
    write('knowledge/delivery/work-items/in-progress/WI-901.md', '---\nid: WI-901\ntype: feature\ntitle: W\nstatus: in-progress\nepic: EP-001\ninitiative: INI-010\n---\n# x\n')
    const wis = workItemsInEpic(tmp, 'EP-001')
    expect(wis.map((w) => w.id)).toEqual(['WI-901'])
    expect(computeEpicProgress(tmp, getEpic(tmp, 'EP-001')!).delivery.total).toBe(1)
  })

  it('INV-2: duplicate milestone ids within a Plan are flagged', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-01\n    title: A\n  - id: RM-01\n    title: B\n---\n# P\n')
    const findings = validatePlanningGraph(tmp)
    expect(findings.some((f) => f.kind === 'duplicate_milestone' && f.subject === 'PLAN-001')).toBe(true)
  })

  it('INV-3: Completion Readiness is not positive without deliverables or without criteria', () => {
    config()
    // No work items, has criteria → not positive (no committed work).
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\nsuccess_criteria:\n  - Outcome verified\n---\n# E\n')
    expect(computeEpicProgress(tmp, getEpic(tmp, 'EP-001')!).readiness.meetsCompletionPreconditions).toBe(false)
    // Work complete but NO criteria → not positive.
    write('knowledge/delivery/epics/EP-002.md', '---\ntype: epic\nid: EP-002\ntitle: E2\nstatus: in-progress\n---\n# E2\n')
    write('knowledge/delivery/work-items/completed/WI-900.md', '---\nid: WI-900\ntype: feature\ntitle: D\nstatus: completed\nepic: EP-002\n---\n# x\n')
    expect(computeEpicProgress(tmp, getEpic(tmp, 'EP-002')!).readiness.meetsCompletionPreconditions).toBe(false)
    // Work complete AND criteria AND no blockers → preconditions met, but approval still required.
    write('knowledge/delivery/epics/EP-003.md', '---\ntype: epic\nid: EP-003\ntitle: E3\nstatus: in-progress\nsuccess_criteria:\n  - Verified\n---\n# E3\n')
    write('knowledge/delivery/work-items/completed/WI-903.md', '---\nid: WI-903\ntype: feature\ntitle: D\nstatus: completed\nepic: EP-003\n---\n# x\n')
    const r = computeEpicProgress(tmp, getEpic(tmp, 'EP-003')!).readiness
    expect(r.meetsCompletionPreconditions).toBe(true)
    expect(r.humanApprovalRequired).toBe(true)
  })

  it('INV-4: create and update persist epic, owners and contributors on the Initiative', () => {
    config()
    const created = createInitiative(tmp, { title: 'Host-side Workers', epic: 'EP-001', owners: ['dev-a'], contributors: ['dev-b'] })
    // Re-read from disk to confirm persistence.
    const read = getInitiative(tmp, created.id)!
    expect(read.epic).toBe('EP-001')
    expect(read.owners).toEqual(['dev-a'])
    expect(read.contributors).toEqual(['dev-b'])
    // Update re-associates and preserves what is not patched.
    const updated = updateInitiative(tmp, created.id, { owners: ['dev-a', 'dev-c'] })
    expect(updated.owners).toEqual(['dev-a', 'dev-c'])
    expect(getInitiative(tmp, created.id)!.epic).toBe('EP-001') // epic preserved across update
  })

  it('INV-5: a milestone carries no independent lifecycle state and stays traceable from its Epic', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-08\n    title: Performance\n    exit_criteria:\n      - Benchmark reviewed\n---\n# P\n')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\nplan: PLAN-001\nmilestone: RM-08\n---\n# E\n')
    const plan = getPlan(tmp, 'PLAN-001')!
    const m = plan.milestones[0]
    // Milestone is a checkpoint: id/title/exit_criteria only, no status field.
    expect(Object.keys(m).sort()).toEqual(['exitCriteria', 'id', 'title'])
    // Valid RM reference from the Epic produces no validation error.
    expect(validatePlanningGraph(tmp).filter((f) => f.level === 'error')).toEqual([])
  })

  it('AC-14: the Knowledge Graph represents plan/epic/milestone nodes and declared edges only', () => {
    config()
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-08\n    title: Perf\n---\n# P\n')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\nplan: PLAN-001\nmilestone: RM-08\n---\n# E\n')
    write('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: I\nstatus: in-progress\nepic: EP-001\n---\n# I\n')
    const g = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' })
    expect(g.nodes.some((n) => n.type === 'delivery-plan' && n.id === 'delivery-plan:plan-001')).toBe(true)
    expect(g.nodes.some((n) => n.type === 'epic' && n.id === 'epic:ep-001')).toBe(true)
    expect(g.nodes.some((n) => n.type === 'milestone')).toBe(true)
    // Declared edges: epic→plan, milestone→plan, initiative→epic.
    expect(g.edges).toContainEqual({ from: 'epic:ep-001', to: 'delivery-plan:plan-001', type: 'belongs_to' })
    expect(g.edges).toContainEqual({ from: 'initiative:ini-010', to: 'epic:ep-001', type: 'belongs_to' })
  })

  it('next ids are deterministic and collision-safe', () => {
    config()
    write('knowledge/delivery/plans/PLAN-003.md', '---\ntype: delivery-plan\nid: PLAN-003\ntitle: P\n---\n# P\n')
    write('knowledge/delivery/epics/EP-007.md', '---\ntype: epic\nid: EP-007\ntitle: E\n---\n# E\n')
    expect(nextPlanId(tmp)).toBe('PLAN-004')
    expect(nextEpicId(tmp)).toBe('EP-008')
  })
})
