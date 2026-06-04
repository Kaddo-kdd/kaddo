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
  it('creates the minimal knowledge/business/ structure', () => {
    bootstrap(dir)
    for (const f of [
      'problem.md',
      'users.md',
      'value-proposition.md',
      'business-rules.md',
      'constraints.md',
    ]) {
      expect(fs.existsSync(path.join(dir, 'knowledge', 'business', f)), f).toBe(true)
    }
  })

  it('generates the product and tech base artifacts', () => {
    bootstrap(dir)
    const expected = [
      'knowledge/product/product-brief.md',
      'knowledge/product/capabilities.md',
      'knowledge/tech/codebase.md',
    ]
    for (const f of expected) expect(fs.existsSync(path.join(dir, f)), f).toBe(true)
  })

  it('does NOT generate delivery artifacts (roadmap/work-items) or decisions', () => {
    bootstrap(dir)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'delivery', 'roadmap.md'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'delivery', 'work-items'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'tech', 'decisions'))).toBe(false)
  })

  it('artifacts come from the template registry', () => {
    bootstrap(dir)
    expect(read('knowledge/product/product-brief.md')).toBe(
      getTemplate('business-product-brief')!.content + ''
    )
    expect(read('knowledge/tech/codebase.md')).toContain('# Codebase Foundation')
  })

  it('does not overwrite existing artifacts (skipped)', () => {
    fs.mkdirSync(path.join(dir, 'knowledge', 'business'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge', 'business', 'problem.md'), 'CUSTOM')
    const res = bootstrap(dir)
    expect(read('knowledge/business/problem.md')).toBe('CUSTOM')
    expect(res.skipped).toContain('knowledge/business/problem.md')
    expect(res.written).toContain('knowledge/product/product-brief.md')
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
