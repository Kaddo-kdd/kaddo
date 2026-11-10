// Planning outcome verification & evidence-based completion evaluation (WI-078).
//
// Read-only and pure: given a Delivery Plan or Epic, it matches each declared success criterion (and,
// for a Plan, each milestone exit criterion) against the evidence recorded in the artifact, and derives
// a conservative completion readiness. It never mutates an artifact and never transitions a lifecycle —
// completion stays a human action (see delivery-planning-write.ts). "Work finished" (all Work Items
// done) is a signal, never proof that the declared outcome was achieved.

import {
  getPlan,
  getEpic,
  epicsInPlan,
  computeEpicProgress,
  computePlanProgress,
  validatePlanningGraph,
  type DeliveryPlan,
  type Epic,
} from './delivery-planning.js'
import type { AcceptanceCriterionEvidence } from './lifecycle.js'

export type CompletionReadiness = 'READY_TO_COMPLETE' | 'READY_WITH_EXCEPTIONS' | 'NEEDS_WORK' | 'BLOCKED'

export type CriterionStatus = AcceptanceCriterionEvidence['status']

export type CriterionVerification = {
  criterion: string
  status: CriterionStatus
  evidence?: string
  reference?: string
  method?: 'automated' | 'manual'
  verifiedAt?: string
  verifiedBy?: string
  /** True when an accepted completion exception waives this criterion. */
  waived?: boolean
  /** True when the same normalized criterion text appears more than once in scope — evidence is NOT shared. */
  ambiguous?: boolean
}

export type OutcomeVerification = {
  total: number
  passed: number
  failed: number
  notVerified: number
  manualReview: number
  /** Count of declared criteria whose text collides with another (evidence cannot be attributed safely). */
  ambiguous: number
  criteria: CriterionVerification[]
  /** Evidence whose criterion no longer matches any declared criterion (edited/removed) — never reattributed. */
  stale: AcceptanceCriterionEvidence[]
}

export type MilestoneVerification = { id: string; title: string; outcome: OutcomeVerification }

export type CompletionException = {
  id: string
  criterion?: string
  status: 'proposed' | 'accepted' | 'rejected'
  reason?: string
}

export type EntityCompletionEvaluation = {
  id: string
  kind: 'plan' | 'epic'
  status: string
  readiness: CompletionReadiness
  reasons: string[]
  blockers: string[]
  warnings: string[]
  outcome: OutcomeVerification
  delivery: { total: number; completed: number; blocked: number }
  blockingDependencies: string[]
  milestones?: MilestoneVerification[]
  epics?: { id: string; status: string }[]
  exceptions: CompletionException[]
}

// --- Parsing helpers ---------------------------------------------------------

/** Stable identity for a criterion: trimmed, lower-cased, whitespace-collapsed. Order never matters. */
export function normalizeCriterion(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

const STATUSES: CriterionStatus[] = ['passed', 'failed', 'not-verified', 'manual-review-required']

function optStr(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'number') return String(v)
  return undefined
}

/** Parse a frontmatter evidence array into AcceptanceCriterionEvidence records (lenient, never throws). */
export function parseEvidenceList(raw: unknown): AcceptanceCriterionEvidence[] {
  if (!Array.isArray(raw)) return []
  const out: AcceptanceCriterionEvidence[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const o = entry as Record<string, unknown>
    const criterion = optStr(o.criterion)
    if (!criterion) continue
    const statusRaw = optStr(o.status)
    const status = (STATUSES as string[]).includes(statusRaw ?? '') ? (statusRaw as CriterionStatus) : 'not-verified'
    const method = optStr(o.method)
    out.push({
      criterion,
      status,
      ...(optStr(o.evidence) ? { evidence: optStr(o.evidence) } : {}),
      ...(optStr(o.reference) ? { reference: optStr(o.reference) } : {}),
      ...(method === 'automated' || method === 'manual' ? { method } : {}),
      ...(optStr(o.verified_at) ? { verified_at: optStr(o.verified_at) } : {}),
      ...(optStr(o.verified_by) ? { verified_by: optStr(o.verified_by) } : {}),
    })
  }
  return out
}

function parseExceptions(raw: unknown): CompletionException[] {
  if (!Array.isArray(raw)) return []
  const out: CompletionException[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const o = entry as Record<string, unknown>
    const id = optStr(o.id)
    if (!id) continue
    const st = optStr(o.status)
    const status = st === 'accepted' || st === 'rejected' ? st : 'proposed'
    out.push({
      id,
      status,
      ...(optStr(o.criterion) ? { criterion: optStr(o.criterion) } : {}),
      ...(optStr(o.reason) ? { reason: optStr(o.reason) } : {}),
    })
  }
  return out
}

