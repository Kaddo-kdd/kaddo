import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import { buildGraph, serializeGraphJson } from '../src/core/graph.js'
import { buildGraphHints, serializeGraphHintsJson } from '../src/core/graph-hints.js'
import { buildImpactReport, renderImpactMarkdown, serializeImpactJson } from '../src/core/impact-report.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(name = 'todoApp') {
  write(
    '.kaddo/config.yml',
    `version: 1\nproject:\n  name: ${name}\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`
  )
}
function baseKnowledge() {
  write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nManages tasks.')
  write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n\nProduct.')
  write(
    'knowledge/delivery/work-items/completed/WI-004.md',
    '---\nid: WI-004\ntype: feature\ntitle: Cmds\nstatus: completed\nknowledge_level: K2\nsource: roadmap\nsource_id: WI-CANDIDATE-1\ninitiative: cli\ncode:\n  - src/cli/**\n---\n# WI\n\n## Acceptance criteria\n- a\n\n## Definition of Done\n- d\n'
  )
}
function exportGraph(scope: 'active' | 'all') {
  const graph = buildGraph(tmp, loadConfig(tmp)!, { scope }, new Date('2026-06-21T00:00:00.000Z'))
  write('.kaddo/graph.json', serializeGraphJson(graph))
  write('.kaddo/graph-hints.json', serializeGraphHintsJson(buildGraphHints(tmp, graph, new Date('2026-06-21T00:00:00.000Z'))))
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-impact-'))
})
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Knowledge Impact Report (VS-061)', () => {
  it('AC3-AC12: report has all sections (healthy graph project)', () => {
    config()
    baseKnowledge()
    exportGraph('all')
    const md = renderImpactMarkdown(buildImpactReport(tmp))
    for (const section of [
      '# Kaddo Knowledge Impact Report',
      '## Executive Summary',
      '## Knowledge Health',
      '## Knowledge Coverage',
      '## Ownership Coverage',
      '## Traceability',
      '## Context Readiness',
      '## Work Item Readiness',
      '## Graph Quality',
      '## Guard Activity',
      '## Impact Signals',
      '## Suggested Actions',
    ]) {
      expect(md).toContain(section)
    }
    expect(md).toContain('Guard history: not available')
  })

  it('AC18/AC19: degrades gracefully when the graph has not been exported', () => {
    config()
    baseKnowledge()
    const r = buildImpactReport(tmp) // no graph.json
    expect(r.graph_quality.available).toBe(false)
    const md = renderImpactMarkdown(r)
    expect(md).toContain('Graph data not available.')
    expect(md).toContain('kaddo graph export --scope all')
    expect(r.suggested_actions.some((a) => a.includes('graph export'))).toBe(true)
  })

  it('AC28: active scope with no active Work Items reports empty graph quality', () => {
    config()
    baseKnowledge() // only a completed Work Item
    const r = buildImpactReport(tmp, { scope: 'active' })
    expect(r.graph_quality.available).toBe(true)
    if (r.graph_quality.available) {
      expect(r.graph_quality.scope).toBe('active')
      expect(r.graph_quality.quality).toBe('empty')
    }
  })

  it('AC14/AC30: stable JSON shape', () => {
    config()
    baseKnowledge()
    exportGraph('all')
    const json = JSON.parse(serializeImpactJson(buildImpactReport(tmp)))
    expect(json).toHaveProperty('knowledge_health')
    expect(json).toHaveProperty('knowledge_coverage')
    expect(json).toHaveProperty('ownership_coverage.coverage_percent')
    expect(json).toHaveProperty('traceability')
    expect(json).toHaveProperty('context_readiness.level')
    expect(json).toHaveProperty('work_item_readiness')
    expect(json).toHaveProperty('graph_quality')
    expect(json).toHaveProperty('guard_activity.available', false)
    expect(json).toHaveProperty('impact_signals.ai_context_readiness')
    expect(json).toHaveProperty('suggested_actions')
  })

  it('coverage and ownership reflect the Work Item front matter + body', () => {
    config()
    baseKnowledge()
    exportGraph('all')
    const r = buildImpactReport(tmp)
    expect(r.ownership_coverage.coverage_percent).toBe(100)
    expect(r.knowledge_coverage.find((c) => c.label.includes('acceptance'))!.have).toBe(1)
    expect(r.knowledge_coverage.find((c) => c.label.includes('Definition of Done'))!.have).toBe(1)
    expect(r.traceability.completed_work_items).toBe(1)
  })
})
