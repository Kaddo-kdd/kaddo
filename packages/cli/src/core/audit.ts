// WI-090 (EP-001 / INI-001, candidate AUD-C1) — the Core data contract for the audit flow: AuditRun and
// AuditFinding, stable finding ids, deduplication across runs, and deterministic JSON serialization under
// .kaddo/audits/. This is the single source of truth the CLI, MCP and Admin all derive from (EP-001 AC-9).
//
// Pure: no LLM, no network. It never claims an inference is a confirmed vulnerability — severity and
// confidence are independent dimensions, a finding starts `open`, and a failed tool is recorded as PARTIAL
// coverage, never a clean result. It never touches canonical knowledge artifacts.

import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type AuditScope =
  | { kind: 'project' }
  | { kind: 'module'; modules: string[] }
  | { kind: 'paths'; paths: string[] }

/** One tool invocation in a run. A failure is recorded here and propagated as partial coverage — never dropped. */
export type AuditToolRun = {
  name: string
  version?: string
  status: 'ok' | 'failed' | 'skipped'
  reason?: string
}

export type AuditCoverage = {
  /** False when a tool failed/was skipped or an area is explicitly not evaluated. */
  complete: boolean
  /** Human-readable areas that were evaluated (e.g. module ids, globs). */
  evaluated: string[]
  /** Areas explicitly not evaluated, with why (a failed tool, an out-of-scope path). */
  notEvaluated: string[]
}

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
/** Confidence is INDEPENDENT of severity: a high-severity finding may still be only `inferred`. */
export type FindingConfidence = 'confirmed' | 'likely' | 'inferred'
export type FindingStatus = 'open' | 'acknowledged' | 'accepted-risk' | 'false-positive' | 'resolved'

export type FindingLocation = { file?: string; line?: number; symbol?: string }

export type FindingReferences = {
  adrs?: string[]
  capabilities?: string[]
  workItems?: string[]
}

export type AuditFinding = {
  /** Stable across runs: the same finding gets the same id (see stableFindingId). */
  id: string
  category: string
  title: string
  description: string
  location?: FindingLocation
  /** What the evidence actually shows (not just a flag). */
  evidence: string
  /** Where the evidence came from (tool, rule, file) — provenance, never inferred. */
  provenance: string
  severity: FindingSeverity
  confidence: FindingConfidence
  technicalImpact?: string
  operationalImpact?: string
  recommendation: string
  effort?: string
  status: FindingStatus
  references: FindingReferences
  /** A proposed planning action (e.g. "relate to WI-xxx"), surfaced for human approval — never applied here. */
  planningRecommendation?: string
}

export type AuditRunStatus = 'completed' | 'partial' | 'failed'

export type AuditRun = {
  id: string
  createdAt: string
  commit?: string
  scope: AuditScope
  tools: AuditToolRun[]
  status: AuditRunStatus
  coverage: AuditCoverage
  findings: AuditFinding[]
  limitations: string[]
  reportRef?: string
  /** The previous AuditRun id this one is compared against, when any. */
  previousRunId?: string
}

export const AUDITS_DIR = path.join('.kaddo', 'audits')

/**
 * A stable finding id: deterministic over the identity of the finding (category + normalized location +
 * fingerprint), so the SAME finding keeps the SAME id across runs and can be deduplicated and tracked. It
 * never depends on the run, timestamp or ordering. `fingerprint` is the stable, tool-provided discriminator
 * (e.g. rule id, message, code hash) that distinguishes two findings at the same location.
 */
export function stableFindingId(input: { category: string; location?: FindingLocation; fingerprint: string }): string {
  const loc = input.location ?? {}
  const key = [
    input.category.trim().toLowerCase(),
    (loc.file ?? '').replace(/\\/g, '/').trim().toLowerCase(),
    loc.symbol?.trim().toLowerCase() ?? '',
    typeof loc.line === 'number' ? String(loc.line) : '',
    input.fingerprint.trim(),
  ].join('\u0001')
  return 'AF-' + createHash('sha256').update(key).digest('hex').slice(0, 16)
}

