import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import { buildGraph } from '../src/core/graph.js'
import {
  buildGraphHints,
  renderGraphHintsMarkdown,
  serializeGraphHintsJson,
  loadGraphHints,
} from '../src/core/graph-hints.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(name: string) {
  write(
    '.kaddo/config.yml',
    `version: 1\nproject:\n  name: ${name}\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`
  )
}
function report() {
  const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' }, new Date('2026-06-19T00:00:00.000Z'))
  return buildGraphHints(tmp, graph, new Date('2026-06-19T00:00:00.000Z'))
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ghints-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('Graph hints — detection (VS-056)', () => {
  it('AC3/AC4/AC5: active Work Item missing code, capabilities and source is flagged', () => {
    config('todoApp')
    write(
      'knowledge/delivery/work-items/in-progress/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Init CLI\nstatus: in-progress\n---\n# x\n'
    )
    const r = report()
    const wi = r.hints.find((h) => h.artifact_id === 'WI-002')!
    expect(wi.artifact_type).toBe('work-item')
    expect(wi.missing).toEqual(expect.arrayContaining(['code', 'capabilities', 'decisions', 'source']))
    expect(wi.suggested_front_matter).toHaveProperty('code')
    expect(wi.suggested_front_matter).not.toHaveProperty('source') // scalar key omitted from YAML
    expect(r.metrics.active_work_items_without_code).toBe(1)
    expect(r.metrics.active_work_items_without_capabilities).toBe(1)
    expect(r.metrics.work_items_without_source).toBe(1)
  })

  it('AC6: ADR without governed code is flagged', () => {
    config('todoApp')
    write('knowledge/tech/decisions/ADR-001.md', '---\nid: ADR-001\ntype: adr\ntitle: Tech Stack\n---\nx\n')
    const r = report()
    const adr = r.hints.find((h) => h.artifact_id === 'ADR-001')!
    expect(adr.artifact_type).toBe('decision')
    expect(adr.missing).toEqual(['code'])
    expect(adr.message).toContain('no governed code paths')
    expect(r.metrics.adrs_without_code).toBe(1)
  })

  it('AC7: capability declared but not referenced by any Work Item is flagged', () => {
    config('todoApp')
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n# Cap\n\n### Task Management\n')
    const r = report()
    const cap = r.hints.find((h) => h.artifact_type === 'capability')!
    expect(cap.artifact_id).toBe('Task Management')
    expect(cap.message).toContain('not linked to any Work Item')
  })

  it('AC7: a capability referenced by a Work Item is NOT flagged', () => {
    config('todoApp')
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n# Cap\n\n### Task Management\n')
    write(
      'knowledge/delivery/work-items/in-progress/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Init\nstatus: in-progress\ncapabilities:\n  - task-management\n---\n# x\n'
    )
    const r = report()
    expect(r.hints.find((h) => h.artifact_type === 'capability')).toBeUndefined()
  })

  it('AC8: registered capsule not referenced by any Work Item is flagged; referenced one is not', () => {
    config('todoApp')
    write('external/orders-service.capsule.md', '---\ntype: knowledge-capsule\nsystem: orders-service\n---\n# c\n')
    write('.kaddo/external.yml', 'external:\n  - id: orders-service\n    type: knowledge-capsule\n    path: external/orders-service.capsule.md\n')
    expect(report().hints.find((h) => h.artifact_type === 'knowledge-capsule')?.artifact_id).toBe('orders-service')

    // Now a Work Item declares it.
    write(
      'knowledge/delivery/work-items/in-progress/WI-003.md',
      '---\nid: WI-003\ntype: feature\ntitle: Checkout\nstatus: in-progress\ncode:\n  - src/x/**\ncapabilities:\n  - checkout\ndecisions:\n  - ADR-1\nsource_id: WI-CANDIDATE-9\ncapsules:\n  - orders-service\n---\n# x\n'
    )
    expect(report().hints.find((h) => h.artifact_type === 'knowledge-capsule')).toBeUndefined()
  })

  it('AC9/AC10/AC11/AC12: hints are non-blocking, never edit artifacts, never read src/', () => {
    config('todoApp')
    write(
      'knowledge/delivery/work-items/in-progress/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Init\nstatus: in-progress\n---\n# x\n'
    )
    write('src/cli/index.ts', 'export const SECRET = "do-not-read-me"\n')
    const r = report()
    const out = renderGraphHintsMarkdown(r) + serializeGraphHintsJson(r)
    expect(out).not.toContain('do-not-read-me')
    expect(out).not.toContain('SECRET')
    // The Work Item file is unchanged.
    expect(fs.readFileSync(path.join(tmp, 'knowledge/delivery/work-items/in-progress/WI-002.md'), 'utf-8')).toContain('title: Init')
  })

  it('quality levels: empty (layers only) vs partial (active WI with relations + hints)', () => {
    config('todoApp')
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n')
    write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n')
    expect(report().quality).toBe('empty') // only the informs chain, no relationship edges

    write(
      'knowledge/delivery/work-items/in-progress/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Init\nstatus: in-progress\ncode:\n  - src/cli/**\ncapabilities:\n  - cli\ndecisions:\n  - ADR-1\nsource_id: WI-CANDIDATE-1\n---\n# x\n'
    )
    write(
      'knowledge/delivery/work-items/in-progress/WI-003.md',
      '---\nid: WI-003\ntype: feature\ntitle: Other\nstatus: in-progress\n---\n# x\n'
    )
    const r = report()
    expect(r.quality).toBe('partial') // some relations exist, but WI-003 still has hints
    expect(r.hints.some((h) => h.artifact_id === 'WI-003')).toBe(true)
  })

  it('markdown renders summary, missing list and suggested front matter', () => {
    config('todoApp')
    write('knowledge/tech/decisions/ADR-001.md', '---\nid: ADR-001\ntype: adr\ntitle: Tech Stack\n---\nx\n')
    const md = renderGraphHintsMarkdown(report())
    expect(md).toContain('# Kaddo Graph Hints')
    expect(md).toContain('Relationship quality:')
    expect(md).toContain('### ADR-001')
    expect(md).toContain('```yaml')
  })
})

describe('Graph hints — explain / context integration (VS-056)', () => {
  function exportAll() {
    const graph = buildGraph(tmp, loadConfig(tmp)!, { scope: 'all' }, new Date('2026-06-19T00:00:00.000Z'))
    write('.kaddo/graph.json', JSON.stringify(graph, null, 2))
    write('.kaddo/graph-hints.json', serializeGraphHintsJson(buildGraphHints(tmp, graph, new Date('2026-06-19T00:00:00.000Z'))))
  }

  it('AC13: explain shows graph quality + hints when present', () => {
    config('todoApp')
    write(
      'knowledge/delivery/work-items/in-progress/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Init\nstatus: in-progress\n---\n# x\n'
    )
    exportAll()
    const exp = buildProjectExplanation(tmp)
    expect(exp.graphHints).not.toBeNull()
    const out = renderExplanationHuman(exp)
    expect(out).toContain('## Knowledge Graph')
    expect(out).toContain('Quality:')
    expect(out).toContain('Hints:')
  })

  it('AC15: context includes a short graph-hints summary with the suggested agent', () => {
    config('todoApp')
    write(
      'knowledge/delivery/work-items/in-progress/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Init\nstatus: in-progress\n---\n# x\n'
    )
    exportAll()
    const pack = buildContextPack(tmp, loadConfig(tmp)!)
    expect(pack.graphHints).not.toBeNull()
    const md = renderContextPack(pack)
    expect(md).toContain('## Graph Hints')
    expect(md).toContain('Suggested agent: graph-agent')
  })

  it('loadGraphHints returns null when nothing exported', () => {
    config('todoApp')
    expect(loadGraphHints(tmp)).toBeNull()
  })
})
