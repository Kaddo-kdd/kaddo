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
import { buildGuardHistory } from './guard-history.js'

export type Level = 'Low' | 'Medium' | 'High' | 'Very High'

/** A single Work Item gap (VS-061.1). */
export type GapItem = {
  id: string
  title: string
  status: string
  path: string
  suggested_action: string
}

export type BroadGlobGap = { id: string; title: string; glob: string; suggested_action: string }
export type OwnershipOverlap = { code_path: string; work_items: string[]; suggested_action: string }

export type ActionableGaps = {
  missing_source: GapItem[]
  missing_initiative: GapItem[]
  missing_code_ownership: GapItem[]
  missing_knowledge_level: GapItem[]
  missing_acceptance_criteria: GapItem[]
  missing_definition_of_done: GapItem[]
  missing_validation: GapItem[]
  broad_ownership_globs: BroadGlobGap[]
  ownership_overlaps: OwnershipOverlap[]
}

export type ScoreBreakdown = {
  knowledge_health: { points: number; max: number }
  knowledge_coverage: { points: number; max: number }
  ownership_coverage: { points: number; max: number }
  traceability: { points: number; max: number }
  graph_quality: { points: number; max: number }
  context_readiness: { points: number; max: number }
}

export type ImpactReport = {
  generated_at: string
  project: string
  scope: string
  /** Impact reports default to `all` to measure accumulated knowledge impact (VS-061.2). */
  default_scope: 'all'
  scope_source: 'default' | 'explicit'
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
  guard_activity:
    | { available: false; note: string }
    | { available: true; runs_recorded: number; detected: number; open: number; resolved: number; resolution_rate: number }
  impact_signals: {
    ambiguity_reduction: Level
    drift_prevention: 'Active' | 'Limited'
    onboarding_support: Level
    delivery_traceability: Level
    ai_context_readiness: Level
    maintenance_readiness: Level
  }
  actionable_gaps: ActionableGaps
  score: number | null
  score_breakdown: ScoreBreakdown | null
  suggested_actions: string[]
}

/** Broad = ends with `/**` and has at most two path segments (e.g. src/**, src/cli/**). */
function isBroadGlob(glob: string): boolean {
  if (!glob.endsWith('/**')) return false
  const prefix = glob.slice(0, -3)
  return prefix.length > 0 && prefix.split('/').length <= 2
}

function levelFromRatio(r: number): Level {
  if (r >= 0.9) return 'Very High'
  if (r >= 0.7) return 'High'
  if (r >= 0.4) return 'Medium'
  return 'Low'
}

