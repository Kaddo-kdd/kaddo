// WI-095 (EP-001 / INI-001, candidate AUD-C7) — the Report step of the audit flow: a PURE renderer that
// turns an AuditRun (and, when provided, its correlated findings) into a structured, reproducible Markdown
// report, plus derived-artifact persistence under .kaddo/audits.
//
// Honest by construction (EP-001 AC-4): confirmed findings, inferences and not-evaluated areas go in SEPARATE
// sections — a critical inference is never presented as a critical fact. A partial/failed run is marked as
// such and its not-evaluated areas are listed, never a clean result. Deterministic: the same run renders
// byte-identical Markdown (stable section and finding order), all timestamps taken from run.createdAt. It
// never re-analyzes (it consumes a built run) and never writes canonical knowledge — the canonical human
// report under knowledge/tech/audits is a separate human-approved action (AUD-C8).

import fs from 'node:fs'
import path from 'node:path'
import { writeAuditRun, AUDITS_DIR, type AuditRun, type AuditFinding, type AuditScope, type FindingSeverity } from './audit.js'
import type { CorrelatedFinding } from './audit-correlation.js'

const SEVERITY_RANK: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

function sortFindings<T extends AuditFinding>(findings: T[]): T[] {
  return [...findings].sort((a, b) => (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || a.id.localeCompare(b.id))
}

function describeScope(scope: AuditScope): string {
  switch (scope.kind) {
    case 'project': return 'project'
    case 'module': return `modules: ${[...scope.modules].sort().join(', ')}`
    case 'paths': return `paths: ${[...scope.paths].sort().join(', ')}`
  }
}

function hasCorrelation(f: AuditFinding | CorrelatedFinding): f is CorrelatedFinding {
  return (f as CorrelatedFinding).correlation !== undefined
}

/** Render a single finding as a Markdown block. Deterministic; includes correlation when present. */
function renderFinding(f: AuditFinding | CorrelatedFinding): string {
  const lines: string[] = []
  const loc = f.location?.file ? ` — \`${f.location.file}${typeof f.location.line === 'number' ? `:${f.location.line}` : ''}\`` : ''
  lines.push(`#### [${f.severity.toUpperCase()}] ${f.title}${loc}`)
  lines.push('')
  lines.push(`- **Category:** ${f.category}`)
  lines.push(`- **Finding ID:** ${f.id}`)
  lines.push(`- **Confidence:** ${f.confidence}`)
  lines.push(`- **Evidence:** ${f.evidence}`)
  lines.push(`- **Provenance:** ${f.provenance}`)
  lines.push(`- **Recommendation:** ${f.recommendation}`)
  const refs: string[] = []
  if (f.references.workItems?.length) refs.push(`WIs: ${[...f.references.workItems].sort().join(', ')}`)
  if (f.references.adrs?.length) refs.push(`ADRs: ${[...f.references.adrs].sort().join(', ')}`)
  if (f.references.capabilities?.length) refs.push(`Capabilities: ${[...f.references.capabilities].sort().join(', ')}`)
  if (refs.length) lines.push(`- **References:** ${refs.join('; ')}`)
  if (hasCorrelation(f)) {
    const c = f.correlation
    lines.push(`- **Correlation:** ${c.matchStrength}`)
    if (c.confirmedWorkItems?.length) lines.push(`- **Approved Work Item links:** ${c.confirmedWorkItems.join(', ')}`)
    if (c.owners.length) lines.push(`- **Owners:** ${c.owners.map((o) => `${o.domain} → ${o.owners.join('/')}`).join('; ')}`)
    if (c.risks.length) lines.push(`- **Risks:** ${[...c.risks].sort().join(', ')}`)
  }
  lines.push('')
  return lines.join('\n')
}

function renderSection(title: string, findings: (AuditFinding | CorrelatedFinding)[], emptyNote: string): string {
  const lines = [`## ${title}`, '']
  if (findings.length === 0) {
    lines.push(emptyNote, '')
    return lines.join('\n')
  }
  for (const f of sortFindings(findings)) lines.push(renderFinding(f))
  return lines.join('\n')
}

/**
 * Render an AuditRun as a structured Markdown report. When `correlated` is provided it is rendered instead of
 * run.findings (same findings, enriched). Pure and deterministic.
 */
export function renderAuditReport(run: AuditRun, correlated?: CorrelatedFinding[]): string {
  const findings: (AuditFinding | CorrelatedFinding)[] = correlated ?? run.findings
  const confirmed = findings.filter((f) => f.confidence === 'confirmed')
  const inferences = findings.filter((f) => f.confidence !== 'confirmed')

  const out: string[] = []
  out.push(`# Audit Report — ${run.id}`)
  out.push('')
  out.push(`- **Date:** ${run.createdAt}`)
  if (run.commit) out.push(`- **Commit:** ${run.commit}`)
  out.push(`- **Scope:** ${describeScope(run.scope)}`)
  out.push(`- **Status:** ${run.status}${run.status !== 'completed' ? ' — ⚠️ coverage is incomplete; this is not a clean result' : ''}`)
  out.push(`- **Findings:** ${findings.length} (confirmed: ${confirmed.length}, inferences: ${inferences.length})`)
  out.push('')

  out.push('## Coverage')
  out.push('')
  out.push(`- **Complete:** ${run.coverage.complete ? 'yes' : 'no'}`)
  out.push(`- **Evaluated:** ${run.coverage.evaluated.length ? [...run.coverage.evaluated].sort().join(', ') : '—'}`)
  out.push(`- **Tools:** ${run.tools.map((t) => `${t.name}${t.version ? `@${t.version}` : ''} (${t.status})`).join(', ') || '—'}`)
  out.push('')

  out.push(renderSection('Confirmed findings', confirmed, '_No confirmed findings._'))
  out.push(renderSection('Inferences', inferences, '_No inferences._'))

  out.push('## Not evaluated')
  out.push('')
  if (run.coverage.notEvaluated.length === 0) {
    out.push('_All declared areas were evaluated._', '')
  } else {
    for (const area of [...run.coverage.notEvaluated].sort()) out.push(`- ${area}`)
    out.push('')
  }

  out.push('## Limitations')
  out.push('')
  if (run.limitations.length === 0) {
    out.push('_None recorded._', '')
  } else {
    for (const lim of [...run.limitations].sort()) out.push(`- ${lim}`)
    out.push('')
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export type AuditArtifacts = { jsonPath: string; reportPath: string }

/**
 * Persist the DERIVED audit artifacts under .kaddo/audits/: the run JSON (via writeAuditRun) and the Markdown
 * report. Never writes canonical knowledge — publishing knowledge/tech/audits is a human-approved action.
 */
export function writeAuditArtifacts(dir: string, run: AuditRun, opts: { report?: string; correlated?: CorrelatedFinding[] } = {}): AuditArtifacts {
  const jsonPath = writeAuditRun(dir, run)
  const report = opts.report ?? renderAuditReport(run, opts.correlated)
  const auditsDir = path.join(dir, AUDITS_DIR)
  fs.mkdirSync(auditsDir, { recursive: true })
  const reportPath = path.join(auditsDir, `${run.id}.md`)
  fs.writeFileSync(reportPath, report)
  return { jsonPath, reportPath }
}
