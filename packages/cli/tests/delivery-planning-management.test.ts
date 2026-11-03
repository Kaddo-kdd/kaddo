import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import matter from 'gray-matter'
import { getPlan, getEpic, revisionOf } from '../src/core/delivery-planning.js'
import {
  createDeliveryPlan,
  createEpic,
  associateInitiativeWithEpic,
  disassociateInitiativeFromEpic,
  updateDeliveryPlan,
  updateEpic,
  DeliveryPlanningWriteError,
  PlanningConflictError,
} from '../src/core/delivery-planning-write.js'
import { createInitiative } from '../src/core/initiative-write.js'
import { getInitiative } from '../src/core/initiative.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}

beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-plan-mgmt-')) })
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

describe('Delivery Plan management (WI-076)', () => {
  it('AC-04: edits plan metadata while preserving the Markdown body and unknown frontmatter keys', () => {
    config()
    const plan = createDeliveryPlan(tmp, { title: 'Roadmap', objective: 'Ship it' })
    // Inject an unknown key + custom body an external tool might own.
    const raw = fs.readFileSync(plan.filePath, 'utf8')
    const parsed = matter(raw)
    parsed.data.custom_field = 'keep-me'
    fs.writeFileSync(plan.filePath, matter.stringify('\n# Roadmap\n\nHand-written notes that must survive.\n', parsed.data))

    const updated = updateDeliveryPlan(tmp, plan.id, {
      objective: 'Ship it well',
      successCriteria: ['All milestones closed'],
      risks: ['Scope creep'],
      references: ['ADR-001'],
    })
    expect(updated.objective).toBe('Ship it well')
    expect(updated.successCriteria).toEqual(['All milestones closed'])
    expect(updated.risks).toEqual(['Scope creep'])
    expect(updated.references).toEqual(['ADR-001'])
    expect(updated.body).toContain('Hand-written notes that must survive.')
    expect((updated.rawFrontmatter as Record<string, unknown>).custom_field).toBe('keep-me')
    // AC-18: lifecycle is never touched by a metadata edit.
    expect(updated.status).toBe('draft')
  })

  it('AC-05: adds, edits and removes milestones with stable order and unique ids', () => {
    config()
    const plan = createDeliveryPlan(tmp, { title: 'Roadmap' })
    const withMs = updateDeliveryPlan(tmp, plan.id, {
      milestones: [
        { id: 'RM-01', title: 'Foundation', exitCriteria: ['Baseline approved'] },
        { id: 'RM-02', title: 'Hardening' },
      ],
    })
    expect(withMs.milestones.map((m) => m.id)).toEqual(['RM-01', 'RM-02'])
    expect(withMs.milestones[0].exitCriteria).toEqual(['Baseline approved'])

    const edited = updateDeliveryPlan(tmp, plan.id, {
      milestones: [
        { id: 'RM-01', title: 'Foundation', exitCriteria: ['Baseline approved', 'Verified'] },
      ],
    })
    expect(edited.milestones).toHaveLength(1)
    expect(edited.milestones[0].exitCriteria).toEqual(['Baseline approved', 'Verified'])

    expect(() =>
      updateDeliveryPlan(tmp, plan.id, { milestones: [{ id: 'RM-09' }, { id: 'rm-09' }] }),
    ).toThrow(/more than once/)
  })

  it('AC-06/VS-05: a milestone referenced by an Epic cannot be removed or renamed silently', () => {
    config()
    const plan = createDeliveryPlan(tmp, { title: 'Roadmap' })
    updateDeliveryPlan(tmp, plan.id, { milestones: [{ id: 'RM-01', title: 'Foundation' }] })
    createEpic(tmp, { title: 'Core work', plan: plan.id, milestone: 'RM-01' })

    // Removing the referenced milestone is rejected...
    expect(() => updateDeliveryPlan(tmp, plan.id, { milestones: [] })).toThrow(/still referenced by an Epic/)
    // ...and so is renaming it (new id no longer matches the Epic reference).
    expect(() =>
      updateDeliveryPlan(tmp, plan.id, { milestones: [{ id: 'RM-99', title: 'Foundation' }] }),
    ).toThrow(/still referenced by an Epic/)
    // The plan is untouched after a rejected write.
    expect(getPlan(tmp, plan.id)!.milestones.map((m) => m.id)).toEqual(['RM-01'])
  })

  it('AC-15/VS-10: a stale expectedRevision is rejected with a conflict, fresh one succeeds', () => {
    config()
    const plan = createDeliveryPlan(tmp, { title: 'Roadmap' })
    const stale = revisionOf(fs.readFileSync(plan.filePath, 'utf8'))
    // A concurrent writer changes the file.
    updateDeliveryPlan(tmp, plan.id, { objective: 'Changed elsewhere' })
    expect(() => updateDeliveryPlan(tmp, plan.id, { objective: 'Mine' }, { expectedRevision: stale })).toThrow(PlanningConflictError)
    // Reading the current revision lets the write go through.
    const fresh = revisionOf(fs.readFileSync(plan.filePath, 'utf8'))
    const ok = updateDeliveryPlan(tmp, plan.id, { objective: 'Mine' }, { expectedRevision: fresh })
    expect(ok.objective).toBe('Mine')
  })
})

