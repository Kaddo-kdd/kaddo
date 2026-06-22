// Estimated Savings Model (VS-062).
//
// Translates Kaddo's impact metrics into APPROXIMATE time/effort/value estimates using explicit,
// configurable assumptions. These are evidence-based estimates, NOT exact ROI or accounting savings.
// Deterministic: reuses the impact report as evidence, never calls an LLM, never measures individual
// productivity, and writes nothing unless asked.

import { readFile, exists, join } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'
import { buildImpactReport } from './impact-report.js'
import { buildGuardHistory } from './guard-history.js'
import type { GraphScope } from './graph.js'

export type SavingsAssumptions = {
  currency: string
  hourly_cost: number
  context_preparation_minutes_saved_per_work_item: number
  rework_hours_avoided_per_resolved_drift: number
  onboarding_hours_saved_per_new_contributor: number
  review_minutes_saved_per_work_item_with_ownership: number
  clarification_minutes_saved_per_ready_work_item: number
  architecture_discovery_hours_saved_when_graph_good: number
  expected_new_contributors_per_month: number
  expected_work_items_per_month: number
}

export const DEFAULT_ASSUMPTIONS: SavingsAssumptions = {
  currency: 'USD',
  hourly_cost: 40,
  context_preparation_minutes_saved_per_work_item: 30,
  rework_hours_avoided_per_resolved_drift: 2,
  onboarding_hours_saved_per_new_contributor: 4,
  review_minutes_saved_per_work_item_with_ownership: 20,
  clarification_minutes_saved_per_ready_work_item: 25,
  architecture_discovery_hours_saved_when_graph_good: 3,
  expected_new_contributors_per_month: 1,
  expected_work_items_per_month: 8,
}

const SAVINGS_PATH = '.kaddo/savings.yml'

/** Load assumptions from `.kaddo/savings.yml`, merged over defaults. */
export function loadAssumptions(dir: string): { assumptions: SavingsAssumptions; source: 'default' | 'file' } {
  const p = join(dir, SAVINGS_PATH)
  if (!exists(p)) return { assumptions: { ...DEFAULT_ASSUMPTIONS }, source: 'default' }
  try {
    const raw = parseYaml(readFile(p)) as {
      currency?: string
      hourly_cost?: number
      assumptions?: Record<string, number>
      team?: Record<string, number>
    }
    const a = raw?.assumptions ?? {}
    const t = raw?.team ?? {}
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
    return {
      source: 'file',
      assumptions: {
        currency: raw?.currency ?? DEFAULT_ASSUMPTIONS.currency,
        hourly_cost: num(raw?.hourly_cost, DEFAULT_ASSUMPTIONS.hourly_cost),
        context_preparation_minutes_saved_per_work_item: num(a.context_preparation_minutes_saved_per_work_item, DEFAULT_ASSUMPTIONS.context_preparation_minutes_saved_per_work_item),
        rework_hours_avoided_per_resolved_drift: num(a.rework_hours_avoided_per_resolved_drift, DEFAULT_ASSUMPTIONS.rework_hours_avoided_per_resolved_drift),
        onboarding_hours_saved_per_new_contributor: num(a.onboarding_hours_saved_per_new_contributor, DEFAULT_ASSUMPTIONS.onboarding_hours_saved_per_new_contributor),
        review_minutes_saved_per_work_item_with_ownership: num(a.review_minutes_saved_per_work_item_with_ownership, DEFAULT_ASSUMPTIONS.review_minutes_saved_per_work_item_with_ownership),
        clarification_minutes_saved_per_ready_work_item: num(a.clarification_minutes_saved_per_ready_work_item, DEFAULT_ASSUMPTIONS.clarification_minutes_saved_per_ready_work_item),
        architecture_discovery_hours_saved_when_graph_good: num(a.architecture_discovery_hours_saved_when_graph_good, DEFAULT_ASSUMPTIONS.architecture_discovery_hours_saved_when_graph_good),
        expected_new_contributors_per_month: num(t.expected_new_contributors_per_month, DEFAULT_ASSUMPTIONS.expected_new_contributors_per_month),
        expected_work_items_per_month: num(t.expected_work_items_per_month, DEFAULT_ASSUMPTIONS.expected_work_items_per_month),
      },
    }
  } catch {
    return { assumptions: { ...DEFAULT_ASSUMPTIONS }, source: 'default' }
  }
}