/**
 * Match declared criteria to recorded evidence by normalized text. A declared criterion with no
 * evidence is `not-verified`; evidence whose criterion no longer matches any declared one is `stale`
 * (surfaced, never silently reattributed to another criterion — AC-10, §7.4).
 */
export function buildOutcomeVerification(
  declared: string[],
  evidence: AcceptanceCriterionEvidence[],
  exceptions: CompletionException[] = [],
): OutcomeVerification {
  const byCriterion = new Map<string, AcceptanceCriterionEvidence>()
  for (const e of evidence) byCriterion.set(normalizeCriterion(e.criterion), e)
  const declaredKeys = new Set(declared.map(normalizeCriterion))
  // Keys that appear more than once in scope: evidence cannot be attributed to one of them, so none is
  // auto-shared — they must be disambiguated (adjustment 2).
  const counts = new Map<string, number>()
  for (const c of declared) counts.set(normalizeCriterion(c), (counts.get(normalizeCriterion(c)) ?? 0) + 1)
  const ambiguousKeys = new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k))
  // An accepted exception waives a criterion only when it names a declared, unambiguous criterion AND
  // carries a reason — it never hides a missing criterion or a defect (adjustment 5).
  const waived = new Set(
    exceptions
      .filter((x) => x.status === 'accepted' && x.reason?.trim() && x.criterion && declaredKeys.has(normalizeCriterion(x.criterion)) && !ambiguousKeys.has(normalizeCriterion(x.criterion)))
      .map((x) => normalizeCriterion(x.criterion as string)),
  )

  const criteria: CriterionVerification[] = declared.map((criterion) => {
    const key = normalizeCriterion(criterion)
    const ambiguous = ambiguousKeys.has(key)
    const e = ambiguous ? undefined : byCriterion.get(key) // never attribute shared evidence to a collision
    return {
      criterion,
      status: e?.status ?? 'not-verified',
      ...(e?.evidence ? { evidence: e.evidence } : {}),
      ...(e?.reference ? { reference: e.reference } : {}),
      ...(e?.method ? { method: e.method } : {}),
      ...(e?.verified_at ? { verifiedAt: e.verified_at } : {}),
      ...(e?.verified_by ? { verifiedBy: e.verified_by } : {}),
      ...(!ambiguous && waived.has(key) ? { waived: true } : {}),
      ...(ambiguous ? { ambiguous: true } : {}),
    }
  })
  const stale = evidence.filter((e) => !declaredKeys.has(normalizeCriterion(e.criterion)))

  return {
    total: criteria.length,
    // An ambiguous criterion is never counted as passed/waived; it counts as unverified until disambiguated.
    passed: criteria.filter((c) => !c.ambiguous && (c.status === 'passed' || c.waived)).length,
    failed: criteria.filter((c) => !c.ambiguous && c.status === 'failed' && !c.waived).length,
    notVerified: criteria.filter((c) => c.ambiguous || (c.status === 'not-verified' && !c.waived)).length,
    manualReview: criteria.filter((c) => !c.ambiguous && c.status === 'manual-review-required' && !c.waived).length,
    ambiguous: criteria.filter((c) => c.ambiguous).length,
    criteria,
    stale,
  }
}

function fm(entity: { rawFrontmatter: Record<string, unknown> }, key: string): unknown {
  return entity.rawFrontmatter?.[key]
}

export function epicOutcomeVerification(epic: Epic): OutcomeVerification {
  return buildOutcomeVerification(
    epic.successCriteria,
    parseEvidenceList(fm(epic, 'outcome_verifications')),
    parseExceptions(fm(epic, 'completion_exceptions')),
  )
}
export function planOutcomeVerification(plan: DeliveryPlan): OutcomeVerification {
  return buildOutcomeVerification(
    plan.successCriteria,
    parseEvidenceList(fm(plan, 'outcome_verifications')),
    parseExceptions(fm(plan, 'completion_exceptions')),
  )
}

