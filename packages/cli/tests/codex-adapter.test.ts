import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  buildCodexAdapterContext,
  renderAgentsMd,
  renderClaudeMd,
  renderKaddoBlock,
  detectAgentsState,
  detectPackageManager,
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
    expect(md).toContain('Do not fail immediately just because the global `kaddo` binary is missing')
  })

  it('VS-065.1-ref AC4-AC7/AC26-AC28: package-manager-aware fallbacks from lockfiles', () => {
    // pnpm
    config()
    write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
    expect(detectPackageManager(tmp)).toBe('pnpm')
    let md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).toContain('detected package manager: `pnpm`')
    expect(md).toContain('corepack pnpm exec kaddo <command>')
    expect(md).toContain('pnpm exec kaddo <command>')

    // npm
    fs.rmSync(path.join(tmp, 'pnpm-lock.yaml'))
    write('package-lock.json', '{}')
    expect(detectPackageManager(tmp)).toBe('npm')
    md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).toContain('detected package manager: `npm`')
    expect(md).toContain('npm exec kaddo <command>')
    expect(md).toContain('npx kaddo <command>')

    // yarn
    fs.rmSync(path.join(tmp, 'package-lock.json'))
    write('yarn.lock', '')
    expect(detectPackageManager(tmp)).toBe('yarn')
    expect(renderAgentsMd(buildCodexAdapterContext(tmp))).toContain('yarn kaddo <command>')

    // none → generic
    fs.rmSync(path.join(tmp, 'yarn.lock'))
    expect(detectPackageManager(tmp)).toBeUndefined()
    md = renderAgentsMd(buildCodexAdapterContext(tmp))
    expect(md).toContain('no package manager detected')
    expect(md).toContain('npx kaddo <command>')
  })

  it('VS-065.1-ref AC8: fallback tells the agent not to give up before trying locally', () => {
    config()
    expect(renderAgentsMd(buildCodexAdapterContext(tmp))).toContain(
      'Do not fail immediately just because the global `kaddo` binary is missing',
    )
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

describe('Claude Code adapter content (VS-066)', () => {
  it('AC3-AC18/AC30/AC31: CLAUDE.md is a projection with the shared Kaddo guidance', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nSECRET_BODY')
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n\nAGENT_BODY')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x')
    write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
    const md = renderClaudeMd(buildCodexAdapterContext(tmp))
    // Claude-specific header + title (AC8)
    expect(md).toContain('Generated by `kaddo adapters install claude`')
    expect(md).toContain('# CLAUDE.md')
    expect(md).not.toContain('# AGENTS.md')
    // Shared body (AC4-AC7, AC9-AC14)
    expect(md).toContain('Knowledge Driven Development')
    expect(md).toContain('knowledge/business/')
    expect(md).toContain('.kaddo/context-pack.md')
    expect(md).toContain('it is generated output')
    expect(md.toLowerCase()).toContain('open-questions readiness')
    expect(md).toContain('resolve, assume or defer')
    expect(md).toContain('reading the active Work Item')
    expect(md).toContain('Do not implement outside the scope of the active Work Item')
    expect(md).toContain('kaddo guard')
    expect(md).toContain('kaddo impact')
    expect(md).toContain('kaddo savings')
    expect(md).toContain('kaddo drift')
    // pm-aware fallback (AC15/AC16)
    expect(md).toContain('## Command fallback')
    expect(md).toContain('detected package manager: `pnpm`')
    // agents + skills (AC17/AC18)
    expect(md).toContain('## Available Kaddo agents')
    expect(md).toContain('`roadmap-agent`')
    expect(md).toContain('## Available Kaddo skills')
    expect(md).toContain('`adr-writing`')
    // no full-file inlining (AC30/AC31)
    expect(md).not.toContain('SECRET_BODY')
    expect(md).not.toContain('AGENT_BODY')
  })

  it('AC19/AC20/AC32-AC34: valid without agents/skills across project states', () => {
    for (const state of ['new', 'pre-ai', 'legacy']) {
      config('P', state)
      const md = renderClaudeMd(buildCodexAdapterContext(tmp))
      expect(md).toContain('# CLAUDE.md')
      expect(md).not.toContain('## Available Kaddo agents')
      expect(md).not.toContain('## Available Kaddo skills')
    }
  })
})

