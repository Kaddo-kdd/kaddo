import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateReadiness, transitionToReady } from '../src/commands/ready.js'
import { resolveNextStep } from '../src/core/next-step.js'
import { discoverWorkItems } from '../src/services/knowledge-artifacts.js'

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
domains:
  - loyalty
code:
  - src/hooks/useAdminMetrics.ts
  - src/app/dashboard/page.tsx
source:
  type: manual
  inferred: false
generated_by: kaddo-create
template_version: 1
---

## Problem

Users cannot see recent purchases in the admin dashboard.

## Expected result

The admin metrics page shows the last 10 purchases.

## Acceptance criteria

- [ ] Admin page shows recent purchases.
- [ ] Purchases are sorted by date descending.

## Out of scope

- Mobile view.

## Validation

Run the admin dashboard and verify purchases appear.

## Definition of Done

- Tests pass.
- PR reviewed.
`

const DRAFT_WI_MINIMAL = `---
type: bugfix
id: WI-002
title: "Minimal item"
status: draft
source:
  type: manual
  inferred: false
---

## Problem

Something is broken.
`

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ready-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('kaddo ready — validation (VS-087)', () => {
  it('AC16: warns when no acceptance criteria exist', () => {
    const warnings = validateReadiness(DRAFT_WI_MINIMAL, { status: 'draft' })
    const fields = warnings.map((w) => w.field)
    expect(fields).toContain('acceptance_criteria')
  })

  it('AC17: warns when no code globs exist', () => {
    const warnings = validateReadiness(DRAFT_WI_MINIMAL, { status: 'draft' })
    const fields = warnings.map((w) => w.field)
    expect(fields).toContain('code')
  })

  it('AC18: warns when open questions are present', () => {
    const content = DRAFT_WI + '\n## Open questions\n\n- What about X?\n'
    const warnings = validateReadiness(content, { status: 'draft', code: ['src/x.ts'], domains: ['a'] })
    const fields = warnings.map((w) => w.field)
    expect(fields).toContain('open_questions')
  })

  it('does not warn about open questions when resolved', () => {
    const content = DRAFT_WI + '\n## Open questions\n\nNone\n'
    const warnings = validateReadiness(content, { status: 'draft', code: ['src/x.ts'], domains: ['a'] })
    const fields = warnings.map((w) => w.field)
    expect(fields).not.toContain('open_questions')
  })

  it('no warnings for a complete Work Item', () => {
    const warnings = validateReadiness(DRAFT_WI, {
      status: 'draft',
      domains: ['loyalty'],
      code: ['src/hooks/useAdminMetrics.ts'],
    })
    expect(warnings).toHaveLength(0)
  })
})

describe('kaddo ready — transition (VS-087)', () => {
  it('AC6: changes status from draft to ready', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toContain('status: ready')
    expect(newContent).not.toMatch(/status: draft/)
  })

  it('AC7: moves file from draft/ to ready/', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newPath } = transitionToReady(wiPath)
    expect(newPath.replace(/\\/g, '/')).toContain('/work-items/ready/')
    expect(path.basename(newPath)).toBe('WI-001-test.md')
  })

  it('AC8: creates ready/ directory if missing', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newPath } = transitionToReady(wiPath)
    const readyDir = path.dirname(newPath)
    expect(fs.existsSync(readyDir)).toBe(true)
  })

  it('AC9: preserves source metadata', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toContain('type: manual')
    expect(newContent).toContain('inferred: false')
  })

  it('AC10: preserves domains', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toContain('loyalty')
  })

  it('AC11: preserves code globs', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toContain('src/hooks/useAdminMetrics.ts')
    expect(newContent).toContain('src/app/dashboard/page.tsx')
  })

  it('AC12/AC13: preserves generated_by and template_version', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toContain('generated_by: kaddo-create')
    expect(newContent).toContain('template_version: 1')
  })

  it('AC14: adds ready_at timestamp', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toMatch(/ready_at:.*\d{4}-\d{2}-\d{2}/)
  })

  it('AC15: does not rewrite Work Item body', () => {
    const wiPath = path.join(dir, 'knowledge/delivery/work-items/draft/WI-001-test.md')
    fs.mkdirSync(path.dirname(wiPath), { recursive: true })
    fs.writeFileSync(wiPath, DRAFT_WI)

    const { newContent } = transitionToReady(wiPath)
    expect(newContent).toContain('Users cannot see recent purchases')
    expect(newContent).toContain('## Acceptance criteria')
    expect(newContent).toContain('## Validation')
  })
})

describe('kaddo ready — next step alignment (VS-087)', () => {
  it('AC22: understand no longer recommends work-item-agent when WI is ready', () => {
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/ready/WI-001-test.md', DRAFT_WI.replace('status: draft', 'status: ready'))
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('refine-work-item')
    expect(rec.agent).not.toBe('work-item-agent')
  })

  it('AC21: context detects ready Work Item', () => {
    config()
    write('knowledge/delivery/work-items/ready/WI-001-test.md', DRAFT_WI.replace('status: draft', 'status: ready'))
    const wis = discoverWorkItems(dir)
    const ready = wis.filter((w) => w.lifecycle === 'ready')
    expect(ready.length).toBe(1)
    expect(ready[0].id).toBe('WI-001')
  })
})

describe('kaddo ready — safety (VS-087)', () => {
  it('AC35: CLI does not call LLM', () => {
    const src = fs.readFileSync(path.join(CLI_ROOT, 'src/commands/ready.ts'), 'utf-8')
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
  })

  it('AC36: CLI does not execute git', () => {
    const src = fs.readFileSync(path.join(CLI_ROOT, 'src/commands/ready.ts'), 'utf-8')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('git commit')
    expect(src).not.toContain('git push')
  })
})
