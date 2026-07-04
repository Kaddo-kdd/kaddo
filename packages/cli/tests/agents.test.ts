import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { runAdd } from '../src/commands/add.js'
import { agentsModule } from '../src/modules/agents.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'
import { agentInstallPath } from '../src/agents/groups.js'

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
  // Agents install into per-layer folders (knowledge/agents/<group>/<name>).
  return path.join(tmpDir, agentInstallPath(name))
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-agents-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('agents module — prompt pack source', () => {
  it('defines the five base understanding agents first', () => {
    const names = AGENT_PROMPTS.map((a) => a.fileName)
    expect(names.slice(0, 5)).toEqual([
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

  it('agents module installs into per-layer folders under knowledge/agents', () => {
    expect(agentsModule.dirs).toContain('knowledge/agents')
    const paths = agentsModule.files.map((f) => f.path)
    for (const a of AGENT_PROMPTS) {
      expect(paths).toContain(agentInstallPath(a.fileName))
    }
    // sanity: each agent lives in a group subfolder, not flat
    expect(paths).toContain('knowledge/agents/product/capability-agent.md')
    expect(paths).toContain('knowledge/agents/tech/codebase-agent.md')
  })
})

describe('roadmap-agent — structured output (VS-009)', () => {
  const roadmap = () => {
    const a = AGENT_PROMPTS.find((p) => p.fileName === 'roadmap-agent.md')
    if (!a) throw new Error('roadmap-agent.md not found')
    return a.content
  }

  it('directs the output to knowledge/delivery/roadmap.md', () => {
    expect(roadmap()).toContain('knowledge/delivery/roadmap.md')
  })

  it('includes grounded initiative fields (VS-077)', () => {
    const c = roadmap()
    for (const field of [
      '**Related domain:**',
      '**Related capabilities:**',
      '**Source signals:**',
      '**Expected value:**',
      '**Risks:**',
      '**Dependencies:**',
      '### RM-001',
    ]) {
      expect(c, `missing ${field}`).toContain(field)
    }
  })

  it('includes a Suggested Work Items section without materializing them (VS-077)', () => {
    const c = roadmap()
    expect(c).toContain('Suggested Work Items')
    expect(c).toContain('WI-CANDIDATE-001')
    expect(c).toContain('Never create files under `knowledge/delivery/work-items/`')
  })

  it('suggests a Knowledge Level for initiatives', () => {
    const c = roadmap()
    expect(c).toContain('Suggested Knowledge Level')
    expect(c).toMatch(/K1 \/ K2 \/ K3 \/ K4/)
  })

  it('requires grounding and a Not Now section (VS-077)', () => {
    const c = roadmap()
    expect(c).toContain('## Assumptions')
    expect(c).toContain('Grounding rules')
    expect(c).toContain('## Not Now')
  })

  it('adapts priorities to project states', () => {
    const c = roadmap()
    expect(c).toContain('new')
    expect(c).toContain('pre-ai')
    expect(c).toContain('legacy')
  })

  it('marks initiatives as candidates, not decisions, and forbids code', () => {
    const c = roadmap()
    expect(c.toLowerCase()).toContain('candidate')
    expect(c).toContain('Do not write code')
  })

  it('references the future kaddo create --from roadmap bridge', () => {
    expect(roadmap()).toContain('kaddo create --from roadmap')
  })
})

describe('kaddo add agents', () => {
  it('installs every agent with --all', () => {
    initProject()
    runAdd('agents', { all: true }, tmpDir)

    expect(fs.existsSync(path.join(tmpDir, 'knowledge', 'agents'))).toBe(true)
    for (const a of AGENT_PROMPTS) {
      expect(fs.existsSync(agentsDirFile(a.fileName))).toBe(true)
    }
  })

  it('installs only the recommended set by default (progressive)', () => {
    initProject() // state defaults; pre-ai recommended set
    runAdd('agents', {}, tmpDir)
    // recommended for pre-ai includes capability + architecture, not git-strategy
    expect(fs.existsSync(agentsDirFile('capability-agent.md'))).toBe(true)
    expect(fs.existsSync(agentsDirFile('architecture-agent.md'))).toBe(true)
    expect(fs.existsSync(agentsDirFile('git-strategy-agent.md'))).toBe(false)
  })

  it('installs a single group with --group', () => {
    initProject()
    runAdd('agents', { group: 'tech' }, tmpDir)
    expect(fs.existsSync(agentsDirFile('codebase-agent.md'))).toBe(true)
    expect(fs.existsSync(agentsDirFile('stack-agent.md'))).toBe(true)
    expect(fs.existsSync(agentsDirFile('business-agent.md'))).toBe(false)
  })

  it('does not overwrite an existing agent file (partial install)', () => {
    initProject()
    // Pre-create one agent with custom content (in its layer folder).
    fs.mkdirSync(path.dirname(agentsDirFile('capability-agent.md')), { recursive: true })
    fs.writeFileSync(agentsDirFile('capability-agent.md'), 'CUSTOM EDIT')

    runAdd('agents', { all: true }, tmpDir)

    // Existing file preserved, missing ones installed.
    expect(fs.readFileSync(agentsDirFile('capability-agent.md'), 'utf8')).toBe('CUSTOM EDIT')
    expect(fs.existsSync(agentsDirFile('roadmap-agent.md'))).toBe(true)
  })

  it('shows a helpful error when project is not initialized', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => runAdd('agents', {}, tmpDir)).toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not initialized'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
