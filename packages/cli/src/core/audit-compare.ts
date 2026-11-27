import { dedupeFindings, type AuditFinding, type AuditRun } from './audit.js'

export type AuditComparisonEntry = { id: string; classification: 'new' | 'persistent' | 'resolved' | 'unverifiable'; before?: AuditFinding; after?: AuditFinding; changes?: string[]; reason?: string }

/** A missing finding is resolved only with equivalent, explicit complete coverage and matching source. */
export function compareAuditRuns(before: AuditRun, after: AuditRun): { beforeId: string; afterId: string; warnings: string[]; entries: AuditComparisonEntry[] } {
  const warnings: string[] = []
  const normalize = (scope: AuditRun['scope'] | undefined): string | undefined => {
    if (!scope || typeof scope !== 'object') return undefined
    if (scope.kind === 'project') return 'project'
    const values = scope.kind === 'module' ? scope.modules : scope.kind === 'paths' ? scope.paths : undefined
    return Array.isArray(values) && values.length > 0 && values.every(v => typeof v === 'string') ? JSON.stringify([scope.kind, [...values].sort()]) : undefined
  }
  const beforeScope = normalize(before.scope), afterScope = normalize(after.scope)
  const sameScope = !!beforeScope && beforeScope === afterScope
  if (!sameScope) warnings.push('Audit scopes differ or are unavailable.')
  const complete = before.status === 'completed' && after.status === 'completed' && before.coverage?.complete === true && after.coverage?.complete === true && Array.isArray(before.coverage?.notEvaluated) && Array.isArray(after.coverage?.notEvaluated) && before.coverage.notEvaluated.length === 0 && after.coverage.notEvaluated.length === 0
  if (!complete) warnings.push('Coverage is incomplete, failed or unavailable.')
  const areas = (r: AuditRun) => Array.isArray(r.coverage?.evaluated) && r.coverage.evaluated.every(v => typeof v === 'string') ? [...r.coverage.evaluated].sort() : []
  const sameAreas = areas(before).length > 0 && JSON.stringify(areas(before)) === JSON.stringify(areas(after))
  if (!sameAreas) warnings.push('Evaluated areas differ or are unavailable.')
  const tools = (r: AuditRun) => Array.isArray(r.tools) ? r.tools.filter(t => t && typeof t.name === 'string').map(t => `${t.name}\u0000${t.version ?? ''}\u0000${t.status}`).sort() : []
  const versionsKnown = (r: AuditRun) => Array.isArray(r.tools) && r.tools.length > 0 && r.tools.every(t => t && typeof t.version === 'string' && t.version.trim().length > 0)
  const sameTools = versionsKnown(before) && versionsKnown(after) && JSON.stringify(tools(before)) === JSON.stringify(tools(after))
  if (!sameTools) warnings.push('Tools, versions or tool status differ or are unavailable.')
  const beforeFindings = dedupeFindings(before.findings), afterFindings = dedupeFindings(after.findings)
  if (beforeFindings.length !== before.findings.length || afterFindings.length !== after.findings.length) warnings.push('Duplicate finding IDs were deduplicated; first occurrence retained.')
  const oldMap = new Map(beforeFindings.map(f => [f.id, f]))
  const newMap = new Map(afterFindings.map(f => [f.id, f]))
  const ids = [...new Set([...oldMap.keys(), ...newMap.keys()])].sort()
  const entries: AuditComparisonEntry[] = ids.map(id => {
    const old = oldMap.get(id), current = newMap.get(id)
    if (old && current) {
      const changes = (['severity', 'confidence', 'status', 'evidence'] as const).filter(k => old[k] !== current[k])
      return { id, classification: 'persistent', before: old, after: current, changes }
    }
    if (current) {
      const file = current.location?.file?.replace(/\\/g, '/')
      const sourceCovered = !!current.provenance && Array.isArray(before.tools) && before.tools.some(t => t?.name === current.provenance && t.status === 'ok')
      const areaCovered = !!file && areas(before).some(area => area.replace(/\\/g, '/') === file)
      if (sameScope && complete && sameAreas && sameTools && sourceCovered && areaCovered) return { id, classification: 'new', after: current }
      return { id, classification: 'unverifiable', after: current, reason: 'Equivalent baseline coverage and successful matching source cannot be established.' }
    }
    const sourceCovered = !!old?.provenance && Array.isArray(after.tools) && after.tools.some(t => t?.name === old.provenance && t.status === 'ok')
    const file = old?.location?.file?.replace(/\\/g, '/')
    const areaCovered = !!file && areas(after).some(area => area.replace(/\\/g, '/') === file)
    if (sameScope && complete && sameAreas && sameTools && sourceCovered && areaCovered) return { id, classification: 'resolved', before: old }
    return { id, classification: 'unverifiable', before: old, reason: 'Equivalent complete coverage and successful matching source cannot be established.' }
  })
  return { beforeId: before.id, afterId: after.id, warnings, entries }
}
