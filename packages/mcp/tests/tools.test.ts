import { describe, it, expect, afterEach } from 'vitest'
import {
  projectStatus,
  listWorkItemsTool,
  getWorkItem,
  listCapsulesTool,
  getCapsuleTool,
  listAgentsTool,
  getAgentPromptTool,
  listGraphHints,
} from '../src/tools.js'
import { makeProject, write, config, workItem, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

describe('MCP tools (VS-057 AC7)', () => {
  it('kaddo_list_work_items filters by status/type/level', () => {
    root = makeProject()
    config(root)
    workItem(root, 'WI-001', { status: 'ready', type: 'feature', level: 'K2' })
    workItem(root, 'WI-002', { status: 'in-progress', type: 'chore', level: 'K1' })

    const ready = listWorkItemsTool(root, { status: 'ready' })
    expect(ready.ok && (ready.data as unknown[]).length).toBe(1)
    const chores = listWorkItemsTool(root, { type: 'chore' })
    expect(chores.ok && (chores.data as { id: string }[])[0].id).toBe('WI-002')
  })

  it('kaddo_get_work_item returns content or a not-found message', () => {
    root = makeProject()
    config(root)
    workItem(root, 'WI-001')
    const found = getWorkItem(root, 'WI-001')
    expect(found.ok).toBe(true)
    expect(getWorkItem(root, 'WI-999').ok).toBe(false)
  })

  it('kaddo_project_status reads explain.json + graph-hints.json', () => {
    root = makeProject()
    config(root)
    expect(projectStatus(root).ok).toBe(false) // no explain.json yet
    write(
      root,
      '.kaddo/explain.json',
      JSON.stringify({
        project: { name: 'demo', state: 'new' },
        workItems: { total: 2, byState: { ready: 1 }, byType: { feature: 2 } },
        ownership: { workItemsWithOwnership: 1, workItemsTotal: 2 },
        layers: [{ layer: 'Business', status: 'Complete' }],
      })
    )
    write(root, '.kaddo/graph-hints.json', JSON.stringify({ quality: 'partial', scope: 'active', scope_reason: 'r', summary: { hints: 3 } }))
    const status = projectStatus(root)
    expect(status.ok).toBe(true)
    const data = (status as { data: { graph: { quality: string; scope: string } } }).data
    expect(data.graph.quality).toBe('partial')
    expect(data.graph.scope).toBe('active')
  })

  it('kaddo_list_capsules / get_capsule', () => {
    root = makeProject()
    config(root)
    write(root, 'external/orders.capsule.md', '---\ntype: knowledge-capsule\nsystem: orders\n---\n## Purpose\n\nOrders.\n')
    write(root, '.kaddo/external.yml', 'external:\n  - id: orders\n    type: knowledge-capsule\n    path: external/orders.capsule.md\n')
    const list = listCapsulesTool(root)
    expect(list.ok && (list.data as { id: string }[])[0].id).toBe('orders')
    expect(getCapsuleTool(root, 'orders').ok).toBe(true)
    expect(getCapsuleTool(root, 'nope').ok).toBe(false)
  })

  it('kaddo_list_agents / get_agent_prompt', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/agents/delivery/work-item-agent.md', '# Work Item Agent\n\nRefine work items.')
    const agents = listAgentsTool(root)
    expect(agents.ok && (agents.data as { name: string }[])[0].name).toBe('work-item-agent')
    expect(getAgentPromptTool(root, 'work-item-agent').ok).toBe(true)
    expect(getAgentPromptTool(root, 'missing-agent').ok).toBe(false)
  })

  it('kaddo_list_graph_hints filters + reports missing file', () => {
    root = makeProject()
    config(root)
    expect(listGraphHints(root).ok).toBe(false)
    write(
      root,
      '.kaddo/graph-hints.json',
      JSON.stringify({
        quality: 'partial',
        hints: [
          { artifact_id: 'WI-1', artifact_type: 'work-item', severity: 'info', missing: ['code'], message: 'm' },
          { artifact_id: 'ADR-1', artifact_type: 'decision', severity: 'info', missing: ['code'], message: 'm' },
        ],
      })
    )
    const active = listGraphHints(root, { active_only: true })
    expect(active.ok && (active.data as { count: number }).count).toBe(1)
  })
})
