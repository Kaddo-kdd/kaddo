import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-res-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function initProject(dir: string, extra: Record<string, string> = {}) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: res-test', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
  for (const [rel, content] of Object.entries(extra)) write(dir, rel, content)
}

const SUPABASE_RESOURCE = [
  '---',
  'type: project-resource',
  'id: RES-supabase-main',
  'title: Supabase Main Database',
  'resource_type: database',
  'provider: supabase',
  'environments: [development, production]',
  'access_interfaces:',
  '  - type: cli',
  '    tool: supabase',
  '    purpose: migrations and local development',
  '    operations: [migrations, schema-inspection]',
  '  - type: mcp',
  '    provider: Supabase',
  '  - type: sql',
  '    tool: psql',
  'access_boundaries:',
  '  development: [read, write, migrations]',
  '  production: [read]',
  'authentication:',
  '  mode: external',
  '  refs: [SUPABASE_ACCESS_TOKEN, "SUPABASE_DB_PASSWORD=sup3rs3cret"]',
  '---',
  '',
  '# Purpose',
  '',
  'Stores application users, projects and product data.',
  '',
].join('\n')

const WI_WITH_RESOURCES = [
  '---',
  'id: WI-900',
  'title: Add profile table',
  'type: feature',
  'status: ready',
  'affected_modules: [api, web]',
  'resources:',
  '  - id: RES-supabase-main',
  '    role: affected',
  '  - id: RES-aws-platform',
  '    role: validation',
  '  - id: RES-supabase-main',
  '    role: delivery',
  '---',
  '',
  '# Add profile table',
  '',
  '## Current behavior',
  '',
  'No profile table.',
  '',
].join('\n')

const WI_NO_RESOURCES = [
  '---', 'id: WI-901', 'title: Tweak CSS', 'type: chore', 'status: ready', '---', '', '# Tweak CSS', '',
].join('\n')

describe('WI-030 — Project Resources (Core)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('discovers a project-resource as tech knowledge, not a Work Item (AC-01)', async () => {
    initProject(dir, { 'knowledge/tech/resources/supabase-main.md': SUPABASE_RESOURCE })
    const core = await import('../src/core.js')
    const art = core.discoverKnowledge(dir).find((a) => a.type === 'project-resource')
    expect(art).toBeTruthy()
    expect(art!.layer).toBe('tech')
    expect(art!.isWorkItem).toBe(false)
  })

  it('getResources / getResource expose the contract (AC-02, AC-04)', async () => {
    initProject(dir, { 'knowledge/tech/resources/supabase-main.md': SUPABASE_RESOURCE })
    const core = await import('../src/core.js')
    const list = core.getResources(dir)
    expect(list.map((r) => r.id)).toEqual(['RES-supabase-main'])
    expect(list[0].resourceType).toBe('database')
    expect(list[0].provider).toBe('supabase')

    const res = core.getResource(dir, 'RES-supabase-main')!
    expect(res.title).toBe('Supabase Main Database')
    expect(res.environments).toEqual(['development', 'production'])
    expect(res.interfaces.map((i) => i.type)).toEqual(['cli', 'mcp', 'sql'])
    expect(res.interfaces[0]).toMatchObject({ type: 'cli', tool: 'supabase' })
    expect(res.boundaries.production).toEqual(['read'])
    expect(res.purpose === null || typeof res.purpose === 'string').toBe(true)
    expect(res.markdownBody).toContain('# Purpose')
  })

  it('never exposes credential values — only reference names (AC-03)', async () => {
    initProject(dir, { 'knowledge/tech/resources/supabase-main.md': SUPABASE_RESOURCE })
    const core = await import('../src/core.js')
    const res = core.getResource(dir, 'RES-supabase-main')!
    expect(res.authMode).toBe('external')
    expect(res.authRefs).toContain('SUPABASE_ACCESS_TOKEN')
    // The secret-looking "NAME=value" entry is dropped — no value leaks.
    expect(res.authRefs.some((r) => r.includes('='))).toBe(false)
    expect(JSON.stringify(res)).not.toContain('sup3rs3cret')
  })

  it('exposes WI resources separate from affected_modules, roles preserved (AC-05)', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/ready/WI-900.md': WI_WITH_RESOURCES })
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-900')
    expect(wi.affectedModules).toEqual(['api', 'web'])
    expect(wi.resources).toEqual([
      { id: 'RES-supabase-main', role: 'affected' },
      { id: 'RES-aws-platform', role: 'validation' },
      { id: 'RES-supabase-main', role: 'delivery' },
    ])
  })

  it('is optional and backward compatible (AC-06)', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/ready/WI-901.md': WI_NO_RESOURCES })
    const core = await import('../src/core.js')
    expect(core.getResources(dir)).toEqual([])
    const wi = core.getWorkItem(dir, 'WI-901')
    expect(wi.resources).toEqual([])
  })

  it('accepts a minimum-sufficient resource (type/id/title/resource_type/provider) (AC-07)', async () => {
    const minimal = ['---', 'type: project-resource', 'id: RES-min', 'title: Minimal', 'resource_type: api', 'provider: acme', '---', '', '# Minimal', ''].join('\n')
    initProject(dir, { 'knowledge/tech/resources/min.md': minimal })
    const core = await import('../src/core.js')
    const res = core.getResource(dir, 'RES-min')!
    expect(res.id).toBe('RES-min')
    expect(res.interfaces).toEqual([])
    expect(res.authRefs).toEqual([])
    expect(res.boundaries).toEqual({})
  })
})