describe('kaddo adapters install claude command (VS-066)', () => {
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

  it('AC1/AC3: creates CLAUDE.md in the project root', () => {
    config()
    runAdaptersInstall('claude', {})
    const p = path.join(tmp, 'CLAUDE.md')
    expect(fs.existsSync(p)).toBe(true)
    expect(fs.readFileSync(p, 'utf-8')).toContain('# CLAUDE.md')
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false)
  })

  it('AC21: does not overwrite CLAUDE.md by default', () => {
    config()
    write('CLAUDE.md', '# Mine\nkeep')
    runAdaptersInstall('claude', {})
    expect(fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')).toBe('# Mine\nkeep')
  })

  it('AC22: --force overwrites CLAUDE.md', () => {
    config()
    write('CLAUDE.md', '# Mine')
    runAdaptersInstall('claude', { force: true })
    expect(fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')).toContain('Knowledge Driven Development')
  })

  it('AC23: --dry-run prints CLAUDE.md preview without writing', () => {
    config()
    runAdaptersInstall('claude', { dryRun: true })
    expect(output()).toContain('# CLAUDE.md preview')
    expect(fs.existsSync(path.join(tmp, 'CLAUDE.md'))).toBe(false)
  })

  it('AC25/AC26: does not touch knowledge/ or write AGENTS.md', () => {
    config()
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B')
    const kb = fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf-8')
    runAdaptersInstall('claude', {})
    expect(fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf-8')).toBe(kb)
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false)
  })

  it('unknown adapter errors and lists available targets', () => {
    config()
    expect(() => runAdaptersInstall('cursor', {})).toThrow('exit')
    expect(errSpy.mock.calls.flat().join(' ')).toContain('codex, claude')
  })

  it('AC13/AC15: --inject adds/updates only the Kaddo block in an existing CLAUDE.md, preserving team content', () => {
    config()
    write('CLAUDE.md', '# Team rules\n\nDo not change public APIs without approval.\n')
    runAdaptersInstall('claude', { inject: true })
    let out = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')
    expect(out).toContain('# Team rules')
    expect(out).toContain('Do not change public APIs without approval.')
    expect(out).toContain(KADDO_BEGIN_MARKER)
    // Re-inject updates in place, no duplicate block.
    runAdaptersInstall('claude', { inject: true })
    out = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')
    expect(out.split(KADDO_BEGIN_MARKER).length - 1).toBe(1)
    expect(out).toContain('# Team rules')
  })

  it('AC1/AC3: --inject on a fully Kaddo-generated CLAUDE.md does nothing (no duplicated guidance)', () => {
    config()
    runAdaptersInstall('claude', {}) // full generated file (header, no markers)
    const before = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')
    expect(before).not.toContain(KADDO_BEGIN_MARKER)
    runAdaptersInstall('claude', { inject: true })
    const after = fs.readFileSync(path.join(tmp, 'CLAUDE.md'), 'utf-8')
    expect(after).toBe(before) // unchanged
    expect(after.split(KADDO_BEGIN_MARKER).length - 1).toBe(0) // no injected block
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

  it('uses target-neutral markers (no "CODEX" in a generated block)', () => {
    expect(KADDO_BEGIN_MARKER).toBe('<!-- BEGIN KADDO ADAPTER -->')
    expect(renderKaddoBlock(ctx())).not.toContain('CODEX')
  })

  it('recognizes and migrates the legacy Codex marker on update', () => {
    const legacy = `# Team\n\n<!-- BEGIN KADDO CODEX ADAPTER -->\nold guidance\n<!-- END KADDO CODEX ADAPTER -->\n\ntail\n`
    expect(detectAgentsState(legacy)).toBe('existing_with_kaddo_block')
    const { content, status } = injectKaddoBlock(legacy, ctx())
    expect(status).toBe('updated')
    expect(content).not.toContain('KADDO CODEX ADAPTER') // migrated to neutral
    expect(content).toContain(KADDO_BEGIN_MARKER)
    expect(content).toContain('# Team')
    expect(content).toContain('tail')
    expect(content.split(KADDO_BEGIN_MARKER).length - 1).toBe(1)
  })
})

describe('OpenCode adapter (VS-067)', () => {
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

  it('AC1/AC3/AC4-AC18: creates AGENTS.md with the OpenCode header and shared guidance', () => {
    config()
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n\nAGENT_BODY')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x')
    write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
    runAdaptersInstall('opencode', {})
    const md = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(md).toContain('Generated by `kaddo adapters install opencode`')
    expect(md).toContain('# AGENTS.md')
    expect(md).toContain('Knowledge Driven Development')
    expect(md).toContain('knowledge/business/')
    expect(md).toContain('.kaddo/context-pack.md')
    expect(md).toContain('it is generated output')
    expect(md.toLowerCase()).toContain('open-questions readiness')
    expect(md).toContain('reading the active Work Item')
    expect(md).toContain('kaddo guard')
    expect(md).toContain('kaddo drift')
    expect(md).toContain('detected package manager: `pnpm`')
    expect(md).toContain('`roadmap-agent`')
    expect(md).toContain('`adr-writing`')
    expect(md).not.toContain('AGENT_BODY')
  })

  it('AC2: export opencode alias creates the file', () => {
    config()
    runAdaptersInstall('opencode', {})
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(true)
  })

  it('AC21/AC22/AC23: skip by default, --force overwrites, --dry-run previews', () => {
    config()
    write('AGENTS.md', '# Mine\nkeep')
    runAdaptersInstall('opencode', {})
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe('# Mine\nkeep')
    runAdaptersInstall('opencode', { force: true })
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toContain('install opencode')
    fs.rmSync(path.join(tmp, 'AGENTS.md'))
    runAdaptersInstall('opencode', { dryRun: true })
    expect(output()).toContain('# AGENTS.md preview')
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false)
  })

  it('AC24/AC25: --inject adds then updates the Kaddo block in a team-owned file, no dup', () => {
    config()
    write('AGENTS.md', '# Team agent instructions\n\nUse Conventional Commits.\n')
    runAdaptersInstall('opencode', { inject: true })
    let out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out).toContain('# Team agent instructions')
    expect(out).toContain('Use Conventional Commits.')
    expect(out).toContain(KADDO_BEGIN_MARKER)
    runAdaptersInstall('opencode', { inject: true })
    out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out.split(KADDO_BEGIN_MARKER).length - 1).toBe(1)
  })

  it('AC26/AC27: --inject on a fully Kaddo-generated AGENTS.md does nothing', () => {
    config()
    runAdaptersInstall('opencode', {})
    const before = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    runAdaptersInstall('opencode', { inject: true })
    const after = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(after).toBe(before)
    expect(after.split(KADDO_BEGIN_MARKER).length - 1).toBe(0)
  })

  it('AC28: --inject with half-open markers errors, file untouched', () => {
    config()
    const bad = `# Team\n${KADDO_BEGIN_MARKER}\nhalf open\n`
    write('AGENTS.md', bad)
    expect(() => runAdaptersInstall('opencode', { inject: true })).toThrow('exit')
    expect(errSpy.mock.calls.flat().join(' ')).toContain('Invalid Kaddo adapter block')
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe(bad)
  })

  it('AC19/AC20/AC37-AC39: valid with no agents/skills across project states', () => {
    for (const state of ['new', 'pre-ai', 'legacy']) {
      config('P', state)
      runAdaptersInstall('opencode', { force: true })
      const md = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
      expect(md).toContain('# AGENTS.md')
      expect(md).not.toContain('## Available Kaddo agents')
    }
  })

  it('unknown adapter lists codex, claude and opencode', () => {
    config()
    expect(() => runAdaptersInstall('cursor', {})).toThrow('exit')
    expect(errSpy.mock.calls.flat().join(' ')).toContain('codex, claude, opencode')
  })
})

