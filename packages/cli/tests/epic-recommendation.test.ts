import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { recommendEpicNextStep } from '../src/core/epic-recommendation.js'
import { getEpic } from '../src/core/delivery-planning.js'

// WI-089 — the Epic next-step recommendation is deterministic and encodes Epic → Initiative → Candidates →
// Work Items without making it mandatory. One matrix test per scenario A–G (AC-04/AC-14), plus the
// optional-Initiative and lifecycle guarantees (AC-08/AC-12/AC-13).

let dir: string
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-eprec-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

function w(rel: string, body: string) {
  const f = path.join(dir, rel)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, body)
}
function epic(id: string, extra = '') {
  w(`knowledge/delivery/epics/${id}.md`, `---\ntype: epic\nid: ${id}\ntitle: ${id} epic\nstatus: planned\nsuccess_criteria:\n  - Outcome verified\n${extra}---\n# ${id}\n`)
}
function initiative(id: string, epicId: string, candidates = '') {
  w(`knowledge/delivery/initiatives/${id}.md`, `---\ntype: initiative\nid: ${id}\ntitle: ${id}\nstatus: in-progress\nepic: ${epicId}\n${candidates}---\n# ${id}\n`)
}
function workItem(id: string, lifecycle: 'in-progress' | 'ready', fm: string) {
  w(`knowledge/delivery/work-items/${lifecycle}/${id}.md`, `---\nid: ${id}\ntype: feature\ntitle: ${id}\nstatus: ${lifecycle}\n${fm}---\n# ${id}\n`)
}
const rec = (id: string) => recommendEpicNextStep(dir, getEpic(dir, id)!)

describe('recommendEpicNextStep (WI-089)', () => {
  it('A — a new Epic with no work recommends creating or associating an Initiative (AC-02)', () => {
    epic('EP-001')
    const r = rec('EP-001')
    expect(r.scenario).toBe('new-no-work')
    expect(r.recommendationId).toBe('create-or-associate-initiative')
    expect(r.primary.action).toMatch(/create or associate an initiative/i)
    // Creating a Work Item directly is offered as a valid ALTERNATIVE, never the primary step (AC-08).
    expect(r.alternatives.some((a) => /work item directly/i.test(a.label))).toBe(true)
  })

  it('B — an Epic with an Initiative but no candidates recommends defining candidates (AC-05)', () => {
    epic('EP-001')
    initiative('INI-001', 'EP-001')
    const r = rec('EP-001')
    expect(r.scenario).toBe('initiative-no-candidates')
    expect(r.primary.action).toMatch(/define work item candidates/i)
    expect(r.primary.target).toBe('INI-001')
  })

  it('C/D — pending candidates recommend review and materialization, never auto-create (AC-06)', () => {
    epic('EP-001')
    initiative('INI-001', 'EP-001', 'candidates:\n  - id: C1\n    title: First\n  - id: C2\n    title: Second\n    materialized_as: WI-900\n')
    const r = rec('EP-001')
    expect(r.scenario).toBe('candidates-pending')
    expect(r.recommendationId).toBe('review-and-materialize-candidates')
    expect(r.state.pendingCandidates).toBe(1)
  })

  it('E — active Work Items take priority: continue and unblock (AC-12)', () => {
    epic('EP-001')
    workItem('WI-100', 'in-progress', 'epic: EP-001\n')
    const r = rec('EP-001')
    expect(r.scenario).toBe('active-work')
    expect(r.primary.action).toMatch(/continue the work items in progress/i)
  })

  it('F — direct Work Items under an Epic are a valid model, no Initiative required (AC-08/AC-13)', () => {
    epic('EP-001')
    workItem('WI-100', 'ready', 'epic: EP-001\n')
    const r = rec('EP-001')
    expect(r.scenario).toBe('direct-work-items')
    expect(r.primary.reason).toMatch(/valid model/i)
    // The Initiative appears only as an OPTIONAL improvement, never as an integrity error.
    expect(r.alternatives.some((a) => /optional/i.test(a.label) || /optional/i.test(a.reason))).toBe(true)
  })

  it('G — a completed Epic does not recommend new work by default (AC-12)', () => {
    epic('EP-001', 'status: completed\n'.replace('status: completed', '') + '')
    // override status to completed
    w('knowledge/delivery/epics/EP-001.md', `---\ntype: epic\nid: EP-001\ntitle: done\nstatus: completed\nsuccess_criteria:\n  - Outcome verified\n---\n# EP-001\n`)
    const r = rec('EP-001')
    expect(r.scenario).toBe('completed')
    expect(r.primary.action).toMatch(/terminal|completed/i)
    expect(r.alternatives).toEqual([])
  })

  it('consulting a recommendation never mutates artifacts (AC-11)', () => {
    epic('EP-001')
    const before = fs.readFileSync(path.join(dir, 'knowledge/delivery/epics/EP-001.md'), 'utf8')
    rec('EP-001'); rec('EP-001')
    expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/epics/EP-001.md'), 'utf8')).toBe(before)
  })
})
