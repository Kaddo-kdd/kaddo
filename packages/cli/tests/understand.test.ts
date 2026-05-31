import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import { buildUnderstandPlan } from '../src/core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../src/templates/understand-template.js'
import { runUnderstand } from '../src/commands/understand.js'

let tmpDir: string
let origCwd: string

function writeConfig(state = 'pre-ai') {
  const full = path.join(tmpDir, '.kaddo', 'config.yml')
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(
    full,
    [
      'version: 1',
      'project:',
      '  name: "demo"',
      `  state: ${state}`,
      '  structure: monorepo',
      'team:',
      '  size: indie',
    ].join('\n')
  )
}

function installAgents(...names: string[]) {
  const agentsDir = path.join(tmpDir, 'architecture', 'agents')
  fs.mkdirSync(agentsDir, { recursive: true })
  for (const n of names) fs.writeFileSync(path.join(agentsDir, n), '# agent')
}

const ALL_AGENTS = [
  'capability-agent.md',
  'architecture-agent.md',
  'roadmap-agent.md',
  'legacy-agent.md',
  'adr-agent.md',
]

function plan() {
  return buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-understand-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('understand — buildUnderstandPlan', () => {
  it('recommends roadmap then architecture for new projects', () => {
    writeConfig('new')
    const p = plan()
    expect(p.steps.map((s) => s.agent)).toEqual(['roadmap-agent.md', 'architecture-agent.md'])
    expect(p.steps[0].output).toBe('architecture/roadmap.md')
  })

  it('recommends capability-first for pre-ai projects', () => {
    writeConfig('pre-ai')
    const p = plan()
    expect(p.steps.map((s) => s.agent)).toEqual([
      'capability-agent.md',
      'architecture-agent.md',
      'roadmap-agent.md',
    ])
    expect(p.steps[0].output).toBe('architecture/capabilities.md')
  })

  it('recommends a four-step legacy-first flow for legacy projects', () => {
    writeConfig('legacy')
    const p = plan()
    expect(p.steps.map((s) => s.agent)).toEqual([
      'legacy-agent.md',
      'architecture-agent.md',
      'capability-agent.md',
      'roadmap-agent.md',
    ])
    expect(p.steps[0].output).toBe('architecture/legacy/risks.md')
  })

  it('flags missing agents and marks agentsInstalled false', () => {
    writeConfig('pre-ai')
    const p = plan()
    expect(p.agentsInstalled).toBe(false)
    expect(p.missingAgents).toContain('capability-agent.md')
  })

  it('marks agentsInstalled true when recommended agents exist', () => {
    writeConfig('pre-ai')
    installAgents(...ALL_AGENTS)
    const p = plan()
    expect(p.agentsInstalled).toBe(true)
    expect(p.missingAgents).toEqual([])
  })

  it('reports scan availability', () => {
    writeConfig('pre-ai')
    expect(plan().scanAvailable).toBe(false)
    fs.writeFileSync(path.join(tmpDir, '.kaddo', 'scan.json'), '{}')
    expect(plan().scanAvailable).toBe(true)
  })
})

describe('understand — rendering', () => {
  it('renders the markdown handoff with all sections and CLI-vs-LLM note', () => {
    writeConfig('pre-ai')
    const md = renderUnderstand(plan())
    expect(md).toContain('# Kaddo Understand Handoff')
    expect(md).toContain('## Recommended Agent Flow')
    expect(md).toContain('## Expected Outputs')
    expect(md).toContain('## Copy/Paste Instructions')
    expect(md).toContain('Kaddo does not call an LLM')
    expect(md).toContain('architecture/capabilities.md')
  })

  it('terminal output names the first agent and target output', () => {
    writeConfig('pre-ai')
    const out = renderUnderstandTerminal(plan())
    expect(out).toContain('First step: use capability-agent.')
    expect(out).toContain('Expected output: architecture/capabilities.md')
  })
})

describe('understand — runUnderstand command', () => {
  it('errors when project is not initialized', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => runUnderstand()).toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not initialized'))
    expect(exitSpy).toHaveBeenCalled()
    cwdSpy.mockRestore()
  })

  it('generates context-pack.md and understand.md', () => {
    writeConfig('pre-ai')
    installAgents(...ALL_AGENTS)
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    vi.spyOn(console, 'log').mockImplementation(() => {})

    runUnderstand()

    expect(fs.existsSync(path.join(tmpDir, '.kaddo', 'context-pack.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.kaddo', 'understand.md'))).toBe(true)
    const md = fs.readFileSync(path.join(tmpDir, '.kaddo', 'understand.md'), 'utf8')
    expect(md).toContain('# Kaddo Understand Handoff')
    cwdSpy.mockRestore()
  })
})