/** Per-milestone exit-criteria verification, read from the milestone entry's `exit_verifications`. */
export function planMilestoneVerifications(plan: DeliveryPlan): MilestoneVerification[] {
  const rawMs = Array.isArray(fm(plan, 'milestones')) ? (fm(plan, 'milestones') as Record<string, unknown>[]) : []
  return plan.milestones.map((m) => {
    const rawEntry = rawMs.find((r) => r && typeof r === 'object' && optStr(r.id)?.toLowerCase() === m.id.toLowerCase())
    const evidence = parseEvidenceList(rawEntry?.exit_verifications)
    return { id: m.id, title: m.title, outcome: buildOutcomeVerification(m.exitCriteria, evidence) }
  })
}

// --- Completion evaluation ---------------------------------------------------

function decide(blockers: string[], softBlocks: string[], hasAcceptedExceptions: boolean): CompletionReadiness {
  if (blockers.length > 0) return 'BLOCKED'
  if (softBlocks.length > 0) return 'NEEDS_WORK'
  return hasAcceptedExceptions ? 'READY_WITH_EXCEPTIONS' : 'READY_TO_COMPLETE'
}

/**
 * Evaluate whether an Epic is ready to complete, from declared outcome + recorded evidence + delivery +
 * dependencies. Conservative: without an expected outcome, without success criteria, with unverified or
 * failed criteria, with incomplete committed work, or with a blocking dependency, it is never READY.
 */
export function evaluateEpicCompletion(dir: string, epic: Epic): EntityCompletionEvaluation {
  const prog = computeEpicProgress(dir, epic)
  const exceptions = parseExceptions(fm(epic, 'completion_exceptions'))
  const outcome = epicOutcomeVerification(epic)
  const blockers: string[] = []
  const softBlocks: string[] = []
  const reasons: string[] = []
  const warnings: string[] = []

  for (const d of prog.readiness.blockingDependencies) blockers.push(`Blocked by unfinished dependency ${d}.`)
  // Integrity errors (invalid references, cycles) are hard blockers and are never waivable (adjustment 5).
  for (const f of integrityBlockers(dir, epic.id)) blockers.push(f)
  // An Epic requires a declared expected outcome (§7.1); a Plan does not (objective is optional, §7.2).
  evaluateOutcomeInto(epic.outcome, true, outcome, blockers, softBlocks, reasons, warnings)
  if (prog.delivery.total > 0 && prog.delivery.completed < prog.delivery.total) {
    softBlocks.push('committed-work-incomplete')
    reasons.push(`Committed work is incomplete (${prog.delivery.completed}/${prog.delivery.total} Work Items completed).`)
  }

  const readiness = decide(blockers, softBlocks, exceptions.some((x) => x.status === 'accepted'))
  pushReadinessReason(readiness, reasons)
  return {
    id: epic.id, kind: 'epic', status: epic.status, readiness, reasons, blockers, warnings,
    outcome, delivery: { total: prog.delivery.total, completed: prog.delivery.completed, blocked: prog.delivery.blocked },
    blockingDependencies: prog.readiness.blockingDependencies, exceptions,
  }
}

/**
 * Evaluate whether a Delivery Plan is ready to complete. Adds, to the Epic checks, the state of the
 * Plan's Epics and the verification of each milestone's exit criteria. A completed Epic is a signal,
 * not an automatic approval of the Plan.
 */
