import { describe, it, expect } from 'vitest'
import { buildAuditRun, stableFindingId, type AuditFinding, type AuditRun } from '../src/core/audit.js'
import { compareAuditRuns } from '../src/core/audit-compare.js'
import { writeAuditRun } from '../src/core/audit.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const finding = (name: string): AuditFinding => ({ id: stableFindingId({ category: 'types', fingerprint: name }), category: 'types', title: name, description: '', location: { file: 'src/a.ts' }, evidence: name, provenance: 'tsc', severity: 'high', confidence: 'confirmed', recommendation: 'fix', status: 'open', references: {} })
const run = (id: string, findings: AuditFinding[]): AuditRun => buildAuditRun({ id, createdAt: '2026-01-01', scope: { kind: 'project' }, tools: [{ name: 'tsc', status: 'ok', version: '1' }], evaluated: ['src/a.ts'], findings })

describe('audit comparison', () => {
  it('classifies stable identities and records persistent changes deterministically', () => {
    const a = finding('a'), b = finding('b'), c = finding('c')
    const before = run('AUD-001', [a, b, b]), after = run('AUD-002', [{ ...b, severity: 'low', confidence: 'inferred', status: 'resolved', evidence: 'changed' }, c])
    const snapshot = JSON.stringify([before, after]); const result = compareAuditRuns(before, after)
    expect(result.entries.find(e => e.id === a.id)?.classification).toBe('resolved')
    expect(result.entries.find(e => e.id === b.id)).toMatchObject({ classification: 'persistent', changes: ['severity', 'confidence', 'status', 'evidence'], before: b, after: after.findings[0] })
    expect(result.entries.find(e => e.id === c.id)?.classification).toBe('new')
    expect(result.entries).toHaveLength(3)
    expect(JSON.stringify([before, after])).toBe(snapshot)
    expect(compareAuditRuns(before, after)).toEqual(result)
  })
  it('never claims resolution with partial, different or unknown coverage', () => {
    const before = run('AUD-001', [finding('a')]); const after = run('AUD-002', [])
    const partial = { ...after, status: 'partial' as const, coverage: { ...after.coverage, complete: false } }
    const scoped = { ...after, scope: { kind: 'paths' as const, paths: ['src'] } }
    const missing = { ...after, tools: [] }
    const generic = { ...after, coverage: { ...after.coverage, evaluated: ['types'] } }
    const differentVersion = { ...after, tools: [{ name: 'tsc', version: '2', status: 'ok' as const }] }
    const unknownVersion = { ...after, tools: [{ name: 'tsc', status: 'ok' as const }] }
    for (const candidate of [partial, scoped, missing, generic, differentVersion, unknownVersion]) expect(compareAuditRuns(before, candidate).entries[0].classification).toBe('unverifiable')
    expect(compareAuditRuns(partial, before).entries[0].classification).toBe('unverifiable')
    expect(compareAuditRuns(before, before).entries[0].classification).toBe('persistent')
  })
  it('handles historical missing optional coverage conservatively and reports duplicate IDs', () => {
    const a = finding('historical')
    const before = run('AUD-001', [a])
    const historical = { ...run('AUD-002', []), coverage: undefined, tools: undefined } as unknown as AuditRun
    const result = compareAuditRuns(before, historical)
    expect(result.entries[0].classification).toBe('unverifiable')
    expect(result.warnings.join(' ')).toMatch(/coverage/i)
    const duplicated = { ...before, findings: [a, a] }
    expect(compareAuditRuns(duplicated, before).warnings.join(' ')).toMatch(/duplicate/i)
  })
  it('compares persisted audits through the CLI without writing and rejects invalid IDs', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-compare-'))
    try {
      const first = writeAuditRun(dir, run('AUD-001', [finding('a')]))
      const second = writeAuditRun(dir, run('AUD-002', []))
      const original = [fs.readFileSync(first, 'utf8'), fs.readFileSync(second, 'utf8')]
      const cli = fileURLToPath(new URL('../dist/index.js', import.meta.url))
      const execute = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8' })
      const result = execute(['audit', 'compare', 'AUD-001', 'AUD-002', '--json'])
      expect(result.status, result.stderr).toBe(0)
      expect(JSON.parse(result.stdout).entries[0].classification).toBe('resolved')
      expect(execute(['audit', 'compare', '../AUD-001', 'AUD-002']).status).not.toBe(0)
      expect(execute(['audit', 'compare', 'AUD-999', 'AUD-002']).status).not.toBe(0)
      expect(execute(['audit', 'compare', 'AUD-001']).status).not.toBe(0)
      expect(execute(['audit', 'compare', 'AUD-001', 'AUD-001']).stdout).toContain('persistent')
      expect([fs.readFileSync(first, 'utf8'), fs.readFileSync(second, 'utf8')]).toEqual(original)
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  })
})
