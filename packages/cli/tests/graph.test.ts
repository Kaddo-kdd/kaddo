import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import {
  buildGraph,
  serializeGraphJson,
  renderGraphMermaid,
  graphIsSparse,
  loadGraphSummary,
} from '../src/core/graph.js'
import { buildGraphHints, renderGraphHintsMarkdown } from '../src/core/graph-hints.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(name: string, extra = '') {
  write(
    '.kaddo/config.yml',
    `version: 1\nproject:\n  name: ${name}\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n${extra}`
  )
}

// A fully-connected Work Item: code globs, capabilities, decision, initiative + roadmap source.
function richWorkItem(id: string, status = 'in-progress') {
  write(
    `knowledge/delivery/work-items/in-progress/${id}.md`,
    [
      '---',
      `id: ${id}`,
      'type: feature',
      `title: ${id} Task management`,
      `status: ${status}`,
      'knowledge_level: K2',
      'initiative: Checkout',
      'source: roadmap',
      'source_id: WI-CANDIDATE-001',
      'capabilities:',
      '  - task-management',
      'decisions:',
      '  - ADR-001',
      'code:',
      '  - src/cli/**',
      '  - src/shared/**',
      '---',
      '# body',
    ].join('\n')
  )
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-graph-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('Knowledge Graph — build (VS-055)', () => {
  it('AC3/AC4/AC5/AC7/AC8/AC9: nodes + edges from layers, Work Items, code, ADRs, capsules', () => {
    config('todoApp')
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n')
    write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n')
    write('knowledge/tech/decisions/ADR-001.md', '---\nid: ADR-001\ntype: adr\ntitle: Tech Stack\ncode:\n  - src/database/**\n---\nx\n')
    richWorkItem('WI-002')
    write('external/orders-service.capsule.md', '---\ntype: knowledge-capsule\nsystem: orders-service\n---\n# c\n')
    write('.kaddo/external.yml', 'external:\n  - id: orders-service\n    type: knowledge-capsule\n    path: external/orders-service.capsule.md\n')

    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' }, new Date('2026-06-19T00:00:00.000Z'))
    const ids = graph.nodes.map((n) => n.id)
    // Layer nodes
    expect(ids).toContain('business:business')
    expect(ids).toContain('product:product')
    // Work Item + its relations
    expect(ids).toContain('wi:WI-002')
    expect(ids).toContain('code:src/cli/**')
    expect(ids).toContain('capability:task-management')
    expect(ids).toContain('adr:ADR-001')
    expect(ids).toContain('initiative:checkout')
    expect(ids).toContain('candidate:WI-CANDIDATE-001')
    expect(ids).toContain('capsule:orders-service')

    const edge = (from: string, to: string, type: string) =>
      graph.edges.some((e) => e.from === from && e.to === to && e.type === type)
    expect(edge('business:business', 'product:product', 'informs')).toBe(true)
    expect(edge('wi:WI-002', 'code:src/cli/**', 'owns')).toBe(true)
    expect(edge('wi:WI-002', 'capability:task-management', 'implements')).toBe(true)
    expect(edge('wi:WI-002', 'adr:ADR-001', 'depends_on')).toBe(true)
    expect(edge('wi:WI-002', 'initiative:checkout', 'belongs_to')).toBe(true)
    expect(edge('candidate:WI-CANDIDATE-001', 'wi:WI-002', 'materialized_as')).toBe(true)
    expect(edge('adr:ADR-001', 'code:src/database/**', 'governs')).toBe(true)
    expect(edge('capsule:orders-service', 'project:todoapp', 'provides_external_context')).toBe(true)

    // ADR node carries its path/title once present.
    const adr = graph.nodes.find((n) => n.id === 'adr:ADR-001')!
    expect(adr.label).toContain('Tech Stack')
    expect(adr.path).toContain('decisions')
  })

  it('AC10/AC11: active scope drops completed Work Items; all scope keeps them + unreferenced ADRs', () => {
    config('todoApp')
    richWorkItem('WI-002', 'in-progress')
    write(
      'knowledge/delivery/work-items/completed/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Done\nstatus: done\n---\n# x\n'
    )
    write('knowledge/tech/decisions/ADR-009.md', '---\nid: ADR-009\ntype: adr\ntitle: Unreferenced\n---\nx\n')

    const active = buildGraph(tmp, loadConfig(tmp)!, { scope: 'active' })
    const activeIds = active.nodes.map((n) => n.id)
    expect(activeIds).toContain('wi:WI-002')
    expect(activeIds).not.toContain('wi:WI-001') // completed excluded
    expect(activeIds).not.toContain('adr:ADR-009') // unreferenced ADR excluded in active

    const all = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' })
    const allIds = all.nodes.map((n) => n.id)
    expect(allIds).toContain('wi:WI-001')
    expect(allIds).toContain('adr:ADR-009')
  })

  it('VS-060 AC6/AC8: active scope with no active Work Items reports contextual-empty metadata', () => {
    config('todoApp')
    write(
      'knowledge/delivery/work-items/completed/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Done\nstatus: completed\ncode:\n  - src/cli/**\n---\n# x\n'
    )
    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'active' })
    expect(graph.scope).toBe('active')
    expect(graph.scope_reason).toContain('No active Work Items found')
    expect(graph.included_statuses).toEqual(['draft', 'ready', 'in-progress', 'blocked'])
    expect(graph.excluded_statuses).toContain('completed')
    expect(graph.nodes.some((n) => n.type === 'work-item')).toBe(false)

    const hints = buildGraphHints(tmp, graph)
    expect(hints.scope).toBe('active')
    expect(hints.quality).toBe('empty')
    const md = renderGraphHintsMarkdown(hints)
    expect(md).not.toContain('look healthy')
    expect(md).toContain('No active relationship hints were generated')
    expect(md).toContain('--scope all')
  })

  it('VS-060 AC7/AC10: all scope includes completed and excludes archived by default', () => {
    config('todoApp')
    write(
      'knowledge/delivery/work-items/completed/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Done\nstatus: completed\ncode:\n  - src/cli/**\n---\n# x\n'
    )
    write(
      'knowledge/delivery/work-items/archived/WI-000.md',
      '---\nid: WI-000\ntype: feature\ntitle: Old\nstatus: archived\ncode:\n  - src/old/**\n---\n# x\n'
    )
    const all = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' })
    const ids = all.nodes.map((n) => n.id)
    expect(all.scope).toBe('all')
    expect(all.excluded_statuses).toEqual(['archived'])
    expect(ids).toContain('wi:WI-001') // completed included
    expect(ids).not.toContain('wi:WI-000') // archived excluded by default
  })

  it('AC2/AC12: JSON + Mermaid serialization (sanitized ids, edge labels)', () => {
    config('todoApp')
    richWorkItem('WI-002')

    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' }, new Date('2026-06-19T00:00:00.000Z'))
    const json = JSON.parse(serializeGraphJson(graph))
    expect(json.generated_at).toBe('2026-06-19T00:00:00.000Z')
    expect(json.project.name).toBe('todoApp')
    expect(Array.isArray(json.nodes)).toBe(true)
    expect(Array.isArray(json.edges)).toBe(true)

    const mmd = renderGraphMermaid(graph)
    expect(mmd.startsWith('flowchart LR')).toBe(true)
    expect(mmd).toContain('wi_WI_002["WI-002 WI-002 Task management"]')
    expect(mmd).toMatch(/wi_WI_002 -->\|owns\| code_src_cli/)
  })

  it('AC13: never reads files under src/ (no source code content)', () => {
    config('todoApp')
    richWorkItem('WI-002')
    write('src/cli/index.ts', 'export const SECRET = "do-not-read-me"\n')
    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' })
    const serialized = serializeGraphJson(graph) + renderGraphMermaid(graph)
    expect(serialized).not.toContain('do-not-read-me')
    expect(serialized).not.toContain('SECRET')
  })

  it('limited-relationships detection for a graph with only the layer chain', () => {
    config('todoApp')
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n')
    write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n')
    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' })
    expect(graphIsSparse(graph)).toBe(true)
  })
})

