// Drift Trend Report (VS-063). Renders the aggregated guard history (core/guard-history.ts) as a
// deterministic Markdown / JSON report. No LLM, no writes.

import { loadConfig } from './config.js'
import { buildGuardHistory, type GuardHistory } from './guard-history.js'
import { graphHintFinding, reportingProjectContext, type EvidenceItem, type ReportFinding, type ReportingProjectContext } from './reporting-evidence.js'
import { getDeprecationPlan, getDeprecationPlans, validateTarget } from './deprecation.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { buildGraph } from './graph.js'
import { buildGraphHints } from './graph-hints.js'

export type DriftReport = {
  generated_at: string
  project: string
  project_context: ReportingProjectContext
  consistency_evidence: EvidenceItem[]
  /** Findings from executed deterministic checks; absence does not mean the project is drift-free. */
  current_consistency_findings: ReportFinding[]
  structural_consistency: {
    deprecation_target_checks: 'not_applicable' | 'not_evaluated' | 'passed' | 'findings_detected'
    plans_discovered: number
    plans_without_targets: number
    plans_with_targets_evaluated: number
    structural_findings: number
    plans_without_structural_findings: number
    note: string
  }
  guard_history: {
    available: boolean
    total_runs: number
    first_run: string | null
    last_run: string | null
    runs_with_warnings: number
    runs_clean: number
  }
  drift_warnings: { detected: number; open: number; resolved: number; resolution_rate: number }
  hotspots: { path: string; warnings: number }[]
  trend: GuardHistory['trend']
  threads: GuardHistory['threads']
  suggested_actions: string[]
}

export function buildDriftReport(dir: string, now: Date = new Date()): DriftReport {
  const h = buildGuardHistory(dir)
  const project = loadConfig(dir)?.project.name ?? 'unknown'
  const projectContext = reportingProjectContext(dir)
  const workItems = discoverWorkItems(dir)
  const verificationEvidence = workItems.filter((wi) => wi.validationStatus && wi.validationStatus !== 'not-started')
  const plans = getDeprecationPlans(dir)
  const planDetails = plans.map((plan) => getDeprecationPlan(dir, plan.id)).filter((plan): plan is NonNullable<typeof plan> => plan !== null)
  const plansWithoutTargets = planDetails.filter((plan) => plan.targets.length === 0)
  const plansWithTargets = planDetails.filter((plan) => plan.targets.length > 0)
  const targetFindingsByPlan = new Map(plansWithTargets.map((plan) => [
    plan.id,
    plan.targets.flatMap(validateTarget),
  ]))
  const deprecationFindings = [...targetFindingsByPlan.values()].flat()
  const plansWithoutStructuralFindings = plansWithTargets.filter((plan) => (targetFindingsByPlan.get(plan.id) ?? []).length === 0)
  const config = loadConfig(dir)
  const topology = config ? buildGraph(dir, config, { scope: 'all' }, now) : null
  const graphHints = topology ? buildGraphHints(dir, topology, now) : null
  const topologyHints = graphHints?.summary.hints ?? null
  const currentConsistencyFindings: ReportFinding[] = [
    ...(graphHints?.hints.map(graphHintFinding) ?? []),
    ...deprecationFindings.map((finding, index) => ({
      id: `deprecation-target:${index + 1}`,
      category: 'consistency' as const,
      classification: 'consistency_violation' as const,
      resolution_status: 'open' as const,
      source: 'deprecation-target-validation',
      affected_artifacts: finding.target ? [finding.target] : [],
      priority: finding.severity === 'error' ? 'high' as const : 'medium' as const,
      evidence: finding.message,
      explanation: 'A deterministic deprecation target consistency check reported a finding.',
      suggested_action: 'Review the affected deprecation target and its declared lifecycle evidence.',
    })),
    ...(h.available && h.total_runs >= 2
      ? h.threads.filter((thread) => thread.status === 'open').map((thread) => ({
          id: `guard-history:${thread.code_path}`,
          category: 'consistency' as const,
          classification: 'historical_drift' as const,
          resolution_status: 'open' as const,
          source: 'guard-history',
          affected_artifacts: [thread.code_path, ...thread.related_artifacts],
          priority: 'medium' as const,
          evidence: `Recorded Guard observations from ${thread.first_detected} through ${thread.last_seen} remain unresolved.`,
          explanation: 'Comparable Guard runs observed a possible code/knowledge drift thread over time.',
          suggested_action: 'Review the recorded drift thread and update the relevant knowledge or ownership evidence.',
        }))
      : []),
  ]

  const actions: string[] = []
  if (!h.available) {
    actions.push('Start recording Guard runs at relevant delivery checkpoints with `kaddo guard --record`; one run creates an observation, while multiple comparable runs are needed for a historical trend.')
  } else {
    if (h.open > 0) actions.push('Review open drift warnings and update related Work Items or ownership.')
    actions.push('Run `kaddo guard --record` before important commits.')
    actions.push('Use this report to calibrate estimated drift-prevention savings.')
  }

  return {
    generated_at: now.toISOString(),
    project,
    project_context: projectContext,
    consistency_evidence: [
      { id: 'guard-current-consistency', label: 'Current Guard consistency', classification: h.available ? 'observed' : 'unknown', reason: h.available ? `${h.total_runs} recorded Guard run(s) provide deterministic consistency evidence.` : 'No recorded Guard history is available.' },
      { id: 'lifecycle-consistency', label: 'Lifecycle evidence consistency', classification: verificationEvidence.length > 0 ? 'observed' : 'unknown', reason: verificationEvidence.length > 0 ? `${verificationEvidence.length} Work Item(s) persist an implementation validation status.` : 'No persisted Work Item validation status is available.' },
      { id: 'deprecation-consistency', label: 'Deprecation consistency', classification: plans.length === 0 ? 'not_applicable' : plansWithTargets.length === 0 ? 'unknown' : deprecationFindings.length === 0 ? 'derived' : 'observed', reason: plans.length === 0 ? 'No deprecation plans exist in this project.' : plansWithTargets.length === 0 ? `${plansWithoutTargets.length} plan(s) have no targets, so target consistency was not evaluated.` : deprecationFindings.length === 0 ? `${plansWithTargets.length} plan(s) with targets passed deterministic target consistency checks; ${plansWithoutTargets.length} plan(s) remain unevaluated because they have no targets.` : `${deprecationFindings.length} deterministic deprecation consistency finding(s) were detected.` },
      { id: 'topology-consistency', label: 'Knowledge topology consistency', classification: topology === null ? 'unknown' : topologyHints === 0 ? 'derived' : 'observed', reason: topology === null ? 'No project configuration is available to construct the topology.' : topologyHints === 0 ? `The in-memory topology has ${topology.nodes.length} node(s) and no open deterministic hints.` : `The in-memory topology has ${topologyHints} open deterministic hint(s).` },
    ],
    current_consistency_findings: currentConsistencyFindings,
    structural_consistency: {
      deprecation_target_checks: plans.length === 0 ? 'not_applicable' : plansWithTargets.length === 0 ? 'not_evaluated' : deprecationFindings.length === 0 ? 'passed' : 'findings_detected',
      plans_discovered: plans.length,
      plans_without_targets: plansWithoutTargets.length,
      plans_with_targets_evaluated: plansWithTargets.length,
      structural_findings: deprecationFindings.length,
      plans_without_structural_findings: plansWithoutStructuralFindings.length,
      note: plans.length === 0
        ? 'No deprecation plans exist in this project.'
        : 'Target consistency checks validate declared structural state only; they do not verify operational removal from infrastructure, production or external consumers.',
    },
    guard_history: {
      available: h.available,
      total_runs: h.total_runs,
      first_run: h.first_run,
      last_run: h.last_run,
      runs_with_warnings: h.runs_with_warnings,
      runs_clean: h.runs_clean,
    },
    drift_warnings: { detected: h.detected, open: h.open, resolved: h.resolved, resolution_rate: h.resolution_rate },
    hotspots: h.hotspots,
    trend: h.trend,
    threads: h.threads,
    suggested_actions: actions,
  }
}