describe('Antigravity adapter (VS-068)', () => {
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

  it('AC1/AC3/AC4-AC18: creates AGENTS.md with the Antigravity header and shared guidance', () => {
    config()
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n\nAGENT_BODY')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x')
    write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
    runAdaptersInstall('antigravity', {})
    const md = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(md).toContain('Generated by `kaddo adapters install antigravity`')
    expect(md).toContain('# AGENTS.md')
    expect(md).toContain('Knowledge Driven Development')
    expect(md).toContain('knowledge/business/')
    expect(md).toContain('.kaddo/context-pack.md')
    expect(md).toContain('it is generated output')
    expect(md.toLowerCase()).toContain('open-questions readiness')
    expect(md).toContain('reading the active Work Item')
    expect(md).toContain('kaddo guard')
    expect(md).toContain('kaddo drift')
    expect(md).toContain('detected package manager: `pnpm`')
    expect(md).toContain('`roadmap-agent`')
    expect(md).toContain('`adr-writing`')
    expect(md).not.toContain('AGENT_BODY')
  })

  it('AC2: export antigravity alias creates the file', () => {
    config()
    runAdaptersInstall('antigravity', {})
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(true)
  })

  it('AC21/AC22/AC23: skip by default, --force overwrites, --dry-run previews', () => {
    config()
    write('AGENTS.md', '# Mine\nkeep')
    runAdaptersInstall('antigravity', {})
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe('# Mine\nkeep')
    runAdaptersInstall('antigravity', { force: true })
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toContain('install antigravity')
    fs.rmSync(path.join(tmp, 'AGENTS.md'))
    runAdaptersInstall('antigravity', { dryRun: true })
    expect(output()).toContain('# AGENTS.md preview')
    expect(fs.existsSync(path.join(tmp, 'AGENTS.md'))).toBe(false)
  })

  it('AC24/AC25: --inject adds then updates the Kaddo block in a team-owned file, no dup', () => {
    config()
    write('AGENTS.md', '# Team agent instructions\n\nUse Conventional Commits.\n')
    runAdaptersInstall('antigravity', { inject: true })
    let out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out).toContain('# Team agent instructions')
    expect(out).toContain('Use Conventional Commits.')
    expect(out).toContain(KADDO_BEGIN_MARKER)
    runAdaptersInstall('antigravity', { inject: true })
    out = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(out.split(KADDO_BEGIN_MARKER).length - 1).toBe(1)
  })

  it('AC26/AC27: --inject on a fully Kaddo-generated AGENTS.md does nothing', () => {
    config()
    runAdaptersInstall('antigravity', {})
    const before = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    runAdaptersInstall('antigravity', { inject: true })
    const after = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(after).toBe(before)
    expect(after.split(KADDO_BEGIN_MARKER).length - 1).toBe(0)
  })

  it('AC28: --inject with half-open markers errors, file untouched', () => {
    config()
    const bad = `# Team\n${KADDO_BEGIN_MARKER}\nhalf open\n`
    write('AGENTS.md', bad)
    expect(() => runAdaptersInstall('antigravity', { inject: true })).toThrow('exit')
    expect(errSpy.mock.calls.flat().join(' ')).toContain('Invalid Kaddo adapter block')
    expect(fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')).toBe(bad)
  })

  it('AC19/AC20/AC37-AC39: valid with no agents/skills across project states', () => {
    for (const state of ['new', 'pre-ai', 'legacy']) {
      config('P', state)
      runAdaptersInstall('antigravity', { force: true })
      const md = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
      expect(md).toContain('# AGENTS.md')
      expect(md).not.toContain('## Available Kaddo agents')
    }
  })

  it('unknown adapter lists codex, claude, opencode and antigravity', () => {
    config()
    expect(() => runAdaptersInstall('cursor', {})).toThrow('exit')
    expect(errSpy.mock.calls.flat().join(' ')).toContain('codex, claude, opencode, antigravity')
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

  it('VS-066.1 AC2/AC3: --inject on a fully Kaddo-generated AGENTS.md does nothing', () => {
    config()
    runAdaptersInstall('codex', {}) // full generated file (header, no markers)
    const before = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(before).not.toContain(KADDO_BEGIN_MARKER)
    runAdaptersInstall('codex', { inject: true })
    const after = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf-8')
    expect(after).toBe(before)
    expect(after.split(KADDO_BEGIN_MARKER).length - 1).toBe(0)
  })
})
