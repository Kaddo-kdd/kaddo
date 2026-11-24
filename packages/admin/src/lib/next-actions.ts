import type { PlanningInsights, AttentionItem, InsightArtifactKind } from './api'

// WI-088 — derive the action-first "What's next" feed from the SAME canonical projection the Diagnostics
// view uses (/planning/insights). Pure and deterministic: no telemetry, heuristics, ranking model or
// invented work. Every action traces to a canonical signal, and its priority follows the signal's REAL
// impact on the ability to make progress — not just finding order:
//
//   1 blocking    a real, fixable block (a broken/mismatched reference Core marks `blocking`)
//   2 decision    evidence to review or a human completion decision whose preconditions are met
//   3 active      committed work still in progress that needs attention
//   4 data-quality a provenance/quality note that is NOT an operational block (an ambiguous historical
//                  `materialized_as` reference, stale evidence, a coverage gap, a declared risk)
//
// A legitimate pending DEPENDENCY is context, not an action. A `warning`-level provenance note never
// outranks a real block and is never shown as a critical error. No project-specific logic. Core stays the
// source of truth; this only re-presents and prioritizes.

export type ActionTier = 1 | 2 | 3 | 4
export type ActionSection = 'evidence' | 'relations' | 'milestones' | 'overview'

export type NextAction = {
  tier: ActionTier
  /** Imperative label — what the person can do, e.g. "Review evidence". */
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
  /** Tier-4 provenance / data-quality notes — surfaced quietly, never as critical blocks. */
  dataQuality: NextAction[]
  /** Total canonical findings, so "N of M" stays honest. */
  totalFindings: number
}

export const DEFAULT_ACTION_CAP = 3

const KIND_RANK: Record<InsightArtifactKind, number> = { plan: 0, epic: 1, initiative: 2, 'work-item': 3 }

type Mapped = { tier: ActionTier; verb: string; cta: string; section?: ActionSection }

// Map an attention finding to a tier by its MEANING and canonical severity. `dependency` returns null — it
// is blocking context, not an action.
function mapAttention(a: AttentionItem): Mapped | null {
  switch (a.type) {
    case 'provenance':
      // A broken/mismatched reference Core marks `blocking` is a real, fixable structural block. An
      // `ambiguous` historical reference is only a warning — a data-quality note, never a critical error.
      return a.severity === 'blocking'
        ? { tier: 1, verb: 'Inspect broken reference', cta: 'Inspect', section: 'relations' }
        : { tier: 4, verb: 'Review provenance note', cta: 'Review', section: 'relations' }
    case 'unverified-outcome':
      // Stale evidence is a data-quality note; a declared criterion without evidence is a review to do.
      return a.category === 'stale-evidence'
        ? { tier: 4, verb: 'Review stale evidence', cta: 'Review', section: 'evidence' }
        : { tier: 2, verb: 'Review evidence', cta: 'Review', section: 'evidence' }
    case 'incomplete-delivery':
      return { tier: 3, verb: 'Review progress', cta: 'Review' }
    case 'pending-candidates':
      return { tier: 4, verb: 'Review coverage gap', cta: 'Review', section: 'relations' }
    case 'declared-risk':
      return { tier: 4, verb: 'Review declared risk', cta: 'Review' }
    case 'dependency':
      return null
    default:
      return null
  }
}

const TERMINAL = new Set(['completed', 'cancelled'])

/**
 * Deterministic prioritization (WI-088 AC-04). One action per artifact (its highest-priority signal), so a
 * single noisy artifact never fills the list and a chain of dependency-blocked epics never reads as a list
 * of incidents. Order: tier asc → artifact-kind rank → id → verb. Stable, independent of input order.
 */
export function prioritizeActions(ins: PlanningInsights): NextActionsResult {
  const byArtifact = new Map<string, NextAction>()
  const consider = (a: NextAction) => {
    const prev = byArtifact.get(a.artifactId)
    if (!prev || a.tier < prev.tier) byArtifact.set(a.artifactId, a)
  }

  // Tier 2 — a verifiable human decision: preconditions met (READY_*), not yet closed. Never inferred.
  for (const e of ins.entities) {
    const ready = e.readiness === 'READY_TO_COMPLETE' || e.readiness === 'READY_WITH_EXCEPTIONS'
    if (ready && !TERMINAL.has(e.status.toLowerCase())) {
      consider({
        tier: 2, verb: 'Ready for your completion decision', cta: 'Open',
        artifactId: e.id, artifactKind: e.kind, artifactTitle: e.title,
        reason: `Preconditions met (${e.readiness.replace(/_/g, ' ').toLowerCase()}); human approval is still required to close.`,
        section: 'evidence', hasDestination: Boolean(e.link),
      })
    }
  }

  // Tiers 1/2/3/4 — from attention findings (dependency excluded, handled as context below).
  for (const a of ins.attention) {
    const m = mapAttention(a)
    if (!m) continue
    consider({
      tier: m.tier, verb: m.verb, cta: m.cta, artifactId: a.artifactId, artifactKind: a.artifactKind,
      artifactTitle: a.title, reason: a.reason, section: m.section, hasDestination: Boolean(a.link),
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

  return {
    actions,
    blocking: ins.attention.filter((a) => a.type === 'dependency'),
    dataQuality: actions.filter((a) => a.tier === 4),
    totalFindings: ins.attention.length,
  }
}
