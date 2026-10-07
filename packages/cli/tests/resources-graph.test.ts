import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-resgraph-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function init(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: g', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
}

const RESOURCE = [
  '---', 'type: project-resource', 'id: RES-supabase-main', 'title: Supabase Main',
  'resource_type: database', 'provider: supabase', '---', '', '# Purpose', '', 'Data.', '',
].join('\n')

const WI = [
  '---', 'id: WI-700', 'title: Add table', 'type: feature', 'status: ready',
  'resources:', '  - id: RES-supabase-main', '    role: affected',
  '  - id: RES-supabase-main', '    role: validation',
  '---', '', '# Add table', '',
].join('\n')

describe('WI-033 — Project Resources in the Knowledge Graph', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); init(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('adds a project-resource node and role-based edges with WI provenance (AC-01, AC-02)', async () => {
    write(dir, 'knowledge/tech/resources/supabase.md', RESOURCE)
    write(dir, 'knowledge/delivery/work-items/ready/WI-700.md', WI)
    const { buildGraph } = await import('../src/core/graph.js')
    const { loadConfig } = await import('../src/core/config.js')
    const g = buildGraph(dir, loadConfig(dir)!)

    const resNode = g.nodes.find((n) => n.id === 'resource:RES-supabase-main')
    expect(resNode).toBeTruthy()
    expect(resNode!.type).toBe('project-resource')
    expect(resNode!.label).toContain('Supabase Main')

    const resEdges = g.edges.filter((e) => e.to === 'resource:RES-supabase-main' && e.from === 'wi:WI-700')
    expect(resEdges.map((e) => e.type).sort()).toEqual(['affects', 'validates_with'])
  })

  it('does not invent module→resource edges without evidence (AC-03)', async () => {
    write(dir, 'knowledge/tech/resources/supabase.md', RESOURCE)
    const { buildGraph } = await import('../src/core/graph.js')
    const { loadConfig } = await import('../src/core/config.js')
    const g = buildGraph(dir, loadConfig(dir)!)
    // The resource node exists, but nothing fabricated a depends_on toward it.
    expect(g.nodes.some((n) => n.id === 'resource:RES-supabase-main')).toBe(true)
    expect(g.edges.some((e) => e.to === 'resource:RES-supabase-main')).toBe(false)
  })

  it('is backward compatible: no resources → no resource nodes/edges (AC-07)', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-700.md', ['---', 'id: WI-700', 'title: X', 'type: chore', 'status: ready', '---', '', '# X', ''].join('\n'))
    const { buildGraph } = await import('../src/core/graph.js')
    const { loadConfig } = await import('../src/core/config.js')
    const g = buildGraph(dir, loadConfig(dir)!)
    expect(g.nodes.some((n) => n.type === 'project-resource')).toBe(false)
  })
})

describe('WI-040 — module → resource dependency edges', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); init(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('adds module→resource depends_on edges from scope/modules (AC-01, AC-02)', async () => {
    write(dir, 'knowledge/tech/resources/stripe.md', ['---', 'type: project-resource', 'id: RES-stripe', 'title: Stripe', 'resource_type: service', 'scope:', '  type: system', 'modules: [orders-api, billing-worker]', '---', '', '# Purpose', '', 'Payments.', ''].join('\n'))
    const { buildGraph } = await import('../src/core/graph.js')
    const { loadConfig } = await import('../src/core/config.js')
    const g = buildGraph(dir, loadConfig(dir)!)
    expect(g.nodes.some((n) => n.id === 'module:orders-api' && n.type === 'module')).toBe(true)
    const deps = g.edges.filter((e) => e.to === 'resource:RES-stripe' && e.type === 'depends_on').map((e) => e.from).sort()
    expect(deps).toEqual(['module:billing-worker', 'module:orders-api'])
    // One canonical resource definition (not duplicated per module).
    expect(g.nodes.filter((n) => n.id === 'resource:RES-stripe').length).toBe(1)
  })
})
