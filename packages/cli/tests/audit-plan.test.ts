import { describe, expect, it } from 'vitest'
import { buildAuditRun, stableFindingId, type AuditFinding } from '../src/core/audit.js'
import { correlateFindings } from '../src/core/audit-correlation.js'
import { previewAuditPlan } from '../src/core/audit-plan.js'

describe('audit remediation preview', () => {
  it('orders findings, preserves evidence and partial coverage without mutating inputs', () => {
    const finding = (severity: 'low' | 'high'): AuditFinding => ({ id: stableFindingId({ category: 'types', fingerprint: severity }), category: 'types', title: severity, description: '', evidence: 'observed', provenance: 'test', severity, confidence: 'inferred', recommendation: 'review', status: 'open', references: {} })
    const run = buildAuditRun({ id: 'AUD-001', createdAt: '2026-01-01T00:00:00Z', scope: { kind: 'project' }, tools: [{ name: 'tsc', status: 'failed' }], findings: [finding('low'), finding('high')] })
    const before = JSON.stringify(run)
    const correlated = correlateFindings({ findings: run.findings, artifacts: [] })
    const plan = previewAuditPlan(run, correlated)
    expect(plan.coverage.complete).toBe(false)
    expect(plan.actions.map(a => a.severity)).toEqual(['high', 'low'])
    expect(plan.actions[0]).toMatchObject({ evidence: 'observed', confidence: 'inferred', action: 'review' })
    expect(JSON.stringify(run)).toBe(before)
    expect(previewAuditPlan(run, correlated)).toEqual(plan)
  })
})
