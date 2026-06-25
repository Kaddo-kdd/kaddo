import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildCodexAdapterContext, renderAgentsMd } from '../src/core/codex-adapter.js'
import { runAdaptersInstall } from '../src/commands/adapters.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(name = 'EventBoard', state = 'new') {
  write('.kaddo/config.yml', `version: 1\nproject:\n  name: ${name}\n  state: ${state}\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`)
}

beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-codex-')) })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Codex adapter content (VS-065)', () => {
  it('AC3-AC12: includes Kaddo guidance, knowledge map, readiness, guard and validations', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B')
    const md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).toContain('Knowledge Driven Development')
    expect(md).toContain('knowledge/business/')
    expect(md).toContain('.kaddo/context-pack.md')
    expect(md).toContain('it is generated output') // .kaddo/ is generated
    expect(md.toLowerCase()).toContain('open-questions readiness')
    expect(md).toContain('resolve, assume or defer') // blocking questions
    expect(md).toContain('reading the active Work Item')
    expect(md).toContain('Do not implement outside the scope of the active Work Item')
    expect(md).toContain('kaddo guard')
    expect(md).toContain('kaddo impact')
    expect(md).toContain('kaddo savings')
    expect(md).toContain('kaddo drift')
    expect(md).toContain('EventBoard')
  })

  it('AC13/AC14: lists installed agents and skills', () => {
    config()
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent')
    write('knowledge/agents/delivery/implementation-agent.md', '# Impl')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x')
    const ctx = buildCodexAdapterContext(tmp)
    expect(ctx.agents).toContain('roadmap-agent')
    expect(ctx.skills).toContain('adr-writing')
    const md = renderAgentsMd(ctx)
    expect(md).toContain('## Available Kaddo agents')
    expect(md).toContain('`roadmap-agent`')
    expect(md).toContain('## Available Kaddo skills')
    expect(md).toContain('`adr-writing`')
  })

  it('AC15/AC16: valid without agents or skills (no those sections)', () => {
    config()
    const md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).toContain('# AGENTS.md')
    expect(md).not.toContain('## Available Kaddo agents')
    expect(md).not.toContain('## Available Kaddo skills')
  })

  it('AC26/AC27: does not inline full file contents', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nSECRET_BUSINESS_BODY_LINE')
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n\nLONG_AGENT_PROMPT_BODY')
    const md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).not.toContain('SECRET_BUSINESS_BODY_LINE')
    expect(md).not.toContain('LONG_AGENT_PROMPT_BODY')
  })

  it('AC28/AC29/AC30: works for new / pre-ai / legacy projects', () => {
    for (const state of ['new', 'pre-ai', 'legacy']) {
      config('P', state)
      expect(renderAgentsMd(buildCodexAdapterContext(tmp))).toContain('# AGENTS.md')
    }
  })
})

describe('kaddo adapters install codex command (VS-065)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  const output = () => logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('AC1/AC2: creates AGENTS.md in the project root', () => {
    config()
    runAdaptersInstall('codex', {})
    const p = path.join(tmp, 'AGENTS.md')
    expect(fs.existsSync(p)).toBe(true)
    expect(fs.readFileSync(p, 'utf-8')).toContain('Knowledge Driven Development')
  })

  it('AC17: does not overwrite by default', () => {
    config()
    write('AGENTS.md', '# Mine\nkeep')
    runAdaptersInstall('codex', {})
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe('# Mine\nkeep')
  })

  it('AC18: --force overwrites', () => {
    config()
    write('AGENTS.md', '# Mine')
    runAdaptersInstall('codex', { force: true })
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toContain('Knowledge Driven Development')
  })

  it('AC19/AC21: --dry-run writes nothing and does not touch knowledge', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B')
    const before = fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf-8')
    runAdaptersInstall('codex', { dryRun: true })
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false)
    expect(output()).toContain('AGENTS.md preview')
    expect(fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf-8')).toBe(before)
  })
})
