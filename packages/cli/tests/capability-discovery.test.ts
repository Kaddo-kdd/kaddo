import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { baselineTemplate } from '../src/core/bootstrap-templates.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'
import { resolveNextStep } from '../src/core/next-step.js'

const prompt = (name: string) => AGENT_PROMPTS.find((p) => p.fileName === name)!.content

describe('capability templates (VS-074)', () => {
  it('AC5-AC8: pre-ai capabilities is an evidence-backed inventory with gaps + candidate signals', () => {
    const t = baselineTemplate('capabilities', 'pre-ai')
    expect(t).toContain('project_state: pre-ai')
    expect(t).toContain('## Capability Inventory')
    expect(t).toContain('## Capability Gaps')
    expect(t).toContain('## Roadmap Candidate Signals')
    expect(t).toContain('Evidence:')
    expect(t).toContain('Status: implemented | partial | inferred | risky | deprecated | unknown')
  })

  it('AC9-AC11: legacy capabilities adds criticality, change risk and modernization notes', () => {
    const t = baselineTemplate('capabilities', 'legacy')
    expect(t).toContain('## Capability Inventory')
    expect(t).toContain('Criticality:')
    expect(t).toContain('Change risk:')
    expect(t).toContain('Modernization notes:')
    expect(t).toContain('Operational dependency:')
  })

  it('AC2: new capabilities keeps planned capabilities', () => {
    expect(baselineTemplate('capabilities', 'new')).toContain('Planned capabilities')
  })
})

describe('capability-agent prompt (VS-074)', () => {
  const p = prompt('capability-agent.md')
  it('AC1-AC4: is state-aware (new/pre-ai/legacy modes)', () => {
    expect(p).toContain('State-aware modes')
    expect(p).toContain('Planned Capability Definition')
    expect(p).toContain('Existing Capability Discovery')
    expect(p).toContain('Legacy Capability Discovery')
  })
  it('AC12-AC14/AC20: status values + evidence rule (no invented evidence)', () => {
    for (const s of ['implemented', 'partial', 'inferred', 'risky', 'deprecated', 'unknown']) expect(p).toContain(s)
    expect(p).toContain('Never mark a capability `implemented` without evidence')
    expect(p).toContain('Do not invent evidence')
  })
  it('AC16/AC17: gaps and roadmap candidate signals', () => {
    expect(p).toContain('Capability Gaps')
    expect(p).toContain('Roadmap Candidate Signals')
  })
})

describe('roadmap-agent prompt (VS-074)', () => {
  const p = prompt('roadmap-agent.md')
  it('AC23/AC24/AC25/AC27: capabilities.md is the primary source; not from placeholder', () => {
    expect(p).toContain('primary source for roadmap candidates')
    expect(p).toContain('Capability Gaps')
    expect(p).toContain('Roadmap Candidate Signals')
    expect(p.toLowerCase()).toContain('placeholder')
  })
})

describe('work-item-agent prompt (VS-074)', () => {
  it('AC28: mentions related_capability as a recommendation', () => {
    expect(prompt('work-item-agent.md')).toContain('related_capability')
  })
})

describe('discovery wording (VS-074)', () => {
  let dir: string
  const write = (rel: string, c: string) => {
    const f = path.join(dir, rel)
    fs.mkdirSync(path.dirname(f), { recursive: true })
    fs.writeFileSync(f, c)
  }
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-cap-')) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); vi.restoreAllMocks() })

  it('AC21/AC22: pre-ai next step for placeholder capabilities uses discovery wording', () => {
    write('.kaddo/config.yml', 'version: 1\nproject:\n  name: d\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# c\n')
    write('.kaddo/understand.md', '# u\n')
    write('knowledge/agents/product/capability-agent.md', '# a\n')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
    // Business useful, capabilities placeholder → capability-agent discovery.
    const useful = '---\ntype: x\n---\n\n## One\nThe API is a Fastify service written in TypeScript and backed by a PostgreSQL database, with a Redis worker queue for background jobs, JWT based authentication, and blue-green deployments gated behind a manual approval step before automated database migrations run on every release to the production tier of the platform.\n\n## Two\nRate limiting is enforced at the shared gateway, background jobs retry with a dead-letter queue for failures, structured logs and per-endpoint latency metrics feed the monitoring dashboards, and every administrator write operation is recorded in an append-only audit table read nightly by the compliance reporting pipeline used across finance and operations teams.\n'
    write('knowledge/business/business.md', useful)
    write('knowledge/product/product.md', useful)
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n\n## Capability Inventory\n\n### <name>\n\n- Status: implemented | partial\n')
    const rec = resolveNextStep(dir)
    expect(rec.agent).toBe('capability-agent')
    expect(rec.label).toContain('discover and document existing system capabilities')
  })
})
