// Knowledge Impact Report (VS-061).
//
// A deterministic, evidence-first report that consolidates the value Kaddo already produces
// (knowledge health, coverage, ownership, traceability, readiness, graph quality, qualitative
// impact signals). It never calls an LLM, never computes money/ROI, never measures individual
// productivity, and writes nothing unless the caller asks for an output file.

import { readFile } from '../utils/fs.js'
import matter from 'gray-matter'
import { loadConfig } from './config.js'
import { buildProjectExplanation } from './project-explain.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { discoverInstalledSkills } from '../services/installed-skills.js'
import { buildGraph, type GraphScope } from './graph.js'
import { buildGraphHints } from './graph-hints.js'

export type Level = 'Low' | 'Medium' | 'High' | 'Very High'

export type ImpactReport = {
  generated_at: string
  project: string
  scope: string
  executive_summary: string[]
  knowledge_health: Record<string, string>
  knowledge_coverage: { label: string; have: number; total: number }[]
  ownership_coverage: {
    coverage_percent: number
    work_items_with_ownership: string
    owned_code_paths: number
    broad_globs: number
    ownership_overlaps: number
  }
  traceability: {
    roadmap_candidates: number
    materialized_work_items: number
    remaining_candidates: number
    completed_work_items: number
    work_items_connected_to_roadmap: string
    work_items_connected_to_code: string
    graph_quality: string
    graph_nodes: number | null
    graph_edges: number | null
    graph_hints: number | null
  }
  context_readiness: { level: Level; reasons: string[] }
  work_item_readiness: {
    draft: number
    ready: number
    in_progress: number
    blocked: number
    completed: number
    ready_quality: string
  }
  graph_quality:
    | { available: true; scope: string; quality: string; nodes: number; edges: number; hints: number; reason: string; last_exported: string }
    | { available: false; suggestion: string }
  guard_activity: { available: false; note: string }
  impact_signals: {
    ambiguity_reduction: Level
    drift_prevention: 'Active' | 'Limited'
    onboarding_support: Level
    delivery_traceability: Level
    ai_context_readiness: Level
    maintenance_readiness: Level
  }
  score: number | null
  suggested_actions: string[]
}

