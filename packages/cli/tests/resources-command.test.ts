import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { runResourcesList, runResourcesGet } from '../src/commands/resources.js'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-rescmd-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function init(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: t', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
}

const RESOURCE = [
  '---', 'type: project-resource', 'id: RES-supabase-main', 'title: Supabase Main',
  'resource_type: database', 'provider: supabase', 'environments: [development, production]',
  'access_interfaces:', '  - type: cli', '    tool: supabase', '  - type: mcp',
  'authentication:', '  mode: external', '  refs: [SUPABASE_ACCESS_TOKEN, "SECRET=leakme"]',
  '---', '', '# Purpose', '', 'Data.', '',
].join('\n')

function capture(fn: () => void): string {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => { lines.push(a.join(' ')) })
  try { fn() } finally { spy.mockRestore() }
  return lines.join('\n')
}

describe('WI-031 — resources CLI command', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('list --json returns the resources', () => {
    init(dir); write(dir, 'knowledge/tech/resources/supabase.md', RESOURCE)
    const out = capture(() => runResourcesList(dir, { json: true }))
    const data = JSON.parse(out)
    expect(data.map((r: { id: string }) => r.id)).toEqual(['RES-supabase-main'])
  })

  it('list is empty and does not error without resources', () => {
    init(dir)
    const out = capture(() => runResourcesList(dir, { json: true }))
    expect(JSON.parse(out)).toEqual([])
  })

  it('get --json returns the detail without secret values', () => {
    init(dir); write(dir, 'knowledge/tech/resources/supabase.md', RESOURCE)
    const out = capture(() => runResourcesGet('RES-supabase-main', dir, { json: true }))
    const data = JSON.parse(out)
    expect(data.id).toBe('RES-supabase-main')
    expect(data.interfaces.map((i: { type: string }) => i.type)).toEqual(['cli', 'mcp'])
    expect(data.authRefs).toEqual(['SUPABASE_ACCESS_TOKEN'])
    expect(out).not.toContain('leakme')
  })
})
