import { describe, it, expect } from 'vitest'
import { runAudit, type Analyzer } from '../src/core/audit-orchestrator.js'
import { serializeAuditRun, stableFindingId, type AuditFinding } from '../src/core/audit.js'

// WI-092 (EP-001/INI-001, AUD-C4) — the analysis orchestrator: runs analyzer adapters, isolates failures
// (failed tool → partial coverage, never a clean result), preserves analyzer severity/confidence/provenance,
// and assembles an AuditRun via the WI-090 contract. Tested with STUB analyzers — no real tools.

function finding(over: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: over.id ?? stableFindingId({ category: 'deps', location: { file: 'a.ts' }, fingerprint: over.title ?? 'CVE-1' }),
    category: 'deps', title: 'Vulnerable dependency', description: 'x', evidence: 'advisory', provenance: 'stub',
    severity: 'high', confidence: 'inferred', recommendation: 'upgrade', status: 'open', references: {}, ...over,
  }
}

function okAnalyzer(name: string, findings: AuditFinding[], extra: Partial<Analyzer> = {}): Analyzer {
  return { name, run: () => ({ findings }), ...extra }
}

const ctx = { dir: '/x', scope: { kind: 'project' as const } }
const base = { id: 'AUD-001', createdAt: '2026-11-26T00:00:00Z', scope: { kind: 'project' as const }, context: ctx }

describe('audit orchestrator (WI-092)', () => {
  it('all analyzers ok → completed run assembled via the contract (AC-02)', async () => {
    const run = await runAudit({ ...base, analyzers: [okAnalyzer('eslint', [finding()]), okAnalyzer('semgrep', [])] })
    expect(run.status).toBe('completed')
    expect(run.coverage.complete).toBe(true)
    expect(run.tools.map((t) => t.status)).toEqual(['ok', 'ok'])
    expect(run.findings).toHaveLength(1)
  })

  it('a throwing analyzer is isolated: failed tool, partial run, others still run (AC-03/AC-04)', async () => {
    const throwing: Analyzer = { name: 'semgrep', version: '1.2', run: () => { throw new Error('boom') } }
    const run = await runAudit({ ...base, analyzers: [okAnalyzer('eslint', [finding()]), throwing, okAnalyzer('tsc', [finding({ title: 'other', id: 'AF-z' })])] })
    expect(run.status).toBe('partial')
    expect(run.coverage.complete).toBe(false)
    const failed = run.tools.find((t) => t.name === 'semgrep')
    expect(failed).toMatchObject({ status: 'failed', reason: 'boom', version: '1.2' })
    expect(run.coverage.notEvaluated.join(' ')).toMatch(/semgrep.*failed.*boom/)
    // The analyzers before and after the failing one still contributed their findings.
    expect(run.findings.map((f) => f.id).sort()).toEqual(['AF-z', finding().id].sort())
  })

  it('a rejecting (async) analyzer is also isolated (AC-03)', async () => {
    const rejecting: Analyzer = { name: 'audit', run: async () => { throw new Error('network down') } }
    const run = await runAudit({ ...base, analyzers: [rejecting] })
    expect(run.status).toBe('failed')
    expect(run.tools[0]).toMatchObject({ name: 'audit', status: 'failed', reason: 'network down' })
  })

  it('all analyzers failing → failed run (AC-04)', async () => {
    const bad = (name: string): Analyzer => ({ name, run: () => { throw new Error('x') } })
    const run = await runAudit({ ...base, analyzers: [bad('a'), bad('b')] })
    expect(run.status).toBe('failed')
    expect(run.coverage.complete).toBe(false)
  })

  it('a skipped analyzer makes the run partial without being a failure (AC-04)', async () => {
    const skipped: Analyzer = { name: 'semgrep', run: () => ({ findings: [], status: 'skipped', reason: 'not installed' }) }
    const run = await runAudit({ ...base, analyzers: [okAnalyzer('eslint', [finding()]), skipped] })
    expect(run.status).toBe('partial')
    expect(run.tools.find((t) => t.name === 'semgrep')).toMatchObject({ status: 'skipped', reason: 'not installed' })
  })

  it('findings from different analyzers are deduplicated by stable id (AC-02)', async () => {
    const shared = finding()
    const run = await runAudit({ ...base, analyzers: [okAnalyzer('a', [shared]), okAnalyzer('b', [{ ...shared }])] })
    expect(run.findings).toHaveLength(1)
  })

  it('does not reclassify: severity, confidence and provenance pass through unchanged (AC-05/AC-06)', async () => {
    const f = finding({ severity: 'critical', confidence: 'inferred', provenance: 'eslint-plugin-x' })
    const run = await runAudit({ ...base, analyzers: [okAnalyzer('eslint', [f])] })
    expect(run.findings[0]).toMatchObject({ severity: 'critical', confidence: 'inferred', provenance: 'eslint-plugin-x' })
    // The run lists the tool with its name/version and outcome.
    expect(run.tools[0]).toMatchObject({ name: 'eslint', status: 'ok' })
  })

  it('does not mutate analyzer-provided inputs (AC-08)', async () => {
    const findings = [finding()]
    const analyzers = [okAnalyzer('eslint', findings)]
    await runAudit({ ...base, analyzers })
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('high')
  })

  it('is deterministic for the same analyzers and context, and round-trips (AC-07)', async () => {
    const mk = () => [okAnalyzer('eslint', [finding()]), okAnalyzer('semgrep', [finding({ title: 'b', id: 'AF-b' })])]
    const a = await runAudit({ ...base, analyzers: mk() })
    const b = await runAudit({ ...base, analyzers: mk() })
    expect(serializeAuditRun(a)).toBe(serializeAuditRun(b))
    expect(serializeAuditRun(a)).toContain('"status": "completed"')
  })

  it('is exported from the Core barrel (AC-09)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.runAudit).toBe('function')
  })
})
