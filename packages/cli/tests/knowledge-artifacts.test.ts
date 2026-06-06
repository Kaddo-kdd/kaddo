import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  discoverKnowledge,
  discoverWorkItems,
  isWorkItemArtifact,
} from '../src/services/knowledge-artifacts.js'
import { findWorkItemArtifacts } from '../src/core/ownership-suggest.js'

let tmp: string

function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-discovery-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('unified knowledge discovery (VS-046)', () => {
  it('AC7: discovers Work Items in flat and lifecycle-subfolder structures', () => {
    write(
      'knowledge/delivery/work-items/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Flat one\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/ready/WI-002.md',
      '---\nid: WI-002\ntype: chore\ntitle: Ready one\nstatus: ready\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/completed/WI-003.md',
      '---\nid: WI-003\ntype: feature\ntitle: Done one\nstatus: completed\n---\n\nx\n'
    )
    const wis = discoverWorkItems(tmp)
    expect(wis.map((w) => w.id).sort()).toEqual(['WI-001', 'WI-002', 'WI-003'])
  })

  it('AC9: recognizes Work Items by front matter (type), draft and ready alike', () => {
    write(
      'knowledge/delivery/work-items/draft/WI-010.md',
      '---\nid: WI-010\ntype: feature\ntitle: Draft\nstatus: draft\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/ready/WI-011.md',
      '---\nid: WI-011\ntype: feature\ntitle: Ready\nstatus: ready\n---\n\nx\n'
    )
    const byId = Object.fromEntries(discoverWorkItems(tmp).map((w) => [w.id, w]))
    expect(byId['WI-010'].lifecycle).toBe('draft')
    expect(byId['WI-011'].lifecycle).toBe('ready')
  })

  it('ignores files without valid/typed front matter (not Work Items)', () => {
    write('knowledge/delivery/work-items/notes.md', '# just notes, no front matter\n')
    write('knowledge/delivery/work-items/broken.md', '---\ntype: [unclosed\n---\nbody')
    expect(discoverWorkItems(tmp)).toEqual([])
  })

  it('does not treat ADRs or layer docs as Work Items', () => {
    write('knowledge/tech/decisions/ADR-0001.md', '---\nid: ADR-0001\ntype: adr\n---\n\nx\n')
    write('knowledge/business/business.md', '---\ntype: business\n---\n\nx\n')
    const all = discoverKnowledge(tmp)
    expect(all.length).toBe(2)
    expect(all.every((a) => !a.isWorkItem)).toBe(true)
  })

  it('classifies layers from path', () => {
    write('knowledge/business/business.md', '---\ntype: business\n---\n\nx\n')
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n\nx\n')
    write('knowledge/tech/current-state.md', '---\ntype: current-state\n---\n\nx\n')
    write('knowledge/delivery/work-items/ready/WI-1.md', '---\nid: WI-1\ntype: feature\n---\n\nx\n')
    const byLayer = Object.fromEntries(
      discoverKnowledge(tmp).map((a) => [a.relPath, a.layer])
    )
    expect(byLayer['knowledge/business/business.md']).toBe('business')
    expect(byLayer['knowledge/product/capabilities.md']).toBe('product')
    expect(byLayer['knowledge/tech/current-state.md']).toBe('tech')
    expect(byLayer['knowledge/delivery/work-items/ready/WI-1.md']).toBe('delivery')
  })

  it('exposes a POSIX relPath even on Windows-style paths', () => {
    expect(isWorkItemArtifact({ filePath: 'C:\\p\\knowledge\\delivery\\work-items\\ready\\WI-1.md', type: 'feature' })).toBe(true)
    expect(isWorkItemArtifact({ filePath: '/p/knowledge/tech/decisions/ADR.md', type: 'adr' })).toBe(false)
  })
})

describe('owners suggest consumes unified discovery (the VS-046 bug)', () => {
  it('finds a Work Item that lives in a lifecycle subfolder', () => {
    // This is the exact regression: explain saw the item, owners did not (non-recursive).
    write(
      'knowledge/delivery/work-items/ready/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Create task\nstatus: ready\ncode: []\n---\n\nx\n'
    )
    const found = findWorkItemArtifacts(tmp)
    expect(found.map((a) => a.id)).toEqual(['WI-001'])
    expect(found[0].relPath).toBe('knowledge/delivery/work-items/ready/WI-001.md')
    expect(found[0].hasOwnership).toBe(false)
  })
})
