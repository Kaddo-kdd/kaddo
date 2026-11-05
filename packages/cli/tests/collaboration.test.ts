import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { getInitiativeCollaboration, getEpicCollaboration, getPlanCollaboration, matchesWorkItemReference } from '../src/core/collaboration.js'
import { observeGit } from '../src/services/git.js'

describe('Work Item collaboration correlation', () => {
  it('accepts an exact, case-insensitive Work Item token', () => {
    expect(matchesWorkItemReference('feat: complete WI-077 reporting', 'WI-077')).toBe(true)
    expect(matchesWorkItemReference('fix(wi-077): preserve assignments', 'WI-077')).toBe(true)
    expect(matchesWorkItemReference('feat: complete AN-042 evidence', 'AN-042')).toBe(true)
  })

  it('rejects prefixes, suffixes and file-only-like text', () => {
    expect(matchesWorkItemReference('feat: WI-0770 follow-up', 'WI-077')).toBe(false)
    expect(matchesWorkItemReference('feat: xWI-077 work', 'WI-077')).toBe(false)
    expect(matchesWorkItemReference('packages/component-WI-077.ts', 'WI-077')).toBe(false)
    expect(matchesWorkItemReference('feat: AN-0420', 'AN-042')).toBe(false)
  })
})

describe('bounded Git observation', () => {
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-git-bounds-'))
    fs.writeFileSync(path.join(dir, 'README.md'), 'fixture')
    for (const args of [['init'], ['config', 'user.name', 'Fixture'], ['config', 'user.email', 'fixture@example.test'], ['add', '.'], ['commit', '-m', 'seed']]) execFileSync('git', args, { cwd: dir })
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('clamps requested commit observation to the documented safety range', async () => {
    expect((await observeGit(dir, 999)).limit).toBe(250)
    expect((await observeGit(dir, 0)).limit).toBe(1)
  })
  it('reports a non-repository without throwing or broadening the scan', async () => {
    const noGit = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-no-git-'))
    try { expect((await observeGit(noGit)).availability).toBe('unavailable') } finally { fs.rmSync(noGit, { recursive: true, force: true }) }
  })
})

describe('WI-077 shared commit traceability', () => {
  let dir: string
  const write = (rel: string, content: string) => {
    const target = path.join(dir, rel)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-collab-'))
    write('.kaddo/config.yml', 'version: 1\nproject:\n  name: fixture\n  state: ai-assisted\n  structure: monorepo\nteam:\n  size: small\n')
    write('knowledge/delivery/plans/PLAN-001.md', '---\ntype: delivery-plan\nid: PLAN-001\ntitle: Plan\nstatus: in-progress\n---\n# Plan\n')
    write('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: Epic\nstatus: in-progress\nplan: PLAN-001\n---\n# Epic\n')
    for (const id of ['INI-001', 'INI-002']) write(`knowledge/delivery/initiatives/${id}.md`, `---\ntype: initiative\nid: ${id}\ntitle: ${id}\nstatus: in-progress\nepic: EP-001\n---\n# ${id}\n`)
    for (const [id, initiative] of [['WI-TEST-001', 'INI-001'], ['WI-TEST-002', 'INI-001'], ['WI-TEST-003', 'INI-002']] as const) write(`knowledge/delivery/work-items/draft/${id}.md`, `---\ntype: feature\nid: ${id}\ntitle: ${id}\nstatus: draft\ninitiative: ${initiative}\n---\n# ${id}\n`)
    for (const args of [['init'], ['config', 'user.name', 'Fixture'], ['config', 'user.email', 'fixture@example.test'], ['add', '.'], ['commit', '-m', 'feat: WI-TEST-001 WI-TEST-002']]) execFileSync('git', args, { cwd: dir })
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('deduplicates the commit while preserving both Work Item origins in Initiative, Epic and Plan', async () => {
    for (const aggregate of [await getInitiativeCollaboration(dir, 'INI-001'), await getEpicCollaboration(dir, 'EP-001'), await getPlanCollaboration(dir, 'PLAN-001')]) {
      expect(aggregate.linkedCommits).toHaveLength(1)
      expect(aggregate.linkedCommits[0].workItemIds).toEqual(['WI-TEST-001', 'WI-TEST-002'])
    }
  })
})

describe('WI-077 multirepo repository identity', () => {
  let dir: string
  let workspace: string
  const write = (target: string, content: string) => { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content) }
  const initRepo = (repo: string, message: string) => {
    fs.mkdirSync(repo, { recursive: true })
    fs.writeFileSync(path.join(repo, 'README.md'), message)
    for (const args of [['init'], ['config', 'user.name', 'Fixture'], ['config', 'user.email', 'fixture@example.test'], ['add', '.'], ['commit', '-m', message]]) execFileSync('git', args, { cwd: repo })
  }
  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-multirepo-'))
    dir = path.join(workspace, 'core')
    write(path.join(dir, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: fixture\n  state: ai-assisted\n  structure: multirepo\nteam:\n  size: small\n')
    write(path.join(dir, '.kaddo/modules.yml'), 'modules:\n  - id: left\n    repoPath: ../left/api\n  - id: left-copy\n    repoPath: ../left/api\n  - id: right\n    repoPath: ../right/api\n')
    write(path.join(dir, 'knowledge/delivery/initiatives/INI-001.md'), '---\ntype: initiative\nid: INI-001\ntitle: Initiative\nstatus: in-progress\n---\n# Initiative\n')
    for (const id of ['WI-TEST-001', 'WI-TEST-002']) write(path.join(dir, `knowledge/delivery/work-items/draft/${id}.md`), `---\ntype: feature\nid: ${id}\ntitle: ${id}\nstatus: draft\ninitiative: INI-001\n---\n# ${id}\n`)
    initRepo(path.join(workspace, 'left', 'api'), 'feat: WI-TEST-001')
    initRepo(path.join(workspace, 'right', 'api'), 'feat: WI-TEST-002')
  })
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }))

  it('keeps homonymous module repositories distinct while observing a shared root once', async () => {
    const result = await getInitiativeCollaboration(dir, 'INI-001')
    expect(result.linkedCommits).toHaveLength(2)
    expect(result.linkedCommits.map((commit) => commit.repository).sort()).toEqual(['module:left', 'module:right'])
    expect(result.git.repositories.sort()).toEqual(['module:left', 'module:right'])
  })
})
