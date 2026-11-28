import { describe, it, expect } from 'vitest'
import {
  describeAuditScope, auditStatusLabel, auditStatusTone, countConfirmed, summarizeBySeverity,
  confidenceIsFirm, findingLocationLabel, cleanAuditFilters, hasActiveFilters,
  buildAuditLinkInput, isValidWorkItemId, isRevisionConflict,
} from '../src/lib/audit-presentation'
import type { AuditFindingView } from '../src/lib/api'

// WI-103 (INI-002, AUD-ADMIN-C2) — Audit Explorer presentation logic: honest status, scope description and
// finding summaries. The route components (Audits, AuditDetail) consume these.

function finding(over: Partial<AuditFindingView> = {}): AuditFindingView {
  return {
    id: 'AF-x', category: 'deps', title: 't', severity: 'high', confidence: 'confirmed',
    evidence: 'e', provenance: 'p', recommendation: 'r', status: 'open', ...over,
  }
}

describe('audit presentation (WI-103)', () => {
  it('describes each scope kind', () => {
    expect(describeAuditScope({ kind: 'project' })).toBe('project')
    expect(describeAuditScope({ kind: 'module', modules: ['@kaddo/cli', '@kaddo/admin'] })).toBe('modules: @kaddo/cli, @kaddo/admin')
    expect(describeAuditScope({ kind: 'paths', paths: ['src/a.ts'] })).toBe('paths: src/a.ts')
  })

  it('never labels a partial or failed run as clean', () => {
    expect(auditStatusLabel('completed')).toBe('completed')
    expect(auditStatusLabel('partial')).toBe('partial — incomplete coverage')
    expect(auditStatusLabel('failed')).toBe('failed')
    expect(auditStatusTone('partial')).toBe('warning')
    expect(auditStatusTone('failed')).toBe('danger')
    expect(auditStatusTone('completed')).toBe('success')
  })

  it('counts confirmed findings (confidence, independent of severity)', () => {
    expect(countConfirmed([finding({ confidence: 'confirmed' }), finding({ confidence: 'inferred' }), finding({ confidence: 'confirmed' })])).toBe(2)
  })

  it('summarizes findings by severity in fixed order, omitting empty buckets', () => {
    const findings = [
      finding({ severity: 'low' }), finding({ severity: 'critical' }), finding({ severity: 'critical' }), finding({ severity: 'info' }),
    ]
    expect(summarizeBySeverity(findings)).toEqual([
      { severity: 'critical', count: 2 },
      { severity: 'low', count: 1 },
      { severity: 'info', count: 1 },
    ])
    expect(summarizeBySeverity([])).toEqual([])
  })

  it('exposes the Audit route components', async () => {
    const explorer = await import('../src/routes/Audits')
    const detail = await import('../src/routes/AuditDetail')
    expect(typeof explorer.Audits).toBe('function')
    expect(typeof detail.AuditDetail).toBe('function')
  })
})

// WI-104 (AUD-ADMIN-C4) — findings explorer presentation + filter logic.
describe('findings explorer (WI-104)', () => {
  it('distinguishes confirmed facts from inferences', () => {
    expect(confidenceIsFirm('confirmed')).toBe(true)
    expect(confidenceIsFirm('likely')).toBe(false)
    expect(confidenceIsFirm('inferred')).toBe(false)
  })

  it('formats a finding location as file:line, or null when absent', () => {
    expect(findingLocationLabel({ file: 'src/a.ts', line: 12 })).toBe('src/a.ts:12')
    expect(findingLocationLabel({ file: 'src/a.ts' })).toBe('src/a.ts')
    expect(findingLocationLabel(undefined)).toBeNull()
  })

  it('cleans filters: drops empties and enforces module/pathPrefix exclusivity', () => {
    expect(cleanAuditFilters({ severity: 'critical', category: '  ', status: '' })).toEqual({ severity: 'critical' })
    expect(cleanAuditFilters({ module: 'cli', pathPrefix: 'packages/cli' })).toEqual({ module: 'cli' })
    expect(cleanAuditFilters({ pathPrefix: 'packages/cli' })).toEqual({ pathPrefix: 'packages/cli' })
  })

  it('detects whether any filter is active', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(hasActiveFilters({ severity: '' })).toBe(false)
    expect(hasActiveFilters({ severity: 'high' })).toBe(true)
  })
})

// WI-105 (AUD-ADMIN-C6) — remediation / Work Item linking logic.
describe('remediation linking (WI-105)', () => {
  it('builds a link request that always carries explicit confirmation', () => {
    expect(buildAuditLinkInput('AUD-001', 'AF-abc', 'WI-5', 'rev')).toEqual({
      runId: 'AUD-001', findingId: 'AF-abc', workItemId: 'WI-5', expectedRevision: 'rev', confirmed: true,
    })
  })

  it('accepts only canonical Work Item ids', () => {
    expect(isValidWorkItemId('WI-42')).toBe(true)
    expect(isValidWorkItemId('  WI-42  ')).toBe(true)
    expect(isValidWorkItemId('wi-42')).toBe(false)
    expect(isValidWorkItemId('WI')).toBe(false)
    expect(isValidWorkItemId('')).toBe(false)
  })

  it('detects a stale-revision conflict distinctly from other errors', () => {
    expect(isRevisionConflict({ code: 'WORK_ITEM_CONFLICT' })).toBe(true)
    expect(isRevisionConflict({ code: 'WORK_ITEM_NOT_FOUND' })).toBe(false)
    expect(isRevisionConflict(new Error('boom'))).toBe(false)
  })

  it('exposes the remediation component and plan/link api methods', async () => {
    const comp = await import('../src/components/AuditRemediation')
    const apiMod = await import('../src/lib/api')
    expect(typeof comp.AuditRemediation).toBe('function')
    expect(typeof apiMod.api.getAuditPlan).toBe('function')
    expect(typeof apiMod.api.linkAuditFinding).toBe('function')
  })
})
