import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import matter from 'gray-matter'
import {
  analyzeInitiative,
  evaluateInitiativeCompletion,
  parseSuccessCriteria,
} from '../src/core/initiative-analysis.js'
import { getInitiative } from '../src/core/initiative.js'
import { createInitiative, materializeCandidate, transitionInitiative } from '../src/core/initiative-write.js'

function makeProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ini-analysis-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n',
  )
  fs.mkdirSync(path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft'), { recursive: true })
  return dir
}

function setWorkItemStatus(dir: string, wiId: string, status: string): void {
  // Move the draft WI to a lifecycle folder with the given status.
  const draftDir = path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft')
  const file = fs.readdirSync(draftDir).find((f) => f.startsWith(wiId))
  if (!file) throw new Error(`WI ${wiId} not found in draft`)
  const raw = fs.readFileSync(path.join(draftDir, file), 'utf-8')
  const { data, content } = matter(raw, {})
  data.status = status
  const destDir = path.join(dir, 'knowledge', 'delivery', 'work-items', status)
  fs.mkdirSync(destDir, { recursive: true })
  fs.writeFileSync(path.join(destDir, file), matter.stringify(content, data))
  fs.unlinkSync(path.join(draftDir, file))
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

describe('parseSuccessCriteria', () => {
  it('parses checklist items and ignores placeholders', () => {
    const body = [
      '## Success Criteria',
      '',
      '- [x] Users can log in',
      '- [ ] Users can reset passwords',
      '- Lockout after 5 attempts',
      '',
      '## Dependencies',
      '- [ ] something else',
    ].join('\n')
    const criteria = parseSuccessCriteria(body)
    expect(criteria).toHaveLength(3)
    expect(criteria[0]).toEqual({ text: 'Users can log in', checked: true })
    expect(criteria[1]).toEqual({ text: 'Users can reset passwords', checked: false })
    expect(criteria[2]).toEqual({ text: 'Lockout after 5 attempts', checked: null })
  })

  it('returns empty when there is no section', () => {
    expect(parseSuccessCriteria('# Title\n\nNo criteria here.')).toEqual([])
  })
})

describe('analyzeInitiative (AC-16, AC-17, AC-18)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('flags pending candidates as committed-but-uncovered scope', () => {
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login' }, { title: 'Reset' }] })
    const analysis = analyzeInitiative(dir, getInitiative(dir, 'INI-001')!)
    const pending = analysis.findings.find((f) => f.code === 'pending-candidates')
    expect(pending?.severity).toBe('blocking')
    expect(analysis.suggestedCandidates).toHaveLength(2)
  })

  it('re-analysis after delivery surfaces remaining gaps (incremental)', () => {
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login' }, { title: 'Reset' }] })
    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')
    setWorkItemStatus(dir, 'WI-001', 'completed')
    const analysis = analyzeInitiative(dir, getInitiative(dir, 'INI-001')!)
    // One candidate still pending → still a gap, suggested for materialization.
    expect(analysis.suggestedCandidates.map((c) => c.id)).toEqual(['WI-CANDIDATE-002'])
    expect(analysis.progress.delivery.byState.completed).toBe(1)
  })

  it('suggested candidates are always grounded (they exist on the initiative)', () => {
    createInitiative(dir, {
      title: 'Auth',
      candidates: [{ title: 'Login', sourceSignals: ['capability gap: authentication'] }],
    })
    const analysis = analyzeInitiative(dir, getInitiative(dir, 'INI-001')!)
    expect(analysis.suggestedCandidates[0].sourceSignals).toContain('capability gap: authentication')
  })
})

describe('evaluateInitiativeCompletion (AC-19, AC-20)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('is not ready while candidates remain pending', () => {
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login' }] })
    const r = evaluateInitiativeCompletion(dir, getInitiative(dir, 'INI-001')!)
    expect(r.ready).toBe(false)
    expect(r.reasons.join(' ')).toMatch(/candidate/i)
  })

  it('detects uncovered success criteria even when all Work Items are completed (AC-19)', () => {
    const body = [
      '# Auth',
      '## Success Criteria',
      '- [x] Login works',
      '- [ ] Password recovery works',
      '## Learning',
      '',
    ].join('\n')
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login' }], body })
    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')
    setWorkItemStatus(dir, 'WI-001', 'completed')
    const r = evaluateInitiativeCompletion(dir, getInitiative(dir, 'INI-001')!)
    expect(r.ready).toBe(false)
    expect(r.reasons.join(' ')).toMatch(/uncovered/i)
  })

  it('is ready when scope is covered and all Work Items completed', () => {
    const body = ['# Auth', '## Success Criteria', '- [x] Login works', ''].join('\n')
    createInitiative(dir, { title: 'Auth', candidates: [{ title: 'Login' }], body })
    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')
    setWorkItemStatus(dir, 'WI-001', 'completed')
    const r = evaluateInitiativeCompletion(dir, getInitiative(dir, 'INI-001')!)
    expect(r.ready).toBe(true)
    expect(r.reasons).toHaveLength(0)
  })

  it('never transitions the initiative (reports only — human gate)', () => {
    createInitiative(dir, { title: 'Auth' })
    transitionInitiative(dir, 'INI-001', 'in-progress')
    evaluateInitiativeCompletion(dir, getInitiative(dir, 'INI-001')!)
    expect(getInitiative(dir, 'INI-001')!.status).toBe('in-progress') // unchanged
  })
})
