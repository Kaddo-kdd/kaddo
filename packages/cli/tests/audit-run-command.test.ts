import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { performAuditRun, type AuditRunDeps } from '../src/commands/audit.js'
import type { CommandRunner, CommandResult } from '../src/core/audit-analyzers.js'

// WI-097 (EP-001/INI-001, AUD-C8) — the `kaddo audit run` pipeline, tested via performAuditRun with injected
// deps (command runner, confirm, clock, id). No real processes spawned; a temp dir stands in for the repo.

let dir: string

function write(rel: string, content: string) {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function fixtureRepo() {
  write('pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n')
  write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
  write('tsconfig.json', '{}')
  write('package.json', JSON.stringify({ name: 'root' }))
  write('packages/cli/package.json', JSON.stringify({ name: '@kaddo/cli' }))
  write('packages/admin/package.json', JSON.stringify({ name: '@kaddo/admin' }))
}

const AUDIT_JSON = JSON.stringify({
  advisories: { '1': { id: 1, module_name: 'minimist', severity: 'critical', title: 'Proto Pollution', url: 'u' } },
})

/** Stub runner: pnpm audit returns advisories; tsc returns one diagnostic. */
function okRunner(): CommandRunner {
  return async (command) => {
    if (command === 'tsc') return { stdout: 'packages/cli/src/a.ts(1,1): error TS1005: oops.', stderr: '', exitCode: 1 }
    return { stdout: AUDIT_JSON, stderr: '', exitCode: 1 } // pnpm audit: exit!=0 but valid
  }
}

function deps(over: Partial<AuditRunDeps> = {}): AuditRunDeps {
  return {
    dir, run: okRunner(), confirm: async () => false, createdAt: '2026-11-26T00:00:00Z',
    idFor: () => 'AUD-001', hasTty: false, packageManager: 'pnpm', ...over,
  }
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-auditrun-')); fixtureRepo() })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('kaddo audit run (WI-097)', () => {
  it('runs the full pipeline and writes derived artifacts under .kaddo/audits (AC-01/AC-04)', async () => {
    const res = await performAuditRun({}, deps())
    expect(res.run.id).toBe('AUD-001')
    expect(res.run.findings.length).toBeGreaterThanOrEqual(2) // dependency + tsc
    expect(res.jsonPath.replace(/\\/g, '/')).toMatch(/\.kaddo\/audits\/AUD-001\.json$/)
    expect(fs.existsSync(res.reportPath)).toBe(true)
    expect(fs.readFileSync(res.reportPath, 'utf8')).toMatch(/# Audit Report — AUD-001/)
    // No canonical knowledge written by default.
    expect(fs.existsSync(path.join(dir, 'knowledge', 'tech', 'audits'))).toBe(false)
    expect(res.publishedPath).toBeUndefined()
  })

  it('--module selects scope and an unknown module throws before running (AC-02)', async () => {
    const scoped = await performAuditRun({ module: ['cli'] }, deps())
    expect(scoped.run.scope).toEqual({ kind: 'module', modules: ['@kaddo/cli'] })
    await expect(performAuditRun({ module: ['nope'] }, deps())).rejects.toThrow(/Unknown module "nope"/)
  })

  it('correlates inline so the report can carry references (AC-03)', async () => {
    // A Work Item whose code globs cover the finding's file → correlated into the report.
    write('knowledge/delivery/work-items/ready/WI-010.md',
      '---\ntype: feature\nid: WI-010\ntitle: X\nstatus: ready\ncode:\n  - "packages/cli/**"\n---\n\n# X\n')
    const res = await performAuditRun({}, deps())
    expect(res.report).toMatch(/WIs: WI-010/)
  })

  it('--publish writes the canonical report only after confirmation (AC-06)', async () => {
    const declined = await performAuditRun({ publish: true }, deps({ hasTty: true, confirm: async () => false }))
    expect(declined.publishedPath).toBeUndefined()
    expect(fs.existsSync(path.join(dir, 'knowledge', 'tech', 'audits'))).toBe(false)

    const approved = await performAuditRun({ publish: true }, deps({ hasTty: true, confirm: async () => true }))
    expect(approved.publishedPath?.replace(/\\/g, '/')).toMatch(/knowledge\/tech\/audits\/AUD-001\.md$/)
    expect(fs.existsSync(approved.publishedPath!)).toBe(true)
  })

  it('--publish with --yes skips the prompt; without a TTY and without --yes it does not publish (AC-06)', async () => {
    const yes = await performAuditRun({ publish: true, yes: true }, deps({ hasTty: false }))
    expect(yes.publishedPath).toBeDefined()

    const noTty = await performAuditRun({ publish: true }, deps({ hasTty: false }))
    expect(noTty.publishedPath).toBeUndefined()
  })

  it('a missing tool yields partial coverage, never a clean result (AC-07)', async () => {
    const brokenTsc: CommandResult = { stdout: '', stderr: 'tsc: not found', exitCode: 127 }
    const runner: CommandRunner = async (cmd) => (cmd === 'tsc' ? brokenTsc : { stdout: AUDIT_JSON, stderr: '', exitCode: 1 })
    const res = await performAuditRun({}, deps({ run: runner }))
    expect(res.run.status).toBe('partial')
    expect(res.run.coverage.complete).toBe(false)
    expect(res.run.coverage.notEvaluated.join(' ')).toMatch(/tsc.*failed/)
  })

  it('persists a deterministic AuditRun JSON that round-trips with the report (AC-04)', async () => {
    const res = await performAuditRun({}, deps())
    const json = JSON.parse(fs.readFileSync(res.jsonPath, 'utf8'))
    expect(json.id).toBe('AUD-001')
    expect(json.status).toBe('completed')
  })
})
