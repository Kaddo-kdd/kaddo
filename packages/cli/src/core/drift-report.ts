// Drift Trend Report (VS-063). Renders the aggregated guard history (core/guard-history.ts) as a
// deterministic Markdown / JSON report. No LLM, no writes.

import { loadConfig } from './config.js'
import { buildGuardHistory, type GuardHistory } from './guard-history.js'

export type DriftReport = {
  generated_at: string
  project: string
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

  const actions: string[] = []
  if (!h.available) {
    actions.push('Run `kaddo guard --record` to start recording guard history.')
  } else {
    if (h.open > 0) actions.push('Review open drift warnings and update related Work Items or ownership.')
    actions.push('Run `kaddo guard --record` before important commits.')
    actions.push('Use this report to calibrate estimated drift-prevention savings.')
  }

  return {
    generated_at: now.toISOString(),
    project,
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
  L.push('')

  if (!r.guard_history.available) {
    L.push('## Guard History', '')
    L.push('No guard history recorded yet.')
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
    guard_history: r.guard_history,
    drift_warnings: r.drift_warnings,
    hotspots: r.hotspots,
    trend: r.trend,
    threads: r.threads,
    suggested_actions: r.suggested_actions,
  }
  return JSON.stringify(out, null, 2) + '\n'
}
