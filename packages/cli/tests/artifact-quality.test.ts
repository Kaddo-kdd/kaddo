import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { analyzeContent, analyzeKnowledgeArtifact } from '../src/core/artifact-quality.js'
import { baselineTemplate } from '../src/core/bootstrap-templates.js'

let dir: string
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-aq-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

const USEFUL = `---
type: current-state
---

## What exists today
The API is a Fastify service in TypeScript using PostgreSQL via Prisma. Auth is JWT-based and the
worker consumes a Redis queue. Migrations live under prisma/migrations and run on deploy.

## Known constraints
The legacy billing module cannot be changed without finance sign-off, and the reporting export must
stay backward compatible with the v1 CSV schema used by three external partners today. Rate limiting
is enforced at the gateway, background jobs retry with a dead-letter queue, and every administrator
write is recorded in an append-only audit table that downstream compliance reports read from nightly.`

describe('analyzeKnowledgeArtifact (VS-073.1)', () => {
  it('AC2: missing file', () => {
    expect(analyzeKnowledgeArtifact(dir, 'knowledge/tech/current-state.md')).toBe('missing')
  })

  it('AC3: a fresh bootstrap template is a placeholder', () => {
    for (const state of ['new', 'pre-ai', 'legacy'] as const) {
      expect(analyzeContent(baselineTemplate('current-state', state))).toBe('placeholder')
      expect(analyzeContent(baselineTemplate('capabilities', state))).toBe('placeholder')
    }
  })

  it('AC4: a lightly edited file is weak', () => {
    const md = '---\ntype: business\n---\n\n## Problem\nWe help small gyms manage class bookings.\n'
    expect(analyzeContent(md)).toBe('weak')
  })

  it('AC5/AC33: a file with real content across sections is useful', () => {
    expect(analyzeContent(USEFUL)).toBe('useful')
  })

  it('AC6/AC8: deterministic and read-only', () => {
    fs.mkdirSync(path.join(dir, 'knowledge/tech'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/tech/current-state.md'), USEFUL)
    const before = fs.readFileSync(path.join(dir, 'knowledge/tech/current-state.md'), 'utf8')
    const a = analyzeKnowledgeArtifact(dir, 'knowledge/tech/current-state.md')
    const b = analyzeKnowledgeArtifact(dir, 'knowledge/tech/current-state.md')
    expect(a).toBe(b)
    expect(a).toBe('useful')
    expect(fs.readFileSync(path.join(dir, 'knowledge/tech/current-state.md'), 'utf8')).toBe(before)
  })
})
