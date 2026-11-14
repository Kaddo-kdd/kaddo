// Planning Progress & Execution Insights — read-only projection (WI-081).
//
// Pure and read-only: it NEVER writes Markdown, changes lifecycle, or completes anything. It combines
// signals Core already computes (progress, evidence-based readiness/outcome, graph findings) into one
// view oriented to execution decisions, keeping the three dimensions SEPARATE (Planning Coverage,
// Delivery Progress, Outcome Verification) and never inventing a single score. No parallel verifier:
// outcome/readiness come from the WI-078/WI-079 evaluations. No LLM, no git, no time/risk inference.

import {
  discoverDeliveryPlans,
  discoverEpics,
  computeDeliveryProgress,
  validatePlanningGraph,
  type DeliveryProgress,
} from './delivery-planning.js'
import {
  evaluatePlanCompletion,
  evaluateEpicCompletion,
  planMilestoneVerifications,
  type OutcomeVerification,
  type CompletionReadiness,
} from './delivery-verification.js'
import { discoverInitiatives, type Initiative } from './initiative.js'
import { evaluateInitiativeCompletion } from './initiative-verification.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import type { KnowledgeArtifact } from '../services/knowledge-artifacts.js'

export type ArtifactKind = 'plan' | 'epic' | 'initiative' | 'work-item'

export type AttentionType =
  | 'dependency'
  | 'incomplete-delivery'
  | 'pending-candidates'
  | 'unverified-outcome'
  | 'provenance'
  | 'declared-risk'

export type AttentionSeverity = 'blocking' | 'warning' | 'info'

export type AttentionItem = {
  type: AttentionType
  severity: AttentionSeverity
  artifactId: string
  artifactKind: ArtifactKind
  title: string
  reason: string
  /** Deterministic sub-classification (e.g. a provenance category), when one applies. */
  category?: string
  /** Deterministic consequence for planning/completion — context for a decision, never a verdict. */
  impact?: string
  /** A concrete review step (never an auto-fix), e.g. "Review Initiative" or "Inspect reference". */
  nextStep?: string
  /** Relative Admin route to the canonical artifact detail, when a destination exists. */
  link?: string
}

/** Rolled-up outcome counts across entities. Criteria stay owned by their entity (never cross-deduped). */
export type OutcomeRollup = {
  total: number
  passed: number
  failed: number
  notVerified: number
  manualReview: number
  ambiguous: number
  stale: number
}

export type MilestoneInsight = {
  id: string
  title: string
  planId: string
  planTitle: string
  epics: number
  outcome: OutcomeVerification
  needsReview: boolean
}

export type EntityInsight = {
  id: string
  kind: ArtifactKind
  title: string
  status: string
  readiness: CompletionReadiness
  delivery: { total: number; completed: number; blocked: number }
  outcome: { total: number; passed: number; needsVerification: number }
  /**
   * The persisted lifecycle says `completed` but the current evidence-based readiness is not ready
   * (WI-083). It describes a gap between a historical completion and today's checks — it never means the
   * artifact was reopened, recomputed or that the original decision was wrong.
   */
  historicalEvidenceGap: boolean
  link: string
}

/** Delivery over DISTINCT Work Items, split planning-associated vs independent (WI-081/WI-083). The ONE
 * delivery projection the Overview and Execution Insights both consume, so their Work-Item and blocked
 * counts cannot diverge. Deduped by enumerating Work Items once; a Plan/Epic relation is optional. */
export type PlanningDelivery = { associated: DeliveryProgress; independent: DeliveryProgress }

