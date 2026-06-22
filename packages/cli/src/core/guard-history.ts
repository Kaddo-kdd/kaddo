// Guard History & Drift Trend (VS-063).
//
// Persists a deterministic, local history of `kaddo guard --record` runs and aggregates it into a
// drift-trend view. No LLM, no semantic inference, no git authors / personal data, never resolves
// drift automatically, never blocks commits. Resolution is detected only from deterministic diff +
// ownership + artifact-modification signals across runs.

import fs from 'fs'
import { exists, readFile, writeFile, join } from '../utils/fs.js'

export type GuardWarning = {
  type: 'possible-knowledge-drift'
  code_path: string
  related_artifacts: string[]
  updated_artifacts: string[]
  status: 'open'
}

export type GuardRun = {
  run_id: string
  generated_at: string
  project: string
  scope: string
  touched_files: string[]
  matched_artifacts: string[]
  updated_artifacts: string[]
  warnings: GuardWarning[]
  summary: { touched_files: number; matched_artifacts: number; warnings: number }
}

const HISTORY_DIR = '.kaddo/history'
const RUNS_PATH = `${HISTORY_DIR}/guard-runs.jsonl`
const SUMMARY_PATH = `${HISTORY_DIR}/guard-summary.json`

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

/** Read all recorded guard runs (oldest → newest), skipping malformed lines. */
export function loadGuardRuns(dir: string): GuardRun[] {
  const p = join(dir, RUNS_PATH)
  if (!exists(p)) return []
  const out: GuardRun[] = []
  for (const line of readFile(p).split(/\r?\n/)) {
    const t = line.trim()
    if (!t) continue
    try {
      out.push(JSON.parse(t) as GuardRun)
    } catch {
      // skip malformed line
    }
  }
  return out
}

/** Per-code-path drift thread with deterministic open/resolved resolution (VS-063). */
export type DriftThread = {
  code_path: string
  related_artifacts: string[]
  first_detected: string
  last_seen: string
  status: 'open' | 'resolved'
  resolved_at?: string
}

/**
 * Reconstruct drift threads from the run timeline. A code path's warning is resolved when a later
 * run touches the same path, updates a related artifact, and no longer warns about that path.
 */
export function resolveDriftThreads(runs: GuardRun[]): DriftThread[] {
  const sorted = [...runs].sort((a, b) => a.generated_at.localeCompare(b.generated_at))
  const paths = new Set<string>()
  for (const r of sorted) for (const w of r.warnings) paths.add(w.code_path)

  const threads: DriftThread[] = []
  for (const codePath of paths) {
    const related = new Set<string>()
    let firstDetected = ''
    let lastWarn = ''
    for (const r of sorted) {
      const w = r.warnings.find((x) => x.code_path === codePath)
      if (w) {
        if (!firstDetected) firstDetected = r.generated_at
        lastWarn = r.generated_at
        for (const a of w.related_artifacts) related.add(a)
      }
    }
    // Resolution: a run after the last warning that touched the path, updated a related artifact,
    // and produced no warning for it.
    let resolvedAt: string | undefined
    for (const r of sorted) {
      if (r.generated_at <= lastWarn) continue
      const touched = r.touched_files.some((f) => toPosix(f) === codePath)
      const warnedHere = r.warnings.some((x) => x.code_path === codePath)
      const updatedRelated = r.updated_artifacts.some((a) => related.has(a))
      if (touched && updatedRelated && !warnedHere) {
        resolvedAt = r.generated_at
        break
      }
    }
    threads.push({
      code_path: codePath,
      related_artifacts: [...related],
      first_detected: firstDetected,
      last_seen: lastWarn,
      status: resolvedAt ? 'resolved' : 'open',
      ...(resolvedAt ? { resolved_at: resolvedAt } : {}),
    })
  }
  return threads
}

export type GuardHistory = {
  available: boolean
  total_runs: number
  first_run: string | null
  last_run: string | null
  runs_with_warnings: number
  runs_clean: number
  detected: number
  open: number
  resolved: number
  resolution_rate: number
  threads: DriftThread[]
  hotspots: { path: string; warnings: number }[]
  trend: { direction: 'improving' | 'stable' | 'worsening' | 'unknown'; reason: string }
}

function hotspotDir(codePath: string): string {
  const i = codePath.lastIndexOf('/')
  return i >= 0 ? codePath.slice(0, i + 1) : codePath
}