const BROAD_GLOB = /^[^/*]+\/\*\*$/ // e.g. src/** — broad, low-signal ownership

function levelFromRatio(r: number): Level {
  if (r >= 0.9) return 'Very High'
  if (r >= 0.7) return 'High'
  if (r >= 0.4) return 'Medium'
  return 'Low'
}

function hasSection(body: string, re: RegExp): boolean {
  return body.split(/\r?\n/).some((l) => /^#{1,6}\s+/.test(l) && re.test(l))
}

/** Build the deterministic impact report. When `scope` is given, the graph section is computed
 *  fresh at that scope; otherwise it reflects the last exported graph (if any). */
export function buildImpactReport(dir: string, opts: { scope?: GraphScope } = {}, now: Date = new Date()): ImpactReport {
  const exp = buildProjectExplanation(dir)
  const wis = discoverWorkItems(dir)
  const total = wis.length

  // --- Per-Work-Item coverage (front matter + body sections) ---
  let withOwnership = 0
  let withSource = 0
  let withInitiative = 0
  let withLevel = 0
  let withAcceptance = 0
  let withDoD = 0
  let connectedRoadmap = 0
  const globCounts = new Map<string, number>()
  for (const wi of wis) {
    if (wi.codeGlobs.length > 0) withOwnership++
    const hasSource = Boolean(wi.sourceId) || wi.source === 'roadmap'
    if (hasSource) withSource++
    if (hasSource || wi.initiative) connectedRoadmap++
    if (wi.initiative) withInitiative++
    if (wi.knowledgeLevel) withLevel++
    for (const g of wi.codeGlobs) globCounts.set(g, (globCounts.get(g) ?? 0) + 1)
    try {
      const body = matter(readFile(wi.filePath)).content
      if (hasSection(body, /acceptance/i)) withAcceptance++
      if (hasSection(body, /definition of done|^#{1,6}\s*done\b/i)) withDoD++
    } catch {
      // unreadable body — skip section detection
    }
  }
  const ownedCodePaths = [...globCounts.values()].reduce((a, b) => a + b, 0)
  const broadGlobs = [...globCounts.keys()].filter((g) => BROAD_GLOB.test(g)).length
  const ownershipOverlaps = [...globCounts.values()].filter((n) => n > 1).length

  // --- Graph section (fresh at requested scope, or last exported) ---
  type G = { available: boolean; scope: string; scopeReason: string; nodes: number; edges: number; quality: string; hints: number; generatedAt: string }
  let g: G
  if (opts.scope) {
    const config = loadConfig(dir)
    if (config) {
      const graph = buildGraph(dir, config, { scope: opts.scope }, now)
      const hints = buildGraphHints(dir, graph, now)
      g = { available: true, scope: graph.scope, scopeReason: graph.scope_reason, nodes: graph.nodes.length, edges: graph.edges.length, quality: hints.quality, hints: hints.summary.hints, generatedAt: graph.generated_at }
    } else {
      g = { available: false, scope: opts.scope, scopeReason: '', nodes: 0, edges: 0, quality: 'unknown', hints: 0, generatedAt: '' }
    }
  } else if (exp.graph) {
    g = { available: true, scope: exp.graph.scope, scopeReason: exp.graph.scopeReason, nodes: exp.graph.nodes, edges: exp.graph.edges, quality: exp.graphHints?.quality ?? 'unknown', hints: exp.graphHints?.totalHints ?? 0, generatedAt: exp.graph.generatedAt }
  } else {
    g = { available: false, scope: 'n/a', scopeReason: '', nodes: 0, edges: 0, quality: 'unknown', hints: 0, generatedAt: '' }
  }

  const layerStatus = (name: string) => exp.layers.find((l) => l.layer === name)?.status ?? 'Missing'
  const byState = exp.workItems.byState
  const skills = discoverInstalledSkills(dir)

  // --- Knowledge health ---
  const knowledge_health: Record<string, string> = {
    Business: layerStatus('Business'),
    Product: layerStatus('Product'),
    Tech: layerStatus('Tech'),
    Delivery: layerStatus('Delivery'),
    Inventory: exp.knowledge.hasInventory ? 'available' : 'missing',
    'Context pack': exp.knowledge.hasContextPack ? 'available' : 'missing',
    Agents: exp.knowledge.hasAgents ? 'available' : 'missing',
    Skills: skills.length > 0 ? 'available' : 'missing',
  }

  // --- Coverage ---
  const knowledge_coverage = [
    { label: 'Work Items with ownership', have: withOwnership, total },
    { label: 'Work Items with source', have: withSource, total },
    { label: 'Work Items with initiative', have: withInitiative, total },
    { label: 'Work Items with acceptance criteria', have: withAcceptance, total },
    { label: 'Work Items with Definition of Done', have: withDoD, total },
    { label: 'Work Items with knowledge level', have: withLevel, total },
  ]
  const coverageRatio = (have: number) => (total > 0 ? have / total : 0)

  // --- Context readiness (rule-based, transparent) ---
  const deliveryTraceable = ['Traceable', 'Structured', 'Consolidated'].includes(layerStatus('Delivery'))
  const ctxReasons: string[] = []
  let ctxScore = 0
  if (['Consolidated', 'Structured'].includes(layerStatus('Business'))) { ctxScore++; ctxReasons.push('Business knowledge is present.') }
  if (['Consolidated', 'Structured'].includes(layerStatus('Product'))) { ctxScore++; ctxReasons.push('Product knowledge is present.') }
  if (layerStatus('Tech') !== 'Missing') { ctxScore++; ctxReasons.push('Tech knowledge is structured.') }
  if (deliveryTraceable) { ctxScore++; ctxReasons.push('Delivery is traceable.') }
  if (exp.knowledge.hasContextPack) { ctxScore++; ctxReasons.push('Context pack is available.') }
  if (g.available && g.quality !== 'empty') { ctxScore++; ctxReasons.push(`Graph quality is ${g.quality}.`) }
  const ctxLevel: Level = ctxScore >= 6 ? 'Very High' : ctxScore >= 4 ? 'High' : ctxScore >= 2 ? 'Medium' : 'Low'

  // --- Impact signals ---
  const ambiguityRatio = total > 0 ? (withAcceptance + withDoD + withSource) / (3 * total) : 0
  const aiReady: Level =
    exp.knowledge.hasContextPack && g.available && g.quality !== 'empty' && skills.length > 0 && deliveryTraceable
      ? 'High'
      : exp.knowledge.hasContextPack && g.available && g.quality !== 'empty'
        ? 'Medium'
        : 'Low'
  const onboarding = levelFromRatio(
    ([layerStatus('Business'), layerStatus('Product'), layerStatus('Tech'), layerStatus('Delivery')].filter((s) => s !== 'Missing').length / 4) *
      (exp.knowledge.hasContextPack ? 1 : 0.6)
  )
  const deliveryTrace = levelFromRatio(
    (coverageRatio(withOwnership) * 0.5) + ((g.available && g.edges > 0 ? 1 : 0) * 0.25) + ((exp.roadmap.present ? 1 : 0) * 0.25)
  )
  const impact_signals = {
    ambiguity_reduction: levelFromRatio(ambiguityRatio),
    drift_prevention: (withOwnership > 0 ? 'Active' : 'Limited') as 'Active' | 'Limited',
    onboarding_support: onboarding,
    delivery_traceability: deliveryTrace,
    ai_context_readiness: aiReady,
    maintenance_readiness: levelFromRatio((coverageRatio(withOwnership) + (deliveryTraceable ? 1 : 0)) / 2),
  }

  // --- Score (transparent, optional) ---
  let score: number | null = null
  if (total > 0) {
    const healthPts = ([layerStatus('Business'), layerStatus('Product'), layerStatus('Tech'), layerStatus('Delivery')].filter((s) => s !== 'Missing').length / 4) * 20
    const covAvg = knowledge_coverage.reduce((a, c) => a + coverageRatio(c.have), 0) / knowledge_coverage.length
    const coveragePts = covAvg * 20
    const ownPts = coverageRatio(withOwnership) * 15
    const traceBlend = ((exp.roadmap.candidates > 0 ? exp.roadmap.materialized / exp.roadmap.candidates : 1) * 0.5) + (coverageRatio(withOwnership) * 0.5)
    const tracePts = traceBlend * 20
    const qualityMap: Record<string, number> = { good: 1, partial: 0.6, sparse: 0.3, empty: 0, unknown: 0 }
    const graphPts = (g.available ? (qualityMap[g.quality] ?? 0) : 0) * 15
    const ctxPts = ({ Low: 0.25, Medium: 0.5, High: 0.8, 'Very High': 1 }[ctxLevel]) * 10
    score = Math.round(healthPts + coveragePts + ownPts + tracePts + graphPts + ctxPts)
  }

  // --- Suggested actions (depend on the metrics) ---
  const actions: string[] = []
  if (!g.available) actions.push('Run `kaddo graph export --scope all` to inspect full traceability.')
  else if (g.scope === 'active' && g.quality === 'empty') actions.push('Run `kaddo graph export --scope all` to include completed Work Items.')
  if (exp.roadmap.remaining > 0) actions.push(`Materialize the ${exp.roadmap.remaining} remaining roadmap candidate(s) with \`kaddo create --from roadmap\`.`)
  if (total > 0 && withOwnership < total) actions.push('Add code ownership to Work Items without `code:` globs (`kaddo owners suggest`).')
  if (total > 0 && withInitiative < total) actions.push('Add an initiative to Work Items missing one.')
  if (g.available && g.hints > 0) actions.push('Review graph hints (`kaddo://graph-hints` or `.kaddo/graph-hints.md`).')
  if (skills.length === 0) actions.push('Install reusable skills with `kaddo add skills`.')
  actions.push('Run `kaddo guard` before committing to catch knowledge drift.')

  // --- Executive summary ---
  const summary: string[] = []
  if (total > 0) summary.push(`${withOwnership}/${total} Work Items include code ownership.`)
  if (g.available) summary.push(`The knowledge graph is ${g.quality} with ${g.nodes} nodes and ${g.edges} edges (${g.scope} scope).`)
  else summary.push('The knowledge graph has not been exported yet.')
  if (g.available) summary.push(g.hints === 0 ? 'No graph hints are currently open.' : `${g.hints} graph hint(s) are open.`)
  if (exp.roadmap.present) summary.push(`Delivery: ${exp.roadmap.materialized} materialized, ${exp.roadmap.remaining} roadmap candidate(s) remaining.`)
  summary.push(`Context readiness: ${ctxLevel}.`)

  return {
    generated_at: now.toISOString(),
    project: exp.project.name,
    scope: g.scope,
    executive_summary: summary,
    knowledge_health,
    knowledge_coverage,
    ownership_coverage: {
      coverage_percent: total > 0 ? Math.round((withOwnership / total) * 100) : 0,
      work_items_with_ownership: `${withOwnership}/${total}`,
      owned_code_paths: ownedCodePaths,
      broad_globs: broadGlobs,
      ownership_overlaps: ownershipOverlaps,
    },
    traceability: {
      roadmap_candidates: exp.roadmap.candidates,
      materialized_work_items: exp.roadmap.materialized,
      remaining_candidates: exp.roadmap.remaining,
      completed_work_items: byState.completed,
      work_items_connected_to_roadmap: `${connectedRoadmap}/${total}`,
      work_items_connected_to_code: `${withOwnership}/${total}`,
      graph_quality: g.available ? g.quality : 'not available',
      graph_nodes: g.available ? g.nodes : null,
      graph_edges: g.available ? g.edges : null,
      graph_hints: g.available ? g.hints : null,
    },
    context_readiness: { level: ctxLevel, reasons: ctxReasons },
    work_item_readiness: {
      draft: byState.draft,
      ready: byState.ready,
      in_progress: byState['in-progress'],
      blocked: byState.blocked,
      completed: byState.completed,
      ready_quality: byState.ready > 0 ? `${byState.ready} ready` : 'not applicable',
    },
    graph_quality: g.available
      ? { available: true, scope: g.scope, quality: g.quality, nodes: g.nodes, edges: g.edges, hints: g.hints, reason: g.scopeReason, last_exported: g.generatedAt }
      : { available: false, suggestion: 'Run `kaddo graph export --scope all`.' },
    guard_activity: {
      available: false,
      note: 'Guard history is not persisted. Run `kaddo guard` to check drift; future versions may store runs for trend analysis.',
    },
    impact_signals,
    score,
    suggested_actions: actions,
  }
}

function ratio(have: number, total: number): string {
  return `${have}/${total}`
}

/** Render the report as a human-readable Markdown document. */
export function renderImpactMarkdown(r: ImpactReport): string {
  const L: string[] = []
  L.push('# Kaddo Knowledge Impact Report', '')
  L.push(`Generated at: ${r.generated_at}`)
  L.push(`Project: ${r.project}`)
  L.push(`Scope: ${r.scope}`)
  if (r.score !== null) L.push(`Knowledge Impact Score: ${r.score}/100`)
  else L.push('Knowledge Impact Score: not available')
  L.push('')

  L.push('## Executive Summary', '')
  for (const s of r.executive_summary) L.push(`- ${s}`)
  L.push('')

  L.push('## Knowledge Health', '')
  for (const [k, v] of Object.entries(r.knowledge_health)) L.push(`- ${k}: ${v}`)
  L.push('')

  L.push('## Knowledge Coverage', '')
  for (const c of r.knowledge_coverage) L.push(`- ${c.label}: ${ratio(c.have, c.total)}`)
  L.push('')

  L.push('## Ownership Coverage', '')
  L.push(`- Coverage: ${r.ownership_coverage.coverage_percent}%`)
  L.push(`- Work Items with code ownership: ${r.ownership_coverage.work_items_with_ownership}`)
  L.push(`- Owned code paths: ${r.ownership_coverage.owned_code_paths}`)
  L.push(`- Broad globs detected: ${r.ownership_coverage.broad_globs}`)
  L.push(`- Ownership overlaps: ${r.ownership_coverage.ownership_overlaps}`)
  L.push('')

  L.push('## Traceability', '')
  const t = r.traceability
  L.push(`- Roadmap candidates: ${t.roadmap_candidates}`)
  L.push(`- Materialized Work Items: ${t.materialized_work_items}`)
  L.push(`- Remaining candidates: ${t.remaining_candidates}`)
  L.push(`- Completed Work Items: ${t.completed_work_items}`)
  L.push(`- Work Items connected to roadmap: ${t.work_items_connected_to_roadmap}`)
  L.push(`- Work Items connected to code: ${t.work_items_connected_to_code}`)
  L.push(`- Graph quality: ${t.graph_quality}`)
  if (t.graph_nodes !== null) L.push(`- Graph nodes: ${t.graph_nodes}`)
  if (t.graph_edges !== null) L.push(`- Graph edges: ${t.graph_edges}`)
  if (t.graph_hints !== null) L.push(`- Graph hints: ${t.graph_hints}`)
  L.push('')

  L.push('## Context Readiness', '')
  L.push(`Context Readiness: ${r.context_readiness.level}`)
  if (r.context_readiness.reasons.length > 0) {
    L.push('', 'Reason:')
    for (const reason of r.context_readiness.reasons) L.push(`- ${reason}`)
  }
  L.push('')

  L.push('## Work Item Readiness', '')
  const w = r.work_item_readiness
  L.push(`- Draft: ${w.draft}`)
  L.push(`- Ready: ${w.ready}`)
  L.push(`- In Progress: ${w.in_progress}`)
  L.push(`- Blocked: ${w.blocked}`)
  L.push(`- Completed: ${w.completed}`)
  L.push(`- Ready quality: ${w.ready_quality}`)
  L.push('')

  L.push('## Graph Quality', '')
  if (r.graph_quality.available) {
    const gq = r.graph_quality
    L.push(`- Scope: ${gq.scope}`)
    L.push(`- Quality: ${gq.quality}`)
    L.push(`- Nodes: ${gq.nodes}`)
    L.push(`- Edges: ${gq.edges}`)
    L.push(`- Hints: ${gq.hints}`)
    if (gq.reason) L.push(`- Reason: ${gq.reason}`)
    if (gq.last_exported) L.push(`- Last exported: ${gq.last_exported}`)
  } else {
    L.push('- Graph data not available.')
    L.push(`- Tip: ${r.graph_quality.suggestion}`)
  }
  L.push('')

  L.push('## Guard Activity', '')
  L.push('- Guard history: not available')
  L.push(`- Note: ${r.guard_activity.note}`)
  L.push('')

  L.push('## Impact Signals', '')
  const s = r.impact_signals
  L.push(`- Ambiguity reduction: ${s.ambiguity_reduction}`)
  L.push(`- Drift prevention: ${s.drift_prevention}`)
  L.push(`- Onboarding support: ${s.onboarding_support}`)
  L.push(`- Delivery traceability: ${s.delivery_traceability}`)
  L.push(`- AI context readiness: ${s.ai_context_readiness}`)
  L.push(`- Maintenance readiness: ${s.maintenance_readiness}`)
  L.push('')

  L.push('## Suggested Actions', '')
  r.suggested_actions.forEach((a, i) => L.push(`${i + 1}. ${a}`))
  L.push('')

  return L.join('\n')
}

export function serializeImpactJson(r: ImpactReport): string {
  return JSON.stringify(r, null, 2) + '\n'
}
