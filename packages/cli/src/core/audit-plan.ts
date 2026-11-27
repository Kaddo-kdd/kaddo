import type { AuditRun } from './audit.js'
import type { CorrelatedFinding } from './audit-correlation.js'

/** Read-only remediation preview. Heuristic matches remain suggestions, never approved links. */
export function previewAuditPlan(run: AuditRun, findings: CorrelatedFinding[]) {
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  return {
    auditId: run.id,
    coverage: run.coverage,
    status: run.status,
    actions: [...findings].sort((a, b) => (rank[a.severity] - rank[b.severity]) || a.id.localeCompare(b.id)).map(f => ({
      findingId: f.id, title: f.title, severity: f.severity, confidence: f.confidence,
      evidence: f.evidence, recommendation: f.recommendation,
      confirmedWorkItems: f.correlation.confirmedWorkItems,
      suggestedWorkItems: (f.references.workItems ?? []).filter(id => !f.correlation.confirmedWorkItems.includes(id)),
      action: f.correlation.confirmedWorkItems.length ? 'already-linked' : 'review',
    })),
  }
}
