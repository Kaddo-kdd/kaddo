import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderAuditReport, writeAuditArtifacts } from '../src/core/audit-report.js'
import { buildAuditRun, stableFindingId, type AuditFinding } from '../src/core/audit.js'
import type { CorrelatedFinding } from '../src/core/audit-correlation.js'

// WI-095 (EP-001/INI-001, AUD-C7) — the Report step: a pure, deterministic Markdown renderer that separates
// confirmed / inferences / not-evaluated, plus derived-artifact persistence under .kaddo/audits.

function finding(over: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: over.id ?? stableFindingId({ category: 'types', location: over.location, fingerprint: over.title ?? 'f' }),
    category: 'types', title: 'Issue', description: 'd', evidence: 'the evidence', provenance: 'tsc',
    severity: 'high', confidence: 'confirmed', recommendation: 'fix it', status: 'open', references: {}, ...over,
  }
}

function run(findings: AuditFinding[], tools = [{ name: 'tsc', status: 'ok' as const }]) {
  return buildAuditRun({ id: 'AUD-001', createdAt: '2026-11-26T00:00:00Z', scope: { kind: 'project' }, tools, findings })
}

describe('audit report (WI-095)', () => {
  it('renders a header with id, date, scope and status (AC-01)', () => {
    const md = renderAuditReport(run([finding()]))
    expect(md).toMatch(/^# Audit Report — AUD-001/)
    expect(md).toMatch(/- \*\*Date:\*\* 2026-11-26T00:00:00Z/)
    expect(md).toMatch(/- \*\*Scope:\*\* project/)
    expect(md).toMatch(/- \*\*Status:\*\* completed/)
  })

  it('separates confirmed findings from inferences into distinct sections (AC-02)', () => {
    const md = renderAuditReport(run([
      finding({ id: 'AF-c', title: 'Confirmed one', confidence: 'confirmed' }),
      finding({ id: 'AF-i', title: 'Inferred one', confidence: 'inferred' }),
    ]))
    const confirmedIdx = md.indexOf('## Confirmed findings')
    const inferencesIdx = md.indexOf('## Inferences')
    expect(confirmedIdx).toBeGreaterThan(-1)
    expect(inferencesIdx).toBeGreaterThan(confirmedIdx)
    // Confirmed one appears in the confirmed section, inferred one after the Inferences heading.
    expect(md.indexOf('Confirmed one')).toBeGreaterThan(confirmedIdx)
    expect(md.indexOf('Confirmed one')).toBeLessThan(inferencesIdx)
    expect(md.indexOf('Inferred one')).toBeGreaterThan(inferencesIdx)
  })

  it('renders each finding with evidence, provenance, location and recommendation (AC-03)', () => {
    const md = renderAuditReport(run([finding({ location: { file: 'src/a.ts', line: 12 } })]))
    expect(md).toMatch(/\*\*Evidence:\*\* the evidence/)
    expect(md).toMatch(/\*\*Provenance:\*\* tsc/)
    expect(md).toMatch(/`src\/a\.ts:12`/)
    expect(md).toMatch(/\*\*Recommendation:\*\* fix it/)
  })

  it('includes correlation (references, owners, risks, matchStrength) when provided (AC-04)', () => {
    const base = finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })
    const correlated: CorrelatedFinding[] = [{
      ...base,
      references: { workItems: ['WI-050'], adrs: ['ADR-003'], capabilities: ['audit-core'] },
      correlation: { owners: [{ domain: 'Tech', owners: ['alice'] }], risks: ['RISK-001'], matchStrength: 'exact', notes: [] },
    }]
    const md = renderAuditReport(run([base]), correlated)
    expect(md).toMatch(/\*\*References:\*\* WIs: WI-050; ADRs: ADR-003; Capabilities: audit-core/)
    expect(md).toMatch(/\*\*Correlation:\*\* exact/)
    expect(md).toMatch(/\*\*Owners:\*\* Tech → alice/)
    expect(md).toMatch(/\*\*Risks:\*\* RISK-001/)
  })

  it('marks a partial run and lists not-evaluated areas, never a clean result (AC-05)', () => {
    const r = run([finding()], [{ name: 'tsc', status: 'ok' }, { name: 'semgrep', status: 'failed', reason: 'timeout' }])
    const md = renderAuditReport(r)
    expect(md).toMatch(/\*\*Status:\*\* partial — ⚠️ coverage is incomplete/)
    expect(md).toMatch(/## Not evaluated[\s\S]*semgrep.*failed.*timeout/)
  })

  it('is deterministic: the same run renders byte-identical Markdown (AC-06)', () => {
    const r = run([finding({ id: 'AF-b', title: 'b' }), finding({ id: 'AF-a', title: 'a' })])
    expect(renderAuditReport(r)).toBe(renderAuditReport(r))
  })

  it('orders findings by severity then id (AC-07)', () => {
    const md = renderAuditReport(run([
      finding({ id: 'AF-2', title: 'low one', severity: 'low' }),
      finding({ id: 'AF-1', title: 'crit one', severity: 'critical' }),
    ]))
    expect(md.indexOf('crit one')).toBeLessThan(md.indexOf('low one'))
  })

  it('writes derived artifacts (run JSON + report .md) under .kaddo/audits/ (AC-08)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-report-'))
    try {
      const { jsonPath, reportPath } = writeAuditArtifacts(dir, run([finding()]))
      expect(jsonPath.replace(/\\/g, '/')).toMatch(/\.kaddo\/audits\/AUD-001\.json$/)
      expect(reportPath.replace(/\\/g, '/')).toMatch(/\.kaddo\/audits\/AUD-001\.md$/)
      expect(fs.readFileSync(reportPath, 'utf8')).toMatch(/^# Audit Report — AUD-001/)
      expect(JSON.parse(fs.readFileSync(jsonPath, 'utf8')).id).toBe('AUD-001')
      // No canonical knowledge was written.
      expect(fs.existsSync(path.join(dir, 'knowledge'))).toBe(false)
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  })

  it('is exported from the Core barrel (AC-09)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.renderAuditReport).toBe('function')
    expect(typeof core.writeAuditArtifacts).toBe('function')
  })
})
