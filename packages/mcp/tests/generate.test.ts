import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  generateContext,
  generateExplain,
  generateUnderstand,
  generateGraph,
  generateCapsuleDraft,
} from '../src/generate.js'
import { assertMcpDerivedWritePath, writeDerived, KaddoMcpError } from '../src/project.js'
import { makeProject, write, config, workItem, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel))
}

function project(): void {
  root = makeProject()
  config(root, 'demo')
  write(root, 'knowledge/knowledge.md', '# Knowledge\n\nThe product does things.')
  write(root, 'knowledge/business/business.md', '---\ntype: business\n---\n# B\n\nManages orders.')
  write(root, 'knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n# Cap\n\n### Orders')
  workItem(root, 'WI-001', { status: 'in-progress' })
}

describe('Derived generation tools (VS-058)', () => {
  it('AC1/AC2: kaddo_generate_context writes context-pack.md + .json', () => {
    project()
    const r = generateContext(root)
    expect(r.status).toBe('ok')
    expect(r.files_written).toEqual(['.kaddo/context-pack.md', '.kaddo/context-pack.json'])
    expect(exists('.kaddo/context-pack.md')).toBe(true)
    expect(exists('.kaddo/context-pack.json')).toBe(true)
    expect(r.next_suggested_resources).toContain('kaddo://context-pack')
  })

  it('AC3/AC4: kaddo_generate_explain writes explain.md + .json', () => {
    project()
    const r = generateExplain(root)
    expect(r.files_written).toEqual(['.kaddo/explain.md', '.kaddo/explain.json'])
    expect(exists('.kaddo/explain.md')).toBe(true)
    expect(JSON.parse(fs.readFileSync(path.join(root, '.kaddo/explain.json'), 'utf-8'))).toHaveProperty('project')
  })

  it('AC5/AC6: kaddo_generate_understand writes understand.md', () => {
    project()
    const r = generateUnderstand(root)
    expect(r.files_written).toContain('.kaddo/understand.md')
    expect(exists('.kaddo/understand.md')).toBe(true)
  })

  it('AC7/AC8: kaddo_generate_graph writes graph + graph-hints files', () => {
    project()
    const r = generateGraph(root)
    expect(r.files_written).toEqual([
      '.kaddo/graph.json',
      '.kaddo/graph.mmd',
      '.kaddo/graph-hints.md',
      '.kaddo/graph-hints.json',
    ])
    for (const f of r.files_written) expect(exists(f)).toBe(true)
    expect(r.next_suggested_resources).toEqual(['kaddo://graph', 'kaddo://graph-hints'])
  })

  it('VS-060 AC16/AC17: kaddo_generate_graph accepts scope and writes scope metadata', () => {
    project()
    write(
      root,
      'knowledge/delivery/work-items/completed/WI-009.md',
      '---\nid: WI-009\ntype: feature\ntitle: Done\nstatus: completed\ncode:\n  - src/cli/**\n---\n# x\n'
    )
    const active = generateGraph(root, 'active')
    expect(active.summary).toContain('active scope')
    const activeJson = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/graph.json'), 'utf-8'))
    expect(activeJson.scope).toBe('active')
    expect(activeJson.included_statuses).toEqual(['draft', 'ready', 'in-progress', 'blocked'])

    const all = generateGraph(root, 'all')
    expect(all.summary).toContain('all scope')
    const allJson = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/graph.json'), 'utf-8'))
    expect(allJson.scope).toBe('all')
    const hintsJson = JSON.parse(fs.readFileSync(path.join(root, '.kaddo/graph-hints.json'), 'utf-8'))
    expect(hintsJson.scope).toBe('all')
  })

  it('AC9/AC10: kaddo_generate_capsule_draft writes only under .kaddo/exports/ and does not register', () => {
    project()
    const r = generateCapsuleDraft(root)
    expect(r.files_written.every((f) => f.startsWith('.kaddo/exports/'))).toBe(true)
    expect(exists('.kaddo/exports/demo.capsule.md')).toBe(true)
    expect(exists('.kaddo/external.yml')).toBe(false) // AC14: never registers external context
  })

  it('AC11: every derived tool returns the structured result shape', () => {
    project()
    for (const r of [generateContext(root), generateExplain(root), generateUnderstand(root), generateGraph(root), generateCapsuleDraft(root)]) {
      expect(r).toMatchObject({
        status: 'ok',
        files_written: expect.any(Array),
        summary: expect.any(String),
        warnings: expect.any(Array),
        next_suggested_resources: expect.any(Array),
      })
    }
  })

  it('AC12/AC13/AC14: generation never writes outside .kaddo/', () => {
    project()
    const before = fs.readFileSync(path.join(root, 'knowledge/business/business.md'), 'utf-8')
    generateContext(root)
    generateExplain(root)
    generateGraph(root)
    generateCapsuleDraft(root)
    // knowledge/ unchanged, no src/ or external/ created
    expect(fs.readFileSync(path.join(root, 'knowledge/business/business.md'), 'utf-8')).toBe(before)
    expect(exists('src')).toBe(false)
    expect(exists('external')).toBe(false)
  })

  it('AC17: assertMcpDerivedWritePath allows only derived paths', () => {
    expect(assertMcpDerivedWritePath('.kaddo/context-pack.md')).toBe('.kaddo/context-pack.md')
    expect(assertMcpDerivedWritePath('.kaddo/exports/demo.capsule.json')).toBe('.kaddo/exports/demo.capsule.json')
    for (const bad of [
      'knowledge/business/business.md',
      'src/index.ts',
      'external/x.capsule.md',
      '.kaddo/external.yml',
      '.kaddo/config.yml',
      '../escape.md',
      '.kaddo/exports/../../knowledge/x.md',
    ]) {
      expect(() => assertMcpDerivedWritePath(bad)).toThrow(KaddoMcpError)
    }
  })

  it('writeDerived refuses a blocked path even with a valid root', () => {
    project()
    expect(() => writeDerived(root, 'knowledge/x.md', 'nope')).toThrow(/Blocked unsafe/)
    expect(exists('knowledge/x.md')).toBe(false)
  })

  it('errors clearly when knowledge is missing', () => {
    root = makeProject()
    config(root)
    expect(() => generateContext(root)).toThrow(/Run `kaddo bootstrap` first/)
  })
})