export function renderDriftMarkdown(r: DriftReport): string {
  const L: string[] = []
  L.push('# Kaddo Drift Trend Report', '')
  L.push(`Generated at: ${r.generated_at}`)
  L.push(`Project: ${r.project}`)
  L.push(`Project context: state=${r.project_context.state}; mode=${r.project_context.mode}; repositories=${r.project_context.repository_structure}`)
  L.push('')

  L.push('## Consistency Evidence', '')
  for (const item of r.consistency_evidence) L.push(`- ${item.label}: ${item.classification} — ${item.reason}`)
  L.push('')

  const findingGroups: { classification: ReportFinding['classification']; title: string }[] = [
    { classification: 'consistency_violation', title: 'Consistency Violations' },
    { classification: 'coverage_gap', title: 'Coverage Gaps' },
    { classification: 'review_hint', title: 'Review Hints' },
    { classification: 'historical_drift', title: 'Historical Drift' },
  ]
  L.push('## Current Findings Summary', '')
  for (const group of findingGroups) {
    const count = r.current_consistency_findings.filter((finding) => finding.classification === group.classification).length
    const unavailable = group.classification === 'historical_drift' && !r.guard_history.available
    L.push(`- ${group.title}: ${unavailable ? 'not available — no recorded Guard runs' : count}`)
  }
  L.push('')

  L.push('## Current Consistency Findings', '')
  if (r.current_consistency_findings.length === 0) L.push('No findings detected by the executed consistency checks.', '')
  const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
  for (const group of findingGroups) {
    const findings = r.current_consistency_findings.filter((finding) => finding.classification === group.classification)
    if (findings.length === 0) continue
    L.push(`### ${group.title}`, '')
    L.push('| Classification | Priority | Status | Source | Affected | Finding | Suggested action |')
    L.push('|---|---|---|---|---|---|---|')
    for (const finding of findings) {
      L.push(`| ${finding.classification} | ${finding.priority} | ${finding.resolution_status} | ${cell(finding.source)} | ${cell(finding.affected_artifacts.join(', ') || 'not available')} | ${cell(finding.explanation)} Evidence: ${cell(finding.evidence)} | ${cell(finding.suggested_action)} |`)
    }
    L.push('')
  }

  L.push('## Structural Consistency Boundaries', '')
  L.push(`- Deprecation target checks: ${r.structural_consistency.deprecation_target_checks}`)
  L.push(`- Plans discovered: ${r.structural_consistency.plans_discovered}`)
  L.push(`- Plans without targets: ${r.structural_consistency.plans_without_targets}`)
  L.push(`- Plans with targets evaluated: ${r.structural_consistency.plans_with_targets_evaluated}`)
  L.push(`- Structural findings: ${r.structural_consistency.structural_findings}`)
  L.push(`- Plans without structural findings: ${r.structural_consistency.plans_without_structural_findings}`)
  if (r.structural_consistency.plans_without_targets > 0) L.push('- Target consistency for plans without targets: not evaluated — no targets defined.')
  L.push(`- Note: ${r.structural_consistency.note}`)
  L.push('')

  if (!r.guard_history.available) {
    L.push('## Guard History', '')
    L.push('No guard history recorded yet.')
    L.push('')
    L.push('## Historical Drift Trend', '')
    L.push('Not available — no recorded Guard runs.')
    L.push('')
    L.push('Run `kaddo guard --record` to start recording drift evidence.')
    L.push('')
    L.push('## Suggested Actions', '')
    r.suggested_actions.forEach((a, i) => L.push(`${i + 1}. ${a}`))
    L.push('')
    return L.join('\n')
  }

  const w = r.drift_warnings
  L.push('## Executive Summary', '')
  L.push(`- Guard runs recorded: ${r.guard_history.total_runs}`)
  L.push(`- Drift warnings detected: ${w.detected}`)
  L.push(`- Open warnings: ${w.open}`)
  L.push(`- Resolved warnings: ${w.resolved}`)
  L.push(`- Resolution rate: ${w.resolution_rate}%`)
  if (r.hotspots.length > 0) L.push(`- Most affected area: ${r.hotspots[0].path}`)
  L.push('')

  L.push('## Guard History', '')
  L.push(`- First run: ${r.guard_history.first_run}`)
  L.push(`- Last run: ${r.guard_history.last_run}`)
  L.push(`- Runs with warnings: ${r.guard_history.runs_with_warnings}/${r.guard_history.total_runs}`)
  L.push(`- Runs clean: ${r.guard_history.runs_clean}/${r.guard_history.total_runs}`)
  L.push('')

  L.push('## Drift Warnings', '')
  const open = r.threads.filter((t) => t.status === 'open')
  const resolved = r.threads.filter((t) => t.status === 'resolved')
  L.push('### Open', '')
  if (open.length === 0) L.push('_None._', '')
  for (const t of open) {
    L.push(`- ${t.code_path}`)
    L.push(`  - Related artifacts: ${t.related_artifacts.join(', ') || '—'}`)
    L.push(`  - First detected: ${t.first_detected}`)
    L.push(`  - Last seen: ${t.last_seen}`)
    L.push('  - Status: open')
  }
  L.push('')
  L.push('### Resolved', '')
  if (resolved.length === 0) L.push('_None._', '')
  for (const t of resolved) {
    L.push(`- ${t.code_path}`)
    L.push(`  - Related artifacts: ${t.related_artifacts.join(', ') || '—'}`)
    L.push(`  - First detected: ${t.first_detected}`)
    L.push(`  - Resolved at: ${t.resolved_at}`)
    L.push('  - Status: resolved')
  }
  L.push('')

  L.push('## Hotspots', '')
  if (r.hotspots.length === 0) L.push('_None._')
  for (const h of r.hotspots) L.push(`- ${h.path}: ${h.warnings} warning(s)`)
  L.push('')

  L.push('## Trend', '')
  L.push(`- Recent direction: ${r.trend.direction}`)
  L.push(`- Reason: ${r.trend.reason}`)
  L.push('')

  L.push('## Suggested Actions', '')
  r.suggested_actions.forEach((a, i) => L.push(`${i + 1}. ${a}`))
  L.push('')

  return L.join('\n')
}

export function serializeDriftJson(r: DriftReport): string {
  // Stable, documented shape (VS-063).
  const out = {
    generated_at: r.generated_at,
    project: r.project,
    project_context: r.project_context,
    consistency_evidence: r.consistency_evidence,
    current_consistency_findings: r.current_consistency_findings,
    structural_consistency: r.structural_consistency,
    guard_history: r.guard_history,
    drift_warnings: r.drift_warnings,
    hotspots: r.hotspots,
    trend: r.trend,
    threads: r.threads,
    suggested_actions: r.suggested_actions,
  }
  return JSON.stringify(out, null, 2) + '\n'
}
