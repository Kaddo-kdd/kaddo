import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createResourceTool, updateResourceTool, deleteResourceTool, getResourceTool } from '../src/tools.js'
import { makeProject, write, config, cleanup } from './helpers.js'

// WI-038 — MCP resource mutations: LLM proposes, human confirms, Core persists. No secrets.

let root: string
afterEach(() => root && cleanup(root))

function dataOf(res: { ok: boolean; data?: unknown }) { return (res as { ok: true; data: Record<string, unknown> }).data }

describe('MCP Project Resource mutations (WI-038)', () => {
  it('create without confirm previews and writes nothing; with confirm persists', () => {
    root = makeProject(); config(root)
    const preview = createResourceTool(root, { title: 'Supabase Main', resource_type: 'database', provider: 'supabase' })
    expect(preview.ok).toBe(true)
    expect(dataOf(preview).status).toBe('needs_confirmation')
    expect(getResourceTool(root, 'RES-supabase-main').ok).toBe(false) // nothing written

    const created = createResourceTool(root, { title: 'Supabase Main', resource_type: 'database', provider: 'supabase' }, true)
    expect(dataOf(created).status).toBe('created')
    expect(getResourceTool(root, 'RES-supabase-main').ok).toBe(true)
  })

  it('never persists credential values (secret safety)', () => {
    root = makeProject(); config(root)
    createResourceTool(root, { title: 'DB', resource_type: 'database', authentication: { mode: 'external', refs: ['TOKEN', 'PWD=leak'] } }, true)
    const got = dataOf(getResourceTool(root, 'RES-db')) as { authRefs: string[]; path: string }
    expect(got.authRefs).toEqual(['TOKEN'])
    expect(fs.readFileSync(path.join(root, got.path), 'utf-8')).not.toContain('leak')
  })

  it('update previews then applies', () => {
    root = makeProject(); config(root)
    createResourceTool(root, { title: 'DB', resource_type: 'database' }, true)
    const preview = updateResourceTool(root, 'RES-db', { provider: 'supabase' })
    expect(dataOf(preview).status).toBe('needs_confirmation')
    updateResourceTool(root, 'RES-db', { provider: 'supabase' }, true)
    expect((dataOf(getResourceTool(root, 'RES-db')) as { provider: string }).provider).toBe('supabase')
  })

  it('delete without confirm lists references; with confirm removes only the resource', () => {
    root = makeProject(); config(root)
    createResourceTool(root, { title: 'Orders DB', resource_type: 'database' }, true)
    write(root, 'knowledge/delivery/work-items/ready/WI-900.md', ['---', 'id: WI-900', 'title: X', 'type: feature', 'status: ready', 'resources:', '  - id: RES-orders-db', '    role: affected', '---', '', '# X', ''].join('\n'))

    const preview = deleteResourceTool(root, 'RES-orders-db')
    const refs = (dataOf(preview) as { references: { id: string }[] }).references
    expect(refs.map((r) => r.id)).toEqual(['WI-900'])
    expect(getResourceTool(root, 'RES-orders-db').ok).toBe(true) // not deleted yet

    deleteResourceTool(root, 'RES-orders-db', true)
    expect(getResourceTool(root, 'RES-orders-db').ok).toBe(false)
    expect(fs.existsSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-900.md'))).toBe(true)
  })

  it('delete/update fail cleanly for unknown ids', () => {
    root = makeProject(); config(root)
    expect(deleteResourceTool(root, 'RES-nope').ok).toBe(false)
    expect(updateResourceTool(root, 'RES-nope', { provider: 'x' }).ok).toBe(false)
  })
})
