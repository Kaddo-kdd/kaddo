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
  it('creates the knowledge/business/ structure', () => {
    bootstrap(dir)
    for (const f of [
      'product-brief.md',
      'problem.md',
      'users.md',
      'value-proposition.md',
      'business-rules.md',
      'constraints.md',
      'glossary.md',
    ]) {
      expect(fs.existsSync(path.join(dir, 'knowledge', 'business', f)), f).toBe(true)
    }
  })

  it('generates the architecture, codebase and development artifacts', () => {
    bootstrap(dir)
    const expected = [
      'knowledge/capabilities.md',
      'knowledge/quality-attributes.md',
      'knowledge/stack.md',
      'knowledge/current-state.md',
      'knowledge/decision-candidates.md',
      'knowledge/adrs/ADR-0001-initial-architecture.md',
      'knowledge/codebase-foundation.md',
      'knowledge/standards.md',
      'knowledge/git-strategy.md',
      'knowledge/roadmap.md',
      'knowledge/bootstrap-summary.md',
    ]
    for (const f of expected) expect(fs.existsSync(path.join(dir, f)), f).toBe(true)
  })

  it('prepares the work-items directory', () => {
    bootstrap(dir)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'work-items'))).toBe(true)
  })

  it('artifacts come from the template registry', () => {
    bootstrap(dir)
    expect(read('knowledge/business/product-brief.md')).toBe(
      getTemplate('business-product-brief')!.content + ''
    )
    expect(read('knowledge/codebase-foundation.md')).toContain('# Codebase Foundation')
    expect(read('knowledge/roadmap.md')).toContain('# ')
  })

  it('does not overwrite existing artifacts (skipped)', () => {
    fs.mkdirSync(path.join(dir, 'knowledge', 'business'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge', 'business', 'problem.md'), 'CUSTOM')
    const res = bootstrap(dir)
    expect(read('knowledge/business/problem.md')).toBe('CUSTOM')
    expect(res.skipped).toContain('knowledge/business/problem.md')
    expect(res.written).toContain('knowledge/business/product-brief.md')
  })

  it('reports the four base layers', () => {
    const res = bootstrap(dir)
    expect(res.layers).toEqual(['Business', 'Architecture', 'Codebase', 'Development'])
  })

  it('codebase-foundation describes no production code', () => {
    bootstrap(dir)
    expect(read('knowledge/codebase-foundation.md')).toContain('No production code')
  })
})
