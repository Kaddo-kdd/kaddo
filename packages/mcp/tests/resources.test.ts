import { describe, it, expect, afterEach } from 'vitest'
import { listResourcesTool, getResourceTool } from '../src/tools.js'
import { makeProject, write, config, cleanup } from './helpers.js'

// WI-031 — MCP read surface for Project Resources. Read-only, never exposes secret values.

let root: string
afterEach(() => root && cleanup(root))

const RESOURCE = [
  '---', 'type: project-resource', 'id: RES-supabase-main', 'title: Supabase Main',
  'resource_type: database', 'provider: supabase', 'environments: [development, production]',
  'access_interfaces:', '  - type: cli', '    tool: supabase', '  - type: mcp',
  'authentication:', '  mode: external', '  refs: [SUPABASE_ACCESS_TOKEN, "SECRET=leakme"]',
  '---', '', '# Purpose', '', 'Data.', '',
].join('\n')

describe('MCP Project Resources tools (WI-031)', () => {
  it('kaddo_list_resources returns the resources', () => {
    root = makeProject(); config(root)
    write(root, 'knowledge/tech/resources/supabase.md', RESOURCE)
    const res = listResourcesTool(root)
    expect(res.ok).toBe(true)
    if (res.ok) {
      const data = res.data as { id: string }[]
      expect(data.map((r) => r.id)).toEqual(['RES-supabase-main'])
    }
  })

  it('kaddo_get_resource returns the detail without secret values', () => {
    root = makeProject(); config(root)
    write(root, 'knowledge/tech/resources/supabase.md', RESOURCE)
    const res = getResourceTool(root, 'RES-supabase-main')
    expect(res.ok).toBe(true)
    if (res.ok) {
      const d = res.data as { authRefs: string[]; interfaces: { type: string }[] }
      expect(d.interfaces.map((i) => i.type)).toEqual(['cli', 'mcp'])
      expect(d.authRefs).toEqual(['SUPABASE_ACCESS_TOKEN'])
      expect(JSON.stringify(res.data)).not.toContain('leakme')
    }
  })

  it('kaddo_get_resource fails cleanly for an unknown id', () => {
    root = makeProject(); config(root)
    const res = getResourceTool(root, 'RES-nope')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toContain('not found')
  })

  it('returns empty when the project has no resources', () => {
    root = makeProject(); config(root)
    const res = listResourcesTool(root)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.data).toEqual([])
  })
})