export type PlanningInsights = {
  counts: {
    plans: Record<string, number>
    epics: Record<string, number>
    initiatives: Record<string, number>
  }
  /**
   * Planning Coverage across Initiatives (candidates). `materialized` is DECLARED (the field is set);
   * `validated` is the subset whose reference resolves to exactly one existing, consistently-associated
   * Work Item; `unresolved` is declared-but-not-validated (missing / mismatch / ambiguous). Denominator
   * is totalCandidates. Declared ≠ validated — the UI must not present a declared reference as integrity.
   */
  coverage: { totalCandidates: number; materialized: number; pending: number; validated: number; unresolved: number }
  /** Delivery Progress over DISTINCT Work Items (deduped by id); planning-associated vs independent. */
  delivery: { associated: DeliveryProgress; independent: DeliveryProgress }
  /** Outcome Verification rolled up across all entities (kept distinct from delivery). */
  outcome: OutcomeRollup
  indicators: {
    blockingIssues: number
    outcomeNeedsVerification: number
    milestonesNeedingReview: number
  }
  attention: AttentionItem[]
  milestones: MilestoneInsight[]
  entities: EntityInsight[]
}

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function kindOf(id: string): ArtifactKind {
  const up = id.toUpperCase()
  if (up.startsWith('PLAN-')) return 'plan'
  if (up.startsWith('EP-')) return 'epic'
  if (up.startsWith('INI-')) return 'initiative'
  return 'work-item'
}

function linkFor(id: string, kind: ArtifactKind): string {
  switch (kind) {
    case 'plan': return `/planning/plans/${id}`
    case 'epic': return `/planning/epics/${id}`
    case 'initiative': return `/initiatives/${id}`
    case 'work-item': return `/work-items/${id}`
  }
}

const KIND_LABEL: Record<ArtifactKind, string> = { plan: 'Plan', epic: 'Epic', initiative: 'Initiative', 'work-item': 'Work Item' }

/** A concrete review step for an artifact (never an auto-fix) — "Review Initiative" etc. (WI-082 AC-08). */
function reviewStep(kind: ArtifactKind): string {
  return `Review ${KIND_LABEL[kind]}`
}

/** Deterministic impact + next step for a provenance category (Core owns the guidance — AC-08/§4.3). */
function provenanceGuidance(category: string, kind: ArtifactKind): { impact: string; nextStep: string } {
  switch (category) {
    case 'missing_reference':
      return { impact: 'Breaks planning integrity — the materialized Work Item does not exist. Keeps the Initiative blocked.', nextStep: 'Inspect reference' }
    case 'association_mismatch':
      return { impact: 'The referenced Work Item belongs to another Initiative — the relation is inconsistent. Keeps the Initiative blocked.', nextStep: 'Review Work Item' }
    case 'ambiguous_legacy_reference':
      return { impact: 'Cannot be confirmed as materialized — not counted as validated coverage and keeps the Initiative out of ready. Not auto-resolved.', nextStep: 'Inspect reference' }
    default:
      return { impact: 'Relation needs review.', nextStep: reviewStep(kind) }
  }
}

function tally(ids: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of ids) out[s] = (out[s] ?? 0) + 1
  return out
}

function unverified(o: OutcomeVerification): number {
  // Criteria that still need verification: failed + not-verified + manual-review + ambiguous.
  return o.failed + o.notVerified + o.manualReview + o.ambiguous
}

/** A Work Item belongs to the planning universe when it is tied to an Initiative or an Epic. */
function isPlanningAssociated(wi: KnowledgeArtifact): boolean {
  return Boolean(wi.initiative) || Boolean(optStr(wi.rawFrontmatter?.epic))
}

/**
 * The single delivery projection over DISTINCT Work Items (WI-083). Enumerates Work Items once and splits
 * them into the planning-associated universe (tied to an Initiative or Epic — a Plan/Epic is optional) and
 * the independent universe; a Work Item reachable through several relations is still counted once by id.
 * Both the Planning Overview totals and Execution Insights consume THIS, so their Work-Item and blocked
 * counts are identical for the same universe. Read-only and pure.
 */
export function computePlanningDelivery(dir: string): PlanningDelivery {
  const allWis = discoverWorkItems(dir)
  return {
    associated: computeDeliveryProgress(allWis.filter(isPlanningAssociated), dir),
    independent: computeDeliveryProgress(allWis.filter((w) => !isPlanningAssociated(w)), dir),
  }
}

