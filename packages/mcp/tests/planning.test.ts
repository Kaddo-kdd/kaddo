import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { listPlansTool, getEpicTool, getPlanProgressTool, createPlanTool, createEpicTool, associateInitiativeTool } from '../src/planning.js'

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-plan-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: P\nstatus: in-progress\nmilestones:\n  - id: RM-08\n    title: Perf\n---\n# P\n')
  w('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: E\nstatus: in-progress\nplan: PLAN-001\nmilestone: RM-08\n---\n# E\n')
  w('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: I\nstatus: in-progress\nepic: EP-001\n---\n# I\n')
  w('knowledge/delivery/work-items/in-progress/WI-901.md', '---\nid: WI-901\ntype: feature\ntitle: W\nstatus: in-progress\nepic: EP-001\n---\n# x\n')
  return dir
}

let dir: string
beforeEach(() => { dir = tmpProject() })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('MCP Delivery Planning tools (WI-074)', () => {
  it('lists plans with derived epics and delivery', () => {
    const r = listPlansTool(dir)
    expect(r.ok).toBe(true)
    const plans = r.data as { id: string; epics: number; milestones: number }[]
    expect(plans[0]).toMatchObject({ id: 'PLAN-001', epics: 1, milestones: 1 })
  })

  it('getEpic returns derived initiatives and work items', () => {
    const r = getEpicTool(dir, 'EP-001')
    expect(r.ok).toBe(true)
    const epic = r.data as { initiatives: unknown[]; workItems: unknown[] }
    expect(epic.initiatives).toHaveLength(1)
    expect(epic.workItems).toHaveLength(1)
  })

  it('plan progress keeps planning and delivery separate, readiness human-gated', () => {
    const r = getPlanProgressTool(dir, 'PLAN-001')
    const p = (r.data as { planning: unknown; delivery: { total: number }; readiness: { humanApprovalRequired: boolean } })
    expect(p.delivery.total).toBe(1)
    expect(p.readiness.humanApprovalRequired).toBe(true)
  })

  it('create tools follow preview/confirm and validate references', () => {
    // Preview does not write.
    const preview = createPlanTool(dir, { title: 'New Plan' })
    expect((preview.data as { action: string }).action).toBe('create-delivery-plan')
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/plans/PLAN-002-new-plan.md'))).toBe(false)
    // Confirm writes.
    const applied = createPlanTool(dir, { title: 'New Plan', confirm: true })
    expect((applied.data as { applied: boolean }).applied).toBe(true)
    // Creating an epic in a missing plan fails with a safe message.
    const bad = createEpicTool(dir, { title: 'X', plan: 'PLAN-404', confirm: true })
    expect(bad.ok).toBe(false)
  })

  it('associate validates both ids', () => {
    const r = associateInitiativeTool(dir, { epic: 'EP-001', initiative: 'INI-010', confirm: true })
    expect(r.ok).toBe(true)
    const bad = associateInitiativeTool(dir, { epic: 'EP-404', initiative: 'INI-010', confirm: true })
    expect(bad.ok).toBe(false)
  })
})
