import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ih-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function initProject(dir: string, multirepo = false) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: test-project', '  state: pre-ai', `  structure: ${multirepo ? 'multirepo' : 'monorepo'}`, 'team:', '  size: small'].join('\n'))
  if (multirepo) write(dir, '.kaddo/modules.yml', ['modules:', '  - id: frontend', '    path: ../frontend', '    role: module'].join('\n'))
}

const READY_WI = [
  '---', 'id: WI-010', 'title: Add user preferences', 'type: feature', 'status: ready',
  'affected_modules: [core, api]',
  'domains: [User Management, Settings]',
  'module_coverage:', '  core:', '    status: affected', '  api:', '    status: affected',
  'impact_analysis:', '  surfaces:', '    api:', '      status: affected',
  'scope_confidence:', '  level: high', '  reasons: [scope is clear]',
  '---', '',
  '# Add user preferences', '',
  '## Current behavior', '', 'No user preferences exist.', '',
  '## Target behavior', '', 'Users can set preferences.', '',
  '## Entry points', '', 'Settings page', '',
  '## Acceptance criteria', '', '- Users can update preferences.', '',
].join('\n')

const DRAFT_WI = [
  '---', 'id: WI-011', 'title: Draft item', 'type: feature', 'status: draft', '---', '',
  '# Draft item', '',
].join('\n')

const IN_PROGRESS_WI = [
  '---', 'id: WI-012', 'title: In progress item', 'type: feature', 'status: in-progress', '---', '',
  '# In progress item', '',
].join('\n')

describe('VS-110: Implementation Handoff — ready gate (AC-01)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('throws WorkItemNotReadyError for a draft Work Item', async () => {
    write(dir, 'knowledge/delivery/work-items/draft/WI-011.md', DRAFT_WI)
    const core = await import('../src/core.js')
    expect(() => core.buildImplementationHandoff(dir, 'WI-011')).toThrow(core.WorkItemNotReadyError)
  })

  it('throws WorkItemNotReadyError for an in-progress Work Item', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-012.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    expect(() => core.buildImplementationHandoff(dir, 'WI-012')).toThrow(core.WorkItemNotReadyError)
  })

  it('throws for an unknown Work Item', async () => {
    const core = await import('../src/core.js')
    expect(() => core.buildImplementationHandoff(dir, 'WI-999')).toThrow()
  })
})

describe('VS-110: Implementation Handoff — structure (AC-10, AC-11)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('produces handoff for a ready Work Item with correct fields', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.workItemId).toBe('WI-010')
    expect(h.title).toBe('Add user preferences')
    expect(h.projectName).toBe('test-project')
    expect(h.lifecycle).toBe('ready')
    expect(h.recommendedAgent).toBe('implementation-agent')
    expect(h.recommendedSkill).toBe('implementation-planning')
    expect(h.affectedModules).toEqual(['core', 'api'])
    expect(h.domains).toEqual(['User Management', 'Settings'])
    expect(h.scopeConfidence).toMatchObject({ level: 'high' })
    expect(typeof h.text).toBe('string')
  })
})

describe('VS-110: Implementation Handoff — design deliberation (AC-03)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('handoff text includes design deliberation prompts', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).toContain('Technical Approach')
    expect(h.text).toContain('Rationale')
  })
})

describe('VS-110: Implementation Handoff — context assembly (AC-02)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('handoff text includes context assembly sources', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).toContain('Work Item')
    expect(h.text).toContain('Knowledge')
    expect(h.text).toContain('System Context')
    expect(h.text).toContain('Repository Context')
    expect(h.text).toContain('Related Work Items')
  })

  it('includes multirepo guidance for multirepo projects', async () => {
    const mr = tmpDir(); initProject(mr, true)
    write(mr, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(mr, 'WI-010')
    expect(h.text).toContain('multirepo')
    expect(h.text).toContain('frontend')
    fs.rmSync(mr, { recursive: true, force: true })
  })

  it('omits multirepo guidance for monorepo', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).not.toContain('multirepo')
  })
})

describe('VS-110: Implementation Handoff — plan sections (AC-05, AC-06)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('handoff text includes implementation steps, validation, stop criteria', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).toMatch(/implementation steps/i)
    expect(h.text).toMatch(/validation/i)
    expect(h.text).toMatch(/stop criteria/i)
  })
})

describe('VS-110: Implementation Handoff — confirmation gate (AC-09)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('handoff text includes human confirmation gate', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).toMatch(/confirmation/i)
  })
})

describe('VS-110: Implementation Handoff — ADR recommendation (AC-07)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('recommends ADR when unmaterialized decision candidates exist', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    write(dir, 'knowledge/tech/discovery/decision-candidates.md', [
      '---', 'type: discovery', 'title: Decision Candidates', '---', '',
      '## Use PostgreSQL', '', 'We need to decide on database.', '',
    ].join('\n'))
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).toContain('adr-writing')
    expect(h.hasUnmaterializedDecisions).toBe(true)
  })

  it('omits ADR recommendation when no candidates exist', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).not.toContain('adr-writing')
    expect(h.hasUnmaterializedDecisions).toBe(false)
  })
})

describe('VS-110: Implementation Handoff — safety (AC-08, AC-10)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('the handoff contains no secrets or absolute paths', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-010')
    expect(h.text).not.toMatch(/api[_-]?key|secret|token/i)
    expect(h.text).not.toMatch(/[A-Za-z]:\\|\/home\/|\/Users\//)
  })

  it('handoff is a derived artifact — no files written', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const before = fs.readdirSync(path.join(dir, 'knowledge/delivery/work-items/ready'))
    const core = await import('../src/core.js')
    core.buildImplementationHandoff(dir, 'WI-010')
    const after = fs.readdirSync(path.join(dir, 'knowledge/delivery/work-items/ready'))
    expect(after).toEqual(before)
  })
})

describe('VS-110: Implementation Handoff — no regression (AC-12)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('buildRefinementHandoff still works alongside buildImplementationHandoff', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-010.md', READY_WI)
    const core = await import('../src/core.js')
    const refH = core.buildRefinementHandoff(dir, 'WI-010')
    expect(refH.workItemId).toBe('WI-010')
    expect(refH.recommendedAgent).toBe('work-item-agent')
    const implH = core.buildImplementationHandoff(dir, 'WI-010')
    expect(implH.workItemId).toBe('WI-010')
    expect(implH.recommendedAgent).toBe('implementation-agent')
  })
})
