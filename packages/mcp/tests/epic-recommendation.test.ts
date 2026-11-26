import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getEpicProgressTool } from '../src/planning.js'

// WI-089 — the MCP epic-progress tool must surface the deterministic next-step recommendation (AC-03), so
// an agent gets an explicit, grounded step and never has to infer it from counters. It is the SAME Core
// recommendation the CLI and Admin use (AC-10), and consulting it never mutates anything (AC-11).

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-eprec-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))
function epic(id: string, status = 'planned') {
  const f = path.join(dir, `knowledge/delivery/epics/${id}.md`)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, `---\ntype: epic\nid: ${id}\ntitle: ${id}\nstatus: ${status}\nsuccess_criteria:\n  - Outcome verified\n---\n# ${id}\n`)
}

function payload(id: string): Record<string, unknown> {
  const res = getEpicProgressTool(dir, id)
  if (!res.ok) throw new Error(res.message)
  return res.data as Record<string, unknown>
}

describe('MCP get_epic_progress recommendation (WI-089)', () => {
  it('includes an explicit Initiative-first recommendation for a new Epic (AC-03)', () => {
    epic('EP-001')
    const data = payload('EP-001')
    expect(data.recommendation).toBeTruthy()
    const rec = data.recommendation as Record<string, unknown>
    expect(rec.scenario).toBe('new-no-work')
    expect(JSON.stringify((rec.primary as Record<string, unknown>).action)).toMatch(/create or associate an initiative/i)
    // Progress counters are still present (additive, not a replacement).
    expect(data.planning).toBeTruthy()
    expect(data.delivery).toBeTruthy()
  })

  it('consulting the recommendation never mutates the Epic (AC-11)', () => {
    epic('EP-001')
    const before = fs.readFileSync(path.join(dir, 'knowledge/delivery/epics/EP-001.md'), 'utf8')
    payload('EP-001'); payload('EP-001')
    expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/epics/EP-001.md'), 'utf8')).toBe(before)
  })
})
