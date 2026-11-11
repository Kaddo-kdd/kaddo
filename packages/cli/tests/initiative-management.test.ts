import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import matter from 'gray-matter'
import { getInitiative } from '../src/core/initiative.js'
import { revisionOf } from '../src/core/delivery-planning.js'
import {
  createInitiative,
  addCandidate,
  updateCandidate,
  removeCandidate,
  updateInitiative,
  transitionInitiative,
  materializeCandidate,
  recordInitiativeOutcomeVerification,
  completeInitiative,
  InitiativeConflictError,
  InitiativeNotReadyError,
  InitiativeWriteError,
} from '../src/core/initiative-write.js'
import { evaluateInitiativeCompletion } from '../src/core/initiative-verification.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
function iniData(id: string) {
  const f = fs.readdirSync(path.join(tmp, 'knowledge/delivery/initiatives')).find((x) => x.startsWith(id))!
  return matter(fs.readFileSync(path.join(tmp, 'knowledge/delivery/initiatives', f), 'utf8'))
}
function rev(id: string): string {
  const ini = getInitiative(tmp, id)!
  return revisionOf(fs.readFileSync(ini.filePath, 'utf8'))
}
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ini-mgmt-')) })
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }) })

describe('D1 — candidate id identity', () => {
  it('never reuses a candidate id after a removal', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress' })
    addCandidate(tmp, ini.id, { title: 'C1' })
    addCandidate(tmp, ini.id, { title: 'C2' })
    const before = getInitiative(tmp, ini.id)!.candidates.map((c) => c.id)
    expect(before).toEqual(['WI-CANDIDATE-001', 'WI-CANDIDATE-002'])
    removeCandidate(tmp, ini.id, 'WI-CANDIDATE-002', 'descoped')
    addCandidate(tmp, ini.id, { title: 'C3' })
    const after = getInitiative(tmp, ini.id)!.candidates.map((c) => c.id)
    expect(after).toEqual(['WI-CANDIDATE-001', 'WI-CANDIDATE-003']) // 002 not reused
  })
})

describe('D2 — candidate edit & removal', () => {
  it('edits a pending candidate keeping its id and source signals', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress', candidates: [{ title: 'C1', sourceSignals: ['sig-a'] }] })
    const cid = getInitiative(tmp, ini.id)!.candidates[0].id
    updateCandidate(tmp, ini.id, cid, { title: 'C1 refined', expectedValue: 'high' })
    const c = getInitiative(tmp, ini.id)!.candidates[0]
    expect(c.id).toBe(cid)
    expect(c.title).toBe('C1 refined')
    expect(c.expectedValue).toBe('high')
    expect(c.sourceSignals).toEqual(['sig-a'])
  })

  it('removal requires a justification and logs it; refuses a materialized candidate', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress', candidates: [{ title: 'C1' }] })
    const cid = getInitiative(tmp, ini.id)!.candidates[0].id
    expect(() => removeCandidate(tmp, ini.id, cid, '  ')).toThrow(/justification/)
    removeCandidate(tmp, ini.id, cid, 'out of scope for v1')
    const data = iniData(ini.id).data
    expect(data.candidates).toHaveLength(0)
    expect((data.removed_candidates as Record<string, unknown>[])[0]).toMatchObject({ id: cid, reason: 'out of scope for v1' })
  })

  it('cannot edit or remove a materialized candidate', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress', candidates: [{ title: 'C1' }] })
    const cid = getInitiative(tmp, ini.id)!.candidates[0].id
    materializeCandidate(tmp, ini.id, cid)
    expect(() => updateCandidate(tmp, ini.id, cid, { title: 'x' })).toThrow(/materialized/)
    expect(() => removeCandidate(tmp, ini.id, cid, 'reason')).toThrow(/materialized/)
  })
})

describe('D3 — materialization idempotency & provenance', () => {
  it('re-running materialization returns the same Work Item without creating a duplicate', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress', candidates: [{ title: 'C1' }] })
    const cid = getInitiative(tmp, ini.id)!.candidates[0].id
    const first = materializeCandidate(tmp, ini.id, cid)
    expect(first.alreadyMaterialized).toBe(false)
    const second = materializeCandidate(tmp, ini.id, cid)
    expect(second.alreadyMaterialized).toBe(true)
    expect(second.workItemId).toBe(first.workItemId)
    const wiCount = fs.readdirSync(path.join(tmp, 'knowledge/delivery/work-items/draft')).filter((f) => f.endsWith('.md')).length
    expect(wiCount).toBe(1)
  })

  it('recovers a partial failure: a WI exists by provenance but the forward pointer is missing', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress', candidates: [{ title: 'C1' }] })
    const cid = getInitiative(tmp, ini.id)!.candidates[0].id
    const first = materializeCandidate(tmp, ini.id, cid)
    // Simulate a partial failure: clear materialized_as on the candidate (WI still exists).
    const d = iniData(ini.id)
    ;(d.data.candidates as Record<string, unknown>[]).forEach((c) => { delete c.materialized_as })
    const f = fs.readdirSync(path.join(tmp, 'knowledge/delivery/initiatives')).find((x) => x.startsWith(ini.id))!
    fs.writeFileSync(path.join(tmp, 'knowledge/delivery/initiatives', f), matter.stringify(d.content, d.data))
    const recovered = materializeCandidate(tmp, ini.id, cid)
    expect(recovered.alreadyMaterialized).toBe(true)
    expect(recovered.workItemId).toBe(first.workItemId)
    expect(getInitiative(tmp, ini.id)!.candidates[0].materializedAs).toBe(first.workItemId)
  })

  it('a dangling materialized_as is a surfaced error, never silently re-created', () => {
    config()
    write('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: I\nstatus: in-progress\ncandidates:\n  - id: WI-CANDIDATE-001\n    title: C1\n    materialized_as: WI-999\n---\n# I\n')
    expect(() => materializeCandidate(tmp, 'INI-010', 'WI-CANDIDATE-001')).toThrow(/missing Work Item WI-999/)
  })

  it('rejects a stale expectedRevision (concurrency)', () => {
    config()
    const ini = createInitiative(tmp, { title: 'I', status: 'in-progress', candidates: [{ title: 'C1' }] })
    const cid = getInitiative(tmp, ini.id)!.candidates[0].id
    const stale = rev(ini.id)
    addCandidate(tmp, ini.id, { title: 'C2' }) // advances revision
    expect(() => materializeCandidate(tmp, ini.id, cid, { expectedRevision: stale })).toThrow(InitiativeConflictError)
  })
})

