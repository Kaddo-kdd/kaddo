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
  analyzeInitiativeTool,
  completeInitiativeTool,
  addInitiativeExternalLinkTool,
  suggestInitiativeForExternalItemTool,
} from '../src/initiatives.js'
import { getInitiative } from '@kaddo/cli/core'
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

describe('kaddo_analyze_initiative (AC-16)', () => {
  it('returns findings and grounded suggestions', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    addInitiativeCandidateTool(root, { id: 'INI-001', title: 'Login', confirm: true })
    const res = analyzeInitiativeTool(root, 'INI-001')
    expect(res.ok).toBe(true)
    const d = data(res)
    expect((d.findings as Array<{ code: string }>).some((f) => f.code === 'pending-candidates')).toBe(true)
    expect((d.suggestedCandidates as unknown[]).length).toBe(1)
  })

  it('fails for an unknown initiative', () => {
    root = makeProject()
    config(root)
    expect(analyzeInitiativeTool(root, 'INI-999').ok).toBe(false)
  })
})

describe('kaddo_add_initiative_external_link / suggest (AC-22, AC-24)', () => {
  it('previews then adds an external link, and suggests by it', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })

    const preview = addInitiativeExternalLinkTool(root, { id: 'INI-001', integration: 'jira', externalId: 'AUTH-20' })
    expect(data(preview).instruction).toContain('confirm=true')

    const applied = addInitiativeExternalLinkTool(root, { id: 'INI-001', integration: 'jira', externalId: 'AUTH-20', externalType: 'epic', confirm: true })
    expect(applied.ok).toBe(true)

    const suggest = suggestInitiativeForExternalItemTool(root, { integration: 'jira', externalId: 'AUTH-20' })
    expect(suggest.ok).toBe(true)
    expect((data(suggest).suggestions as Array<{ id: string }>)[0].id).toBe('INI-001')
  })

  it('suggest returns empty when nothing matches', () => {
    root = makeProject()
    config(root)
    const res = suggestInitiativeForExternalItemTool(root, { integration: 'jira', externalId: 'NOPE' })
    expect(res.ok).toBe(true)
    expect((data(res).suggestions as unknown[]).length).toBe(0)
  })
})

describe('kaddo_complete_initiative (AC-19, AC-20)', () => {
  it('without confirm returns readiness and does NOT complete', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    updateInitiativeTool(root, { id: 'INI-001', status: 'in-progress', confirm: true })
    const preview = completeInitiativeTool(root, { id: 'INI-001' })
    expect(preview.ok).toBe(true)
    expect(data(preview).readiness).toBeTruthy()
    expect(getInitiative(root, 'INI-001')!.status).toBe('in-progress') // not completed
  })

  it('with confirm transitions to completed (human gate relayed)', () => {
    root = makeProject()
    config(root)
    createInitiativeTool(root, { title: 'Auth', confirm: true })
    updateInitiativeTool(root, { id: 'INI-001', status: 'in-progress', confirm: true })
    const done = completeInitiativeTool(root, { id: 'INI-001', confirm: true })
    expect(done.ok).toBe(true)
    expect(data(done).applied).toBe(true)
    expect(getInitiative(root, 'INI-001')!.status).toBe('completed')
  })
})