/**
 * Deduplicate findings by stable id, keeping the first occurrence and its order. Two runs that surface the
 * same finding never produce two different entries (EP-001; WI-090 AC-03).
 */
export function dedupeFindings(findings: AuditFinding[]): AuditFinding[] {
  const seen = new Set<string>()
  const out: AuditFinding[] = []
  for (const f of findings) {
    if (seen.has(f.id)) continue
    seen.add(f.id)
    out.push(f)
  }
  return out
}

/**
 * Build a run, deriving status and coverage HONESTLY from the tools: any failed tool makes the run
 * `partial` (never `completed`) and coverage incomplete; all tools failing makes it `failed`. A finding
 * with no explicit status defaults to `open`.
 */
export function buildAuditRun(input: {
  id: string
  createdAt: string
  scope: AuditScope
  tools: AuditToolRun[]
  findings: AuditFinding[]
  commit?: string
  evaluated?: string[]
  notEvaluated?: string[]
  limitations?: string[]
  reportRef?: string
  previousRunId?: string
}): AuditRun {
  const failed = input.tools.filter((t) => t.status !== 'ok')
  const allFailed = input.tools.length > 0 && input.tools.every((t) => t.status === 'failed')
  const status: AuditRunStatus = allFailed ? 'failed' : failed.length > 0 || (input.notEvaluated?.length ?? 0) > 0 ? 'partial' : 'completed'
  const notEvaluated = [
    ...(input.notEvaluated ?? []),
    ...failed.map((t) => `${t.name}${t.version ? `@${t.version}` : ''} (${t.status}${t.reason ? `: ${t.reason}` : ''})`),
  ]
  const findings = dedupeFindings(input.findings.map((f) => ({ ...f, status: f.status ?? 'open' })))
  return {
    id: input.id,
    createdAt: input.createdAt,
    ...(input.commit ? { commit: input.commit } : {}),
    scope: input.scope,
    tools: input.tools,
    status,
    coverage: { complete: notEvaluated.length === 0, evaluated: input.evaluated ?? [], notEvaluated },
    findings,
    limitations: input.limitations ?? [],
    ...(input.reportRef ? { reportRef: input.reportRef } : {}),
    ...(input.previousRunId ? { previousRunId: input.previousRunId } : {}),
  }
}

/** Recursively sort object keys so JSON output is deterministic at every level (never drops fields). */
function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(o).sort()) out[k] = sortDeep(o[k])
    return out
  }
  return v
}

/** Deterministic JSON for an AuditRun (stable key order) so serialization round-trips and diffs cleanly. */
export function serializeAuditRun(run: AuditRun): string {
  return JSON.stringify(sortDeep(run), null, 2) + '\n'
}

export function parseAuditRun(json: string): AuditRun {
  const data = JSON.parse(json) as AuditRun
  if (!data || typeof data.id !== 'string' || !Array.isArray(data.findings)) {
    throw new Error('Invalid AuditRun JSON: missing id or findings.')
  }
  return data
}

/** Next audit run id (AUD-001, AUD-002, …), read-only over existing .kaddo/audits/ files. */
export function nextAuditRunId(dir: string): string {
  const d = path.join(dir, AUDITS_DIR)
  let max = 0
  try {
    for (const f of fs.readdirSync(d)) {
      const m = /^AUD-(\d+)\.json$/.exec(f)
      if (m) max = Math.max(max, Number(m[1]))
    }
  } catch { /* no audits yet */ }
  return 'AUD-' + String(max + 1).padStart(3, '0')
}

/** Persist a run under .kaddo/audits/<id>.json (derived, never a canonical knowledge artifact). */
export function writeAuditRun(dir: string, run: AuditRun): string {
  const d = path.join(dir, AUDITS_DIR)
  fs.mkdirSync(d, { recursive: true })
  const file = path.join(d, `${run.id}.json`)
  fs.writeFileSync(file, serializeAuditRun(run))
  return file
}

export function readAuditRun(dir: string, id: string): AuditRun | null {
  const file = path.join(dir, AUDITS_DIR, `${id}.json`)
  try { return parseAuditRun(fs.readFileSync(file, 'utf8')) } catch { return null }
}
