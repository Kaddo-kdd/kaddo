import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { runAdd } from '../src/commands/add.js'
import { agentsModule } from '../src/modules/agents.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'

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

function initProject() {
  fs.mkdirSync(path.join(tmpDir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(tmpDir, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: "demo"\n  state: pre-ai\n  structure: monorepo\nteam:\n  size: indie\nmodules: []\n'
  )
}

function agentsDirFile(name: string): string {
  return path.join(tmpDir, 'architecture', 'agents', name)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-agents-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('agents module — prompt pack source', () => {
  it('defines the five base agents', () => {
    const names = AGENT_PROMPTS.map((a) => a.fileName)
    expect(names).toEqual([
      'capability-agent.md',
      'architecture-agent.md',
      'roadmap-agent.md',
      'legacy-agent.md',
      'adr-agent.md',
    ])
  })

  it('every agent prompt contains all required contract sections', () => {
    for (const agent of AGENT_PROMPTS) {
      for (const section of REQUIRED_SECTIONS) {
        expect(agent.content, `${agent.fileName} missing ${section}`).toContain(section)
      }
    }
  })

  it('every agent references the context pack as input', () => {
    for (const agent of AGENT_PROMPTS) {
      expect(agent.content, agent.fileName).toContain('.kaddo/context-pack.md')
    }
  })

  it('agents module installs into architecture/agents', () => {
    expect(agentsModule.dirs).toContain('architecture/agents')
    const paths = agentsModule.files.map((f) => f.path)
    for (const a of AGENT_PROMPTS) {
      expect(paths).toContain(`architecture/agents/${a.fileName}`)
    }
  })
})

describe('kaddo add agents', () => {
  it('creates architecture/agents/ and installs all base agents', () => {
    initProject()
    runAdd('agents', tmpDir)

    expect(fs.existsSync(path.join(tmpDir, 'architecture', 'agents'))).toBe(true)
    for (const a of AGENT_PROMPTS) {
      expect(fs.existsSync(agentsDirFile(a.fileName))).toBe(true)
    }
  })

  it('does not overwrite an existing agent file (partial install)', () => {
    initProject()
    // Pre-create one agent with custom content.
    fs.mkdirSync(path.join(tmpDir, 'architecture', 'agents'), { recursive: true })
    fs.writeFileSync(agentsDirFile('capability-agent.md'), 'CUSTOM EDIT')

    runAdd('agents', tmpDir)

    // Existing file preserved, missing ones installed.
    expect(fs.readFileSync(agentsDirFile('capability-agent.md'), 'utf8')).toBe('CUSTOM EDIT')
    expect(fs.existsSync(agentsDirFile('roadmap-agent.md'))).toBe(true)
  })

  it('shows a helpful error when project is not initialized', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => runAdd('agents', tmpDir)).toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not initialized'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
