// WI-103 (INI-002, AUD-ADMIN-C2) — pure presentation helpers for the Audit Explorer and detail. Kept
// separate from the route components so they are unit-testable without a DOM.

import type { AuditScopeView, AuditFindingView, AuditRunView } from './api'

export type AuditStatus = AuditRunView['status']

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const

/** Human-readable scope for the detail header. */
export function describeAuditScope(scope: AuditScopeView): string {
  if (scope.kind === 'module') return `modules: ${scope.modules.join(', ')}`
  if (scope.kind === 'paths') return `paths: ${scope.paths.join(', ')}`
  return 'project'
}

/** Status label that never presents a partial/failed run as clean. */
export function auditStatusLabel(status: AuditStatus): string {
  if (status === 'partial') return 'partial — incomplete coverage'
  if (status === 'failed') return 'failed'
  return 'completed'
}

export function auditStatusTone(status: AuditStatus): 'success' | 'warning' | 'danger' {
  if (status === 'partial') return 'warning'
  if (status === 'failed') return 'danger'
  return 'success'
}

export function countConfirmed(findings: AuditFindingView[]): number {
  return findings.filter((f) => f.confidence === 'confirmed').length
}

/** Findings grouped by severity in a fixed order, omitting empty buckets. */
export function summarizeBySeverity(findings: AuditFindingView[]): { severity: string; count: number }[] {
  return SEVERITY_ORDER
    .map((severity) => ({ severity, count: findings.filter((f) => f.severity === severity).length }))
    .filter((x) => x.count > 0)
}