export function computePlanningInsights(dir: string): PlanningInsights {
  const plans = discoverDeliveryPlans(dir)
  const epics = discoverEpics(dir)
  const initiatives = discoverInitiatives(dir)
  const findings = validatePlanningGraph(dir)

  // --- Delivery over DISTINCT Work Items (AC-03: enumerate once; never sum per-entity subtotals).
  //     Shared with the Planning Overview via computePlanningDelivery, so the two can never diverge. ---
  const delivery = computePlanningDelivery(dir)

  // --- Per-entity evidence-based evaluations (reused from WI-078/WI-079; no parallel verifier). ---
  const planEvals = plans.map((p) => ({ p, ev: evaluatePlanCompletion(dir, p) }))
  const epicEvals = epics.map((e) => ({ e, ev: evaluateEpicCompletion(dir, e) }))
  const iniEvals = initiatives.map((i) => ({ i, ev: evaluateInitiativeCompletion(dir, i) }))

  // --- Planning Coverage (candidates) across Initiatives. `materialized` stays DECLARED (field set, as
  //     WI-081); `validated` is the subset whose reference resolves to one consistent Work Item (WI-082
  //     AC-16). Declared and validated differ exactly when a reference is missing, mismatched or ambiguous. ---
  const totalCandidates = initiatives.reduce((n, i) => n + i.candidates.length, 0)
  const materialized = initiatives.reduce((n, i) => n + i.candidates.filter((c) => c.materializedAs).length, 0)
  const validated = iniEvals.reduce((n, { ev }) => n + ev.provenanceDiagnostics.filter((d) => d.category === 'valid_single_reference').length, 0)
  const coverage = { totalCandidates, materialized, pending: totalCandidates - materialized, validated, unresolved: materialized - validated }

  // --- Outcome roll-up (criteria owned by their entity). ---
  const outcome: OutcomeRollup = { total: 0, passed: 0, failed: 0, notVerified: 0, manualReview: 0, ambiguous: 0, stale: 0 }
  const addOutcome = (o: OutcomeVerification) => {
    outcome.total += o.total; outcome.passed += o.passed; outcome.failed += o.failed
    outcome.notVerified += o.notVerified; outcome.manualReview += o.manualReview
    outcome.ambiguous += o.ambiguous; outcome.stale += o.stale.length
  }
  planEvals.forEach(({ ev }) => addOutcome(ev.outcome))
  epicEvals.forEach(({ ev }) => addOutcome(ev.outcome))
  iniEvals.forEach(({ ev }) => addOutcome(ev.outcome))

  // --- Attention Queue (deterministic, structured; each item carries origin, reason and link). ---
  const attention: AttentionItem[] = []
  const push = (it: AttentionItem) => attention.push(it)

  // Graph findings: dependencies (cycle/pending) and relation/consistency (invalid_reference/duplicate).
  for (const f of findings) {
    const kind = kindOf(f.subject)
    const isDep = f.kind === 'dependency_cycle' || f.kind === 'pending_dependency'
    const type: AttentionType = isDep ? 'dependency' : 'provenance'
    push({
      type,
      severity: f.level === 'error' ? 'blocking' : 'warning',
      artifactId: f.subject,
      artifactKind: kind,
      title: f.subject,
      reason: f.message,
      category: f.kind,
      impact: isDep ? 'Dependent work stays blocked until the dependency is resolved.' : 'A declared relation does not resolve — the planning graph is inconsistent.',
      nextStep: reviewStep(kind),
      link: linkFor(f.subject, kind),
    })
  }

  // Declared risks (separate from detected blockers — AC-15; no invented risk score).
  for (const p of plans) for (const r of p.risks) {
    push({ type: 'declared-risk', severity: 'info', artifactId: p.id, artifactKind: 'plan', title: p.title, reason: r, category: 'declared-risk', impact: 'A risk the Plan declares — tracked, not a detected blocker.', nextStep: reviewStep('plan'), link: linkFor(p.id, 'plan') })
  }

  // Outcome/delivery signals from each entity's evaluation.
  const outcomeSignal = (id: string, kind: ArtifactKind, title: string, o: OutcomeVerification) => {
    const n = unverified(o)
    if (n > 0) push({ type: 'unverified-outcome', severity: 'warning', artifactId: id, artifactKind: kind, title, reason: `${n} success criterion(s) without valid evidence (failed/not-verified/manual-review/ambiguous).`, category: 'unverified-outcome', impact: 'The declared outcome is not demonstrated — a completed delivery with an unverified outcome is not done.', nextStep: 'Review outcome evidence', link: linkFor(id, kind) })
    if (o.stale.length > 0) push({ type: 'unverified-outcome', severity: 'warning', artifactId: id, artifactKind: kind, title, reason: `${o.stale.length} evidence record(s) stale: the criterion changed and is not reattributed.`, category: 'stale-evidence', impact: 'Evidence no longer matches its criterion — the outcome is effectively unverified.', nextStep: 'Review outcome evidence', link: linkFor(id, kind) })
  }
  const incompleteSignal = (id: string, kind: ArtifactKind, title: string, status: string, total: number, completed: number) => {
    if (status === 'in-progress' && total > 0 && completed < total) {
      push({ type: 'incomplete-delivery', severity: 'info', artifactId: id, artifactKind: kind, title, reason: `${total - completed} of ${total} committed Work Item(s) not completed.`, category: 'incomplete-delivery', impact: 'Committed scope is still in progress.', nextStep: reviewStep(kind), link: linkFor(id, kind) })
    }
  }

  planEvals.forEach(({ p, ev }) => { outcomeSignal(p.id, 'plan', p.title, ev.outcome); incompleteSignal(p.id, 'plan', p.title, p.status, ev.delivery.total, ev.delivery.completed) })
  epicEvals.forEach(({ e, ev }) => { outcomeSignal(e.id, 'epic', e.title, ev.outcome); incompleteSignal(e.id, 'epic', e.title, e.status, ev.delivery.total, ev.delivery.completed) })
  iniEvals.forEach(({ i, ev }) => {
    outcomeSignal(i.id, 'initiative', i.title, ev.outcome)
    incompleteSignal(i.id, 'initiative', i.title, i.status, ev.delivery.total, ev.delivery.completed)
    if (ev.pendingCandidates.length > 0) push({ type: 'pending-candidates', severity: 'info', artifactId: i.id, artifactKind: 'initiative', title: i.title, reason: `${ev.pendingCandidates.length} committed candidate(s) not yet materialized (coverage signal, not an execution blocker).`, category: 'pending-candidates', impact: 'A coverage gap — committed candidates are not yet materialized. Not an execution blocker.', nextStep: reviewStep('initiative'), link: linkFor(i.id, 'initiative') })
    // Provenance: classified diagnostics (WI-082). missing/mismatch stay blocking; ambiguous is a warning,
    // never claimed missing. valid references produce no signal.
    for (const d of ev.provenanceDiagnostics) {
      if (d.category === 'valid_single_reference') continue
      const g = provenanceGuidance(d.category, 'initiative')
      push({ type: 'provenance', severity: d.severity, artifactId: i.id, artifactKind: 'initiative', title: i.title, reason: d.message, category: d.category, impact: g.impact, nextStep: g.nextStep, link: linkFor(i.id, 'initiative') })
    }
  })

  // Consolidate identical (type, artifact, reason); keep distinct reasons. Deterministic order.
  const seen = new Set<string>()
  const consolidated = attention.filter((a) => {
    const key = `${a.type}|${a.artifactId.toLowerCase()}|${a.reason}`
    if (seen.has(key)) return false
    seen.add(key); return true
  })
  const sevRank: Record<AttentionSeverity, number> = { blocking: 0, warning: 1, info: 2 }
  const kindRank: Record<ArtifactKind, number> = { plan: 0, epic: 1, initiative: 2, 'work-item': 3 }
  consolidated.sort((a, b) =>
    sevRank[a.severity] - sevRank[b.severity] ||
    kindRank[a.artifactKind] - kindRank[b.artifactKind] ||
    a.artifactId.localeCompare(b.artifactId) ||
    a.type.localeCompare(b.type) ||
    a.reason.localeCompare(b.reason),
  )

  // --- Milestone & Outcome insights (exit criteria from WI-078 contracts; never inferred from Epic). ---
  const milestones: MilestoneInsight[] = []
  for (const p of plans) {
    for (const mv of planMilestoneVerifications(p)) {
      const epicsForM = epics.filter((e) => e.plan?.toLowerCase() === p.id.toLowerCase() && e.milestone?.toLowerCase() === mv.id.toLowerCase()).length
      milestones.push({ id: mv.id, title: mv.title, planId: p.id, planTitle: p.title, epics: epicsForM, outcome: mv.outcome, needsReview: unverified(mv.outcome) > 0 || mv.outcome.stale.length > 0 })
    }
  }

  // --- Entity readiness table (delivery vs outcome vs readiness, kept distinct from lifecycle). ---
  // A persisted `completed` whose CURRENT readiness is not ready is a historical evidence gap (WI-083):
  // surfaced as context, never a reopen or a recompute of the original decision.
  const histGap = (status: string, readiness: CompletionReadiness) =>
    status === 'completed' && readiness !== 'READY_TO_COMPLETE' && readiness !== 'READY_WITH_EXCEPTIONS'
  const entities: EntityInsight[] = [
    ...planEvals.map(({ p, ev }) => ({ id: p.id, kind: 'plan' as const, title: p.title, status: p.status, readiness: ev.readiness, delivery: { total: ev.delivery.total, completed: ev.delivery.completed, blocked: ev.delivery.blocked }, outcome: { total: ev.outcome.total, passed: ev.outcome.passed, needsVerification: unverified(ev.outcome) }, historicalEvidenceGap: histGap(p.status, ev.readiness), link: linkFor(p.id, 'plan') })),
    ...epicEvals.map(({ e, ev }) => ({ id: e.id, kind: 'epic' as const, title: e.title, status: e.status, readiness: ev.readiness, delivery: { total: ev.delivery.total, completed: ev.delivery.completed, blocked: ev.delivery.blocked }, outcome: { total: ev.outcome.total, passed: ev.outcome.passed, needsVerification: unverified(ev.outcome) }, historicalEvidenceGap: histGap(e.status, ev.readiness), link: linkFor(e.id, 'epic') })),
    // Initiatives do not track blocked Work Items here (consistent with the Planning overview), so blocked is 0.
    ...iniEvals.map(({ i, ev }) => ({ id: i.id, kind: 'initiative' as const, title: i.title, status: i.status, readiness: ev.readiness, delivery: { total: ev.delivery.total, completed: ev.delivery.completed, blocked: 0 }, outcome: { total: ev.outcome.total, passed: ev.outcome.passed, needsVerification: unverified(ev.outcome) }, historicalEvidenceGap: histGap(i.status, ev.readiness), link: linkFor(i.id, 'initiative') })),
  ]

  return {
    counts: {
      plans: tally(plans.map((p) => p.status)),
      epics: tally(epics.map((e) => e.status)),
      initiatives: tally(initiatives.map((i) => i.status)),
    },
    coverage,
    delivery,
    outcome,
    indicators: {
      blockingIssues: consolidated.filter((a) => a.severity === 'blocking').length,
      outcomeNeedsVerification: outcome.failed + outcome.notVerified + outcome.manualReview + outcome.ambiguous,
      milestonesNeedingReview: milestones.filter((m) => m.needsReview).length,
    },
    attention: consolidated,
    milestones,
    entities,
  }
}
