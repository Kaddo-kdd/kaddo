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

  it('AC18 (VS-061.2): builds the graph in memory even when graph.json was never exported', () => {
    config()
    baseKnowledge()
    const r = buildImpactReport(tmp) // no graph.json on disk
    // The report no longer depends on a persisted graph — it computes it fresh at scope all.
    expect(r.graph_quality.available).toBe(true)
    if (r.graph_quality.available) expect(r.graph_quality.scope).toBe('all')
    const md = renderImpactMarkdown(r)
    expect(md).toContain('## Graph Quality')
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

  it('VS-061.2 AC1/AC8/AC16: default scope is all, even when graph.json was exported active', () => {
    config()
    baseKnowledge() // only a completed Work Item
    exportGraph('active') // persist an EMPTY active graph.json
    const r = buildImpactReport(tmp) // no scope → default all, built in memory
    expect(r.scope).toBe('all')
    expect(r.default_scope).toBe('all')
    expect(r.scope_source).toBe('default')
    expect(r.graph_quality.available).toBe(true)
    if (r.graph_quality.available) {
      expect(r.graph_quality.scope).toBe('all')
      expect(r.graph_quality.quality).not.toBe('empty') // completed WI is included under `all`
    }
  })

  it('VS-061.2 AC4/AC9/AC10: --scope active is explicit and suggests `kaddo impact --scope all`', () => {
    config()
    baseKnowledge()
    const r = buildImpactReport(tmp, { scope: 'active' })
    expect(r.scope).toBe('active')
    expect(r.scope_source).toBe('explicit')
    expect(r.suggested_actions.some((a) => a.includes('kaddo impact --scope all'))).toBe(true)
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
    expect(json).toHaveProperty('actionable_gaps.missing_source')
    expect(json).toHaveProperty('actionable_gaps.ownership_overlaps')
    expect(json).toHaveProperty('suggested_actions')
  })

  it('AC1/AC3-AC11: actionable gaps detect per-Work-Item gaps, broad globs and overlaps', () => {
    config()
    // WI-001 missing everything; WI-004 complete but shares a glob with WI-001.
    write('knowledge/delivery/work-items/completed/WI-001.md', '---\nid: WI-001\ntype: feature\ntitle: Init CLI\nstatus: completed\ncode:\n  - src/cli/**\n---\n# WI-001')
    write(
      'knowledge/delivery/work-items/completed/WI-004.md',
      '---\nid: WI-004\ntype: feature\ntitle: Cmds\nstatus: completed\nknowledge_level: K2\nsource: roadmap\nsource_id: C1\ninitiative: cli\ncode:\n  - src/cli/**\n  - src/modules/tasks/task.repository.ts\n---\n# x\n\n## Acceptance Criteria\n- a\n\n## Definition of Done\n- d\n\n## How to test it\n- run\n'
    )
    const r = buildImpactReport(tmp)
    const g = r.actionable_gaps
    expect(g.missing_source.map((x) => x.id)).toEqual(['WI-001'])
    expect(g.missing_initiative.map((x) => x.id)).toEqual(['WI-001'])
    expect(g.missing_knowledge_level.map((x) => x.id)).toEqual(['WI-001'])
    expect(g.missing_acceptance_criteria.map((x) => x.id)).toEqual(['WI-001'])
    expect(g.missing_definition_of_done.map((x) => x.id)).toEqual(['WI-001'])
    expect(g.missing_validation.map((x) => x.id)).toEqual(['WI-001'])
    expect(g.missing_code_ownership).toHaveLength(0) // both have code
    // AC10: src/cli/** is broad; AC11: it's owned by both WIs (overlap).
    expect(g.broad_ownership_globs.some((b) => b.glob === 'src/cli/**')).toBe(true)
    const overlap = g.ownership_overlaps.find((o) => o.code_path === 'src/cli/**')!
    expect(overlap.work_items.sort()).toEqual(['WI-001', 'WI-004'])
    // AC12: suggested actions name specific Work Items.
    expect(r.suggested_actions.some((a) => a.includes('WI-001'))).toBe(true)
    // gap items carry id/title/status/path/suggested_action (AC14).
    expect(g.missing_source[0]).toMatchObject({ id: 'WI-001', title: 'Init CLI', status: 'completed' })
    expect(g.missing_source[0].path).toContain('WI-001.md')
  })

  it('AC2: no gaps → markdown says so, and score_breakdown is present', () => {
    config()
    write(
      'knowledge/delivery/work-items/ready/WI-1.md',
      '---\nid: WI-1\ntype: feature\ntitle: A\nstatus: ready\nknowledge_level: K2\nsource: roadmap\nsource_id: C1\ninitiative: cli\ncode:\n  - src/cli/program.ts\n---\n# x\n\n## Acceptance Criteria\n- a\n\n## Definition of Done\n- d\n\n## How to test it\n- run\n'
    )
    const r = buildImpactReport(tmp)
    const md = renderImpactMarkdown(r)
    expect(md).toContain('No actionable knowledge gaps detected.')
    expect(md).toContain('## Score Breakdown')
    expect(r.score_breakdown).not.toBeNull()
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
