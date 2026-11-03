import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getPlanningOverviewAdmin, getEpicDetailAdmin } from '../src/core-adapter.js'

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-plan-ov-'))
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  w('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-08\n    title: Perf\n---\n# P\n')
  w('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E1\nstatus: in-progress\nplan: PLAN-001\ndepends_on:\n  - EP-002\n---\n# E\n')
  w('knowledge/delivery/epics/EP-002.md', '---\ntype: epic\nid: EP-002\ntitle: E2\nstatus: in-progress\nplan: PLAN-001\n---\n# E\n')
  // INI-900 has one candidate materialized but ONE linked Work Item (in-progress) — not completed.
  w('knowledge/delivery/initiatives/INI-900.md', '---\ntype: initiative\nid: INI-900\ntitle: I\nstatus: in-progress\nepic: EP-001\ncandidates:\n  - id: WI-CANDIDATE-1\n    title: C\n    materialized_as: WI-950\n---\n# I\n')
  w('knowledge/delivery/initiatives/INI-901.md', '---\ntype: initiative\nid: INI-901\ntitle: Standalone\nstatus: in-progress\n---\n# I\n')
  w('knowledge/delivery/work-items/in-progress/WI-950.md', '---\nid: WI-950\ntype: feature\ntitle: W\nstatus: in-progress\ninitiative: INI-900\n---\n# x\n')
  return dir
}

let dir: string
beforeEach(() => { dir = tmpProject() })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('admin-server — Unified Planning overview (WI-075)', () => {
  it('WI-075 #1: initiative delivery.completed is a finite number (never undefined/NaN)', () => {
    const ov = getPlanningOverviewAdmin(dir)
    const ini = ov.initiatives.find((i) => i.id === 'INI-900')!
    expect(ini.delivery.total).toBe(1)
    expect(Number.isFinite(ini.delivery.completed)).toBe(true)
    expect(ini.delivery.completed).toBe(0) // the linked WI is in-progress, not completed
    // No indicator value is undefined or NaN.
    for (const v of Object.values(ov.totals)) {
      expect(typeof v).toBe('number')
      expect(Number.isFinite(v)).toBe(true)
    }
  })

  it('WI-075 #2: Blocked Work Items and Epics-with-pending-dependencies are separate counters', () => {
    const ov = getPlanningOverviewAdmin(dir)
    // No Work Item declares a dependency, so no WI is blocked...
    expect(ov.totals.blockedWorkItems).toBe(0)
    // ...but EP-001 has an unfinished Epic dependency on EP-002.
    expect(ov.totals.epicsWithPendingDependencies).toBe(1)
    // The Epic's lifecycle status is NOT changed by a pending dependency.
    expect(getEpicDetailAdmin(dir, 'EP-001').status).toBe('in-progress')
  })

  it('shows standalone initiatives and counts those without an epic', () => {
    const ov = getPlanningOverviewAdmin(dir)
    expect(ov.initiatives.map((i) => i.id).sort()).toEqual(['INI-900', 'INI-901'])
    expect(ov.totals.unassignedInitiatives).toBe(1)
    expect(ov.initiatives.find((i) => i.id === 'INI-901')!.hasWorkItems).toBe(false)
  })
})
