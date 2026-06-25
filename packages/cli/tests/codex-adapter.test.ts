import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  buildCodexAdapterContext,
  renderAgentsMd,
  renderKaddoBlock,
  detectAgentsState,
  injectKaddoBlock,
  KADDO_BEGIN_MARKER,
  KADDO_END_MARKER,
} from '../src/core/codex-adapter.js'
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

  it('VS-065.1 AC1/AC5-AC9: includes a Command fallback section with local runners', () => {
    config()
    const md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).toContain('## Command fallback')
    expect(md).toContain('kaddo <command>')
    expect(md).toContain('corepack pnpm exec kaddo <command>')
    expect(md).toContain('pnpm exec kaddo <command>')
    expect(md).toContain('npx kaddo <command>')
    expect(md).toContain('Do not assume Kaddo is unavailable until these local fallbacks have been attempted')
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

  it('AC18 + VS-065.1 AC4: --force overwrites and includes Command fallback', () => {
    config()
    write('AGENTS.md', '# Mine')
    runAdaptersInstall('codex', { force: true })
    const out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out).toContain('Knowledge Driven Development')
    expect(out).toContain('## Command fallback')
    expect(out).toContain('corepack pnpm exec kaddo <command>')
  })

  it('VS-065.1 AC3: --dry-run preview includes the Command fallback section', () => {
    config()
    runAdaptersInstall('codex', { dryRun: true })
    expect(output()).toContain('## Command fallback')
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

describe('Codex adapter safe merge — block & state (VS-065.2)', () => {
  function ctx() { config(); return buildCodexAdapterContext(tmp) }

  it('AC4/AC5/AC13-AC18: the Kaddo block is delimited and carries the key guidance', () => {
    const block = renderKaddoBlock(ctx())
    expect(block.startsWith(KADDO_BEGIN_MARKER)).toBe(true)
    expect(block.trimEnd().endsWith(KADDO_END_MARKER)).toBe(true)
    expect(block).toContain('## Kaddo guidance')
    expect(block).toContain('### Command fallback')
    expect(block).toContain('corepack pnpm exec kaddo <command>')
    expect(block).toContain('open-questions readiness')
    expect(block).toContain('reading the active Work Item')
    expect(block).toContain('it is generated output') // .kaddo/ not edited by hand
    expect(block).toContain('kaddo guard')
    expect(block).toContain('kaddo impact')
    expect(block).toContain('kaddo savings')
    expect(block).toContain('kaddo drift')
  })

  it('detectAgentsState classifies all file states', () => {
    expect(detectAgentsState(null)).toBe('missing')
    expect(detectAgentsState('# Team\nstuff')).toBe('existing_external')
    expect(detectAgentsState('<!-- Generated by `kaddo adapters install codex`. -->\n# x')).toBe('generated_by_kaddo')
    expect(detectAgentsState(`x\n${KADDO_BEGIN_MARKER}\ny\n${KADDO_END_MARKER}\nz`)).toBe('existing_with_kaddo_block')
    expect(detectAgentsState(`x\n${KADDO_BEGIN_MARKER}\ny`)).toBe('invalid_kaddo_block')
    expect(detectAgentsState(`x\n${KADDO_END_MARKER}\ny`)).toBe('invalid_kaddo_block')
  })

  it('AC3/AC7/AC8: injectKaddoBlock appends, preserving content before and after', () => {
    const existing = '# Team instructions\n\nRun tests with `pnpm test`.\n'
    const { content, status } = injectKaddoBlock(existing, ctx())
    expect(status).toBe('injected')
    expect(content).toContain('# Team instructions')
    expect(content).toContain('Run tests with `pnpm test`.')
    expect(content).toContain(KADDO_BEGIN_MARKER)
    expect(content).toContain(KADDO_END_MARKER)
  })

  it('AC6/AC9: re-injecting updates the existing block without duplicating it', () => {
    const existing = '# Team\nkeep me\n'
    const once = injectKaddoBlock(existing, ctx()).content
    const twice = injectKaddoBlock(once, ctx())
    expect(twice.status).toBe('updated')
    expect(twice.content.split(KADDO_BEGIN_MARKER).length - 1).toBe(1)
    expect(twice.content.split(KADDO_END_MARKER).length - 1).toBe(1)
    expect(twice.content).toContain('keep me')
  })

  it('AC11: invalid (half-open) block throws', () => {
    expect(() => injectKaddoBlock(`x\n${KADDO_BEGIN_MARKER}\ny`, ctx())).toThrow(/Invalid Kaddo adapter block/)
  })
})

describe('kaddo adapters install codex --inject command (VS-065.2)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>
  const output = () => logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit') }) as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('AC3/AC7/AC8: --inject adds the block to an existing external file, preserving it', () => {
    config()
    write('AGENTS.md', '# Team instructions\n\nDo not change public APIs without approval.\n')
    runAdaptersInstall('codex', { inject: true })
    const out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out).toContain('# Team instructions')
    expect(out).toContain('Do not change public APIs without approval.')
    expect(out).toContain(KADDO_BEGIN_MARKER)
    expect(out).toContain('### Command fallback')
  })

  it('AC6/AC9: --inject twice updates without duplicating the block', () => {
    config()
    write('AGENTS.md', '# Team\nkeep\n')
    runAdaptersInstall('codex', { inject: true })
    runAdaptersInstall('codex', { inject: true })
    const out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out.split(KADDO_BEGIN_MARKER).length - 1).toBe(1)
    expect(out).toContain('keep')
  })

  it('--inject on a missing file creates the full projection', () => {
    config()
    runAdaptersInstall('codex', { inject: true })
    const out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out).toContain('# AGENTS.md')
    expect(out).toContain('Knowledge Driven Development')
  })

  it('AC10: --inject --dry-run shows the merged result without writing', () => {
    config()
    write('AGENTS.md', '# Team\nkeep\n')
    runAdaptersInstall('codex', { inject: true, dryRun: true })
    expect(output()).toContain(KADDO_BEGIN_MARKER)
    expect(output()).toContain('keep')
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe('# Team\nkeep\n')
  })

  it('AC11/AC12: invalid block errors and leaves the file untouched', () => {
    config()
    const bad = `# Team\n${KADDO_BEGIN_MARKER}\nhalf open\n`
    write('AGENTS.md', bad)
    expect(() => runAdaptersInstall('codex', { inject: true })).toThrow('exit')
    expect(errSpy.mock.calls.flat().join(' ')).toContain('Invalid Kaddo adapter block')
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe(bad)
  })

  it('AC22: --inject does not touch knowledge/ or .kaddo/', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B')
    write('AGENTS.md', '# Team\n')
    const kb = fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf-8')
    runAdaptersInstall('codex', { inject: true })
    expect(fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf-8')).toBe(kb)
  })
})