export function evaluatePlanCompletion(dir: string, plan: DeliveryPlan): EntityCompletionEvaluation {
  const prog = computePlanProgress(dir, plan)
  const exceptions = parseExceptions(fm(plan, 'completion_exceptions'))
  const outcome = planOutcomeVerification(plan)
  const milestones = planMilestoneVerifications(plan)
  const epics = epicsInPlan(dir, plan.id).map((e) => ({ id: e.id, status: e.status }))
  const blockers: string[] = []
  const softBlocks: string[] = []
  const reasons: string[] = []
  const warnings: string[] = []

  for (const d of prog.readiness.blockingDependencies) blockers.push(`Blocked by unfinished dependency ${d}.`)
  for (const f of integrityBlockers(dir, plan.id)) blockers.push(f)
  evaluateOutcomeInto(plan.objective, false, outcome, blockers, softBlocks, reasons, warnings)
  if (!plan.objective) warnings.push('No objective is declared for this Plan (optional, but recommended for completion review).')
  if (prog.delivery.total > 0 && prog.delivery.completed < prog.delivery.total) {
    softBlocks.push('committed-work-incomplete')
    reasons.push(`Committed work is incomplete (${prog.delivery.completed}/${prog.delivery.total} Work Items completed).`)
  }
  // A Plan must have real committed work to be ready — not just checked boxes (adjustment 4; §7.2).
  if (epics.length === 0 && prog.delivery.total === 0) {
    softBlocks.push('no-committed-work')
    reasons.push('No Epics and no committed Work Items — the Plan has no verifiable deliverables yet.')
  }
  // Non-cancelled Epics that are not yet completed keep the Plan from being ready (a signal, not auto-approval).
  const openEpics = epics.filter((e) => e.status !== 'completed' && e.status !== 'cancelled')
  if (openEpics.length > 0) {
    softBlocks.push('epics-open')
    reasons.push(`${openEpics.length} Epic(s) not yet completed: ${openEpics.map((e) => e.id).join(', ')}.`)
  }
  // Milestone exit criteria.
  for (const m of milestones) {
    if (m.outcome.failed > 0) { blockers.push(`Milestone ${m.id} has a failed exit criterion.`); }
    const pending = m.outcome.notVerified + m.outcome.manualReview
    if (pending > 0) { softBlocks.push(`milestone-${m.id}-pending`); reasons.push(`Milestone ${m.id}: ${pending} exit criterion(s) not verified.`) }
    if (m.outcome.stale.length > 0) warnings.push(`Milestone ${m.id} has stale exit-criteria evidence.`)
  }

  const readiness = decide(blockers, softBlocks, exceptions.some((x) => x.status === 'accepted'))
  pushReadinessReason(readiness, reasons)
  return {
    id: plan.id, kind: 'plan', status: plan.status, readiness, reasons, blockers, warnings,
    outcome, delivery: { total: prog.delivery.total, completed: prog.delivery.completed, blocked: prog.delivery.blocked },
    blockingDependencies: prog.readiness.blockingDependencies, milestones, epics, exceptions,
  }
}

/** Error-level planning-graph findings for one subject (invalid references, cycles) — hard blockers. */
function integrityBlockers(dir: string, subjectId: string): string[] {
  return validatePlanningGraph(dir)
    .filter((f) => f.level === 'error' && f.subject.toLowerCase() === subjectId.toLowerCase())
    .map((f) => f.message)
}

/** Shared outcome checks: no declared outcome / no criteria / failed / unverified / ambiguous / stale. */
function evaluateOutcomeInto(
  declaredOutcome: string | null,
  requireDeclaredOutcome: boolean,
  outcome: OutcomeVerification,
  blockers: string[],
  softBlocks: string[],
  reasons: string[],
  warnings: string[],
): void {
  if (requireDeclaredOutcome && !declaredOutcome) { softBlocks.push('no-outcome'); reasons.push('No expected outcome is declared.') }
  if (outcome.total === 0) { softBlocks.push('no-success-criteria'); reasons.push('No success criteria to verify — completion cannot be judged by outcome.') }
  if (outcome.ambiguous > 0) { softBlocks.push('criteria-ambiguous'); reasons.push(`${outcome.ambiguous} success criterion(s) collide in text — rename to disambiguate before verifying.`) }
  if (outcome.failed > 0) { softBlocks.push('criteria-failed'); reasons.push(`${outcome.failed} success criterion(s) failed verification.`) }
  const pending = outcome.notVerified + outcome.manualReview - outcome.ambiguous
  if (pending > 0) { softBlocks.push('criteria-unverified'); reasons.push(`${pending} success criterion(s) not verified (no or insufficient evidence).`) }
  if (outcome.stale.length > 0) warnings.push(`${outcome.stale.length} evidence record(s) no longer match a declared criterion (stale).`)
}

function pushReadinessReason(readiness: CompletionReadiness, reasons: string[]): void {
  if (readiness === 'READY_TO_COMPLETE') reasons.unshift('All success criteria are verified and committed work is complete. Human approval is still required to close.')
  else if (readiness === 'READY_WITH_EXCEPTIONS') reasons.unshift('Remaining gaps are covered by accepted exceptions. Human approval is still required to close.')
}

/** Convenience wrappers by id (read-only). */
export function evaluateEpicById(dir: string, id: string): EntityCompletionEvaluation | null {
  const e = getEpic(dir, id)
  return e ? evaluateEpicCompletion(dir, e) : null
}
export function evaluatePlanById(dir: string, id: string): EntityCompletionEvaluation | null {
  const p = getPlan(dir, id)
  return p ? evaluatePlanCompletion(dir, p) : null
}
