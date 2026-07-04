import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { resolveNextStep } from '../src/core/next-step.js'
import { buildReadinessReport } from '../src/core/readiness.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { loadConfig } from '../src/core/config.js'

let dir: string
function write(rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(state = 'pre-ai') {
  write('.kaddo/config.yml', `version: 1\nproject:\n  name: demo\n  state: ${state}\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`)
}
const USEFUL = (title: string) => `---\ntype: x\n---\n\n## ${title} one\nThe API is a Fastify service written in TypeScript and backed by a PostgreSQL database, with a Redis
worker queue for background jobs, JWT based authentication, and blue-green deployments gated behind a
manual approval step before automated database migrations run on every release to the production tier.\n\n## ${title} two\nRate limiting is enforced at the shared gateway, background jobs retry with a dead-letter queue for
failures, structured logs and per-endpoint latency metrics feed the monitoring dashboards, and every
administrator write operation is recorded in an append-only audit table read nightly by the compliance
reporting pipeline used across the finance and operations teams for their monthly reviews.\n`

// Take the project through the ladder up to (but not including) knowledge refinement.
function pastSetup() {
  config('pre-ai')
  write('.kaddo/scan.json', '{}')
  write('.kaddo/context-pack.md', '# ctx\n')
  write('.kaddo/understand.md', '# und\n')
  write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n')
  write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ns-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('resolveNextStep — priority ladder (VS-073.2)', () => {
  it('AC18: no config → init', () => {
    expect(resolveNextStep(dir).command).toBe('kaddo init')
  })
  it('AC19: baseline missing → bootstrap', () => {
    config('pre-ai')
    expect(resolveNextStep(dir).command).toBe('kaddo bootstrap')
  })
  it('AC20/AC21: baseline exists, agents/skills missing → add agents then add skills', () => {
    config('pre-ai')
    write('knowledge/business/business.md', '# b\n')
    write('knowledge/product/product.md', '# p\n')
    expect(resolveNextStep(dir).command).toBe('kaddo add agents')
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n')
    expect(resolveNextStep(dir).command).toBe('kaddo add skills')
  })
  it('AC22/AC23/AC24: scan → context → understand for pre-ai', () => {
    config('pre-ai')
    write('knowledge/business/business.md', '# b\n')
    write('knowledge/product/product.md', '# p\n')
    write('knowledge/agents/delivery/roadmap-agent.md', '# a\n')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
    expect(resolveNextStep(dir).command).toBe('kaddo scan')
    write('.kaddo/scan.json', '{}')
    expect(resolveNextStep(dir).command).toBe('kaddo context')
    write('.kaddo/context-pack.md', '# c\n')
    expect(resolveNextStep(dir).command).toBe('kaddo understand')
  })
  it('AC25: all placeholder → business-agent first (layer order)', () => {
    pastSetup()
    write('knowledge/business/business.md', '---\ntype: business\n---\n\n## What\n\n_Describe._\n')
    write('knowledge/product/product.md', '---\ntype: product\n---\n\n## What\n\n_Describe._\n')
    const rec = resolveNextStep(dir)
    expect(rec.agent).toBe('business-agent')
    expect(rec.target).toBe('knowledge/business/business.md')
  })
  it('AC26: business useful, capabilities placeholder → capability-agent', () => {
    pastSetup()
    write('knowledge/business/business.md', USEFUL('Business'))
    write('knowledge/product/product.md', USEFUL('Product'))
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n\n## Observed\n\n- [observed] _cap._\n')
    expect(resolveNextStep(dir).agent).toBe('capability-agent')
  })
  it('AC27: product useful, current-state placeholder → architecture-agent', () => {
    pastSetup()
    write('knowledge/business/business.md', USEFUL('Business'))
    write('knowledge/product/product.md', USEFUL('Product'))
    write('knowledge/product/capabilities.md', USEFUL('Capabilities'))
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', '---\ntype: current-state\n---\n\n## What\n\n_Describe._\n')
    expect(resolveNextStep(dir).agent).toBe('architecture-agent')
  })

  function usefulKnowledge() {
    pastSetup()
    write('knowledge/business/business.md', USEFUL('Business'))
    write('knowledge/product/product.md', USEFUL('Product'))
    write('knowledge/product/capabilities.md', USEFUL('Capabilities'))
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
  }

  it('AC30/AC31: knowledge useful, roadmap empty → roadmap-agent, never create', () => {
    usefulKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# Roadmap\n')
    const rec = resolveNextStep(dir)
    expect(rec.command).toBe('kaddo roadmap')
    expect(rec.label).not.toContain('create --from roadmap')
  })
  it('AC32: roadmap has candidates, no Work Items → create --from roadmap', () => {
    usefulKnowledge()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# Roadmap\n\n## Candidates\n- First capability\n- Second capability\n')
    expect(resolveNextStep(dir).command).toBe('kaddo create --from roadmap')
  })
})

describe('unified next step — no divergence (VS-073.2)', () => {
  it('AC15/AC16/AC17: readiness, context-pack and resolveNextStep agree', () => {
    config('pre-ai')
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# c\n')
    write('.kaddo/understand.md', '# u\n')
    write('knowledge/agents/delivery/roadmap-agent.md', '# a\n')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
    write('knowledge/business/business.md', '---\ntype: business\n---\n\n## What\n\n_Describe._\n')
    write('knowledge/product/product.md', '---\ntype: product\n---\n\n## What\n\n_Describe._\n')
    const rec = resolveNextStep(dir)
    const readiness = buildReadinessReport(dir)
    const cfg = loadConfig(dir)!
    const pack = buildContextPack(dir, cfg)
    expect(rec.agent).toBe('business-agent')
    expect(readiness.recommended_next_step.label).toBe(rec.label)
    expect(readiness.nextStepRecommendation.id).toBe(rec.id)
    expect(pack.nextStepRecommendation.label).toBe(rec.label)
    expect(pack.phase.nextStep).toBe(rec.label)
    expect(pack.handoff.nextSteps[0]).toBe(rec.label)
  })
})

describe('resolveNextStep — state-aware delivery (VS-079)', () => {
  function usefulKnowledge() {
    pastSetup()
    write('knowledge/business/business.md', USEFUL('Business'))
    write('knowledge/product/product.md', USEFUL('Product'))
    write('knowledge/product/capabilities.md', USEFUL('Capabilities'))
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# Roadmap\n\n## Candidate Work Items\n- WI-CANDIDATE-001: First capability\n- WI-CANDIDATE-002: Second capability\n- WI-CANDIDATE-003: Third capability\n')
  }
  function writeWI(state: string, id: string, opts: { code?: boolean } = {}) {
    const code = opts.code ? `code: ["src/${id}.ts"]` : 'code: []'
    write(
      `knowledge/delivery/work-items/${state}/${id}.md`,
      `---\ntype: feature\nid: ${id}\ntitle: ${id} title\nstatus: ${state}\n${code}\n---\n# ${id}\n`
    )
  }

  it('AC6: roadmap candidates, no Work Items → create --from roadmap', () => {
    usefulKnowledge()
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('create-work-item')
    expect(rec.command).toBe('kaddo create --from roadmap')
  })

  it('AC1/AC2: a draft Work Item exists → refine with work-item-agent (never "first Work Item")', () => {
    usefulKnowledge()
    writeWI('draft', 'WI-001')
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('refine-work-item')
    expect(rec.agent).toBe('work-item-agent')
    expect(rec.skill).toBe('work-item-refinement')
    expect(rec.label).not.toContain('first Work Item')
  })

  it('AC3/AC4: draft + missing ownership + remaining candidates → secondary owners + materialize-later', () => {
    usefulKnowledge()
    writeWI('draft', 'WI-001') // no code → missing ownership
    const rec = resolveNextStep(dir)
    const ids = (rec.secondary ?? []).map((s) => s.id)
    expect(ids).toContain('suggest-ownership')
    expect(ids).toContain('materialize-more-work-items')
    // remaining candidates must be secondary, not the primary
    expect(rec.id).toBe('refine-work-item')
  })

  it('AC5: tech decision candidates without ADR + Work Item → secondary adr-writing', () => {
    usefulKnowledge()
    writeWI('draft', 'WI-001', { code: true })
    write('knowledge/tech/decision-candidates.md', '# Decision Candidates\n\n## 1. Shared secret\n\n### Context\nx\n\n## 2. Rate limit\n\n### Context\ny\n')
    const rec = resolveNextStep(dir)
    const adr = (rec.secondary ?? []).find((s) => s.id === 'materialize-adrs')
    expect(adr).toBeTruthy()
    expect(adr!.skill).toBe('adr-writing')
    expect(adr!.command).toBe('kaddo adr')
  })

  it('AC7: a ready Work Item with no adapter → install adapter', () => {
    usefulKnowledge()
    writeWI('ready', 'WI-001', { code: true })
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('install-adapter')
    expect(rec.command).toBe('kaddo adapters list')
  })

  it('AC8: a ready Work Item with an adapter installed → implementation-agent', () => {
    usefulKnowledge()
    writeWI('ready', 'WI-001', { code: true })
    write('AGENTS.md', '# Agents\n\n<!-- BEGIN KADDO ADAPTER -->\nKaddo guidance\n<!-- END KADDO ADAPTER -->\n')
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('implement')
    expect(rec.agent).toBe('implementation-agent')
  })

  it('AC9: an in-progress Work Item → guard', () => {
    usefulKnowledge()
    writeWI('in-progress', 'WI-001', { code: true })
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('guard')
    expect(rec.command).toBe('kaddo guard')
  })

  it('AC15-AC21: the recommendation carries id/phase/label/reason (+ agent/skill)', () => {
    usefulKnowledge()
    writeWI('draft', 'WI-001')
    const rec = resolveNextStep(dir)
    expect(rec.id).toBeTruthy()
    expect(rec.phase).toBe('Active Delivery')
    expect(rec.label).toBeTruthy()
    expect(rec.reason).toBeTruthy()
    expect(rec.agent).toBe('work-item-agent')
    expect(rec.skill).toBe('work-item-refinement')
  })

  it('AC11: context-pack carries deliveryState + the state-aware recommendation', () => {
    usefulKnowledge()
    writeWI('draft', 'WI-001')
    const pack = buildContextPack(dir, loadConfig(dir)!)
    expect(pack.deliveryState.draft_work_items).toBe(1)
    expect(pack.deliveryState.ready_work_items).toBe(0)
    expect(pack.deliveryState.phase).toBe('Active Delivery')
    expect(pack.nextStepRecommendation.id).toBe('refine-work-item')
  })
})