/** The `.kaddo/savings.yml` template written by `kaddo savings init`. */
export function savingsTemplate(): string {
  return [
    '# Kaddo savings assumptions (VS-062). Estimates are evidence-based, not exact ROI.',
    '# Edit these to match your team, then run `kaddo savings`.',
    'currency: USD',
    '',
    'hourly_cost: 40',
    '',
    'assumptions:',
    '  context_preparation_minutes_saved_per_work_item: 30',
    '  rework_hours_avoided_per_resolved_drift: 2',
    '  onboarding_hours_saved_per_new_contributor: 4',
    '  review_minutes_saved_per_work_item_with_ownership: 20',
    '  clarification_minutes_saved_per_ready_work_item: 25',
    '  architecture_discovery_hours_saved_when_graph_good: 3',
    '',
    'team:',
    '  expected_new_contributors_per_month: 1',
    '  expected_work_items_per_month: 8',
    '',
  ].join('\n')
}

export type SavingsLine = { hours: number; formula: string }
export type DriftSavings =
  | { available: false; hours: 0; reason: string }
  | { available: true; hours: number; formula: string; reason?: string }

export type SavingsReport = {
  generated_at: string
  project: string
  scope: string
  currency: string
  disclaimer: string
  assumptions_source: 'default' | 'file'
  assumptions: Record<string, number>
  evidence: {
    knowledge_impact_score: number | null
    completed_work_items: number
    ownership_coverage_percent: number
    work_items_with_acceptance_criteria: string
    graph_quality: string
    graph_nodes: number | null
    graph_edges: number | null
    context_readiness: string
    guard_history_available: boolean
    guard_runs_recorded: number
    resolved_drift_warnings: number
  }
  estimated_savings: {
    context_preparation: SavingsLine
    review_effort: SavingsLine
    clarification_reduction: SavingsLine
    onboarding: SavingsLine
    architecture_discovery: SavingsLine
    drift_prevention: DriftSavings
  }
  total: { estimated_hours_saved: number; estimated_value: number; currency: string }
  confidence: { level: 'Low' | 'Medium' | 'High'; reasons: string[] }
  suggested_actions: string[]
}

const READINESS_MULT: Record<string, number> = { Low: 0.25, Medium: 0.5, High: 0.75, 'Very High': 1 }
const GRAPH_MULT: Record<string, number> = { empty: 0, sparse: 0.25, partial: 0.6, good: 1, unknown: 0 }

const round2 = (n: number) => Math.round(n * 100) / 100

function parseRatioNumerator(s: string): number {
  const m = s.match(/^(\d+)/)
  return m ? Number(m[1]) : 0
}

export const SAVINGS_DISCLAIMER = 'These are evidence-based estimates, not exact ROI. Adjust assumptions with real team data.'

