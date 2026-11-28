// WI-103 (INI-002, AUD-ADMIN-C2) — pure presentation helpers for the Audit Explorer and detail. Kept
// separate from the route components so they are unit-testable without a DOM.

import type { AuditScopeView, AuditFindingView, AuditRunView, AuditFindingFilters } from './api'

export type AuditStatus = AuditRunView['status']

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const

export const SEVERITY_OPTIONS = [...SEVERITY_ORDER]
export const CONFIDENCE_OPTIONS = ['confirmed', 'likely', 'inferred'] as const
export const STATUS_OPTIONS = ['open', 'acknowledged', 'accepted-risk', 'false-positive', 'resolved'] as const

/** A finding's confidence is INDEPENDENT of its severity. Confirmed facts read solid; inferences read muted
 *  and tagged, so a critical inference is never shown as a critical fact. */
export function confidenceIsFirm(confidence: string): boolean {
  return confidence === 'confirmed'
}

export function findingLocationLabel(location: AuditFindingView['location']): string | null {
  if (!location?.file) return null
  return typeof location.line === 'number' ? `${location.file}:${location.line}` : location.file
}

/**
 * Normalize filter input for the detail endpoint: drop empty values and enforce the backend's rule that
 * `module` and `pathPrefix` are mutually exclusive (module wins when both are set).
 */
export function cleanAuditFilters(raw: AuditFindingFilters): AuditFindingFilters {
  const out: AuditFindingFilters = {}
  for (const key of ['severity', 'confidence', 'category', 'status', 'module', 'pathPrefix'] as const) {
    const v = raw[key]?.trim()
    if (v) out[key] = v
  }
  if (out.module && out.pathPrefix) delete out.pathPrefix
  return out
}

export function hasActiveFilters(filters: AuditFindingFilters): boolean {
  return Object.values(filters).some((v) => Boolean(v && v.trim()))
}

// WI-105 (AUD-ADMIN-C6) — remediation / Work Item linking helpers.

/** Build the link request, always with explicit confirmation — the write never happens without it. */
export function buildAuditLinkInput(runId: string, findingId: string, workItemId: string, expectedRevision: string) {
  return { runId, findingId, workItemId, expectedRevision, confirmed: true as const }
}

/** A Work Item id the user may type to link; accepted only when it matches the canonical WI-<n> shape. */
export function isValidWorkItemId(id: string): boolean {
  return /^WI-\d+$/.test(id.trim())
}

/** A stale-revision conflict: the Work Item changed since we read it, so the user must refetch and retry. */
export function isRevisionConflict(error: unknown): boolean {
  const code = (error as { code?: string })?.code
  return code === 'WORK_ITEM_CONFLICT'
}

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
