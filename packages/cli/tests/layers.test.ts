import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { knowledgeLayers, currentPhase, renderLayersMarkdown } from '../src/core/layers.js'

let dir: string

function write(rel: string, type: string, body = '') {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `---\ntype: ${type}\n---\n\n${body || '# x'}\n`)
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-layers-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

function statusOf(layers: ReturnType<typeof knowledgeLayers>, name: string) {
  return layers.find((l) => l.layer === name)!.status
}

describe('knowledgeLayers (discovery)', () => {
  it('reports the four layers Missing on a fresh repo', () => {
    const layers = knowledgeLayers(dir)
    expect(layers.map((l) => l.layer)).toEqual(['Business', 'Product', 'Tech', 'Delivery'])
    expect(layers.every((l) => l.status === 'Missing')).toBe(true)
  })

  it('recognizes consolidated artifacts by frontmatter type, regardless of filename', () => {
    // a consolidated business file with a non-standard name, recognized by type
    write('knowledge/business/business-baseline.md', 'business')
    write('knowledge/product/product.md', 'product')
    write('knowledge/tech/codebase.md', 'codebase')
    const layers = knowledgeLayers(dir)
    expect(statusOf(layers, 'Business')).toBe('Consolidated')
    expect(statusOf(layers, 'Product')).toBe('Consolidated')
    expect(statusOf(layers, 'Tech')).toBe('Consolidated')
  })

  it('marks a layer Structured when specialized artifacts exist (by type)', () => {
    write('knowledge/product/anything.md', 'capabilities')
    write('knowledge/tech/x.md', 'current-state')
    const layers = knowledgeLayers(dir)
    expect(statusOf(layers, 'Product')).toBe('Structured')
    expect(statusOf(layers, 'Tech')).toBe('Structured')
  })

  it('Delivery is Partial with a roadmap, Traceable with work items', () => {
    write('knowledge/delivery/roadmap.md', 'roadmap', '# Roadmap\nWI-001 candidate')
    expect(statusOf(knowledgeLayers(dir), 'Delivery')).toBe('Partial')
    write('knowledge/delivery/work-items/WI-001.md', 'feature')
    expect(statusOf(knowledgeLayers(dir), 'Delivery')).toBe('Traceable')
  })

  it('currentPhase points at the first incomplete layer', () => {
    write('knowledge/business/business.md', 'business')
    // Product missing → current phase is Product
    expect(currentPhase(knowledgeLayers(dir))).toBe('Product')
  })

  it('renders maturity + detected artifacts', () => {
    write('knowledge/business/business.md', 'business')
    const md = renderLayersMarkdown(knowledgeLayers(dir))
    expect(md).toContain('### Business — Consolidated')
    expect(md).toContain('✓ business.md')
    expect(md).toContain('### Delivery — Missing')
  })
})