/** Build the deterministic savings report. Reuses the impact report (default scope `all`) as evidence. */
export function buildSavingsReport(
  dir: string,
  opts: { scope?: GraphScope; scopeSource?: 'default' | 'explicit' } = {},
  now: Date = new Date()
): SavingsReport {
  const { assumptions: a, source } = loadAssumptions(dir)
  const impact = buildImpactReport(dir, { scope: opts.scope, scopeSource: opts.scopeSource }, now)

  const completed = impact.traceability.completed_work_items
  const wiWithOwnership = parseRatioNumerator(impact.traceability.work_items_connected_to_code)
  const acceptanceCov = impact.knowledge_coverage.find((c) => c.label.toLowerCase().includes('acceptance'))
  const wiWithAcceptance = acceptanceCov?.have ?? 0
  const graphQuality = impact.graph_quality.available ? impact.graph_quality.quality : 'unknown'
  const readiness = impact.context_readiness.level

  const ctxPrepH = round2((completed * a.context_preparation_minutes_saved_per_work_item) / 60)
  const reviewH = round2((wiWithOwnership * a.review_minutes_saved_per_work_item_with_ownership) / 60)
  const clarH = round2((wiWithAcceptance * a.clarification_minutes_saved_per_ready_work_item) / 60)
  const readinessMult = READINESS_MULT[readiness] ?? 0.5
  const onboardH = round2(a.expected_new_contributors_per_month * a.onboarding_hours_saved_per_new_contributor * readinessMult)
  const graphMult = GRAPH_MULT[graphQuality] ?? 0
  const archH = round2(a.architecture_discovery_hours_saved_when_graph_good * graphMult)

  // Drift prevention (VS-063 / VS-063.1): available whenever guard history exists. With zero
  // resolved warnings it is 0 h (available) — distinct from "no history at all" (not available).
  const guard = buildGuardHistory(dir)
  let driftSavings: DriftSavings
  if (!guard.available) {
    driftSavings = { available: false, hours: 0, reason: 'Guard history is not persisted yet.' }
  } else if (guard.resolved > 0) {
    driftSavings = {
      available: true,
      hours: round2(guard.resolved * a.rework_hours_avoided_per_resolved_drift),
      formula: `${guard.resolved} resolved drift warnings × ${a.rework_hours_avoided_per_resolved_drift} h`,
    }
  } else {
    driftSavings = {
      available: true,
      hours: 0,
      formula: `0 resolved drift warnings × ${a.rework_hours_avoided_per_resolved_drift} h`,
      reason: 'Guard history exists, but no resolved drift warnings have been recorded yet.',
    }
  }

  const totalHours = round2(ctxPrepH + reviewH + clarH + onboardH + archH + driftSavings.hours)
  const totalValue = Math.round(totalHours * a.hourly_cost)

  // Confidence — High needs guard history with resolved drift + custom assumptions; else Medium/Low.
  const reasons: string[] = []
  let level: 'Low' | 'Medium' | 'High'
  if (impact.score === null || impact.score < 60 || graphQuality === 'empty') {
    level = 'Low'
    reasons.push('Impact score is low or the knowledge graph is empty.')
  } else if (
    impact.score >= 85 &&
    graphQuality === 'good' &&
    source === 'file' &&
    guard.available &&
    guard.resolved > 0
  ) {
    level = 'High'
    reasons.push('Strong evidence, custom assumptions and recorded drift resolution.')
  } else {
    level = 'Medium'
    reasons.push('Strong knowledge and graph evidence.')
  }
  if (!guard.available) {
    reasons.push('Guard history is not persisted yet — avoided rework is not estimated.')
  } else if (guard.resolved > 0) {
    reasons.push(`Guard history available (${guard.resolved} resolved drift warning(s)).`)
  } else {
    reasons.push('Guard history available, but no resolved drift warnings have been recorded yet.')
  }
  reasons.push(source === 'file' ? 'Assumptions come from `.kaddo/savings.yml`.' : 'Savings assumptions are defaults and should be calibrated.')

  const actions: string[] = []
  if (source === 'default') actions.push('Run `kaddo savings init` to customize assumptions.')
  actions.push('Calibrate hourly cost and team assumptions with real team data.')
  actions.push('Run `kaddo impact` to verify the underlying evidence quality.')
  actions.push('Use this report as directional evidence, not accounting data.')
  // Guard-history-aware guidance (VS-063.1): only mention "persist history" when there is none.
  if (!guard.available) {
    actions.push('Future: persist Guard history to estimate avoided rework.')
  } else if (guard.resolved === 0) {
    actions.push('Continue running `kaddo guard --record` before important commits to capture resolved drift warnings.')
    if (guard.open > 0) actions.push('Review open drift warnings with `kaddo drift`.')
  } else {
    actions.push('Use drift history to calibrate `rework_hours_avoided_per_resolved_drift`.')
  }

  return {
    generated_at: now.toISOString(),
    project: impact.project,
    scope: impact.scope,
    currency: a.currency,
    disclaimer: SAVINGS_DISCLAIMER,
    assumptions_source: source,
    assumptions: {
      hourly_cost: a.hourly_cost,
      context_preparation_minutes_saved_per_work_item: a.context_preparation_minutes_saved_per_work_item,
      review_minutes_saved_per_work_item_with_ownership: a.review_minutes_saved_per_work_item_with_ownership,
      clarification_minutes_saved_per_ready_work_item: a.clarification_minutes_saved_per_ready_work_item,
      onboarding_hours_saved_per_new_contributor: a.onboarding_hours_saved_per_new_contributor,
      expected_new_contributors_per_month: a.expected_new_contributors_per_month,
      architecture_discovery_hours_saved_when_graph_good: a.architecture_discovery_hours_saved_when_graph_good,
    },
    evidence: {
      knowledge_impact_score: impact.score,
      completed_work_items: completed,
      ownership_coverage_percent: impact.ownership_coverage.coverage_percent,
      work_items_with_acceptance_criteria: acceptanceCov ? `${acceptanceCov.have}/${acceptanceCov.total}` : '0/0',
      graph_quality: graphQuality,
      graph_nodes: impact.graph_quality.available ? impact.graph_quality.nodes : null,
      graph_edges: impact.graph_quality.available ? impact.graph_quality.edges : null,
      context_readiness: readiness,
      guard_history_available: guard.available,
      guard_runs_recorded: guard.total_runs,
      resolved_drift_warnings: guard.resolved,
    },
    estimated_savings: {
      context_preparation: { hours: ctxPrepH, formula: `${completed} Work Items × ${a.context_preparation_minutes_saved_per_work_item} min` },
      review_effort: { hours: reviewH, formula: `${wiWithOwnership} Work Items with ownership × ${a.review_minutes_saved_per_work_item_with_ownership} min` },
      clarification_reduction: { hours: clarH, formula: `${wiWithAcceptance} Work Items with Acceptance Criteria × ${a.clarification_minutes_saved_per_ready_work_item} min` },
      onboarding: { hours: onboardH, formula: `${a.expected_new_contributors_per_month} contributor × ${a.onboarding_hours_saved_per_new_contributor} h × ${readinessMult.toFixed(2)} readiness multiplier` },
      architecture_discovery: { hours: archH, formula: `${a.architecture_discovery_hours_saved_when_graph_good} h × ${graphMult.toFixed(2)} graph multiplier` },
      drift_prevention: driftSavings,
    },
    total: { estimated_hours_saved: totalHours, estimated_value: totalValue, currency: a.currency },
    confidence: { level, reasons },
    suggested_actions: actions,
  }
}

