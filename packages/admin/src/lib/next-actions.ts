import type { PlanningInsights, AttentionItem, InsightArtifactKind } from './api'

// WI-088 — derive the action-first "What's next" feed from the SAME canonical projection the Diagnostics
// view uses (/planning/insights). Pure and deterministic: no telemetry, heuristics, ranking model or
// invented work. Every action traces to a canonical signal (an attention finding or a verifiable entity
// readiness). Legitimate pending dependencies are NOT actions — they are blocking context. Core stays the
// source of truth; this only re-presents and prioritizes.

export type ActionTier = 1 | 2 | 3 | 4
export type ActionSection = 'evidence' | 'relations' | 'milestones' | 'overview'

export type NextAction = {
  tier: ActionTier
  /** Imperative label, e.g. "Review evidence". */
  verb: string
  /** Short CTA on the button, e.g. "Review". */
  cta: string
  artifactId: string
  artifactKind: InsightArtifactKind
  artifactTitle: string
  /** A verifiable, canonical reason — never inferred. */
  reason: string
  /** Target detail section to land on, when the destination supports it. */
  section?: ActionSection
  /** Whether the signal has a navigable destination; false → inspect-only, no promise to fix. */
  hasDestination: boolean
}

export type NextActionsResult = {
  /** Ranked actions (all of them). The Overview shows the first `DEFAULT_ACTION_CAP`. */
  actions: NextAction[]
  /** Pending-dependency findings — shown as blocking CONTEXT, never as incidents to fix. */
  blocking: AttentionItem[]
  /** Total canonical findings, so "N of M" stays honest. */
  totalFindings: number
}

export const DEFAULT_ACTION_CAP = 3

const KIND_RANK: Record<InsightArtifactKind, number> = { plan: 0, epic: 1, initiative: 2, 'work-item': 3 }

// Attention signal → action tier. `dependency` is intentionally absent: it is context, not an action.
const ATTENTION_TIER: Partial<Record<AttentionItem['type'], ActionTier>> = {
  provenance: 1,
  'unverified-outcome': 2,
  'incomplete-delivery': 4,
  'pending-candidates': 4,
  'declared-risk': 4,
}

function verbFor(type: AttentionItem['type']): { verb: string; cta: string; section?: ActionSection } {
  switch (type) {
    case 'provenance': return { verb: 'Inspect reference', cta: 'Inspect', section: 'relations' }
    case 'unverified-outcome': return { verb: 'Review evidence', cta: 'Review', section: 'evidence' }
    case 'incomplete-delivery': return { verb: 'Review progress', cta: 'Review' }
    case 'pending-candidates': return { verb: 'Review coverage', cta: 'Review', section: 'relations' }
    case 'declared-risk': return { verb: 'Review declared risk', cta: 'Review' }
    default: return { verb: 'Review', cta: 'Review' }
  }
}

const TERMINAL = new Set(['completed', 'cancelled'])

/**
 * Deterministic prioritization (WI-088 AC-04). One action per artifact (its highest-priority signal), so a
 * single noisy artifact never fills the list and nine dependency-blocked epics never read as nine incidents.
 * Order: tier asc → artifact-kind rank → id → verb. Fully stable, independent of input order.
 */
export function prioritizeActions(ins: PlanningInsights): NextActionsResult {
  const byArtifact = new Map<string, NextAction>()
  const consider = (a: NextAction) => {
    const prev = byArtifact.get(a.artifactId)
    if (!prev || a.tier < prev.tier) byArtifact.set(a.artifactId, a)
  }

  // Tier 3 — a verifiable human decision: preconditions met (READY_*), not yet closed. Never inferred.
  for (const e of ins.entities) {
    const ready = e.readiness === 'READY_TO_COMPLETE' || e.readiness === 'READY_WITH_EXCEPTIONS'
    if (ready && !TERMINAL.has(e.status.toLowerCase())) {
      consider({
        tier: 3, verb: 'Ready for your completion decision', cta: 'Open',
        artifactId: e.id, artifactKind: e.kind, artifactTitle: e.title,
        reason: `Preconditions met (${e.readiness.replace(/_/g, ' ').toLowerCase()}); human approval is still required to close.`,
        section: 'evidence', hasDestination: Boolean(e.link),
      })
    }
  }

  // Tiers 1/2/4 — from attention findings (dependency excluded).
  for (const a of ins.attention) {
    const tier = ATTENTION_TIER[a.type]
    if (!tier) continue
    const { verb, cta, section } = verbFor(a.type)
    consider({
      tier, verb, cta, artifactId: a.artifactId, artifactKind: a.artifactKind, artifactTitle: a.title,
      reason: a.reason, section, hasDestination: Boolean(a.link),
    })
  }

  // Tier 2 — milestones needing exit-criteria review (embedded in their Plan; land on the Milestones tab).
  for (const m of ins.milestones) {
    if (!m.needsReview) continue
    consider({
      tier: 2, verb: 'Review milestone exit criteria', cta: 'Review',
      artifactId: m.planId, artifactKind: 'plan', artifactTitle: m.planTitle,
      reason: `Milestone ${m.id}: ${m.outcome.passed}/${m.outcome.total} exit criteria verified — needs review.`,
      section: 'milestones', hasDestination: true,
    })
  }

  const actions = [...byArtifact.values()].sort((x, y) =>
    x.tier - y.tier ||
    KIND_RANK[x.artifactKind] - KIND_RANK[y.artifactKind] ||
    x.artifactId.localeCompare(y.artifactId) ||
    x.verb.localeCompare(y.verb),
  )

  const blocking = ins.attention.filter((a) => a.type === 'dependency')

  return { actions, blocking, totalFindings: ins.attention.length }
}
