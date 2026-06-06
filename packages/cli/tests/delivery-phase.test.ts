import { describe, it, expect } from 'vitest'
import { assessPhase, determinePhase, type PhaseInput } from '../src/core/delivery-phase.js'
import { emptyLifecycleCounts, type LifecycleState } from '../src/core/lifecycle.js'
import type { LayerStatus } from '../src/core/knowledge-discovery.js'

function layers(over: Partial<Record<string, string>> = {}): LayerStatus[] {
  const def: Record<string, string> = {
    Business: 'Consolidated',
    Product: 'Structured',
    Tech: 'Consolidated',
    Delivery: 'Missing',
    ...over,
  }
  return (['Business', 'Product', 'Tech', 'Delivery'] as const).map((layer) => ({
    layer,
    status: def[layer] as LayerStatus['status'],
    detected: [],
  }))
}

function input(over: Partial<PhaseInput> = {}): PhaseInput {
  const counts = { ...emptyLifecycleCounts(), ...(over.workItems?.byState ?? {}) }
  return {
    layers: over.layers ?? layers(),
    roadmap: over.roadmap ?? { present: false, candidates: 0, materialized: 0, remaining: 0 },
    workItems: {
      total: over.workItems?.total ?? 0,
      byState: counts as Record<LifecycleState, number>,
      items: over.workItems?.items ?? [],
    },
    ownership: over.ownership ?? {
      workItemsTotal: 0,
      workItemsWithOwnership: 0,
      workItemsMissingOwnership: 0,
    },
  }
}

describe('determinePhase (VS-047)', () => {
  it('Discovery when base layers are missing', () => {
    expect(determinePhase(input({ layers: layers({ Business: 'Missing' }) }))).toBe('Discovery')
  })

  it('Planning when base exists but no roadmap', () => {
    expect(determinePhase(input())).toBe('Planning')
  })

  it('Delivery Preparation when roadmap exists but 0 Work Items', () => {
    const phase = determinePhase(
      input({ roadmap: { present: true, candidates: 5, materialized: 0, remaining: 5 } })
    )
    expect(phase).toBe('Delivery Preparation')
  })

  it('Active Delivery when there are active Work Items', () => {
    const phase = determinePhase(
      input({
        roadmap: { present: true, candidates: 5, materialized: 1, remaining: 4 },
        workItems: { total: 1, byState: { ready: 1 } as any, items: [] },
      })
    )
    expect(phase).toBe('Active Delivery')
  })

  it('Maintenance when work items exist but none active', () => {
    const phase = determinePhase(
      input({
        roadmap: { present: true, candidates: 3, materialized: 3, remaining: 0 },
        workItems: { total: 2, byState: { completed: 2 } as any, items: [] },
      })
    )
    expect(phase).toBe('Maintenance')
  })
})

describe('assessPhase recommendations (VS-047)', () => {
  it('AC2: recommends roadmap-agent only when there is no roadmap', () => {
    const a = assessPhase(input())
    expect(a.recommendedAgents).toContain('roadmap-agent')
  })

  it('roadmap present + 0 WI → create --from roadmap + work-item-agent', () => {
    const a = assessPhase(
      input({ roadmap: { present: true, candidates: 4, materialized: 0, remaining: 4 } })
    )
    expect(a.recommendedAgents).toEqual(['kaddo create --from roadmap', 'work-item-agent'])
    expect(a.recommendedAgents).not.toContain('roadmap-agent')
  })

  it('ready Work Item → implementation-agent + concrete next step', () => {
    const a = assessPhase(
      input({
        roadmap: { present: true, candidates: 2, materialized: 1, remaining: 1 },
        workItems: {
          total: 1,
          byState: { ready: 1 } as any,
          items: [{ id: 'WI-014', title: 'Create task', lifecycle: 'ready' }],
        },
        ownership: { workItemsTotal: 1, workItemsWithOwnership: 1, workItemsMissingOwnership: 0 },
      })
    )
    expect(a.recommendedAgents).toContain('implementation-agent')
    expect(a.nextStep).toContain('WI-014')
  })

  it('draft Work Item → work-item-agent, refine to ready', () => {
    const a = assessPhase(
      input({
        roadmap: { present: true, candidates: 2, materialized: 1, remaining: 1 },
        workItems: {
          total: 1,
          byState: { draft: 1 } as any,
          items: [{ id: 'WI-001', title: 'Init', lifecycle: 'draft' }],
        },
        ownership: { workItemsTotal: 1, workItemsWithOwnership: 1, workItemsMissingOwnership: 0 },
      })
    )
    expect(a.recommendedAgents).toContain('work-item-agent')
    expect(a.nextStep).toContain('draft to ready')
  })

  it('in-progress Work Item → scan/owners/guard', () => {
    const a = assessPhase(
      input({
        roadmap: { present: true, candidates: 2, materialized: 1, remaining: 1 },
        workItems: {
          total: 1,
          byState: { 'in-progress': 1 } as any,
          items: [{ id: 'WI-002', title: 'Build', lifecycle: 'in-progress' }],
        },
        ownership: { workItemsTotal: 1, workItemsWithOwnership: 1, workItemsMissingOwnership: 0 },
      })
    )
    expect(a.recommendedAgents).toEqual(
      expect.arrayContaining(['kaddo scan', 'kaddo owners suggest', 'kaddo guard'])
    )
  })

  it('AC: incomplete ownership adds owners suggest', () => {
    const a = assessPhase(
      input({
        roadmap: { present: true, candidates: 2, materialized: 1, remaining: 1 },
        workItems: {
          total: 1,
          byState: { ready: 1 } as any,
          items: [{ id: 'WI-1', title: 'x', lifecycle: 'ready' }],
        },
        ownership: { workItemsTotal: 1, workItemsWithOwnership: 0, workItemsMissingOwnership: 1 },
      })
    )
    expect(a.recommendedAgents).toContain('kaddo owners suggest')
  })

  it('reasons reflect real state (roadmap + coverage)', () => {
    const a = assessPhase(
      input({
        roadmap: { present: true, candidates: 2, materialized: 1, remaining: 1 },
        workItems: {
          total: 1,
          byState: { ready: 1 } as any,
          items: [{ id: 'WI-1', title: 'x', lifecycle: 'ready' }],
        },
        ownership: { workItemsTotal: 1, workItemsWithOwnership: 1, workItemsMissingOwnership: 0 },
      })
    )
    expect(a.reasons).toContain('Roadmap available')
    expect(a.reasons.some((r) => r.includes('Ownership coverage 100%'))).toBe(true)
  })
})