/** Render the savings report as Markdown. */
export function renderSavingsMarkdown(r: SavingsReport): string {
  const L: string[] = []
  L.push('# Kaddo Estimated Savings Report', '')
  L.push(`Generated at: ${r.generated_at}`)
  L.push(`Project: ${r.project}`)
  L.push(`Scope: ${r.scope}`)
  L.push(`Currency: ${r.currency}`)
  L.push('')

  L.push('## Disclaimer', '')
  L.push(r.disclaimer, '')

  L.push('## Executive Summary', '')
  L.push(`- Estimated time saved: ${r.total.estimated_hours_saved} hours`)
  L.push(`- Estimated value: ${r.total.estimated_value} ${r.currency}`)
  L.push(`- Confidence: ${r.confidence.level}`)
  if (r.assumptions_source === 'default') L.push('- Using default assumptions. Run `kaddo savings init` to customize them.')
  L.push('')

  L.push('## Assumptions', '')
  L.push(`- Hourly cost: ${r.assumptions.hourly_cost} ${r.currency}`)
  L.push(`- Context preparation saved per Work Item: ${r.assumptions.context_preparation_minutes_saved_per_work_item} min`)
  L.push(`- Review saved per Work Item with ownership: ${r.assumptions.review_minutes_saved_per_work_item_with_ownership} min`)
  L.push(`- Clarification saved per Work Item with acceptance criteria: ${r.assumptions.clarification_minutes_saved_per_ready_work_item} min`)
  L.push(`- Onboarding saved per new contributor: ${r.assumptions.onboarding_hours_saved_per_new_contributor} h`)
  L.push(`- Expected new contributors per month: ${r.assumptions.expected_new_contributors_per_month}`)
  L.push(`- Architecture discovery saved when graph is good: ${r.assumptions.architecture_discovery_hours_saved_when_graph_good} h`)
  L.push('')

  L.push('## Evidence Used', '')
  const e = r.evidence
  L.push(`- Knowledge Impact Score: ${e.knowledge_impact_score ?? 'not available'}${e.knowledge_impact_score !== null ? '/100' : ''}`)
  L.push(`- Completed Work Items: ${e.completed_work_items}`)
  L.push(`- Ownership coverage: ${e.ownership_coverage_percent}%`)
  L.push(`- Work Items with Acceptance Criteria: ${e.work_items_with_acceptance_criteria}`)
  L.push(`- Graph quality: ${e.graph_quality}`)
  if (e.graph_nodes !== null) L.push(`- Graph nodes: ${e.graph_nodes}`)
  if (e.graph_edges !== null) L.push(`- Graph edges: ${e.graph_edges}`)
  L.push(`- Context readiness: ${e.context_readiness}`)
  if (e.guard_history_available) {
    L.push('- Guard history: available')
    L.push(`- Guard runs recorded: ${e.guard_runs_recorded}`)
    L.push(`- Resolved drift warnings: ${e.resolved_drift_warnings}`)
  } else {
    L.push('- Guard history: not available')
  }
  L.push('')

  L.push('## Estimated Savings', '')
  const s = r.estimated_savings
  const line = (title: string, l: SavingsLine) => {
    L.push(`### ${title}`, '')
    L.push(`- Formula: ${l.formula}`)
    L.push(`- Estimated: ${l.hours} h`, '')
  }
  line('Context Preparation', s.context_preparation)
  line('Review Effort', s.review_effort)
  line('Clarification Reduction', s.clarification_reduction)
  line('Onboarding', s.onboarding)
  line('Architecture Discovery', s.architecture_discovery)
  L.push('### Drift Prevention', '')
  if (s.drift_prevention.available) {
    L.push(`- Formula: ${s.drift_prevention.formula}`)
    L.push(`- Estimated: ${s.drift_prevention.hours} h`)
    if (s.drift_prevention.reason) L.push(`- Reason: ${s.drift_prevention.reason}`)
    L.push('')
  } else {
    L.push('- Not available yet.')
    L.push(`- Reason: ${s.drift_prevention.reason}`, '')
  }

  L.push('## Total', '')
  L.push(`- Estimated time saved: ${r.total.estimated_hours_saved} h`)
  L.push(`- Estimated value: ${r.total.estimated_value} ${r.currency}`)
  L.push('')

  L.push('## Confidence', '')
  L.push(`Confidence: ${r.confidence.level}`, '', 'Reason:')
  for (const reason of r.confidence.reasons) L.push(`- ${reason}`)
  L.push('')

  L.push('## Suggested Actions', '')
  r.suggested_actions.forEach((act, i) => L.push(`${i + 1}. ${act}`))
  L.push('')

  return L.join('\n')
}

export function serializeSavingsJson(r: SavingsReport): string {
  return JSON.stringify(r, null, 2) + '\n'
}
