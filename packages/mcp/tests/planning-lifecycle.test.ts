import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  verifyEpicTool, recordEpicEvidenceTool, transitionEpicTool, completeEpicTool,
} from '../src/planning.js'

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-life-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: Auth\nstatus: in-progress\noutcome: Ship SSO\nsuccess_criteria:\n  - SSO works\n---\n# E\n')
  return dir
}

let dir: string
beforeEach(() => { dir = tmpProject() })
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

describe('MCP evidence-based lifecycle tools (WI-078)', () => {
  it('verify_epic reports evidence-based readiness (NEEDS_WORK until verified)', () => {
    const r = verifyEpicTool(dir, 'EP-001')
    expect(r.ok).toBe(true)
    expect((r.data as { readiness: string }).readiness).toBe('NEEDS_WORK')
  })

  it('record_epic_evidence previews without confirm, then applies with confirm', () => {
    const preview = recordEpicEvidenceTool(dir, { id: 'EP-001', criterion: 'SSO works', status: 'passed', evidence: 'verified' })
    expect((preview.data as { applied?: boolean }).applied).toBeUndefined()
    const applied = recordEpicEvidenceTool(dir, { id: 'EP-001', criterion: 'SSO works', status: 'passed', evidence: 'verified', confirm: true })
    expect((applied.data as { applied?: boolean }).applied).toBe(true)
    expect(verifyEpicTool(dir, 'EP-001').data).toMatchObject({ readiness: 'READY_TO_COMPLETE' })
  })

  it('transition_epic refuses → completed and points to complete_epic', () => {
    const r = transitionEpicTool(dir, { id: 'EP-001', to: 'completed', confirm: true })
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/complete_epic/)
  })

  it('complete_epic is gated: preview shows readiness; blocked until verified, then records the decision', () => {
    // Not verified yet → confirm fails (not ready).
    const blocked = completeEpicTool(dir, { id: 'EP-001', confirm: true })
    expect(blocked.ok).toBe(false)
    expect(blocked.message).toMatch(/not ready|NEEDS_WORK/i)
    // Verify, preview (no confirm) surfaces the approval boundary note, then confirm completes.
    recordEpicEvidenceTool(dir, { id: 'EP-001', criterion: 'SSO works', status: 'passed', evidence: 'ok', confirm: true })
    const preview = completeEpicTool(dir, { id: 'EP-001' })
    expect((preview.data as { note: string }).note).toMatch(/not by itself proof of human approval/)
    const done = completeEpicTool(dir, { id: 'EP-001', decidedBy: 'lead', confirm: true })
    expect((done.data as { applied: boolean }).applied).toBe(true)
    expect((done.data as { result: { status: string } }).result.status).toBe('completed')
  })
})
