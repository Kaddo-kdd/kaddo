import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getPlanningOverviewAdmin, getPlanningInsightsAdmin } from '../src/core-adapter.js'

// WI-083 — the Planning Overview and Execution Insights read ONE deduped delivery projection, so their
// Work-Item and blocked counts agree. On an Initiative-first project (no Epics) the old Overview summed
// blocked over Epics and reported 0; now it counts Work Items tied directly to Initiatives.

function tmpInitiativeFirst(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ov-consistency-'))
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  // No Plans, no Epics. One Initiative with a completed WI and a blocked (unfinished-dependency) WI.
  w('knowledge/delivery/initiatives/INI-001.md', '---\ntype: initiative\nid: INI-001\ntitle: Auth\nstatus: in-progress\n---\n# Auth\n')
  w('knowledge/delivery/work-items/completed/WI-010.md', '---\nid: WI-010\ntype: feature\ntitle: Done\nstatus: completed\ninitiative: INI-001\n---\n# x\n')
  w('knowledge/delivery/work-items/in-progress/WI-011.md', '---\nid: WI-011\ntype: feature\ntitle: Blocked\nstatus: in-progress\ninitiative: INI-001\ndepends_on:\n  - WI-999\n---\n# x\n')
  return dir
}

let dir: string
beforeEach(() => { dir = tmpInitiativeFirst() })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('admin-server — Overview/Insights metric consistency (WI-083)', () => {
  it('Blocked Work Items counts Epic-less Initiative Work Items and equals Insights (AC-02, AC-05)', () => {
    const ov = getPlanningOverviewAdmin(dir)
    const ins = getPlanningInsightsAdmin(dir)
    expect(ov.totals.epics).toBe(0)
    expect(ov.totals.blockedWorkItems).toBe(1)
    expect(ov.totals.blockedWorkItems).toBe(ins.delivery.associated.blocked)
    expect(ov.totals.workItems).toBe(ins.delivery.associated.total)
  })

  it('exposes independent Work Items as a separate universe (AC-04, AC-06)', () => {
    const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
    w('knowledge/delivery/work-items/in-progress/WI-700.md', '---\nid: WI-700\ntype: feature\ntitle: Independent\nstatus: in-progress\n---\n# x\n')
    const ov = getPlanningOverviewAdmin(dir)
    const ins = getPlanningInsightsAdmin(dir)
    expect(ov.totals.independentWorkItems).toBe(1)
    expect(ov.totals.independentWorkItems).toBe(ins.delivery.independent.total)
    // The independent Work Item is NOT folded into the associated universe.
    expect(ov.totals.workItems).toBe(2)
  })

  it('every total is a finite number (no NaN/undefined) on an empty project (AC-06)', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ov-empty-'))
    fs.mkdirSync(path.join(empty, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(empty, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
    const ov = getPlanningOverviewAdmin(empty)
    for (const v of Object.values(ov.totals)) { expect(typeof v).toBe('number'); expect(Number.isFinite(v)).toBe(true) }
    expect(ov.totals.blockedWorkItems).toBe(0)
    fs.rmSync(empty, { recursive: true, force: true })
  })
})
