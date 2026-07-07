import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseWorkItemSource } from '../src/core/work-item-source.js'
import { resolveNextStep } from '../src/core/next-step.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLI_ROOT = path.resolve(__dirname, '..')

let dir: string
function write(rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(state = 'pre-ai') {
  write('.kaddo/config.yml', `version: 1\nproject:\n  name: demo\n  state: ${state}\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`)
}
const USEFUL = (title: string) => `---\ntype: x\n---\n\n## ${title} one\nThe API is a Fastify service written in TypeScript and backed by a PostgreSQL database, with a Redis\nworker queue for background jobs, JWT based authentication, and blue-green deployments gated behind a\nmanual approval step before automated database migrations run on every release to the production tier.\n\n## ${title} two\nRate limiting is enforced at the shared gateway, background jobs retry with a dead-letter queue for\nfailures, structured logs and per-endpoint latency metrics feed the monitoring dashboards, and every\nadministrator write operation is recorded in an append-only audit table read nightly by the compliance\nreporting pipeline used across the finance and operations teams for their monthly reviews.\n`

function pastUsefulKnowledge() {
  config('pre-ai')
  write('.kaddo/scan.json', '{}')
  write('.kaddo/context-pack.md', '# ctx\n')
  write('.kaddo/understand.md', '# und\n')
  write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n')
  write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
  write('knowledge/business/business.md', USEFUL('Business'))
  write('knowledge/product/product.md', USEFUL('Product'))
  write('knowledge/product/capabilities.md', USEFUL('Capabilities'))
  write('knowledge/tech/codebase.md', USEFUL('Codebase'))
  write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
}

const DRAFT_WI = `---
type: bugfix
id: WI-001
title: "Listar últimas compras"
knowledge_level: K2
status: draft
phase: now
work_type: bugfix
source:
  type: manual
  inferred: false
generated_by: kaddo-create
template_version: 1
---

## Problem
Users cannot see recent purchases.
`

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-vs086-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('Source object parsing (VS-086)', () => {
  it('AC1: parses source object manual correctly', () => {
    const src = parseWorkItemSource({ source: { type: 'manual', inferred: false } })
    expect(src.type).toBe('manual')
    expect(src.inferred).toBe(false)
  })

  it('AC1: parses source object roadmap correctly', () => {
    const src = parseWorkItemSource({ source: { type: 'roadmap', inferred: true, id: 'RC-001' } })
    expect(src.type).toBe('roadmap')
    expect(src.inferred).toBe(true)
    expect(src.id).toBe('RC-001')
  })

  it('AC2: parses legacy source string manual correctly', () => {
    const src = parseWorkItemSource({ source: 'manual' })
    expect(src.type).toBe('manual')
    expect(src.inferred).toBe(false)
  })

  it('AC3: invalid source object does not stringify as [object Object]', () => {
    const src = parseWorkItemSource({ source: { type: 'trello', inferred: false } })
    expect(src.type).toBe('unknown')
    expect(src.reason).not.toContain('[object Object]')
    expect(src.reason).toContain('trello')
  })

  it('AC4: source.type = manual is reported as manual', () => {
    const src = parseWorkItemSource({ source: { type: 'manual', inferred: false } })
    expect(src.type).toBe('manual')
  })

  it('AC5: source.inferred = false is preserved', () => {
    const src = parseWorkItemSource({ source: { type: 'manual', inferred: false } })
    expect(src.inferred).toBe(false)
  })

  it('AC6: manual Work Item with source object does not trigger unknown warning', () => {
    const src = parseWorkItemSource({ source: { type: 'manual', inferred: false } })
    expect(src.type).not.toBe('unknown')
    expect(src.reason).toBeUndefined()
  })

  it('source object with extra fields preserves them', () => {
    const src = parseWorkItemSource({
      source: { type: 'jira', inferred: false, id: 'DOT-42', url: 'https://jira.example.com/DOT-42' },
    })
    expect(src.type).toBe('jira')
    expect(src.id).toBe('DOT-42')
    expect(src.url).toBe('https://jira.example.com/DOT-42')
  })

  it('source object falls back to top-level source_id when obj.id is missing', () => {
    const src = parseWorkItemSource({
      source: { type: 'manual', inferred: false },
      source_id: 'fallback-id',
    })
    expect(src.id).toBe('fallback-id')
  })

  it('source object without type defaults to unknown', () => {
    const src = parseWorkItemSource({ source: { inferred: false } })
    expect(src.type).toBe('unknown')
  })
})

describe('Draft WI priority over empty roadmap (VS-086)', () => {
  it('AC8: draft WI beats empty roadmap recommendation', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001-test.md', DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('refine-work-item')
    expect(rec.agent).toBe('work-item-agent')
  })

  it('AC13: roadmap-agent is NOT primary when draft WI exists', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001-test.md', DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('roadmap')
    expect(rec.agent).not.toBe('roadmap-agent')
  })

  it('AC9: phase is Active Delivery when draft WI exists', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001-test.md', DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.phase).toBe('Active Delivery')
  })

  it('AC10: skill is work-item-refinement when draft WI exists', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001-test.md', DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.skill).toBe('work-item-refinement')
  })

  it('roadmap recommendation still fires when no WIs exist', () => {
    pastUsefulKnowledge()
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('roadmap')
    expect(rec.agent).toBe('roadmap-agent')
  })

  it('AC17: project route and next step are aligned', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001-test.md', DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('refine-work-item')
  })

  it('AC29: CLI does not call LLM', () => {
    const src = fs.readFileSync(path.join(CLI_ROOT, 'src/core/work-item-source.ts'), 'utf-8')
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
  })

  it('AC30: CLI does not execute git', () => {
    const src = fs.readFileSync(path.join(CLI_ROOT, 'src/core/next-step.ts'), 'utf-8')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('git commit')
  })
})
