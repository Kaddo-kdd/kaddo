import { describe, it, expect } from 'vitest'
import { prioritizeActions, DEFAULT_ACTION_CAP } from '../src/lib/next-actions'
import type { PlanningInsights, AttentionItem, EntityInsight, MilestoneInsight } from '../src/lib/api'

// WI-088 — the "What's next" prioritization is deterministic and traces every action to a canonical signal.
// A legit pending dependency is blocking CONTEXT, never an action to "fix" (AC-04/05).

function att(p: Partial<AttentionItem> & Pick<AttentionItem, 'type' | 'severity' | 'artifactId' | 'artifactKind'>): AttentionItem {
  return { title: p.artifactId, reason: `${p.type} on ${p.artifactId}`, link: `/x/${p.artifactId}`, ...p }
}
function ins(over: Partial<PlanningInsights>): PlanningInsights {
  return {
    counts: { plans: {}, epics: {}, initiatives: {} },
    coverage: { totalCandidates: 0, materialized: 0, pending: 0, validated: 0, unresolved: 0 },
    delivery: { associated: { total: 0, byState: {}, blocked: 0, completed: 0 } as never, independent: { total: 0, byState: {}, blocked: 0, completed: 0 } as never },
    outcome: { total: 0, passed: 0, failed: 0, notVerified: 0, manualReview: 0, ambiguous: 0, stale: 0 },
    indicators: { blockingIssues: 0, outcomeNeedsVerification: 0, milestonesNeedingReview: 0 },
    attention: [], milestones: [], entities: [], ...over,
  }
}
const entity = (o: Partial<EntityInsight> & Pick<EntityInsight, 'id' | 'kind' | 'status' | 'readiness'>): EntityInsight => ({
  title: o.id, delivery: { total: 1, completed: 1, blocked: 0 }, outcome: { total: 1, passed: 1, needsVerification: 0 },
  historicalEvidenceGap: false, link: `/x/${o.id}`, ...o,
})

describe('prioritizeActions (WI-088 AC-04)', () => {
  it('orders by real impact: blocking → review/decision → active → data-quality, deterministically', () => {
    const data = ins({
      attention: [
        att({ type: 'incomplete-delivery', severity: 'info', artifactId: 'EP-ACTIVE', artifactKind: 'epic' }),
        att({ type: 'unverified-outcome', severity: 'warning', artifactId: 'EP-EVID', artifactKind: 'epic' }),
        att({ type: 'provenance', severity: 'blocking', artifactId: 'INI-BROKEN', artifactKind: 'initiative' }),
      ],
      entities: [entity({ id: 'EP-READY', kind: 'epic', status: 'in-progress', readiness: 'READY_TO_COMPLETE' })],
    })
    const { actions } = prioritizeActions(data)
    // A blocking broken reference leads; evidence and the ready-for-decision entity are both tier 2
    // (ordered by kind then id); active work is tier 3.
    expect(actions.map((a) => [a.tier, a.artifactId])).toEqual([
      [1, 'INI-BROKEN'], [2, 'EP-EVID'], [2, 'EP-READY'], [3, 'EP-ACTIVE'],
    ])
  })

  it('a warning-level (ambiguous) provenance note is data-quality, never a critical block (feedback #1)', () => {
    const data = ins({
      attention: [
        att({ type: 'provenance', severity: 'warning', artifactId: 'INI-055', artifactKind: 'initiative', reason: 'AN-005, AN-006, AN-007 is not a single canonical Work Item id' }),
        att({ type: 'unverified-outcome', severity: 'warning', artifactId: 'EP-EVID', artifactKind: 'epic' }),
      ],
    })
    const { actions, dataQuality } = prioritizeActions(data)
    // The real review (evidence) outranks the historical ambiguous reference, which is tier 4 data-quality.
    expect(actions[0].artifactId).toBe('EP-EVID')
    const ini = actions.find((a) => a.artifactId === 'INI-055')!
    expect(ini.tier).toBe(4)
    expect(dataQuality.map((a) => a.artifactId)).toEqual(['INI-055'])
  })

  it('treats pending dependencies as blocking context, never as actions', () => {
    const data = ins({
      attention: [
        att({ type: 'dependency', severity: 'blocking', artifactId: 'EP-002', artifactKind: 'epic' }),
        att({ type: 'dependency', severity: 'blocking', artifactId: 'EP-003', artifactKind: 'epic' }),
      ],
    })
    const { actions, blocking } = prioritizeActions(data)
    expect(actions).toEqual([])
    expect(blocking.map((b) => b.artifactId)).toEqual(['EP-002', 'EP-003'])
  })

  it('emits at most one action per artifact (its highest-priority signal)', () => {
    const data = ins({
      attention: [
        att({ type: 'incomplete-delivery', severity: 'info', artifactId: 'EP-1', artifactKind: 'epic' }),
        att({ type: 'provenance', severity: 'blocking', artifactId: 'EP-1', artifactKind: 'epic' }),
      ],
    })
    const { actions } = prioritizeActions(data)
    expect(actions).toHaveLength(1)
    expect(actions[0].tier).toBe(1)
  })

  it('does not invent a human decision: only READY_* non-terminal entities become decision actions', () => {
    const data = ins({
      entities: [
        entity({ id: 'EP-DONE', kind: 'epic', status: 'completed', readiness: 'READY_TO_COMPLETE' }),
        entity({ id: 'EP-WORK', kind: 'epic', status: 'in-progress', readiness: 'NEEDS_WORK' }),
        entity({ id: 'EP-GO', kind: 'epic', status: 'in-progress', readiness: 'READY_WITH_EXCEPTIONS' }),
      ],
    })
    const { actions } = prioritizeActions(data)
    expect(actions.map((a) => a.artifactId)).toEqual(['EP-GO'])
    expect(actions[0].verb).toMatch(/completion decision/i)
  })

  it('returns an empty action list (honest empty state) when nothing is actionable', () => {
    expect(prioritizeActions(ins({})).actions).toEqual([])
  })

  it('a milestone needing review becomes a tier-2 action landing on its Plan', () => {
    const m: MilestoneInsight = { id: 'RM-07', title: 'Integrations', planId: 'PLAN-001', planTitle: 'Roadmap', epics: 2, outcome: { total: 3, passed: 1, failed: 0, notVerified: 2, manualReview: 0, ambiguous: 0, criteria: [], stale: [] }, needsReview: true }
    const { actions } = prioritizeActions(ins({ milestones: [m] }))
    expect(actions[0]).toMatchObject({ tier: 2, artifactId: 'PLAN-001', artifactKind: 'plan', section: 'milestones' })
  })

  it('caps the displayed actions at three', () => {
    const data = ins({
      attention: ['A', 'B', 'C', 'D'].map((id) => att({ type: 'unverified-outcome', severity: 'warning', artifactId: id, artifactKind: 'epic' })),
    })
    expect(prioritizeActions(data).actions.slice(0, DEFAULT_ACTION_CAP)).toHaveLength(3)
  })
})
