import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildAuditRun, stableFindingId, writeAuditRun, type AuditFinding } from '../src/core/audit.js'
import { createWorkItem, getWorkItemForEdit, linkAuditFinding } from '../src/core/work-item-write.js'
import { discoverKnowledge } from '../src/services/knowledge-artifacts.js'
import { correlateFindings } from '../src/core/audit-correlation.js'
import { renderAuditReport } from '../src/core/audit-report.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }) })

describe('approved audit finding links', () => {
  it('persists one stable link and rejects unapproved, stale and missing references', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-audit-link-')); dirs.push(dir)
    const id = stableFindingId({ category: 'types', fingerprint: 'rule' })
    const finding: AuditFinding = { id, category: 'types', title: 'test', description: '', evidence: 'e', provenance: 'test', severity: 'low', confidence: 'confirmed', recommendation: 'fix', status: 'open', references: {} }
    writeAuditRun(dir, buildAuditRun({ id: 'AUD-001', createdAt: '2026-01-01T00:00:00Z', scope: { kind: 'project' }, tools: [], findings: [finding] }))
    const wi = createWorkItem(dir, { intent: 'fix issue', type: 'feature' })
    const edit = getWorkItemForEdit(dir, wi.id)
    const request = { runId: 'AUD-001', findingId: id, workItemId: wi.id, expectedRevision: edit.revision, confirmed: true }
    const before = fs.readFileSync(path.join(dir, wi.path), 'utf8')
    expect(() => linkAuditFinding(dir, { ...request, confirmed: false })).toThrow(/confirmation/i)
    expect(() => linkAuditFinding(dir, { ...request, findingId: 'AF-0000000000000000' })).toThrow(/not found/i)
    expect(() => linkAuditFinding(dir, { ...request, runId: '../AUD-001' })).toThrow(/invalid/i)
    expect(fs.readFileSync(path.join(dir, wi.path), 'utf8')).toBe(before)
    const first = linkAuditFinding(dir, request)
    expect(first.changed).toBe(true)
    expect(() => linkAuditFinding(dir, request)).toThrow(/stale/i)
    expect(linkAuditFinding(dir, { ...request, expectedRevision: first.revision }).changed).toBe(false)
    expect(fs.readFileSync(path.join(dir, wi.path), 'utf8').split(id)).toHaveLength(2)
    const later = buildAuditRun({ id: 'AUD-002', createdAt: '2026-01-02T00:00:00Z', scope: { kind: 'project' }, tools: [], findings: [finding, finding] })
    const [correlated] = correlateFindings({ findings: later.findings, artifacts: discoverKnowledge(dir) })
    expect(later.findings).toHaveLength(1)
    expect(correlated.correlation.confirmedWorkItems).toEqual([wi.id])
    expect(correlated.correlation.notes.join(' ')).not.toContain('No correlation found')
    expect(renderAuditReport(later, [correlated])).toContain(`Approved Work Item links:** ${wi.id}`)
  })

  it('links and reports a finding through the CLI, preserving the audit file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-audit-cli-')); dirs.push(dir)
    const findingId = stableFindingId({ category: 'types', fingerprint: 'cli-rule' })
    const finding: AuditFinding = { id: findingId, category: 'types', title: 'test', description: '', evidence: 'e', provenance: 'test', severity: 'low', confidence: 'confirmed', recommendation: 'fix', status: 'open', references: {} }
    const run = buildAuditRun({ id: 'AUD-001', createdAt: '2026-01-01T00:00:00Z', scope: { kind: 'project' }, tools: [], findings: [finding] })
    const auditPath = writeAuditRun(dir, run)
    const initial = fs.readFileSync(auditPath, 'utf8')
    const wi = createWorkItem(dir, { intent: 'fix issue', type: 'feature' })
    const cli = fileURLToPath(new URL('../dist/index.js', import.meta.url))
    const execute = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8' })
    const wiBefore = fs.readFileSync(path.join(dir, wi.path), 'utf8')
    const previewBefore = execute(['audit', 'plan', 'AUD-001', '--json'])
    expect(previewBefore.status).toBe(0)
    expect(JSON.parse(previewBefore.stdout).actions[0].action).toBe('review')
    expect(execute(['audit', 'plan', '../AUD-001']).status).not.toBe(0)
    expect(fs.readFileSync(path.join(dir, wi.path), 'utf8')).toBe(wiBefore)
    expect(fs.readFileSync(auditPath, 'utf8')).toBe(initial)
    expect(execute(['audit', 'link', 'AUD-001', findingId, wi.id]).status).not.toBe(0)
    expect(execute(['audit', 'link', 'AUD-001', findingId, wi.id, '--yes']).status).toBe(0)
    const repeat = execute(['audit', 'link', 'AUD-001', findingId, wi.id, '--yes'])
    expect(repeat.stdout).toContain('Already linked')
    const report = execFileSync(process.execPath, [cli, 'audit', 'report', 'AUD-001', '--json'], { cwd: dir, encoding: 'utf8' })
    expect(JSON.parse(report)[0].correlation.confirmedWorkItems).toEqual([wi.id])
    const preview = execFileSync(process.execPath, [cli, 'audit', 'plan', 'AUD-001', '--json'], { cwd: dir, encoding: 'utf8' })
    expect(JSON.parse(preview).actions[0]).toMatchObject({ findingId, action: 'already-linked', confirmedWorkItems: [wi.id] })
    expect(fs.readFileSync(auditPath, 'utf8')).toBe(initial)
  })
})
