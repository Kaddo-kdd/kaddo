import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import {
  listInitiativesTool,
  getInitiativeTool,
  getInitiativeContextTool,
  getInitiativeProgressTool,
  createInitiativeTool,
  updateInitiativeTool,
  addInitiativeCandidateTool,
  materializeInitiativeCandidateTool,
} from '../src/initiatives.js'
import { makeProject, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function data(result: { ok: boolean }): Record<string, unknown> {
  return (result as { data: Record<string, unknown> }).data
}

describe('kaddo_create_initiative (AC-12, AC-14)', () => {
  it('previews without confirm and does not write', () => {
    root = makeProject()
    config(root)
    const preview = createInitiativeTool(root, { title: 'Auth' })
    expect(preview.ok).toBe(true)
    expect(data(preview).instruction).toContain('confirm=true')
    expect(fs.existsSync(path.join(root, 'knowledge', 'delivery', 'initiatives'))).toBe(false)
  })

  it('creates with confirm=true', () => {
    root = makeProject()
    config(root)
    const result = createInitiativeTool(root, { title: 'Auth', confirm: true, domains: ['Identity'] })
    expect(result.ok).toBe(true)
    expect(data(result).applied).toBe(true)
    const list = listInitiativesTool(root)
    expect((data(list) as unknown as unknown[]).length).toBe(1)
  })

  it('rejects empty title', () => {
    root = makeProject()
    config(root)
    expect(createInitiativeTool(root, { title: '  ', confirm: true }).ok).toBe(false)
  })
})

describe('kaddo_get_initiative / list / progress / context (AC-12, AC-13)', () => {
  it('lists, gets, and reports progress', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    addInitiativeCandidateTool(root, { id: 'INI-001', title: 'Login', confirm: true })

    const list = listInitiativesTool(root)
    const rows = data(list) as unknown as Array<{ id: string }>
    expect(rows[0].id).toBe('INI-001')

    expect(getInitiativeTool(root, 'INI-001').ok).toBe(true)
    expect(getInitiativeTool(root, 'INI-999').ok).toBe(false)

    const prog = getInitiativeProgressTool(root, 'INI-001')
    expect((data(prog).planning as Record<string, number>).totalCandidates).toBe(1)
  })

  it('context is initiative-scoped with candidates split and work items', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    addInitiativeCandidateTool(root, { id: 'INI-001', title: 'Login', confirm: true })
    materializeInitiativeCandidateTool(root, { id: 'INI-001', candidateId: 'WI-CANDIDATE-001', confirm: true })

    const ctx = getInitiativeContextTool(root, 'INI-001')
    expect(ctx.ok).toBe(true)
    const d = data(ctx)
    expect((d.candidates as { materialized: unknown[]; pending: unknown[] }).materialized.length).toBe(1)
    expect((d.candidates as { pending: unknown[] }).pending.length).toBe(0)
    expect(d.workItems).toBeTruthy()
  })
})

describe('kaddo_update_initiative (AC-12, AC-14)', () => {
  it('previews status transition and applies with confirm', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })

    const preview = updateInitiativeTool(root, { id: 'INI-001', status: 'in-progress' })
    expect(data(preview).instruction).toContain('confirm=true')

    const applied = updateInitiativeTool(root, { id: 'INI-001', status: 'in-progress', confirm: true })
    expect(applied.ok).toBe(true)
    expect(getInitiativeTool(root, 'INI-001').ok).toBe(true)
    const d = data(applied).result as { status: string }
    expect(d.status).toBe('in-progress')
  })

  it('rejects an invalid lifecycle transition', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    const bad = updateInitiativeTool(root, { id: 'INI-001', status: 'completed', confirm: true })
    expect(bad.ok).toBe(false)
  })
})

describe('kaddo_materialize_initiative_candidate (AC-12, AC-14)', () => {
  it('materializes a candidate into a WI with initiative association', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    addInitiativeCandidateTool(root, { id: 'INI-001', title: 'Login', confirm: true })

    const preview = materializeInitiativeCandidateTool(root, { id: 'INI-001', candidateId: 'WI-CANDIDATE-001' })
    expect(data(preview).instruction).toContain('confirm=true')

    const applied = materializeInitiativeCandidateTool(root, { id: 'INI-001', candidateId: 'WI-CANDIDATE-001', confirm: true })
    expect(applied.ok).toBe(true)
    const wiId = (data(applied).result as { workItemId: string }).workItemId
    const draftDir = path.join(root, 'knowledge', 'delivery', 'work-items', 'draft')
    const file = fs.readdirSync(draftDir).find((f) => f.startsWith(wiId))!
    const { data: fm } = matter(fs.readFileSync(path.join(draftDir, file), 'utf-8'))
    expect(fm.initiative).toBe('INI-001')
  })

  it('fails for an unknown candidate', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    expect(materializeInitiativeCandidateTool(root, { id: 'INI-001', candidateId: 'WI-CANDIDATE-999', confirm: true }).ok).toBe(false)
  })
})
