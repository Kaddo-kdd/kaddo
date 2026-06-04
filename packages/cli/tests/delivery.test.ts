import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  activeWorkItems,
  suggestedBranch,
  suggestedCommit,
  renderDeliveryLifecycle,
  branchPrefix,
  commitPrefix,
  branchNameFor,
  resolveStartTarget,
} from '../src/core/delivery.js'

let dir: string

function writeWI(name: string, type: string, status: string, title: string) {
  const full = path.join(dir, 'knowledge', 'delivery', 'work-items', name)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `---\nid: ${name.replace('.md', '')}\ntype: ${type}\ntitle: ${title}\nstatus: ${status}\n---\n\nBody\n`)
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-delivery-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('delivery lifecycle', () => {
  it('finds only in-progress work items under delivery/work-items', () => {
    writeWI('WI-001.md', 'feature', 'in-progress', 'Add task reminders')
    writeWI('WI-002.md', 'feature', 'done', 'Old thing')
    // an ADR is not a work item even if in-progress-like
    const adr = path.join(dir, 'knowledge', 'tech', 'decisions', 'ADR-0001.md')
    fs.mkdirSync(path.dirname(adr), { recursive: true })
    fs.writeFileSync(adr, '---\ntype: adr\nstatus: in-progress\n---\n')

    const active = activeWorkItems(dir)
    expect(active.map((w) => w.id)).toEqual(['WI-001'])
  })

  it('suggests a branch and commit from the work-item type', () => {
    writeWI('WI-001.md', 'feature', 'in-progress', 'Add Task Reminders')
    const wi = activeWorkItems(dir)[0]
    expect(suggestedBranch(wi)).toBe('feature/WI-001-add-task-reminders')
    expect(suggestedCommit(wi)).toBe('feat: add task reminders')
  })

  it('maps bugfix/hotfix/spike to fix/fix/chore and bugfix/hotfix/spike branches', () => {
    expect(branchPrefix('bugfix')).toBe('bugfix')
    expect(commitPrefix('bugfix')).toBe('fix')
    expect(commitPrefix('hotfix')).toBe('fix')
    expect(commitPrefix('spike')).toBe('chore')
    expect(commitPrefix('feature')).toBe('feat')
  })

  it('renders the lifecycle with guard, ownership and scan steps', () => {
    writeWI('WI-001.md', 'feature', 'in-progress', 'Add task reminders')
    const lines = renderDeliveryLifecycle(activeWorkItems(dir)[0]).join('\n')
    expect(lines).toContain('kaddo start')
    expect(lines).toContain('kaddo scan')
    expect(lines).toContain('kaddo owners suggest')
    expect(lines).toContain('kaddo guard')
    expect(lines).toContain('never commits, pushes or merges')
  })

  it('returns no active items on an empty project', () => {
    expect(activeWorkItems(dir)).toEqual([])
  })

  it('builds the branch name from the project git strategy pattern', () => {
    writeWI('WI-001.md', 'feature', 'in-progress', 'Add task reminders')
    const wi = activeWorkItems(dir)[0]
    // default pattern when no .kaddo/git.yml
    expect(branchNameFor(dir, wi)).toBe('feature/WI-001-add-task-reminders')
    // custom pattern from .kaddo/git.yml
    fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
    fs.writeFileSync(
      path.join(dir, '.kaddo', 'git.yml'),
      'branchNaming:\n  pattern: "{type}/{slug}"\n'
    )
    expect(branchNameFor(dir, wi)).toBe('feature/add-task-reminders')
  })

  it('resolveStartTarget picks the active item, an id, or errors clearly', () => {
    writeWI('WI-001.md', 'feature', 'in-progress', 'A')
    expect('wi' in resolveStartTarget(dir)).toBe(true)
    const byId = resolveStartTarget(dir, 'WI-001')
    expect('wi' in byId && byId.wi.id).toBe('WI-001')
    const missing = resolveStartTarget(dir, 'WI-999')
    expect('error' in missing).toBe(true)
  })
})
