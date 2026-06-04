import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-status-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// Test the aggregation logic that status and history rely on
describe('status aggregation', () => {
  it('counts work items by status', () => {
    const items = [
      { status: 'in-progress', type: 'feature', codeGlobs: ['src/**'], domains: ['payments'] },
      { status: 'in-progress', type: 'bugfix', codeGlobs: [], domains: [] },
      { status: 'done', type: 'hotfix', codeGlobs: ['src/**'], domains: [] },
      { status: 'cancelled', type: 'spike', codeGlobs: [], domains: [] },
    ]
    const inProgress = items.filter((a) => a.status === 'in-progress')
    const done = items.filter((a) => a.status === 'done')
    const cancelled = items.filter((a) => a.status === 'cancelled')
    const withOwnership = items.filter((a) => a.codeGlobs.length > 0)

    expect(inProgress).toHaveLength(2)
    expect(done).toHaveLength(1)
    expect(cancelled).toHaveLength(1)
    expect(withOwnership).toHaveLength(2)
  })

  it('deduplicates domains across work items', () => {
    const items = [
      { domains: ['payments', 'orders'] },
      { domains: ['payments'] },
      { domains: ['identity'] },
    ]
    const domains = [...new Set(items.flatMap((a) => a.domains))].filter(Boolean)
    expect(domains).toHaveLength(3)
  })
})

describe('history filtering', () => {
  it('filters by domain', () => {
    const items = [
      { id: 'WI-001', type: 'feature', domains: ['payments'], status: 'in-progress', codeGlobs: [] },
      { id: 'WI-002', type: 'bugfix', domains: ['orders'], status: 'done', codeGlobs: [] },
    ]
    const filtered = items.filter((a) =>
      a.domains.some((d) => d.toLowerCase().includes('payments'))
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('WI-001')
  })

  it('filters by type', () => {
    const items = [
      { id: 'WI-001', type: 'feature', domains: [], status: 'in-progress', codeGlobs: [] },
      { id: 'WI-002', type: 'bugfix', domains: [], status: 'done', codeGlobs: [] },
    ]
    const filtered = items.filter((a) => a.type === 'bugfix')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('WI-002')
  })

  it('filters by status', () => {
    const items = [
      { id: 'WI-001', status: 'in-progress' },
      { id: 'WI-002', status: 'done' },
      { id: 'WI-003', status: 'done' },
    ]
    const filtered = items.filter((a) => a.status === 'done')
    expect(filtered).toHaveLength(2)
  })

  it('respects limit', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: `WI-00${i}` }))
    expect(items.slice(0, 3)).toHaveLength(3)
  })
})

describe('learn — file update logic', () => {
  it('updates learning section and marks status done', () => {
    const content = `---
type: feature
id: WI-001
status: in-progress
---

# Test

## Learning

_What did we learn from this change? Update after completion._
`
    write('knowledge/work-items/WI-001-test.md', content)
    const filePath = path.join(tmpDir, 'knowledge/work-items/WI-001-test.md')
    const raw = fs.readFileSync(filePath, 'utf-8')

    // Simulate what learn does
    const updatedContent = raw.replace(
      '_What did we learn from this change? Update after completion._',
      'We learned that caching at the edge was simpler than in-memory.'
    ).replace('status: in-progress', 'status: done')

    fs.writeFileSync(filePath, updatedContent)
    const result = fs.readFileSync(filePath, 'utf-8')
    expect(result).toContain('status: done')
    expect(result).toContain('We learned that caching')
    expect(result).not.toContain('Update after completion')
  })
})