describe('D4/D5 — concurrency & structured editing', () => {
  it('rejects a stale form on update and preserves other sections + unknown frontmatter', () => {
    config()
    write('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: I\nstatus: in-progress\ncustom_field: keep\n---\n# I\n\n## Goal\n\nOld goal.\n\n## Scope\n\nKeep this scope.\n')
    const stale = rev('INI-010')
    updateInitiative(tmp, 'INI-010', { priority: 'high' }) // advances revision
    expect(() => updateInitiative(tmp, 'INI-010', { title: 'x' }, { expectedRevision: stale })).toThrow(InitiativeConflictError)
    const fresh = rev('INI-010')
    updateInitiative(tmp, 'INI-010', { sections: { Goal: 'New goal statement.' } }, { expectedRevision: fresh })
    const d = iniData('INI-010')
    expect(d.content).toContain('New goal statement.')
    expect(d.content).toContain('Keep this scope.') // other section preserved
    expect(d.data.custom_field).toBe('keep') // unknown frontmatter preserved
  })
})

describe('D6/D7 — evidence-based completion & bypass prevention', () => {
  function readyish() {
    // Initiative with one success criterion, one materialized+completed Work Item.
    write('knowledge/delivery/initiatives/INI-020.md', '---\ntype: initiative\nid: INI-020\ntitle: Auth\nstatus: in-progress\ncandidates:\n  - id: WI-CANDIDATE-001\n    title: SSO\n    materialized_as: WI-900\n---\n# Auth\n\n## Success Criteria\n\n- SSO works end to end\n')
    write('knowledge/delivery/work-items/completed/WI-900.md', '---\nid: WI-900\ntype: feature\ntitle: SSO\nstatus: completed\ninitiative: INI-020\nsource: initiative\nsource_id: WI-CANDIDATE-001\nsource_initiative: INI-020\n---\n# x\n')
  }

  it('Scenario G: completed delivery but an unverified criterion → NEEDS_WORK', () => {
    config(); readyish()
    const ev = evaluateInitiativeCompletion(tmp, getInitiative(tmp, 'INI-020')!)
    expect(ev.outcome.criteria[0].status).toBe('not-verified')
    expect(ev.readiness).toBe('NEEDS_WORK')
  })

  it('records evidence (undeclared rejected), then READY_TO_COMPLETE', () => {
    config(); readyish()
    expect(() => recordInitiativeOutcomeVerification(tmp, 'INI-020', { criterion: 'not a criterion', status: 'passed' })).toThrow(/not a declared/)
    recordInitiativeOutcomeVerification(tmp, 'INI-020', { criterion: 'SSO works end to end', status: 'passed', evidence: 'verified', reference: 'r.md' })
    expect(evaluateInitiativeCompletion(tmp, getInitiative(tmp, 'INI-020')!).readiness).toBe('READY_TO_COMPLETE')
  })

  it('Scenario I: transitionInitiative refuses → completed; completeInitiative is gated and records the decision', () => {
    config(); readyish()
    expect(() => transitionInitiative(tmp, 'INI-020', 'completed')).toThrow(/completeInitiative/)
    expect(() => completeInitiative(tmp, 'INI-020')).toThrow(InitiativeNotReadyError) // not verified yet
    recordInitiativeOutcomeVerification(tmp, 'INI-020', { criterion: 'SSO works end to end', status: 'passed', evidence: 'ok', reference: 'r.md' })
    const done = completeInitiative(tmp, 'INI-020', { decidedBy: 'lead' })
    expect(done.status).toBe('completed')
    const dec = iniData('INI-020').data.completion_decision as Record<string, unknown>
    expect(dec).toMatchObject({ readiness: 'READY_TO_COMPLETE', decided_by: 'lead' })
  })

  it('Scenario J: a historical Initiative without evidence still reads (criteria not-verified, no crash)', () => {
    config()
    write('knowledge/delivery/initiatives/INI-050.md', '---\ntype: initiative\nid: INI-050\ntitle: Legacy\nstatus: in-progress\n---\n# Legacy\n\n## Success Criteria\n\n- [x] Old checkbox criterion\n')
    const ev = evaluateInitiativeCompletion(tmp, getInitiative(tmp, 'INI-050')!)
    expect(ev.outcome.criteria[0].status).toBe('not-verified') // checkbox is not evidence (AC-22)
    expect(ev.readiness).not.toBe('READY_TO_COMPLETE')
  })
})
