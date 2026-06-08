import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { normalizeGlob, analyzeGlob } from '../src/core/ownership-suggest.js'
import { findDuplicateWorkItems } from '../src/core/project-explain.js'
import { assessPhase, type PhaseInput } from '../src/core/delivery-phase.js'
import { emptyLifecycleCounts, type LifecycleState } from '../src/core/lifecycle.js'
import type { LayerStatus } from '../src/core/knowledge-discovery.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'
import { RESPONSIBILITY_MATRIX } from '../src/agents/responsibility.js'

let tmp: string
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-vs052-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('owners suggest — glob assistance (VS-052)', () => {
  it('AC4: normalizes a directory path to a /** glob', () => {
    expect(normalizeGlob('src/cli')).toBe('src/cli/**')
    expect(normalizeGlob('src/cli/')).toBe('src/cli/**')
    expect(normalizeGlob('package.json')).toBe('package.json') // file kept as-is
    expect(normalizeGlob('src/cli/**')).toBe('src/cli/**')
  })

  it('AC6: warns when a glob is too broad', () => {
    const a = analyzeGlob(tmp, 'src/**')
    expect(a.warnings.some((w) => /broad/i.test(w))).toBe(true)
  })

  it('AC5: warns and suggests a near match when a path does not exist', () => {
    fs.mkdirSync(path.join(tmp, 'src', 'shared'), { recursive: true })
    const a = analyzeGlob(tmp, 'src/shares/**')
    expect(a.suggestion).toBe('src/shared/**')
    expect(a.warnings.some((w) => w.includes('Did you mean src/shared/**'))).toBe(true)
  })

  it('does not warn for a valid existing narrow path', () => {
    fs.mkdirSync(path.join(tmp, 'src', 'payments'), { recursive: true })
    expect(analyzeGlob(tmp, 'src/payments/**').warnings).toEqual([])
  })
})

describe('duplicate Work Items (VS-052)', () => {
  it('AC10: flags same source candidate and same normalized (translated) title', () => {
    const groups = findDuplicateWorkItems([
      { id: 'WI-001', title: 'Initialize TypeScript CLI project', sourceId: 'WI-CANDIDATE-1' },
      { id: 'WI-002', title: 'Inicializar proyecto TypeScript CLI', sourceId: 'WI-CANDIDATE-1' },
      { id: 'WI-003', title: 'Configure Vitest', sourceId: '' },
    ])
    expect(groups.length).toBeGreaterThan(0)
    const ids = groups.flatMap((g) => g.items.map((i) => i.id))
    expect(ids).toContain('WI-001')
    expect(ids).toContain('WI-002')
  })

  it('flags exact normalized title duplicates (accents/case)', () => {
    const groups = findDuplicateWorkItems([
      { id: 'WI-1', title: 'Add Login' },
      { id: 'WI-2', title: 'add  login' },
    ])
    expect(groups.length).toBe(1)
  })

  it('no false positive for distinct items', () => {
    expect(
      findDuplicateWorkItems([
        { id: 'WI-1', title: 'Add login', sourceId: 'a' },
        { id: 'WI-2', title: 'Export CSV', sourceId: 'b' },
      ])
    ).toEqual([])
  })
})

function layers(): LayerStatus[] {
  return (['Business', 'Product', 'Tech', 'Delivery'] as const).map((layer) => ({
    layer,
    status: layer === 'Delivery' ? 'Missing' : 'Consolidated',
    detected: [],
  })) as LayerStatus[]
}
function input(byState: Partial<Record<LifecycleState, number>>, items: PhaseInput['workItems']['items'], missingOwnership = 0): PhaseInput {
  return {
    layers: layers(),
    roadmap: { present: true, candidates: 3, materialized: 1, remaining: 2 },
    workItems: { total: items.length, byState: { ...emptyLifecycleCounts(), ...byState } as Record<LifecycleState, number>, items },
    ownership: { workItemsTotal: items.length, workItemsWithOwnership: items.length - missingOwnership, workItemsMissingOwnership: missingOwnership },
  }
}

describe('phase LLM instructions (VS-052)', () => {
  it('AC3: Active Delivery / draft → refine, do not implement', () => {
    const a = assessPhase(input({ draft: 1 }, [{ id: 'WI-1', title: 'x', lifecycle: 'draft' }]))
    expect(a.llmInstructions.join(' ').toLowerCase()).toContain('refine draft work items')
    expect(a.llmInstructions.join(' ').toLowerCase()).toContain('do not implement')
  })

  it('AC3: Active Delivery / ready → implementation-agent, branch name only', () => {
    const a = assessPhase(input({ ready: 1 }, [{ id: 'WI-1', title: 'x', lifecycle: 'ready' }]))
    expect(a.llmInstructions.join(' ').toLowerCase()).toContain('implementation-agent')
    expect(a.llmInstructions.join(' ').toLowerCase()).toContain('suggest a branch name only')
  })

  it('incomplete ownership adds an owners-suggest instruction', () => {
    const a = assessPhase(input({ ready: 1 }, [{ id: 'WI-1', title: 'x', lifecycle: 'ready' }], 1))
    expect(a.recommendedAgents).toContain('kaddo owners suggest')
    expect(a.llmInstructions.join(' ').toLowerCase()).toContain('ownership is incomplete')
  })
})

describe('ownership-agent (VS-052)', () => {
  it('AC7: exists with precise-ownership boundaries', () => {
    expect(RESPONSIBILITY_MATRIX['ownership-agent']).toBeDefined()
    const p = AGENT_PROMPTS.find((x) => x.fileName === 'ownership-agent.md')!
    expect(p).toBeDefined()
    expect(p.content.toLowerCase()).toContain('do not implement code')
    expect(p.content.toLowerCase()).toMatch(/narrow|precise/)
  })
})
