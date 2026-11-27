import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { performAuditReport } from '../src/commands/audit.js'
import { listAuditRuns, queryAuditFindings } from '../src/core/audit-query.js'
import { buildAuditRun, writeAuditRun, stableFindingId, type AuditFinding } from '../src/core/audit.js'

// WI-098 (EP-001/INI-001, AUD-C9) — kaddo audit report: read-only query over persisted runs. Pure filtering
// (listAuditRuns + queryAuditFindings) and the command action, tested with fixture runs. Never writes.

let dir: string

function finding(over: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: over.id ?? stableFindingId({ category: over.category ?? 'deps', location: over.location, fingerprint: over.title ?? 'f' }),
    category: 'deps', title: 'x', description: 'd', evidence: 'e', provenance: 'p',
    severity: 'high', confidence: 'confirmed', recommendation: 'fix', status: 'open', references: {}, ...over,
  }
}

function persist(id: string, findings: AuditFinding[]) {
  const run = buildAuditRun({ id, createdAt: `2026-11-26T00:00:0${id.slice(-1)}Z`, scope: { kind: 'project' }, tools: [{ name: 'x', status: 'ok' }], findings })
  writeAuditRun(dir, run)
  return run
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-report-')) })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('kaddo audit report (WI-098)', () => {
  it('--list returns persisted run summaries in deterministic order (AC-01)', () => {
    persist('AUD-001', [finding()])
    persist('AUD-002', [finding({ confidence: 'inferred' }), finding({ id: 'AF-x' })])
    const res = performAuditReport({ list: true }, { dir })
    expect(res.kind).toBe('list')
    if (res.kind !== 'list') return
    expect(res.runs.map((r) => r.id)).toEqual(['AUD-001', 'AUD-002'])
    expect(res.runs[1]).toMatchObject({ total: 2, confirmed: 1, inferences: 1, status: 'completed' })
  })

  it('shows the latest run by default and a specific run by id (AC-02)', () => {
    persist('AUD-001', [finding()])
    persist('AUD-002', [finding({ id: 'AF-newer' })])
    const latest = performAuditReport({}, { dir })
    expect(latest.kind === 'run' && latest.run.id).toBe('AUD-002')
    const byId = performAuditReport({ id: 'AUD-001' }, { dir })
    expect(byId.kind === 'run' && byId.run.id).toBe('AUD-001')
  })

  it('queryAuditFindings filters OR within a dimension, AND across dimensions (AC-03)', () => {
    const findings = [
      finding({ id: 'a', severity: 'critical', category: 'deps' }),
      finding({ id: 'b', severity: 'low', category: 'deps' }),
      finding({ id: 'c', severity: 'critical', category: 'types' }),
    ]
    // severity in {critical} AND category in {deps} → only 'a'
    expect(queryAuditFindings(findings, { severity: ['critical'], category: ['deps'] }).map((f) => f.id)).toEqual(['a'])
    // severity in {critical, low} → a, b, c
    expect(queryAuditFindings(findings, { severity: ['critical', 'low'] }).map((f) => f.id)).toEqual(['a', 'b', 'c'])
  })

  it('--module filters findings by resolved module path prefix (AC-04)', () => {
    fs.mkdirSync(path.join(dir, 'packages', 'cli'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
    fs.writeFileSync(path.join(dir, 'packages', 'cli', 'package.json'), '{"name":"@kaddo/cli"}')
    persist('AUD-001', [
      finding({ id: 'in', location: { file: 'packages/cli/src/a.ts', line: 1 } }),
      finding({ id: 'out', location: { file: 'packages/admin/src/b.ts', line: 1 } }),
    ])
    const res = performAuditReport({ module: ['cli'] }, { dir })
    expect(res.kind === 'run' && res.findings.map((f) => f.id)).toEqual(['in'])
  })

  it('--severity/--category/--confidence filter the shown findings (AC-05)', () => {
    persist('AUD-001', [
      finding({ id: 'crit', severity: 'critical' }),
      finding({ id: 'low', severity: 'low', confidence: 'inferred' }),
    ])
    const res = performAuditReport({ severity: 'critical' }, { dir })
    expect(res.kind === 'run' && res.findings.map((f) => f.id)).toEqual(['crit'])
  })

  it('is read-only and errors clearly on a missing id, writing nothing (AC-07)', () => {
    persist('AUD-001', [finding()])
    const before = fs.readdirSync(path.join(dir, '.kaddo', 'audits')).sort()
    expect(() => performAuditReport({ id: 'AUD-999' }, { dir })).toThrow(/Audit "AUD-999" not found/)
    expect(fs.readdirSync(path.join(dir, '.kaddo', 'audits')).sort()).toEqual(before)
  })

  it('no audits at all → a clear error (AC-07)', () => {
    expect(() => performAuditReport({}, { dir })).toThrow(/No audits found/)
    expect(listAuditRuns(dir)).toEqual([])
  })

  it('an invalid filter value is rejected (AC-09)', () => {
    persist('AUD-001', [finding()])
    expect(() => performAuditReport({ severity: 'nope' }, { dir })).toThrow(/Invalid severity "nope"/)
  })

  it('exports listAuditRuns and queryAuditFindings from the Core barrel (AC-08)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.listAuditRuns).toBe('function')
    expect(typeof core.queryAuditFindings).toBe('function')
  })
})
