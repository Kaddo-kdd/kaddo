import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import matter from 'gray-matter'
import {
  discoverInitiatives,
  getInitiative,
  nextInitiativeId,
  associatedWorkItems,
  computeInitiativeProgress,
  isValidInitiativeTransition,
  INITIATIVE_STATES,
} from '../src/core/initiative.js'
import {
  createInitiative,
  transitionInitiative,
  addCandidate,
  materializeCandidate,
  materializeRoadmapInitiative,
  InitiativeWriteError,
} from '../src/core/initiative-write.js'

function makeProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-initiative-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n',
  )
  fs.mkdirSync(path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft'), { recursive: true })
  return dir
}

function writeWorkItem(dir: string, id: string, status: string, initiative?: string): void {
  const fm: Record<string, unknown> = { id, type: 'feature', title: `${id} title`, status, knowledge_level: 'K2' }
  if (initiative) fm.initiative = initiative
  const content = matter.stringify(`\n# ${id}\n\nSummary.\n`, fm)
  fs.writeFileSync(path.join(dir, 'knowledge', 'delivery', 'work-items', status, `${id}.md`), content)
}

function ensureStatusDir(dir: string, status: string): void {
  fs.mkdirSync(path.join(dir, 'knowledge', 'delivery', 'work-items', status), { recursive: true })
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

describe('initiative lifecycle model', () => {
  it('defines the documented states', () => {
    expect(INITIATIVE_STATES).toEqual([
      'candidate', 'planned', 'in-progress', 'completed', 'deferred', 'cancelled',
    ])
  })

  it('validates transitions', () => {
    expect(isValidInitiativeTransition('planned', 'in-progress')).toBe(true)
    expect(isValidInitiativeTransition('in-progress', 'completed')).toBe(true)
    expect(isValidInitiativeTransition('planned', 'completed')).toBe(false)
    expect(isValidInitiativeTransition('completed', 'in-progress')).toBe(false)
  })
})

describe('initiative id generation (AC-02)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('starts at INI-001 and increments', () => {
    expect(nextInitiativeId(dir)).toBe('INI-001')
    createInitiative(dir, { title: 'First' })
    expect(nextInitiativeId(dir)).toBe('INI-002')
    createInitiative(dir, { title: 'Second' })
    expect(nextInitiativeId(dir)).toBe('INI-003')
  })
})

describe('initiative artifact + create (AC-01)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('creates and discovers an initiative artifact', () => {
    const ini = createInitiative(dir, { title: 'Authentication Foundation', domains: ['Identity'] })
    expect(ini.id).toBe('INI-001')
    expect(ini.status).toBe('planned')
    expect(ini.domains).toEqual(['Identity'])

    const file = path.join(dir, 'knowledge', 'delivery', 'initiatives', 'INI-001-authentication-foundation.md')
    expect(fs.existsSync(file)).toBe(true)

    const all = discoverInitiatives(dir)
    expect(all).toHaveLength(1)
    expect(getInitiative(dir, 'INI-001')?.title).toBe('Authentication Foundation')
    expect(getInitiative(dir, 'ini-001')?.id).toBe('INI-001') // case-insensitive
  })

  it('rejects empty title', () => {
    expect(() => createInitiative(dir, { title: '  ' })).toThrow(InitiativeWriteError)
  })
})

describe('initiative transitions', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('transitions planned → in-progress → completed and sets completed_at', () => {
    createInitiative(dir, { title: 'X' })
    expect(transitionInitiative(dir, 'INI-001', 'in-progress').status).toBe('in-progress')
    const done = transitionInitiative(dir, 'INI-001', 'completed')
    expect(done.status).toBe('completed')
    expect(done.rawFrontmatter.completed_at).toBeTruthy()
  })

  it('rejects an invalid transition', () => {
    createInitiative(dir, { title: 'X' })
    expect(() => transitionInitiative(dir, 'INI-001', 'completed')).toThrow(InitiativeWriteError)
  })
})

