import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { knowledgeLayers, renderLayersMarkdown } from '../src/core/layers.js'

let dir: string

function write(rel: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, '# x\n')
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-layers-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('knowledgeLayers', () => {
  it('reports the four layers in order with all items absent on a fresh repo', () => {
    const layers = knowledgeLayers(dir)
    expect(layers.map((l) => l.layer)).toEqual(['Business', 'Product', 'Tech', 'Delivery'])
    expect(layers.every((l) => l.items.every((i) => !i.present))).toBe(true)
  })

  it('detects present artifacts per layer', () => {
    write('knowledge/business/problem.md')
    write('knowledge/product/capabilities.md')
    write('knowledge/tech/codebase.md')
    const layers = knowledgeLayers(dir)
    const business = layers.find((l) => l.layer === 'Business')!
    expect(business.items.find((i) => i.name === 'problem')!.present).toBe(true)
    expect(business.items.find((i) => i.name === 'users')!.present).toBe(false)
    expect(
      layers.find((l) => l.layer === 'Product')!.items.find((i) => i.name === 'capabilities')!
        .present
    ).toBe(true)
    expect(
      layers.find((l) => l.layer === 'Tech')!.items.find((i) => i.name === 'codebase')!.present
    ).toBe(true)
    expect(
      layers.find((l) => l.layer === 'Delivery')!.items.find((i) => i.name === 'roadmap')!.present
    ).toBe(false)
  })

  it('renders markdown with ✓/✗ per item, grouped by layer', () => {
    write('knowledge/tech/codebase.md')
    const md = renderLayersMarkdown(knowledgeLayers(dir))
    expect(md).toContain('### Business')
    expect(md).toContain('### Delivery')
    expect(md).toContain('✓ codebase')
    expect(md).toContain('✗ roadmap')
  })
})
