import { describe, it, expect } from 'vitest'
import {
  mapSeverity, mapAuditAdvisories, mapTscDiagnostics,
  createDependencyAnalyzer, createTypescriptAnalyzer, type CommandRunner, type CommandResult,
} from '../src/core/audit-analyzers.js'
import { runAudit } from '../src/core/audit-orchestrator.js'

// WI-093 (EP-001/INI-001, AUD-C5) — TypeScript code + dependency analyzers. Tested with a STUB command
// runner over fixture tool output: evidence-backed findings, honest confidence, stable ids, and honest
// partial coverage when a tool is missing/broken (via the WI-092 orchestrator). No real processes spawned.

/** A stub runner that returns a fixed result (optionally per-command). */
function stubRunner(byCommand: Record<string, CommandResult>, fallback?: CommandResult): CommandRunner {
  return async (command) => byCommand[command] ?? fallback ?? { stdout: '', stderr: '', exitCode: 0 }
}

const AUDIT_JSON = JSON.stringify({
  advisories: {
    '1179': { id: 1179, module_name: 'minimist', severity: 'critical', title: 'Prototype Pollution', url: 'https://x/1179', vulnerable_versions: '<1.2.6', recommendation: 'Upgrade to 1.2.6' },
    '755': { id: 755, module_name: 'lodash', severity: 'high', title: 'ReDoS', vulnerable_versions: '<4.17.21' },
  },
})

const ctx = { dir: '/x', scope: { kind: 'project' as const } }
const base = { id: 'AUD-001', createdAt: '2026-11-26T00:00:00Z', scope: { kind: 'project' as const }, context: ctx }