describe('Knowledge Graph — explain / context integration (VS-055)', () => {
  function exportGraph() {
    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' }, new Date('2026-06-19T00:00:00.000Z'))
    write('.kaddo/graph.json', serializeGraphJson(graph))
  }

  it('AC15: explain shows a Knowledge Graph summary only after export', () => {
    config('todoApp')
    richWorkItem('WI-002')
    expect(buildProjectExplanation(tmp).graph).toBeNull()

    exportGraph()
    const exp = buildProjectExplanation(tmp)
    expect(exp.graph).not.toBeNull()
    expect(exp.graph!.activeWorkItemsConnectedToCode).toBe(1)
    const out = renderExplanationHuman(exp)
    expect(out).toContain('## Knowledge Graph')
    expect(out).toContain('Last exported: 2026-06-19')
  })

  it('AC16: context shows a Knowledge Graph summary, not the full graph', () => {
    config('todoApp')
    richWorkItem('WI-002')
    exportGraph()
    const pack = buildContextPack(tmp, loadConfig(tmp)!)
    expect(pack.graph).not.toBeNull()
    const md = renderContextPack(pack)
    expect(md).toContain('## Knowledge Graph')
    expect(md).toContain('Active Work Items connected to code: 1')
    // Summary only — the node-by-node list must not be inlined.
    expect(md).not.toContain('flowchart LR')
  })

  it('loadGraphSummary returns null when nothing exported', () => {
    config('todoApp')
    expect(loadGraphSummary(tmp)).toBeNull()
  })
})
