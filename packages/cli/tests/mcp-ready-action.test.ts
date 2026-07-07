import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolveNextStep, buildDeliveryState } from '../src/core/next-step.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

const REFINED_DRAFT_WI = `---
type: bugfix
id: WI-001
title: "Listar últimas compras"
knowledge_level: K2
status: draft
phase: now
work_type: bugfix
domains:
  - loyalty
code:
  - src/hooks/useAdminMetrics.ts
  - src/app/dashboard/page.tsx
source:
  type: manual
  inferred: false
refined_by: work-item-agent
generated_by: kaddo-create
template_version: 1
---

## Problem

Users cannot see recent purchases in the admin dashboard.

## Acceptance criteria

- [ ] Admin page shows recent purchases.
- [ ] Purchases are sorted by date descending.

## Validation

Run the admin dashboard and verify purchases appear.
`

const UNREFINED_DRAFT_WI = `---
type: bugfix
id: WI-002
title: "Fix login"
status: draft
domains:
  - auth
code:
  - src/auth.ts
source:
  type: manual
  inferred: false
generated_by: kaddo-create
template_version: 1
---

## Problem

Login fails.

## Acceptance criteria

- [ ] Login works.

## Validation

Try logging in.
`

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-ready-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('VS-088 — refined_draft_work_items count', () => {
  it('counts draft WIs with refined_by', () => {
    config()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    write('knowledge/delivery/work-items/draft/WI-002.md', UNREFINED_DRAFT_WI)
    const st = buildDeliveryState(dir)
    expect(st.draft_work_items).toBe(2)
    expect(st.refined_draft_work_items).toBe(1)
  })

  it('returns 0 when no drafts have refined_by', () => {
    config()
    write('knowledge/delivery/work-items/draft/WI-002.md', UNREFINED_DRAFT_WI)
    const st = buildDeliveryState(dir)
    expect(st.draft_work_items).toBe(1)
    expect(st.refined_draft_work_items).toBe(0)
  })

  it('returns 0 when no work items exist', () => {
    config()
    const st = buildDeliveryState(dir)
    expect(st.refined_draft_work_items).toBe(0)
  })
})

describe('VS-088 — review-work-item next step', () => {
  it('returns review-work-item when refined draft exists', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('review-work-item')
    expect(rec.command).toBe('kaddo ready')
    expect(rec.mcpAction).toBe('kaddo_mark_work_item_ready')
    expect(rec.phase).toBe('Active Delivery')
  })

  it('returns refine-work-item when draft has no refined_by', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-002.md', UNREFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('refine-work-item')
    expect(rec.agent).toBe('work-item-agent')
    expect(rec.mcpAction).toBeUndefined()
  })

  it('prefers review-work-item over refine-work-item when both exist', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    write('knowledge/delivery/work-items/draft/WI-002.md', UNREFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('review-work-item')
  })

  it('review-work-item reason mentions count of refined drafts', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.reason).toContain('1 refined draft')
  })

  it('does not return review-work-item when roadmap has candidates', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n\n## Candidates\n\n- [ ] Build dashboard\n')
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('review-work-item')
  })
})

describe('VS-088 — MCP tool safety', () => {
  it('MCP tools.ts does not call LLM', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../mcp/src/tools.ts'), 'utf-8')
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
  })

  it('MCP tools.ts does not execute git', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../mcp/src/tools.ts'), 'utf-8')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('git commit')
  })

  it('MCP workitems.ts does not write files', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../mcp/src/workitems.ts'), 'utf-8')
    expect(src).not.toContain('writeFile')
    expect(src).not.toContain('fs.write')
    expect(src).not.toContain('mkdirSync')
  })

  it('markWorkItemReady returns preview or CLI command for confirmation', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../mcp/src/tools.ts'), 'utf-8')
    expect(src).toContain('needs_confirmation')
    expect(src).toContain('kaddo ready')
  })
})
