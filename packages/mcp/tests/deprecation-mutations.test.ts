import { describe, it, expect, afterEach } from 'vitest'
import {
  createDeprecationTool,
  addDeprecationTargetTool,
  updateDeprecationTargetTool,
  removeDeprecationTargetTool,
  getDeprecationTool,
  listDeprecationsTool,
  planDeprecationTool,
  analyzeDeprecationTool,
} from '../src/tools.js'
import { makeProject, config, cleanup } from './helpers.js'

// WI-049 — MCP Controlled Deprecation surfaces: propose → preview → confirm. Core persists Markdown.

let root: string
afterEach(() => root && cleanup(root))

function dataOf(res: { ok: boolean; data?: unknown }) { return (res as { ok: true; data: Record<string, unknown> }).data }

describe('MCP Controlled Deprecation (WI-049)', () => {
  it('create plan previews then persists; add-target previews then appends', () => {
    root = makeProject(); config(root)

    const preview = createDeprecationTool(root, { title: 'Retire legacy credit' })
    expect(preview.ok).toBe(true)
    expect(dataOf(preview).status).toBe('needs_confirmation')
    expect(listDeprecationsTool(root).ok).toBe(true)
    expect((dataOf(listDeprecationsTool(root)) as unknown[]).length).toBe(0) // nothing written

    const created = createDeprecationTool(root, { title: 'Retire legacy credit' }, true)
    expect(dataOf(created).status).toBe('created')
    const planId = (dataOf(created) as { id: string }).id
    expect(planId).toBe('DEP-001')

    const tPreview = addDeprecationTargetTool(root, planId, { type: 'function', locator: 'legacy.ts#calc' })
    expect(dataOf(tPreview).status).toBe('needs_confirmation')
    expect((dataOf(getDeprecationTool(root, planId)) as { targetCount: number }).targetCount).toBe(0)

    const added = addDeprecationTargetTool(root, planId, { type: 'function', locator: 'legacy.ts#calc' }, true)
    expect(dataOf(added).status).toBe('added')
    expect((dataOf(added) as { targetId: string }).targetId).toBe('DEP-TGT-001')
    expect((dataOf(getDeprecationTool(root, planId)) as { targetCount: number }).targetCount).toBe(1)
  })

  it('update-target applies no-lossy; preview writes nothing', () => {
    root = makeProject(); config(root)
    createDeprecationTool(root, { title: 'P' }, true)
    addDeprecationTargetTool(root, 'DEP-001', { id: 'DEP-TGT-001', type: 'route', locator: 'POST /x', lifecycle: 'candidate' }, true)

    const preview = updateDeprecationTargetTool(root, 'DEP-001', 'DEP-TGT-001', { lifecycle: 'usage-validated' })
    expect(dataOf(preview).status).toBe('needs_confirmation')
    let plan = dataOf(getDeprecationTool(root, 'DEP-001')) as { targets: { id: string; lifecycle: string }[] }
    expect(plan.targets[0].lifecycle).toBe('candidate') // unchanged

    updateDeprecationTargetTool(root, 'DEP-001', 'DEP-TGT-001', { lifecycle: 'usage-validated' }, true)
    plan = dataOf(getDeprecationTool(root, 'DEP-001')) as { targets: { id: string; lifecycle: string; locator: string | null }[] }
    expect(plan.targets[0].lifecycle).toBe('usage-validated')
    expect(plan.targets[0].locator).toBe('POST /x') // preserved (no-lossy)
  })

  it('remove-target previews dependents and only removes with confirm', () => {
    root = makeProject(); config(root)
    createDeprecationTool(root, { title: 'P' }, true)
    addDeprecationTargetTool(root, 'DEP-001', { id: 'FN', type: 'function', locator: 'f#f' }, true)
    addDeprecationTargetTool(root, 'DEP-001', { id: 'SP', type: 'database-object', locator: 'sp', dependsOnRemoval: ['FN'] }, true)

    const preview = removeDeprecationTargetTool(root, 'DEP-001', 'FN')
    expect(dataOf(preview).status).toBe('needs_confirmation')
    expect((dataOf(preview) as { dependents: string[] }).dependents).toEqual(['SP'])
    expect((dataOf(getDeprecationTool(root, 'DEP-001')) as { targetCount: number }).targetCount).toBe(2) // nothing removed

    const removed = removeDeprecationTargetTool(root, 'DEP-001', 'FN', true)
    expect(dataOf(removed).status).toBe('removed')
    expect((dataOf(getDeprecationTool(root, 'DEP-001')) as { targetCount: number }).targetCount).toBe(1)
  })

  it('plan + analyze expose waves and confidence for a dependency chain', () => {
    root = makeProject(); config(root)
    createDeprecationTool(root, { title: 'Chain' }, true)
    addDeprecationTargetTool(root, 'DEP-001', { id: 'FN', type: 'function', locator: 'f#f' }, true)
    addDeprecationTargetTool(root, 'DEP-001', { id: 'SP', type: 'database-object', locator: 'sp', dependsOnRemoval: ['FN'] }, true)

    const waves = dataOf(planDeprecationTool(root, 'DEP-001')) as { waves: string[][] }
    expect(waves.waves).toEqual([['FN'], ['SP']])
    const intel = dataOf(analyzeDeprecationTool(root, 'DEP-001')) as { eligible: string[] }
    // FN has no dependents to retire first → eligible; SP waits on FN.
    expect(intel.eligible).toEqual(['FN'])
  })

  it('fails clearly for an unknown plan and a validation error', () => {
    root = makeProject(); config(root)
    expect(getDeprecationTool(root, 'DEP-999').ok).toBe(false)
    createDeprecationTool(root, { title: 'P' }, true)
    // invalid lifecycle -> VALIDATION_FAILED on apply
    const bad = addDeprecationTargetTool(root, 'DEP-001', { id: 'X', type: 'function', locator: 'x#x', lifecycle: 'bogus' }, true)
    expect(bad.ok).toBe(false)
  })
})
