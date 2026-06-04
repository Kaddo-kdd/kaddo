import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { runAdd } from '../src/commands/add.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'
import { getModule } from '../src/modules/registry.js'

let tmpDir: string

const REQUIRED_SECTIONS = [
  '## Role',
  '## When to Use',
  '## Input Required',
  '## Expected Output',
  '## Instructions',
  '## Constraints',
  '## Output Format',
  '## Where to Save the Result',
  '## Quality Checklist',
]

const OPERATIONAL_AGENTS = [
  'work-item-agent.md',
  'git-strategy-agent.md',
  'security-agent.md',
  'standards-agent.md',
  'stack-agent.md',
  'module-design-agent.md',
]

function initProject() {
  fs.mkdirSync(path.join(tmpDir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(tmpDir, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: "demo"\n  state: pre-ai\n  structure: multirepo\nteam:\n  size: small\nmodules: []\n'
  )
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-op-agents-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('operational agents (VS-017)', () => {
  it('all six operational agents are registered', () => {
    const names = AGENT_PROMPTS.map((a) => a.fileName)
    for (const a of OPERATIONAL_AGENTS) {
      expect(names, `${a} missing`).toContain(a)
    }
  })

  it('each operational agent has all required contract sections', () => {
    for (const name of OPERATIONAL_AGENTS) {
      const agent = AGENT_PROMPTS.find((a) => a.fileName === name)!
      for (const section of REQUIRED_SECTIONS) {
        expect(agent.content, `${name} missing ${section}`).toContain(section)
      }
    }
  })

  it('each operational agent references the context pack', () => {
    for (const name of OPERATIONAL_AGENTS) {
      const agent = AGENT_PROMPTS.find((a) => a.fileName === name)!
      expect(agent.content, name).toContain('.kaddo/context-pack.md')
    }
  })

  it('git-strategy-agent states the default strategy', () => {
    const agent = AGENT_PROMPTS.find((a) => a.fileName === 'git-strategy-agent.md')!
    expect(agent.content).toContain('GitHub Flow')
    expect(agent.content).toContain('Conventional Commits')
    expect(agent.content).toContain('SemVer')
  })

  it('security-agent does not claim to perform security scanning', () => {
    const agent = AGENT_PROMPTS.find((a) => a.fileName === 'security-agent.md')!
    expect(agent.content.toLowerCase()).toContain('not')
    expect(agent.content.toLowerCase()).toContain('scanning')
    // explicitly disclaims scanning
    expect(agent.content).toMatch(/do not\s+perform\s+(?:security|vulnerability)?\s*(?:scanning|vulnerability scanning)/i)
  })

  it('kaddo add agents installs the operational agents', () => {
    initProject()
    runAdd('agents', tmpDir)
    for (const name of OPERATIONAL_AGENTS) {
      expect(fs.existsSync(path.join(tmpDir, 'knowledge', 'agents', name)), name).toBe(true)
    }
  })
})

describe('global doc modules (VS-017)', () => {
  it('registers standards, security, stack and git-strategy modules', () => {
    expect(getModule('standards')).toBeDefined()
    expect(getModule('security')).toBeDefined()
    expect(getModule('stack')).toBeDefined()
    expect(getModule('git-strategy')).toBeDefined()
  })

  it('kaddo add git-strategy creates the artifact and .kaddo/git.yml', () => {
    initProject()
    runAdd('git-strategy', tmpDir)
    expect(fs.existsSync(path.join(tmpDir, 'knowledge', 'tech', 'git-strategy.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.kaddo', 'git.yml'))).toBe(true)
    const md = fs.readFileSync(path.join(tmpDir, 'knowledge', 'tech', 'git-strategy.md'), 'utf8')
    expect(md).toContain('GitHub Flow')
  })

  it('kaddo add security creates a security doc that disclaims scanning', () => {
    initProject()
    runAdd('security', tmpDir)
    const md = fs.readFileSync(path.join(tmpDir, 'knowledge', 'tech', 'security.md'), 'utf8')
    expect(md.toLowerCase()).toContain('not')
    expect(md.toLowerCase()).toContain('scanning')
  })

  it('kaddo add standards and stack create their artifacts', () => {
    initProject()
    runAdd('standards', tmpDir)
    runAdd('stack', tmpDir)
    expect(fs.existsSync(path.join(tmpDir, 'knowledge', 'tech', 'standards.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'knowledge', 'tech', 'stack.md'))).toBe(true)
  })
})