function hasSection(body: string, re: RegExp): boolean {
  return body.split(/\r?\n/).some((l) => /^#{1,6}\s+/.test(l) && re.test(l))
}

/**
 * Build the deterministic impact report. The graph section is always computed FRESH in memory at the
 * resolved scope (default `all`, to measure accumulated knowledge impact — VS-061.2), so the report
 * never depends on whatever scope `graph.json` was last exported with. Pass `scope` to override and
 * `scopeSource: 'explicit'` when the user asked for it.
 */
export function buildImpactReport(
  dir: string,
  opts: { scope?: GraphScope; scopeSource?: 'default' | 'explicit' } = {},
  now: Date = new Date()
): ImpactReport {
  const resolvedScope: GraphScope = opts.scope ?? 'all'
  const scopeSource: 'default' | 'explicit' = opts.scopeSource ?? (opts.scope ? 'explicit' : 'default')
  const exp = buildProjectExplanation(dir)
  const wis = discoverWorkItems(dir)
  const total = wis.length

  // --- Per-Work-Item coverage + actionable gaps (front matter + body sections) ---
  let withOwnership = 0
  let withSource = 0
  let withInitiative = 0
  let withLevel = 0
  let withAcceptance = 0
  let withDoD = 0
  let withValidation = 0
  let connectedRoadmap = 0
  const globCounts = new Map<string, number>()
  const globOwners = new Map<string, string[]>()
  const gaps: ActionableGaps = {
    missing_source: [],
    missing_initiative: [],
    missing_code_ownership: [],
    missing_knowledge_level: [],
    missing_acceptance_criteria: [],
    missing_definition_of_done: [],
    missing_validation: [],
    broad_ownership_globs: [],
    ownership_overlaps: [],
  }
  const gapItem = (wi: (typeof wis)[number], action: string): GapItem => ({
    id: wi.id || wi.title,
    title: wi.title,
    status: wi.lifecycle ?? wi.status,
    path: wi.relPath,
    suggested_action: action,
  })

  for (const wi of wis) {
    const id = wi.id || wi.title
    if (wi.codeGlobs.length > 0) withOwnership++
    else gaps.missing_code_ownership.push(gapItem(wi, 'Add `code:` globs to connect this Work Item to source paths (`kaddo owners suggest`).'))

    const hasSource = Boolean(wi.sourceId) || wi.source === 'roadmap'
    if (hasSource) withSource++
    else gaps.missing_source.push(gapItem(wi, 'Add `source` or `source_id` if this Work Item came from the roadmap.'))
    if (hasSource || wi.initiative) connectedRoadmap++

    if (wi.initiative) withInitiative++
    else gaps.missing_initiative.push(gapItem(wi, 'Add `initiative` to connect this Work Item to a delivery initiative.'))

    if (wi.knowledgeLevel) withLevel++
    else gaps.missing_knowledge_level.push(gapItem(wi, 'Add `knowledge_level` (K0–K4) to the front matter.'))

    for (const g of wi.codeGlobs) {
      globCounts.set(g, (globCounts.get(g) ?? 0) + 1)
      globOwners.set(g, [...(globOwners.get(g) ?? []), id])
      if (isBroadGlob(g)) {
        gaps.broad_ownership_globs.push({ id, title: wi.title, glob: g, suggested_action: 'Replace with specific files or narrower module paths.' })
      }
    }

    try {
      const body = matter(readFile(wi.filePath)).content
      if (hasSection(body, /acceptance|criterios de aceptaci/i)) withAcceptance++
      else gaps.missing_acceptance_criteria.push(gapItem(wi, 'Add an `## Acceptance Criteria` section.'))
      if (hasSection(body, /definition of done|^#{1,6}\s*dod\b|definici[oó]n de (terminado|hecho)/i)) withDoD++
      else gaps.missing_definition_of_done.push(gapItem(wi, 'Add a `## Definition of Done` section.'))
      if (hasSection(body, /how to test|validation|validaci|c[oó]mo probarlo/i)) withValidation++
      else gaps.missing_validation.push(gapItem(wi, 'Add a `## How to test it` (validation) section.'))
    } catch {
      // unreadable body — skip section detection
    }
  }
  const ownedCodePaths = [...globCounts.values()].reduce((a, b) => a + b, 0)
  const broadGlobs = [...globCounts.keys()].filter((g) => isBroadGlob(g)).length
  // Overlaps: a declared glob owned by more than one Work Item.
  for (const [glob, owners] of globOwners) {
    if (owners.length > 1) {
      gaps.ownership_overlaps.push({ code_path: glob, work_items: [...new Set(owners)], suggested_action: 'Review whether the overlap is expected or should be narrowed.' })
    }
  }
  const ownershipOverlaps = gaps.ownership_overlaps.length

  // --- Graph section: always computed fresh at the resolved scope (VS-061.2), so the impact
  //     report never inherits an empty `active` graph.json from a previous export. ---
  type G = { available: boolean; scope: string; scopeReason: string; nodes: number; edges: number; quality: string; hints: number; generatedAt: string }
  let g: G
  const config = loadConfig(dir)
  if (config) {
    const graph = buildGraph(dir, config, { scope: resolvedScope }, now)
    const hints = buildGraphHints(dir, graph, now)
    g = { available: true, scope: graph.scope, scopeReason: graph.scope_reason, nodes: graph.nodes.length, edges: graph.edges.length, quality: hints.quality, hints: hints.summary.hints, generatedAt: graph.generated_at }
  } else {
    g = { available: false, scope: resolvedScope, scopeReason: '', nodes: 0, edges: 0, quality: 'unknown', hints: 0, generatedAt: '' }
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

  // --- Score (transparent, optional) + breakdown ---
  let score: number | null = null
  let score_breakdown: ScoreBreakdown | null = null
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
    score_breakdown = {
      knowledge_health: { points: Math.round(healthPts), max: 20 },
      knowledge_coverage: { points: Math.round(coveragePts), max: 20 },
      ownership_coverage: { points: Math.round(ownPts), max: 15 },
      traceability: { points: Math.round(tracePts), max: 20 },
      graph_quality: { points: Math.round(graphPts), max: 15 },
      context_readiness: { points: Math.round(ctxPts), max: 10 },
    }
  }

  // --- Suggested actions (derived from real gaps — name specific Work Items) ---
  const idsOf = (items: GapItem[]) => items.map((i) => i.id)
  const groupedAction = (items: GapItem[], verb: string): string | null => {
    if (items.length === 0) return null
    const ids = idsOf(items)
    return ids.length <= 3
      ? `${verb} ${ids.join(', ')}.`
      : `${verb} ${ids.length} Work Items: ${ids.slice(0, 3).join(', ')}, …`
  }
  const actions: string[] = []
  if (!g.available) actions.push('Run `kaddo graph export --scope all` to inspect full traceability.')
  else if (g.scope === 'active' && g.quality === 'empty') actions.push('Run `kaddo impact --scope all` to measure accumulated knowledge impact.')
  if (exp.roadmap.remaining > 0) actions.push(`Materialize the ${exp.roadmap.remaining} remaining roadmap candidate(s) with \`kaddo create --from roadmap\`.`)
  for (const a of [
    groupedAction(gaps.missing_code_ownership, 'Add `code:` ownership to'),
    groupedAction(gaps.missing_source, 'Add `source`/`source_id` to'),
    groupedAction(gaps.missing_initiative, 'Add an `initiative` to'),
    groupedAction(gaps.missing_acceptance_criteria, 'Add Acceptance Criteria to'),
    groupedAction(gaps.missing_definition_of_done, 'Add a Definition of Done to'),
    groupedAction(gaps.missing_validation, 'Add a validation (How to test it) section to'),
  ]) if (a) actions.push(a)
  if (gaps.broad_ownership_globs.length > 0) actions.push(`Narrow ${gaps.broad_ownership_globs.length} broad ownership glob(s) into specific paths.`)
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
    default_scope: 'all',
    scope_source: scopeSource,
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
    guard_activity: (() => {
      const gh = buildGuardHistory(dir)
      return gh.available
        ? { available: true as const, runs_recorded: gh.total_runs, detected: gh.detected, open: gh.open, resolved: gh.resolved, resolution_rate: gh.resolution_rate }
        : { available: false as const, note: 'Guard history is not persisted. Run `kaddo guard --record` to record runs for trend analysis.' }
    })(),
    impact_signals,
    actionable_gaps: gaps,
    score,
    score_breakdown,
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
  if (r.scope_source === 'default') {
    L.push('Scope note: Impact reports use `all` by default to measure accumulated knowledge impact.')
  } else if (r.scope === 'active' && r.graph_quality.available === false) {
    L.push('Tip: Run `kaddo impact --scope all` to inspect accumulated knowledge impact.')
  }
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
    if (gq.scope === 'active' && gq.quality === 'empty') {
      L.push('- Tip: Run `kaddo impact --scope all` to inspect accumulated knowledge impact.')
    }
  } else {
    L.push('- Graph data not available.')
    L.push(`- Tip: ${r.graph_quality.suggestion}`)
  }
  L.push('')

  L.push('## Guard Activity', '')
  if (r.guard_activity.available) {
    const ga = r.guard_activity
    L.push('- Guard history: available')
    L.push(`- Guard runs recorded: ${ga.runs_recorded}`)
    L.push(`- Drift warnings detected: ${ga.detected}`)
    L.push(`- Open warnings: ${ga.open}`)
    L.push(`- Resolved warnings: ${ga.resolved}`)
    L.push(`- Resolution rate: ${ga.resolution_rate}%`)
  } else {
    L.push('- Guard history: not available')
    L.push(`- Note: ${r.guard_activity.note}`)
  }
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

  // --- Actionable Gaps ---
  L.push('## Actionable Gaps', '')
  const gp = r.actionable_gaps
  const gapSection = (title: string, items: GapItem[]) => {
    if (items.length === 0) return
    L.push(`### ${title}`, '')
    for (const it of items) {
      L.push(`- ${it.id} — ${it.title}`)
      L.push(`  - Path: ${it.path}`)
      L.push(`  - Suggested action: ${it.suggested_action}`)
    }
    L.push('')
  }
  gapSection('Work Items missing source', gp.missing_source)
  gapSection('Work Items missing initiative', gp.missing_initiative)
  gapSection('Work Items missing code ownership', gp.missing_code_ownership)
  gapSection('Work Items missing knowledge level', gp.missing_knowledge_level)
  gapSection('Work Items missing acceptance criteria', gp.missing_acceptance_criteria)
  gapSection('Work Items missing Definition of Done', gp.missing_definition_of_done)
  gapSection('Work Items missing validation', gp.missing_validation)
  if (gp.broad_ownership_globs.length > 0) {
    L.push('### Broad ownership globs', '')
    for (const b of gp.broad_ownership_globs) {
      L.push(`- ${b.id} — ${b.title}`)
      L.push(`  - Glob: \`${b.glob}\``)
      L.push(`  - Suggested action: ${b.suggested_action}`)
    }
    L.push('')
  }
  if (gp.ownership_overlaps.length > 0) {
    L.push('### Ownership overlaps', '')
    for (const o of gp.ownership_overlaps) {
      L.push(`- \`${o.code_path}\``)
      L.push(`  - Owned by: ${o.work_items.join(', ')}`)
      L.push(`  - Suggested action: ${o.suggested_action}`)
    }
    L.push('')
  }
  const anyGaps =
    gp.missing_source.length + gp.missing_initiative.length + gp.missing_code_ownership.length +
    gp.missing_knowledge_level.length + gp.missing_acceptance_criteria.length +
    gp.missing_definition_of_done.length + gp.missing_validation.length +
    gp.broad_ownership_globs.length + gp.ownership_overlaps.length
  if (anyGaps === 0) {
    L.push('No actionable knowledge gaps detected. 🎉', '')
  }

  // --- Score Breakdown ---
  if (r.score_breakdown) {
    L.push('## Score Breakdown', '')
    const b = r.score_breakdown
    L.push(`- Knowledge Health: ${b.knowledge_health.points}/${b.knowledge_health.max}`)
    L.push(`- Knowledge Coverage: ${b.knowledge_coverage.points}/${b.knowledge_coverage.max}`)
    L.push(`- Ownership Coverage: ${b.ownership_coverage.points}/${b.ownership_coverage.max}`)
    L.push(`- Traceability: ${b.traceability.points}/${b.traceability.max}`)
    L.push(`- Graph Quality: ${b.graph_quality.points}/${b.graph_quality.max}`)
    L.push(`- Context Readiness: ${b.context_readiness.points}/${b.context_readiness.max}`)
    L.push('')
  }

  L.push('## Suggested Actions', '')
  r.suggested_actions.forEach((a, i) => L.push(`${i + 1}. ${a}`))
  L.push('')

  return L.join('\n')
}

export function serializeImpactJson(r: ImpactReport): string {
  return JSON.stringify(r, null, 2) + '\n'
}
