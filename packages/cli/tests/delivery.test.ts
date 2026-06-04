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
    expect(lines).toContain('Create a branch')
    expect(lines).toContain('kaddo scan')
    expect(lines).toContain('kaddo owners suggest')
    expect(lines).toContain('kaddo guard')
    expect(lines).toContain('never runs git for you')
  })

  it('returns no active items on an empty project', () => {
    expect(activeWorkItems(dir)).toEqual([])
  })
})