describe('candidates (AC-07) + planning progress (AC-09)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('adds candidates and auto-numbers ids', () => {
    createInitiative(dir, { title: 'X' })
    addCandidate(dir, 'INI-001', { title: 'Login form' })
    const ini = addCandidate(dir, 'INI-001', { title: 'Password reset' })
    expect(ini.candidates.map((c) => c.id)).toEqual(['WI-CANDIDATE-001', 'WI-CANDIDATE-002'])
  })

  it('reports planning coverage materialized/total', () => {
    createInitiative(dir, {
      title: 'X',
      candidates: [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
    })
    const before = computeInitiativeProgress(dir, getInitiative(dir, 'INI-001')!)
    expect(before.planning).toEqual({ totalCandidates: 3, materialized: 0, remaining: 3 })

    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')
    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-002')
    const after = computeInitiativeProgress(dir, getInitiative(dir, 'INI-001')!)
    expect(after.planning).toEqual({ totalCandidates: 3, materialized: 2, remaining: 1 })
  })
})

describe('candidate materialization (AC-08)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('materializes a candidate into a draft WI with initiative association + source', () => {
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login form', type: 'feature' }] })
    const result = materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')
    expect(result.workItemId).toBe('WI-001')

    const wiPath = path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft', result.fileName)
    const { data } = matter(fs.readFileSync(wiPath, 'utf-8'))
    expect(data.initiative).toBe('INI-001')
    expect(data.source).toBe('initiative')
    expect(data.source_id).toBe('WI-CANDIDATE-001')
    expect(data.status).toBe('draft')

    // candidate now marked materialized
    const cand = getInitiative(dir, 'INI-001')!.candidates[0]
    expect(cand.materializedAs).toBe('WI-001')
  })

  it('refuses to materialize the same candidate twice', () => {
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login form' }] })
    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')
    expect(() => materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')).toThrow(InitiativeWriteError)
  })
})

describe('work item association (AC-03, AC-04) + delivery progress (AC-10)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('resolves WIs associated to an initiative by metadata', () => {
    createInitiative(dir, { title: 'Auth' })
    ensureStatusDir(dir, 'completed')
    ensureStatusDir(dir, 'in-progress')
    writeWorkItem(dir, 'WI-010', 'completed', 'INI-001')
    writeWorkItem(dir, 'WI-011', 'in-progress', 'INI-001')
    writeWorkItem(dir, 'WI-012', 'draft') // standalone, no initiative

    const assoc = associatedWorkItems(dir, 'INI-001')
    expect(assoc.map((w) => w.id)).toEqual(['WI-010', 'WI-011'])

    const progress = computeInitiativeProgress(dir, getInitiative(dir, 'INI-001')!)
    expect(progress.delivery.total).toBe(2)
    expect(progress.delivery.byState.completed).toBe(1)
    expect(progress.delivery.byState['in-progress']).toBe(1)
  })

  it('a standalone WI (no initiative) is not associated and parses cleanly', () => {
    createInitiative(dir, { title: 'Auth' })
    writeWorkItem(dir, 'WI-020', 'draft')
    expect(associatedWorkItems(dir, 'INI-001')).toHaveLength(0)
  })
})

describe('roadmap materialization (AC-06)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('materializes an RM initiative into an INI preserving provenance and candidates', () => {
    const roadmap = [
      '# Roadmap',
      '',
      '## RM-001: Authentication Foundation',
      '',
      '**Related capabilities:** User Authentication',
      '**Candidate Work Items:**',
      '- WI-CANDIDATE-001: Login form',
      '  - type: feature',
      '- WI-CANDIDATE-002: Password reset',
      '  - type: feature',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(dir, 'knowledge', 'delivery', 'roadmap.md'), roadmap)

    const ini = materializeRoadmapInitiative(dir, 'RM-001')
    expect(ini.id).toBe('INI-001')
    expect(ini.title).toBe('Authentication Foundation')
    expect(ini.source).toBe('roadmap')
    expect(ini.sourceId).toBe('RM-001')
    expect(ini.candidates.map((c) => c.id)).toEqual(['WI-CANDIDATE-001', 'WI-CANDIDATE-002'])
  })

  it('throws when the RM id has no candidates', () => {
    fs.writeFileSync(path.join(dir, 'knowledge', 'delivery', 'roadmap.md'), '# Roadmap\n')
    expect(() => materializeRoadmapInitiative(dir, 'RM-099')).toThrow(InitiativeWriteError)
  })
})
