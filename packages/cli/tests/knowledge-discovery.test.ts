import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { discoverLayers, layerForType } from '../src/core/knowledge-discovery.js'

let dir: string

function write(rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function fm(type: string, body = '# x') {
  return `---\ntype: ${type}\n---\n\n${body}\n`
}
function statusOf(dir2: string, name: string) {
  return discoverLayers(dir2).find((l) => l.layer === name)!.status
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-discovery-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('layerForType', () => {
  it('maps types to layers, not paths', () => {
    expect(layerForType('business')).toBe('Business')
    expect(layerForType('product')).toBe('Product')
    expect(layerForType('capabilities')).toBe('Product')
    expect(layerForType('codebase')).toBe('Tech')
    expect(layerForType('current-state')).toBe('Tech')
    expect(layerForType('adr')).toBe('Tech')
    expect(layerForType('decision')).toBe('Tech')
    expect(layerForType('roadmap')).toBe('Delivery')
    expect(layerForType('feature')).toBe('Delivery')
    expect(layerForType('unknown')).toBeNull()
  })
})

describe('discoverLayers — semantic recognition', () => {
  it('AC1/AC2: consolidated business/product recognized regardless of name', () => {
    write('knowledge/business/baseline.md', fm('business'))
    write('knowledge/product/whatever.md', fm('product'))
    expect(statusOf(dir, 'Business')).toBe('Consolidated')
    expect(statusOf(dir, 'Product')).toBe('Consolidated')
  })

  it('AC3/AC4/AC5: capabilities / current-state / ADR detected by frontmatter', () => {
    write('knowledge/product/caps.md', fm('capabilities'))
    write('knowledge/tech/reality.md', fm('current-state'))
    write('knowledge/tech/decisions/d1.md', fm('adr'))
    expect(statusOf(dir, 'Product')).toBe('Structured')
    expect(statusOf(dir, 'Tech')).toBe('Structured')
  })

  it('AC6: Work Items detected by type (Delivery Traceable)', () => {
    write('knowledge/delivery/work-items/WI-001.md', fm('feature'))
    expect(statusOf(dir, 'Delivery')).toBe('Traceable')
  })

  it('AC7: does not depend on exact filenames', () => {
    write('knowledge/business/anything-at-all.md', fm('problem'))
    expect(statusOf(dir, 'Business')).toBe('Structured')
  })
})
