import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  stableFindingId, dedupeFindings, buildAuditRun, serializeAuditRun, parseAuditRun,
  nextAuditRunId, writeAuditRun, readAuditRun,
  type AuditFinding,
} from '../src/core/audit.js'

// WI-090 (EP-001/INI-001, AUD-C1) — the AuditRun/AuditFinding contract: stable ids, dedup, deterministic
// serialization and honest defaults (open status, independent severity/confidence, partial coverage).

function finding(over: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: over.id ?? stableFindingId({ category: 'deps', location: { file: 'a.ts' }, fingerprint: 'CVE-1' }),
    category: 'deps', title: 'Vulnerable dependency', description: 'x', evidence: 'advisory', provenance: 'npm-audit',
    severity: 'high', confidence: 'inferred', recommendation: 'upgrade', status: 'open', references: {}, ...over,
  }
}

describe('audit contract (WI-090)', () => {
  it('a finding id is stable across runs for the same identity, and differs for a different fingerprint (AC-03)', () => {
    const a = stableFindingId({ category: 'deps', location: { file: 'src/a.ts', line: 3 }, fingerprint: 'CVE-2024-1' })
    const b = stableFindingId({ category: 'deps', location: { file: 'src/a.ts', line: 3 }, fingerprint: 'CVE-2024-1' })
    const c = stableFindingId({ category: 'deps', location: { file: 'src/a.ts', line: 3 }, fingerprint: 'CVE-2024-2' })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toMatch(/^AF-[0-9a-f]{16}$/)
  })

  it('path separators do not change the id (cross-platform stability)', () => {
    expect(stableFindingId({ category: 'deps', location: { file: 'src\\a.ts' }, fingerprint: 'f' }))
      .toBe(stableFindingId({ category: 'deps', location: { file: 'src/a.ts' }, fingerprint: 'f' }))
  })

  it('dedupeFindings keeps one entry per stable id, preserving order (AC-03)', () => {
    const f = finding()
    expect(dedupeFindings([f, { ...f }, finding({ id: 'AF-other' })]).map((x) => x.id)).toEqual([f.id, 'AF-other'])
  })

  it('a failed tool makes the run partial with incomplete coverage, never a clean result (AC-07)', () => {
    const run = buildAuditRun({
      id: 'AUD-001', createdAt: '2026-11-26T00:00:00Z', scope: { kind: 'project' },
      tools: [{ name: 'eslint', status: 'ok' }, { name: 'semgrep', status: 'failed', reason: 'timeout' }],
      findings: [],
    })
    expect(run.status).toBe('partial')
    expect(run.coverage.complete).toBe(false)
    expect(run.coverage.notEvaluated.join(' ')).toMatch(/semgrep.*failed.*timeout/)
  })

  it('all tools failing makes the run failed; all ok makes it completed', () => {
    expect(buildAuditRun({ id: 'A', createdAt: 't', scope: { kind: 'project' }, tools: [{ name: 'x', status: 'failed' }], findings: [] }).status).toBe('failed')
    expect(buildAuditRun({ id: 'A', createdAt: 't', scope: { kind: 'project' }, tools: [{ name: 'x', status: 'ok' }], findings: [] }).status).toBe('completed')
  })

  it('severity and confidence are independent, and a finding defaults to open (AC-06)', () => {
    const run = buildAuditRun({
      id: 'AUD-001', createdAt: 't', scope: { kind: 'project' }, tools: [{ name: 'x', status: 'ok' }],
      findings: [finding({ severity: 'critical', confidence: 'inferred', status: undefined as never })],
    })
    expect(run.findings[0].severity).toBe('critical')
    expect(run.findings[0].confidence).toBe('inferred')
    expect(run.findings[0].status).toBe('open')
  })

  it('serialization round-trips deterministically (AC-05)', () => {
    const run = buildAuditRun({ id: 'AUD-001', createdAt: 't', scope: { kind: 'module', modules: ['cli'] }, tools: [{ name: 'x', status: 'ok' }], findings: [finding()] })
    const json = serializeAuditRun(run)
    expect(serializeAuditRun(parseAuditRun(json))).toBe(json)
    expect(parseAuditRun(json)).toEqual(run)
  })

  it('persists under .kaddo/audits/ and reads back; ids are monotonic (AC-05)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-audit-'))
    try {
      expect(nextAuditRunId(dir)).toBe('AUD-001')
      const run = buildAuditRun({ id: 'AUD-001', createdAt: 't', scope: { kind: 'project' }, tools: [], findings: [finding()] })
      const file = writeAuditRun(dir, run)
      expect(file.replace(/\\/g, '/')).toMatch(/\.kaddo\/audits\/AUD-001\.json$/)
      expect(readAuditRun(dir, 'AUD-001')).toEqual(run)
      expect(nextAuditRunId(dir)).toBe('AUD-002')
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  })
})
