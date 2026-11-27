// WI-092 (EP-001 / INI-001, candidate AUD-C4) — the analysis orchestrator of the audit flow. Given a scope,
// a context and a list of analyzer adapters, it runs each analyzer, ISOLATES its failures (a throwing or
// rejecting analyzer becomes a failed AuditToolRun, never aborts the others), aggregates and deduplicates
// findings, and assembles an AuditRun via the Core contract (WI-090).
//
// Honest by construction: a failed or skipped tool makes the run partial (or failed), never a clean result
// (EP-001 AC-4). The orchestrator NEVER reclassifies a finding — it passes severity, confidence and
// provenance through exactly as the analyzer reported them. Pure assembly: no network of its own, no writes
// to canonical knowledge, and it never mutates its inputs. Persistence is the caller's choice (writeAuditRun).

import { buildAuditRun, type AuditFinding, type AuditRun, type AuditScope, type AuditToolRun } from './audit.js'
import type { ProjectDiscovery } from './discovery.js'

/** What an analyzer receives: the project dir, the scope under audit, and (optionally) the Discover inventory. */
export type AnalyzerContext = {
  dir: string
  scope: AuditScope
  discovery?: ProjectDiscovery
}

/** What an analyzer returns. `status: 'skipped'` marks a tool that chose not to run (partial coverage). */
export type AnalyzerResult = {
  findings: AuditFinding[]
  evaluated?: string[]
  notEvaluated?: string[]
  status?: 'ok' | 'skipped'
  reason?: string
}

/** An analyzer adapter. Real analyzers (AUD-C5) implement this; the orchestrator only runs them. */
export type Analyzer = {
  name: string
  version?: string
  run: (context: AnalyzerContext) => AnalyzerResult | Promise<AnalyzerResult>
}

export type RunAuditInput = {
  id: string
  createdAt: string
  scope: AuditScope
  analyzers: Analyzer[]
  context: AnalyzerContext
  commit?: string
  limitations?: string[]
  reportRef?: string
  previousRunId?: string
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Run every analyzer and assemble an AuditRun. Each analyzer is isolated: a throw/reject is recorded as a
 * failed tool (with its reason) and never aborts the others. Status and coverage are derived HONESTLY by
 * buildAuditRun from the tool outcomes; findings are deduplicated by stable id and passed through unchanged
 * (no severity/confidence reclassification). Deterministic given the same analyzers and context.
 */
export async function runAudit(input: RunAuditInput): Promise<AuditRun> {
  const tools: AuditToolRun[] = []
  const findings: AuditFinding[] = []
  const evaluated: string[] = []
  // Explicit sub-areas an analyzer reports as not evaluated. Failed tools are added to coverage by
  // buildAuditRun, so they are NOT pushed here (that would double-list them).
  const notEvaluated: string[] = []

  for (const analyzer of input.analyzers) {
    try {
      const result = await analyzer.run(input.context)
      const status: AuditToolRun['status'] = result.status === 'skipped' ? 'skipped' : 'ok'
      tools.push({
        name: analyzer.name,
        ...(analyzer.version ? { version: analyzer.version } : {}),
        status,
        ...(result.reason ? { reason: result.reason } : {}),
      })
      // Pass findings through untouched — the orchestrator never reclassifies severity/confidence/provenance.
      for (const f of result.findings ?? []) findings.push(f)
      for (const area of result.evaluated ?? []) evaluated.push(area)
      for (const area of result.notEvaluated ?? []) notEvaluated.push(area)
    } catch (err) {
      // Failure isolation: this analyzer failed; record it and keep going. buildAuditRun turns any failed
      // tool into partial coverage and lists it under notEvaluated — never a clean result.
      tools.push({
        name: analyzer.name,
        ...(analyzer.version ? { version: analyzer.version } : {}),
        status: 'failed',
        reason: errorMessage(err),
      })
    }
  }

  return buildAuditRun({
    id: input.id,
    createdAt: input.createdAt,
    scope: input.scope,
    tools,
    findings,
    ...(input.commit ? { commit: input.commit } : {}),
    evaluated,
    notEvaluated,
    ...(input.limitations ? { limitations: input.limitations } : {}),
    ...(input.reportRef ? { reportRef: input.reportRef } : {}),
    ...(input.previousRunId ? { previousRunId: input.previousRunId } : {}),
  })
}
