import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { bootstrap } from '../src/commands/bootstrap.js'
import { getTemplate } from '../src/templates/registry.js'

let dir: string

function initProject(state = 'new') {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.kaddo', 'config.yml'),
    `version: 1\nproject:\n  name: demo\n  state: ${state}\n  structure: monorepo\nteam:\n  size: indie\n`
  )
}

function read(rel: string): string {
  return fs.readFileSync(path.join(dir, rel), 'utf8')
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-bootstrap-'))
  initProject()
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('bootstrap — knowledge base generation', () => {
  it('generates exactly the three consolidated layer files', () => {
    const res = bootstrap(dir)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'business', 'business.md'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'product', 'product.md'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'tech', 'codebase.md'))).toBe(true)
    expect(res.written.sort()).toEqual([
      'knowledge/business/business.md',
      'knowledge/product/product.md',
      'knowledge/tech/codebase.md',
    ])
  })

  it('does NOT generate specialized files or delivery/decisions', () => {
    bootstrap(dir)
    for (const p of [
      'knowledge/business/problem.md',
      'knowledge/business/users.md',
      'knowledge/product/product-brief.md',
      'knowledge/product/capabilities.md',
      'knowledge/delivery/roadmap.md',
      'knowledge/delivery/work-items',
      'knowledge/tech/decisions',
    ]) {
      expect(fs.existsSync(path.join(dir, p)), p).toBe(false)
    }
  })

  it('consolidated business.md carries the layer sections', () => {
    bootstrap(dir)
    const md = read('knowledge/business/business.md')
    expect(md).toContain('# Business')
    expect(md).toContain('## Problem')
    expect(md).toContain('## Users')
    expect(md).toContain('## Constraints')
  })

  it('artifacts come from the template registry', () => {
    bootstrap(dir)
    expect(read('knowledge/business/business.md')).toBe(getTemplate('business')!.content + '')
    expect(read('knowledge/product/product.md')).toBe(getTemplate('product')!.content + '')
    expect(read('knowledge/tech/codebase.md')).toContain('# Codebase')
  })

  it('does not overwrite existing artifacts (skipped)', () => {
    fs.mkdirSync(path.join(dir, 'knowledge', 'business'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge', 'business', 'business.md'), 'CUSTOM')
    const res = bootstrap(dir)
    expect(read('knowledge/business/business.md')).toBe('CUSTOM')
    expect(res.skipped).toContain('knowledge/business/business.md')
    expect(res.written).toContain('knowledge/product/product.md')
  })

  it('reports the three minimal base layers', () => {
    const res = bootstrap(dir)
    expect(res.layers).toEqual(['Business', 'Product', 'Tech'])
  })

  it('codebase describes no production code', () => {
    bootstrap(dir)
    expect(read('knowledge/tech/codebase.md')).toContain('No production code')
  })
})