function computeTrend(runs: GuardRun[]): GuardHistory['trend'] {
  if (runs.length < 2) return { direction: 'unknown', reason: 'Not enough recorded runs to detect a trend.' }
  const sorted = [...runs].sort((a, b) => a.generated_at.localeCompare(b.generated_at))
  const mid = Math.floor(sorted.length / 2)
  const avg = (arr: GuardRun[]) => (arr.length ? arr.reduce((s, r) => s + r.warnings.length, 0) / arr.length : 0)
  const earlier = avg(sorted.slice(0, mid))
  const recent = avg(sorted.slice(mid))
  if (recent < earlier) return { direction: 'improving', reason: 'Fewer warnings in the last recorded runs.' }
  if (recent > earlier) return { direction: 'worsening', reason: 'More warnings in the last recorded runs.' }
  return { direction: 'stable', reason: 'Warning volume is roughly stable across recorded runs.' }
}

/** Aggregate the recorded runs into the drift-trend view used by `kaddo drift`, impact and savings. */
export function buildGuardHistory(dir: string): GuardHistory {
  const runs = loadGuardRuns(dir)
  if (runs.length === 0) {
    return {
      available: false,
      total_runs: 0,
      first_run: null,
      last_run: null,
      runs_with_warnings: 0,
      runs_clean: 0,
      detected: 0,
      open: 0,
      resolved: 0,
      resolution_rate: 0,
      threads: [],
      hotspots: [],
      trend: { direction: 'unknown', reason: 'No guard history recorded yet.' },
    }
  }
  const sorted = [...runs].sort((a, b) => a.generated_at.localeCompare(b.generated_at))
  const threads = resolveDriftThreads(sorted)
  const open = threads.filter((t) => t.status === 'open').length
  const resolved = threads.filter((t) => t.status === 'resolved').length
  const detected = threads.length
  const runsWithWarnings = sorted.filter((r) => r.warnings.length > 0).length

  const hotspotMap = new Map<string, number>()
  for (const t of threads) {
    const d = hotspotDir(t.code_path)
    hotspotMap.set(d, (hotspotMap.get(d) ?? 0) + 1)
  }
  const hotspots = [...hotspotMap.entries()]
    .map(([path, warnings]) => ({ path, warnings }))
    .sort((a, b) => b.warnings - a.warnings)

  return {
    available: true,
    total_runs: sorted.length,
    first_run: sorted[0].generated_at,
    last_run: sorted[sorted.length - 1].generated_at,
    runs_with_warnings: runsWithWarnings,
    runs_clean: sorted.length - runsWithWarnings,
    detected,
    open,
    resolved,
    resolution_rate: detected > 0 ? Math.round((resolved / detected) * 1000) / 10 : 0,
    threads,
    hotspots,
    trend: computeTrend(sorted),
  }
}

export type GuardSummaryFile = {
  generated_at: string
  total_runs: number
  total_warnings: number
  open_warnings: number
  resolved_warnings: number
  last_run_id: string
}

/**
 * Record a guard run: append a JSONL line and refresh the summary. Deterministic and local; never
 * touches src/ or knowledge/, never runs git. Returns the written run + file paths.
 */
export function recordGuardRun(
  dir: string,
  input: {
    project: string
    scope: string
    touched_files: string[]
    matched_artifacts: string[]
    updated_artifacts: string[]
    warnings: GuardWarning[]
  },
  now: Date = new Date()
): { run: GuardRun; runsPath: string; summaryPath: string } {
  const iso = now.toISOString()
  const run: GuardRun = {
    run_id: `guard-${iso.replace(/[:.]/g, '-')}`,
    generated_at: iso,
    project: input.project,
    scope: input.scope,
    touched_files: input.touched_files,
    matched_artifacts: input.matched_artifacts,
    updated_artifacts: input.updated_artifacts,
    warnings: input.warnings,
    summary: {
      touched_files: input.touched_files.length,
      matched_artifacts: input.matched_artifacts.length,
      warnings: input.warnings.length,
    },
  }

  const runsAbs = join(dir, RUNS_PATH)
  fs.mkdirSync(join(dir, HISTORY_DIR), { recursive: true })
  fs.appendFileSync(runsAbs, JSON.stringify(run) + '\n', 'utf-8')

  // Recompute the summary from the full timeline so open/resolved stay accurate.
  const history = buildGuardHistory(dir)
  const summary: GuardSummaryFile = {
    generated_at: iso,
    total_runs: history.total_runs,
    total_warnings: history.detected,
    open_warnings: history.open,
    resolved_warnings: history.resolved,
    last_run_id: run.run_id,
  }
  writeFile(join(dir, SUMMARY_PATH), JSON.stringify(summary, null, 2) + '\n')

  return { run, runsPath: RUNS_PATH, summaryPath: SUMMARY_PATH }
}
