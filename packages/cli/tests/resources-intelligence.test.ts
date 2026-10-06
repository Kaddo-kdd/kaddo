import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-resint-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function init(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: resint', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
}

const RESOURCE = [
  '---', 'type: project-resource', 'id: RES-supabase-main', 'title: Supabase Main',
  'resource_type: database', 'provider: supabase', 'environments: [development, production]',
  'access_interfaces:', '  - type: cli', '    tool: supabase', '  - type: mcp', '    provider: Supabase',
  'access_boundaries:', '  production: [read]',
  'authentication:', '  mode: external', '  refs: [SUPABASE_ACCESS_TOKEN, "SECRET=leakme"]',
  '---', '', '# Purpose', '', 'Stores product data.', '',
].join('\n')

const WI_READY_WITH_RES = [
  '---', 'id: WI-800', 'title: Add profile table', 'type: feature', 'status: ready',
  'affected_modules: [api]',
  'resources:', '  - id: RES-supabase-main', '    role: affected', '  - id: RES-aws', '    role: validation',
  '---', '', '# Add profile table', '', '## Current behavior', '', 'None.', '',
].join('\n')

const WI_READY_NO_RES = [
  '---', 'id: WI-801', 'title: Tweak CSS', 'type: chore', 'status: ready', '---', '', '# Tweak CSS', '',
].join('\n')

describe('WI-032 — Project Resources intelligence', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); init(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('Implementation Handoff surfaces relevant resources, no secrets, informs-not-executes (AC-03, AC-04)', async () => {
    write(dir, 'knowledge/tech/resources/supabase.md', RESOURCE)
    write(dir, 'knowledge/delivery/work-items/ready/WI-800.md', WI_READY_WITH_RES)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-800')
    expect(h.resources).toEqual([
      { id: 'RES-supabase-main', role: 'affected' },
      { id: 'RES-aws', role: 'validation' },
    ])
    expect(h.text).toContain('--- Relevant Resources ---')
    expect(h.text).toContain('RES-supabase-main — Supabase Main (role: affected)')
    expect(h.text).toContain('interfaces: cli (supabase), mcp (Supabase)')
    expect(h.text).toContain('boundary (production): read')
    expect(h.text).toContain('auth references (names only): SUPABASE_ACCESS_TOKEN')
    expect(h.text).toContain('never connects to them')
    // A referenced-but-undefined resource is noted, not fabricated.
    expect(h.text).toContain('RES-aws (role: validation) — definition not found')
    // No secret value ever leaks.
    expect(h.text).not.toContain('leakme')
  })

  it('a WI without resources has no Relevant Resources section (AC-05)', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-801.md', WI_READY_NO_RES)
    const core = await import('../src/core.js')
    const h = core.buildImplementationHandoff(dir, 'WI-801')
    expect(h.resources).toEqual([])
    expect(h.text).not.toContain('Relevant Resources')
  })

  it('context pack includes only the WI own resource relationships (AC-02)', async () => {
    write(dir, 'knowledge/tech/resources/supabase.md', RESOURCE)
    write(dir, 'knowledge/delivery/work-items/ready/WI-800.md', WI_READY_WITH_RES)
    const { buildContextPack } = await import('../src/core/context-pack.js')
    const { loadConfig } = await import('../src/core/config.js')
    const pack = buildContextPack(dir, loadConfig(dir)!) as { knowledge: { activeWorkItems: { id: string; resources?: { id: string; role: string }[] }[] } }
    const wi = pack.knowledge.activeWorkItems.find((w) => w.id === 'WI-800')
    expect(wi?.resources).toEqual([
      { id: 'RES-supabase-main', role: 'affected' },
      { id: 'RES-aws', role: 'validation' },
    ])
  })
})