describe('audit analyzers (WI-093)', () => {
  it('maps npm modern advisory records instead of treating vulnerabilities as a clean result', async () => {
    const output = JSON.stringify({ vulnerabilities: { example: { via: [{ source: 123, name: 'example', title: 'Example advisory', severity: 'high', url: 'https://example.test/advisory', range: '<2' }] } } })
    const run = await runAudit({ ...base, analyzers: [createDependencyAnalyzer({ run: stubRunner({ npm: { stdout: output, stderr: '', exitCode: 1 } }), packageManager: 'npm' })] })
    expect(run.findings).toHaveLength(1)
    expect(run.findings[0]).toMatchObject({ severity: 'high', title: 'Example advisory', provenance: 'npm audit' })
  })

  it.each(['{}', '{"error":{"code":"E401"}}', '{"vulnerabilities":{"indirect":{"via":["other"]}}}'])('does not treat unsupported or error JSON as clean: %s', async (stdout) => {
    const run = await runAudit({ ...base, analyzers: [createDependencyAnalyzer({ run: stubRunner({ npm: { stdout, stderr: '', exitCode: 1 } }), packageManager: 'npm' })] })
    expect(run.coverage.complete).toBe(false)
    expect(run.tools[0].status).toBe('failed')
  })

  it('keeps direct advisory evidence but reports partial attribution for indirect npm vulnerabilities', async () => {
    const stdout = JSON.stringify({ vulnerabilities: { direct: { via: [{ source: 123, name: 'direct', title: 'Advisory', severity: 'high' }] }, indirect: { via: ['direct'] } } })
    const run = await runAudit({ ...base, analyzers: [createDependencyAnalyzer({ run: stubRunner({ npm: { stdout, stderr: '', exitCode: 1 } }), packageManager: 'npm' })] })
    expect(run.findings).toHaveLength(1)
    expect(run.coverage.complete).toBe(false)
    expect(run.coverage.notEvaluated).toContain('indirect dependency vulnerability attribution')
  })
  it('maps audit advisories to confirmed findings with evidence and provenance (AC-01/AC-04/AC-05)', () => {
    const findings = mapAuditAdvisories(JSON.parse(AUDIT_JSON), 'pnpm')
    expect(findings).toHaveLength(2)
    const minimist = findings.find((f) => f.title.includes('Prototype'))!
    expect(minimist).toMatchObject({ category: 'dependency', severity: 'critical', confidence: 'confirmed', provenance: 'pnpm audit' })
    expect(minimist.evidence).toMatch(/critical advisory for minimist.*<1\.2\.6.*https:\/\/x\/1179/)
    expect(minimist.id).toMatch(/^AF-[0-9a-f]{16}$/)
  })

  it('maps tsc diagnostics to findings with file:line evidence (AC-02/AC-05)', () => {
    const out = 'src/a.ts(12,5): error TS2345: Argument of type string is not assignable.\nignored line\nsrc/b.ts(3,1): warning TS6133: unused var.'
    const findings = mapTscDiagnostics(out)
    expect(findings).toHaveLength(2)
    expect(findings[0]).toMatchObject({ category: 'types', severity: 'high', confidence: 'confirmed', provenance: 'tsc', location: { file: 'src/a.ts', line: 12 } })
    expect(findings[0].evidence).toMatch(/src\/a\.ts:12:5 error TS2345/)
    expect(findings[1].severity).toBe('low') // warning
  })

  it('maps severity honestly and defaults unknown to info, never upgraded (AC-04)', () => {
    expect(['critical', 'high', 'medium', 'medium', 'low', 'info'].join()).toBe(
      [mapSeverity('critical'), mapSeverity('HIGH'), mapSeverity('moderate'), mapSeverity('medium'), mapSeverity('low'), mapSeverity('weird')].join(),
    )
  })

  it('dependency analyzer: exit!=0 with valid JSON (vulns found) is NOT a failure (AC-07)', async () => {
    const analyzer = createDependencyAnalyzer({ run: stubRunner({ pnpm: { stdout: AUDIT_JSON, stderr: '', exitCode: 1 } }), packageManager: 'pnpm' })
    const run = await runAudit({ ...base, analyzers: [analyzer] })
    expect(run.status).toBe('completed')
    expect(run.findings).toHaveLength(2)
    expect(run.tools[0]).toMatchObject({ name: 'pnpm audit', status: 'ok' })
  })

  it('dependency analyzer: unparseable output (missing/broken tool) → partial coverage (AC-07/AC-08)', async () => {
    const analyzer = createDependencyAnalyzer({ run: stubRunner({ pnpm: { stdout: '', stderr: 'command not found', exitCode: 127 } }), packageManager: 'pnpm' })
    const run = await runAudit({ ...base, analyzers: [analyzer] })
    expect(run.status).toBe('failed') // the only analyzer failed
    expect(run.coverage.complete).toBe(false)
    expect(run.coverage.notEvaluated.join(' ')).toMatch(/pnpm audit.*failed/)
  })

  it('tsc analyzer: errors found (exit 1 with diagnostics) → ok (AC-02/AC-07)', async () => {
    const out = 'src/a.ts(12,5): error TS2345: bad.'
    const analyzer = createTypescriptAnalyzer({ run: stubRunner({ tsc: { stdout: out, stderr: '', exitCode: 1 } }) })
    const run = await runAudit({ ...base, analyzers: [analyzer] })
    expect(run.status).toBe('completed')
    expect(run.findings[0].category).toBe('types')
  })

  it('tsc analyzer: exit 1 with no diagnostics (tool failure) → partial (AC-07)', async () => {
    const analyzer = createTypescriptAnalyzer({ run: stubRunner({ tsc: { stdout: '', stderr: "error TS18003: No inputs were found", exitCode: 1 } }) })
    const run = await runAudit({ ...base, analyzers: [analyzer] })
    expect(run.status).toBe('failed')
    expect(run.tools[0]).toMatchObject({ name: 'tsc', status: 'failed' })
  })

  it('finding ids are stable so the same advisory dedupes across runs (AC-06)', () => {
    const a = mapAuditAdvisories(JSON.parse(AUDIT_JSON), 'pnpm')
    const b = mapAuditAdvisories(JSON.parse(AUDIT_JSON), 'pnpm')
    expect(a.map((f) => f.id)).toEqual(b.map((f) => f.id))
  })

  it('both analyzers plug into runAudit and produce an AuditRun with findings and tools (AC-08)', async () => {
    const run = await runAudit({
      ...base,
      analyzers: [
        createDependencyAnalyzer({ run: stubRunner({ pnpm: { stdout: AUDIT_JSON, stderr: '', exitCode: 1 } }), packageManager: 'pnpm' }),
        createTypescriptAnalyzer({ run: stubRunner({ tsc: { stdout: 'src/a.ts(1,1): error TS1005: oops.', stderr: '', exitCode: 1 } }) }),
      ],
    })
    expect(run.status).toBe('completed')
    expect(run.tools.map((t) => t.name).sort()).toEqual(['pnpm audit', 'tsc'])
    expect(run.findings.map((f) => f.category).sort()).toEqual(['dependency', 'dependency', 'types'])
    // Every finding carries evidence and provenance (AC-05).
    expect(run.findings.every((f) => f.evidence.length > 0 && f.provenance.length > 0)).toBe(true)
  })

  it('a missing tool (runner rejects) is isolated as partial coverage (AC-07)', async () => {
    const rejecting: CommandRunner = async () => { throw Object.assign(new Error('spawn tsc ENOENT'), { code: 'ENOENT' }) }
    const run = await runAudit({ ...base, analyzers: [createTypescriptAnalyzer({ run: rejecting })] })
    expect(run.status).toBe('failed')
    expect(run.tools[0]).toMatchObject({ name: 'tsc', status: 'failed', reason: expect.stringContaining('ENOENT') })
  })

  it('is exported from the Core barrel (AC-09)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.createDependencyAnalyzer).toBe('function')
    expect(typeof core.createTypescriptAnalyzer).toBe('function')
    expect(typeof core.mapAuditAdvisories).toBe('function')
  })
})
