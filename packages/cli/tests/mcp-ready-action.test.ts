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
    expect(rec.command).toBe('kaddo ready WI-001')
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

  it('review-work-item reason mentions specific WI ID for single target', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.reason).toContain('WI-001')
    expect(rec.reason).toContain('refined draft')
  })

  it('returns review-work-item even when roadmap has candidates (VS-090)', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n\n## Candidates\n\n- [ ] Build dashboard\n')
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('review-work-item')
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

const REFINED_DRAFT_WI_2 = `---
type: feature
id: WI-003
title: "Add metrics endpoint"
knowledge_level: K2
status: draft
phase: now
work_type: feature
domains:
  - observability
code:
  - src/metrics.ts
source:
  type: manual
  inferred: false
refined_by: work-item-agent
generated_by: kaddo-create
template_version: 1
---

## Problem

No metrics endpoint exists.

## Acceptance criteria

- [ ] GET /metrics returns Prometheus format.

## Validation

curl localhost:3000/metrics
`

describe('VS-089 — targeted recommendation', () => {
  it('single refined draft sets target and mcpArgs', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('review-work-item')
    expect(rec.target).toBe('WI-001')
    expect(rec.mcpArgs).toEqual({ id: 'WI-001' })
    expect(rec.targets).toBeUndefined()
  })

  it('multiple refined drafts sets targets array without target/mcpArgs', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    write('knowledge/delivery/work-items/draft/WI-003.md', REFINED_DRAFT_WI_2)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('review-work-item')
    expect(rec.targets).toEqual(expect.arrayContaining(['WI-001', 'WI-003']))
    expect(rec.targets).toHaveLength(2)
    expect(rec.target).toBeUndefined()
    expect(rec.mcpArgs).toBeUndefined()
  })

  it('multiple refined drafts uses generic command', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    write('knowledge/delivery/work-items/draft/WI-003.md', REFINED_DRAFT_WI_2)
    const rec = resolveNextStep(dir)
    expect(rec.command).toBe('kaddo ready <WI-ID>')
    expect(rec.reason).toContain('2 refined draft')
  })

  it('refined_draft_ids populated in DeliveryState', () => {
    config()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    write('knowledge/delivery/work-items/draft/WI-003.md', REFINED_DRAFT_WI_2)
    const st = buildDeliveryState(dir)
    expect(st.refined_draft_ids).toEqual(expect.arrayContaining(['WI-001', 'WI-003']))
    expect(st.refined_draft_ids).toHaveLength(2)
  })

  it('single refined draft label includes WI ID', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    expect(rec.label).toContain('WI-001')
    expect(rec.label).toContain('ready')
  })

  it('context-pack JSON includes target and mcpArgs for single', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-001.md', REFINED_DRAFT_WI)
    const rec = resolveNextStep(dir)
    const json = JSON.stringify(rec)
    expect(json).toContain('"target":"WI-001"')
    expect(json).toContain('"mcpArgs"')
  })
})

const READY_WI = `---
type: bugfix
id: WI-001
title: "Listar últimas compras"
knowledge_level: K2
status: ready
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
ready_at: '2026-07-07'
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

const READY_WI_2 = `---
type: feature
id: WI-002
title: "Add metrics"
status: ready
phase: now
work_type: feature
domains:
  - observability
code:
  - src/metrics.ts
source:
  type: manual
  inferred: false
refined_by: work-item-agent
ready_at: '2026-07-07'
generated_by: kaddo-create
template_version: 1
---

## Problem

No metrics.

## Acceptance criteria

- [ ] Metrics endpoint exists.

## Validation

curl metrics.
`

describe('VS-090 — ready beats empty roadmap', () => {
  it('ready WI recommends prepare-implementation, not roadmap', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('prepare-implementation')
    expect(rec.agent).toBe('implementation-agent')
    expect(rec.skill).toBe('implementation-planning')
    expect(rec.target).toBe('WI-001')
    expect(rec.id).not.toBe('roadmap')
  })

  it('ready WI with adapter recommends implement-work-item', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    write('AGENTS.md', '# Agents\n\n<!-- BEGIN KADDO ADAPTER -->\nKaddo guidance\n<!-- END KADDO ADAPTER -->\n')
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('implement-work-item')
    expect(rec.agent).toBe('implementation-agent')
    expect(rec.skill).toBe('implementation-planning')
    expect(rec.target).toBe('WI-001')
    expect(rec.reason).toContain('WI-001')
    expect(rec.reason).toContain('ready for implementation')
  })

  it('roadmap empty appears as secondary when ready WI exists', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    const rec = resolveNextStep(dir)
    const roadmapSec = (rec.secondary ?? []).find((s) => s.id === 'roadmap')
    expect(roadmapSec).toBeTruthy()
    expect(roadmapSec!.reason).toContain('ready Work Items exist')
  })

  it('multiple ready WIs expose targets array', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    write('knowledge/delivery/work-items/ready/WI-002.md', READY_WI_2)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('prepare-implementation')
    expect(rec.targets).toEqual(expect.arrayContaining(['WI-001', 'WI-002']))
    expect(rec.targets).toHaveLength(2)
    expect(rec.target).toBeUndefined()
  })

  it('ready_work_item_ids populated in DeliveryState', () => {
    config()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    write('knowledge/delivery/work-items/ready/WI-002.md', READY_WI_2)
    const st = buildDeliveryState(dir)
    expect(st.ready_work_item_ids).toEqual(expect.arrayContaining(['WI-001', 'WI-002']))
    expect(st.ready_work_item_ids).toHaveLength(2)
  })

  it('no ready/draft WIs keeps roadmap recommendation when roadmap is empty', () => {
    pastUsefulKnowledge()
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('roadmap')
  })

  it('missing adapter produces prepare-implementation, not roadmap', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('prepare-implementation')
    expect(rec.command).toBe('kaddo adapters list')
    expect(rec.id).not.toBe('roadmap')
  })

  it('ready WI beats roadmap even when roadmap has candidates', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n\n## Candidates\n\n- [ ] Build dashboard\n')
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('prepare-implementation')
    expect(rec.agent).toBe('implementation-agent')
  })

  it('projectRoute and nextStep aligned for ready WI', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001.md', READY_WI)
    const rec = resolveNextStep(dir)
    expect(rec.phase).toBe('Active Delivery')
    expect(['prepare-implementation', 'implement-work-item']).toContain(rec.id)
  })
})