describe('Epic management (WI-076)', () => {
  it('AC-07: edits outcome, criteria, capabilities and decisions without touching lifecycle', () => {
    config()
    const epic = createEpic(tmp, { title: 'Perf', outcome: 'Fast' })
    const updated = updateEpic(tmp, epic.id, {
      outcome: 'Very fast',
      successCriteria: ['p95 < 100ms'],
      relatedCapabilities: ['Runtime Execution'],
      decisions: ['ADR-010'],
    })
    expect(updated.outcome).toBe('Very fast')
    expect(updated.successCriteria).toEqual(['p95 < 100ms'])
    expect(updated.relatedCapabilities).toEqual(['Runtime Execution'])
    expect(updated.decisions).toEqual(['ADR-010'])
    expect(updated.status).toBe('planned')
  })

  it('AC-08: rejects a dependency on a missing Epic, a self-dependency and a cycle', () => {
    config()
    const a = createEpic(tmp, { title: 'A' })
    const b = createEpic(tmp, { title: 'B' })
    expect(() => updateEpic(tmp, a.id, { dependsOn: ['EP-999'] })).toThrow(/missing Epic/)
    expect(() => updateEpic(tmp, a.id, { dependsOn: [a.id] })).toThrow(/cannot depend on itself/)
    updateEpic(tmp, a.id, { dependsOn: [b.id] })
    expect(() => updateEpic(tmp, b.id, { dependsOn: [a.id] })).toThrow(/cycle/i)
    expect(getEpic(tmp, b.id)!.dependsOn).toEqual([])
  })

  it('VS-03/VS-06: changing the Plan revalidates the milestone belongs to the new Plan', () => {
    config()
    const planA = createDeliveryPlan(tmp, { title: 'A' })
    updateDeliveryPlan(tmp, planA.id, { milestones: [{ id: 'RM-01' }] })
    const planB = createDeliveryPlan(tmp, { title: 'B' })
    updateDeliveryPlan(tmp, planB.id, { milestones: [{ id: 'RM-02' }] })
    const epic = createEpic(tmp, { title: 'E', plan: planA.id, milestone: 'RM-01' })

    // Moving to planB while keeping RM-01 (not in planB) is rejected.
    expect(() => updateEpic(tmp, epic.id, { plan: planB.id })).toThrow(/not defined in/)
    // Moving with a milestone that exists in planB succeeds.
    const moved = updateEpic(tmp, epic.id, { plan: planB.id, milestone: 'RM-02' })
    expect(moved.plan).toBe(planB.id)
    expect(moved.milestone).toBe('RM-02')
    // Detaching the Plan also clears the milestone (no dangling reference).
    const detached = updateEpic(tmp, epic.id, { plan: null })
    expect(detached.plan).toBeNull()
    expect(detached.milestone).toBeNull()
  })
})

describe('Initiative ↔ Epic association (WI-076)', () => {
  it('AC-09/AC-10: associates then reassigns an Initiative between Epics', () => {
    config()
    const e1 = createEpic(tmp, { title: 'E1' })
    const e2 = createEpic(tmp, { title: 'E2' })
    const ini = createInitiative(tmp, { title: 'Workers', status: 'in-progress' })
    associateInitiativeWithEpic(tmp, ini.id, e1.id)
    expect(getInitiative(tmp, ini.id)!.epic).toBe(e1.id)
    // Reassignment overwrites the single canonical field.
    associateInitiativeWithEpic(tmp, ini.id, e2.id)
    expect(getInitiative(tmp, ini.id)!.epic).toBe(e2.id)
  })

  it('AC-11/VS-09: removing an association keeps the Initiative, status, owners and candidates', () => {
    config()
    const epic = createEpic(tmp, { title: 'E' })
    const ini = createInitiative(tmp, {
      title: 'Workers',
      status: 'in-progress',
      epic: epic.id,
      owners: ['developer-a'],
      contributors: ['developer-b'],
      candidates: [{ title: 'C1' }],
    })
    const after = disassociateInitiativeFromEpic(tmp, ini.id)
    expect(after.epic).toBeNull()
    expect(after.status).toBe('in-progress')
    expect(after.owners).toEqual(['developer-a'])
    expect(after.contributors).toEqual(['developer-b'])
    expect(after.candidates).toHaveLength(1)
    // Idempotent: disassociating an already-independent Initiative is a no-op, not an error.
    expect(disassociateInitiativeFromEpic(tmp, ini.id).epic).toBeNull()
  })

  it('AC-13: write operations fail clearly on missing subjects (no silent artifact creation)', () => {
    config()
    expect(() => updateDeliveryPlan(tmp, 'PLAN-404', { title: 'x' })).toThrow(DeliveryPlanningWriteError)
    expect(() => updateEpic(tmp, 'EP-404', { title: 'x' })).toThrow(DeliveryPlanningWriteError)
    expect(() => disassociateInitiativeFromEpic(tmp, 'INI-404')).toThrow(DeliveryPlanningWriteError)
  })
})
