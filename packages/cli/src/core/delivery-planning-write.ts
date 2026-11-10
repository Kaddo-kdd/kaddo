// Delivery Planning write contract: create Plans and Epics, associate an Initiative with an Epic.
//
// Controlled writes only — no lifecycle inference, no silent changes to other artifacts. Status
// transitions and completion stay human-gated and are not performed here. Mutations validate their
// references against the current planning graph before writing.

import matter from 'gray-matter'
import { ensureDir, writeFile, readFile, join } from '../utils/fs.js'
import {
  DELIVERY_PLANS_DIR,
  EPICS_DIR,
  PLAN_STATES,
  EPIC_STATES,
  getPlan,
  getEpic,
  nextPlanId,
  nextEpicId,
  parseDeliveryPlan,
  parseEpic,
  epicsInPlan,
  revisionOf,
  validateEpicDependencyChange,
  PLAN_TRANSITIONS,
  EPIC_TRANSITIONS,
  type DeliveryPlan,
  type Epic,
  type PlanStatus,
  type EpicStatus,
  type Milestone,
} from './delivery-planning.js'
import { getInitiative, type Initiative } from './initiative.js'
import { updateInitiative } from './initiative-write.js'
import {
  evaluateEpicCompletion,
  evaluatePlanCompletion,
  normalizeCriterion,
  type EntityCompletionEvaluation,
} from './delivery-verification.js'
import type { AcceptanceCriterionEvidence } from './lifecycle.js'

export class DeliveryPlanningWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeliveryPlanningWriteError'
  }
}

/** Raised when a controlled write targets an artifact that changed on disk since it was read (WI-076). */
export class PlanningConflictError extends Error {
  constructor(
    public id: string,
    public expectedRevision: string,
    public actualRevision: string,
  ) {
    super(`"${id}" was modified since it was loaded (expected revision ${expectedRevision}, found ${actualRevision}). Reload and try again.`)
    this.name = 'PlanningConflictError'
  }
}

export type UpdateOptions = {
  expectedRevision?: string
  /** Allow removing a milestone that still carries exit-criteria evidence (explicit, never accidental). */
  allowMilestoneEvidenceLoss?: boolean
}

/** Guard a controlled write against a stale form (optimistic concurrency). No mutation. */
function assertFreshRevision(id: string, currentContent: string, opts?: UpdateOptions): void {
  if (!opts?.expectedRevision) return
  const actual = revisionOf(currentContent)
  if (actual !== opts.expectedRevision) throw new PlanningConflictError(id, opts.expectedRevision, actual)
}

/** Clean a string list patch: trim, drop empties, keep order. */
function cleanList(v: string[]): string[] {
  return v.map((x) => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean)
}

/** Set a frontmatter list key, or delete it when the patch is empty (keep artifacts tidy). */
function setListOrDelete(data: Record<string, unknown>, key: string, list: string[]): void {
  const cleaned = cleanList(list)
  if (cleaned.length > 0) data[key] = cleaned
  else delete data[key]
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item'
}

export type CreatePlanInput = { title: string; status?: PlanStatus; objective?: string }

export function createDeliveryPlan(dir: string, input: CreatePlanInput): DeliveryPlan {
  if (!input.title?.trim()) throw new DeliveryPlanningWriteError('Plan title is required.')
  const status: PlanStatus = input.status ?? 'draft'
  if (!(PLAN_STATES as readonly string[]).includes(status)) throw new DeliveryPlanningWriteError(`Invalid plan status: ${status}.`)
  const id = nextPlanId(dir)
  const data: Record<string, unknown> = { type: 'delivery-plan', id, title: input.title.trim(), status, milestones: [] }
  if (input.objective?.trim()) data.objective = input.objective.trim()
  const body = `\n# ${input.title.trim()}\n\n_Describe the objective, scope, exclusions, milestones, dependencies, success criteria and risks._\n`
  const filePath = join(dir, DELIVERY_PLANS_DIR, `${id}-${slugify(input.title)}.md`)
  ensureDir(join(dir, DELIVERY_PLANS_DIR))
  const content = matter.stringify(body, data)
  writeFile(filePath, content)
  const plan = parseDeliveryPlan(dir, filePath, content)
  if (!plan) throw new DeliveryPlanningWriteError('Failed to parse the Plan just written.')
  return plan
}

export type CreateEpicInput = { title: string; status?: EpicStatus; outcome?: string; plan?: string; milestone?: string }

export function createEpic(dir: string, input: CreateEpicInput): Epic {
  if (!input.title?.trim()) throw new DeliveryPlanningWriteError('Epic title is required.')
  const status: EpicStatus = input.status ?? 'planned'
  if (!(EPIC_STATES as readonly string[]).includes(status)) throw new DeliveryPlanningWriteError(`Invalid epic status: ${status}.`)
  if (input.plan) {
    const plan = getPlan(dir, input.plan)
    if (!plan) throw new DeliveryPlanningWriteError(`Plan ${input.plan} does not exist.`)
    if (input.milestone && !plan.milestones.some((m) => m.id.toLowerCase() === input.milestone!.toLowerCase())) {
      throw new DeliveryPlanningWriteError(`Milestone ${input.milestone} is not defined in ${input.plan}.`)
    }
  } else if (input.milestone) {
    throw new DeliveryPlanningWriteError('A milestone can only be set together with its plan.')
  }
  const id = nextEpicId(dir)
  const data: Record<string, unknown> = { type: 'epic', id, title: input.title.trim(), status }
  if (input.outcome?.trim()) data.outcome = input.outcome.trim()
  if (input.plan) data.plan = input.plan
  if (input.milestone) data.milestone = input.milestone
  const body = `\n# ${input.title.trim()}\n\n_Describe the expected outcome, success criteria, dependencies and delivery evidence._\n`
  const filePath = join(dir, EPICS_DIR, `${id}-${slugify(input.title)}.md`)
  ensureDir(join(dir, EPICS_DIR))
  const content = matter.stringify(body, data)
  writeFile(filePath, content)
  const epic = parseEpic(dir, filePath, content)
  if (!epic) throw new DeliveryPlanningWriteError('Failed to parse the Epic just written.')
  return epic
}

/** Associate an existing Initiative with an existing Epic (validated). Reuses the Initiative writer. */
export function associateInitiativeWithEpic(dir: string, initiativeId: string, epicId: string): Initiative {
  const ini = getInitiative(dir, initiativeId)
  if (!ini) throw new DeliveryPlanningWriteError(`Initiative ${initiativeId} not found.`)
  if (!getEpic(dir, epicId)) throw new DeliveryPlanningWriteError(`Epic ${epicId} does not exist.`)
  return updateInitiative(dir, ini.id, { epic: epicId })
}

/**
 * Remove the Epic association from an Initiative (WI-076). Explicit wrapper over the Initiative writer:
 * clears only `initiative.epic`, preserving status, owners, contributors, candidates and Work Items.
 * Never changes any lifecycle.
 */
export function disassociateInitiativeFromEpic(dir: string, initiativeId: string): Initiative {
  const ini = getInitiative(dir, initiativeId)
  if (!ini) throw new DeliveryPlanningWriteError(`Initiative ${initiativeId} not found.`)
  if (!ini.epic) return ini // already independent — nothing to change
  return updateInitiative(dir, ini.id, { epic: null })
}

// --- Controlled metadata updates (no lifecycle, preserve body + unknown keys) ----

export type MilestoneInput = { id: string; title?: string; exitCriteria?: string[] }

export type UpdatePlanInput = {
  title?: string
  objective?: string | null
  successCriteria?: string[]
  risks?: string[]
  dependsOn?: string[]
  references?: string[]
  milestones?: MilestoneInput[]
}

/**
 * Normalize a milestone patch to canonical frontmatter shape, enforcing unique ids within the Plan.
 * Each milestone is MERGED onto its existing entry (matched by id): recorded `exit_verifications` and
 * any unknown keys are preserved, while only id/title/exit_criteria are taken from the patch. Editing a
 * title keeps the evidence; editing an exit criterion keeps its prior evidence (which the evaluator then
 * surfaces as stale) rather than deleting the trail (adjustment 1).
 */
function normalizeMilestones(
  planId: string,
  input: MilestoneInput[],
  existing: Record<string, unknown>[],
): { data: Record<string, unknown>[]; model: Milestone[] } {
  const byId = new Map<string, Record<string, unknown>>()
  for (const e of existing) {
    if (e && typeof e === 'object' && !Array.isArray(e)) {
      const eid = typeof e.id === 'string' ? e.id.trim().toLowerCase() : ''
      if (eid) byId.set(eid, e)
    }
  }
  const seen = new Set<string>()
  const data: Record<string, unknown>[] = []
  const model: Milestone[] = []
  for (const m of input) {
    const id = m.id?.trim()
    if (!id) throw new DeliveryPlanningWriteError('Each milestone needs an id.')
    const key = id.toLowerCase()
    if (seen.has(key)) throw new DeliveryPlanningWriteError(`Plan ${planId} declares milestone ${id} more than once.`)
    seen.add(key)
    const title = m.title?.trim() || id
    const exit = cleanList(m.exitCriteria ?? [])
    // Start from the existing entry to keep unknown keys and exit_verifications, then apply the patch.
    const entry: Record<string, unknown> = { ...(byId.get(key) ?? {}) }
    entry.id = id
    entry.title = title
    if (exit.length > 0) entry.exit_criteria = exit
    else delete entry.exit_criteria
    data.push(entry)
    model.push({ id, title, exitCriteria: exit })
  }
  return { data, model }
}

/** True when a raw milestone entry carries at least one recorded exit-criterion verification. */
function hasExitEvidence(entry: Record<string, unknown> | undefined): boolean {
  return !!entry && Array.isArray(entry.exit_verifications) && (entry.exit_verifications as unknown[]).length > 0
}

/**
 * Update a Delivery Plan's metadata (title, objective, success criteria, risks, dependencies,
 * references, milestones). Never changes `status` (lifecycle stays human-gated via the CLI/transition
 * path). Preserves the Markdown body and any frontmatter keys not covered by the patch. A milestone
 * referenced by an Epic cannot be removed or renamed silently — the operation is rejected instead.
 */
export function updateDeliveryPlan(dir: string, id: string, patch: UpdatePlanInput, opts?: UpdateOptions): DeliveryPlan {
  const plan = getPlan(dir, id)
  if (!plan) throw new DeliveryPlanningWriteError(`Plan ${id} does not exist.`)
  const raw = readFile(plan.filePath)
  assertFreshRevision(plan.id, raw, opts)
  const { data, content } = matter(raw, {})

  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new DeliveryPlanningWriteError('Plan title cannot be empty.')
    data.title = patch.title.trim()
  }
  if (patch.objective !== undefined) {
    if (patch.objective === null || patch.objective.trim() === '') delete data.objective
    else data.objective = patch.objective.trim()
  }
  if (patch.successCriteria !== undefined) setListOrDelete(data, 'success_criteria', patch.successCriteria)
  if (patch.risks !== undefined) setListOrDelete(data, 'risks', patch.risks)
  if (patch.dependsOn !== undefined) setListOrDelete(data, 'depends_on', patch.dependsOn)
  if (patch.references !== undefined) setListOrDelete(data, 'references', patch.references)

  if (patch.milestones !== undefined) {
    const existingRaw = Array.isArray(data.milestones) ? (data.milestones as Record<string, unknown>[]) : []
    const { data: msData, model } = normalizeMilestones(plan.id, patch.milestones, existingRaw)
    const newIds = new Set(model.map((m) => m.id.toLowerCase()))
    // Reject removal/rename of a milestone an Epic still points at (no silent dangling reference).
    const referencedByEpic = new Map<string, string[]>()
    for (const e of epicsInPlan(dir, plan.id)) {
      if (!e.milestone) continue
      const key = e.milestone.toLowerCase()
      if (!newIds.has(key)) {
        const list = referencedByEpic.get(e.milestone) ?? []
        list.push(e.id)
        referencedByEpic.set(e.milestone, list)
      }
    }
    if (referencedByEpic.size > 0) {
      const detail = [...referencedByEpic.entries()].map(([ms, epics]) => `${ms} (used by ${epics.join(', ')})`).join('; ')
      throw new DeliveryPlanningWriteError(`Cannot remove or rename milestone(s) still referenced by an Epic: ${detail}. Reassign the Epic first.`)
    }
    // Removing a milestone that still carries exit-criteria evidence needs an explicit decision (adjustment 1).
    if (!opts?.allowMilestoneEvidenceLoss) {
      const droppedWithEvidence = existingRaw
        .filter((e) => e && typeof e === 'object' && typeof e.id === 'string' && !newIds.has(e.id.trim().toLowerCase()) && hasExitEvidence(e))
        .map((e) => String(e.id))
      if (droppedWithEvidence.length > 0) {
        throw new DeliveryPlanningWriteError(`Milestone(s) ${droppedWithEvidence.join(', ')} still carry exit-criteria evidence. Removing them discards that evidence — pass allowMilestoneEvidenceLoss to confirm.`)
      }
    }
    data.milestones = msData
  }

  const newContent = matter.stringify(content, data)
  writeFile(plan.filePath, newContent)
  const updated = parseDeliveryPlan(dir, plan.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Plan after update.')
  return updated
}

export type UpdateEpicInput = {
  title?: string
  outcome?: string | null
  plan?: string | null
  milestone?: string | null
  successCriteria?: string[]
  dependsOn?: string[]
  relatedCapabilities?: string[]
  decisions?: string[]
}

/**
 * Update an Epic's metadata (title, outcome, plan, milestone, success criteria, dependencies, related
 * capabilities, decisions). Never changes `status`. Validates that the resulting plan/milestone pairing
 * is consistent and that dependencies reference existing Epics without introducing a cycle. Preserves
 * the Markdown body and any frontmatter keys not covered by the patch.
 */
export function updateEpic(dir: string, id: string, patch: UpdateEpicInput, opts?: UpdateOptions): Epic {
  const epic = getEpic(dir, id)
  if (!epic) throw new DeliveryPlanningWriteError(`Epic ${id} does not exist.`)
  const raw = readFile(epic.filePath)
  assertFreshRevision(epic.id, raw, opts)
  const { data, content } = matter(raw, {})

  // Resolve the effective plan/milestone after the patch, then validate the pairing.
  const finalPlan = patch.plan !== undefined ? (patch.plan?.trim() || null) : epic.plan
  let finalMilestone = patch.milestone !== undefined ? (patch.milestone?.trim() || null) : epic.milestone
  if (!finalPlan) {
    // An Epic without a Plan cannot carry a milestone; detaching the Plan clears an inherited one,
    // but an explicit milestone with no plan is contradictory and rejected.
    if (patch.milestone !== undefined && finalMilestone) {
      throw new DeliveryPlanningWriteError('A milestone can only be set together with its plan.')
    }
    finalMilestone = null
  } else {
    if (patch.plan !== undefined && !getPlan(dir, finalPlan)) {
      throw new DeliveryPlanningWriteError(`Plan ${finalPlan} does not exist.`)
    }
    if (finalMilestone) {
      const plan = getPlan(dir, finalPlan)
      if (!plan) throw new DeliveryPlanningWriteError(`Plan ${finalPlan} does not exist.`)
      if (!plan.milestones.some((m) => m.id.toLowerCase() === finalMilestone!.toLowerCase())) {
        throw new DeliveryPlanningWriteError(`Milestone ${finalMilestone} is not defined in ${finalPlan}.`)
      }
    }
  }

  if (patch.dependsOn !== undefined) {
    const deps = cleanList(patch.dependsOn)
    const errs = validateEpicDependencyChange(dir, epic.id, deps)
    if (errs.length > 0) throw new DeliveryPlanningWriteError(errs.join(' '))
  }

  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new DeliveryPlanningWriteError('Epic title cannot be empty.')
    data.title = patch.title.trim()
  }
  if (patch.outcome !== undefined) {
    delete data.expected_outcome // collapse the legacy alias onto the canonical key
    if (patch.outcome === null || patch.outcome.trim() === '') delete data.outcome
    else data.outcome = patch.outcome.trim()
  }
  if (patch.plan !== undefined) {
    if (finalPlan) data.plan = finalPlan
    else delete data.plan
  }
  // Detaching the Plan (finalMilestone forced null) also clears any inherited milestone reference.
  if (patch.plan !== undefined || patch.milestone !== undefined) {
    if (finalMilestone) data.milestone = finalMilestone
    else delete data.milestone
  }
  if (patch.successCriteria !== undefined) setListOrDelete(data, 'success_criteria', patch.successCriteria)
  if (patch.dependsOn !== undefined) setListOrDelete(data, 'depends_on', patch.dependsOn)
  if (patch.relatedCapabilities !== undefined) setListOrDelete(data, 'related_capabilities', patch.relatedCapabilities)
  if (patch.decisions !== undefined) setListOrDelete(data, 'decisions', patch.decisions)

  const newContent = matter.stringify(content, data)
  writeFile(epic.filePath, newContent)
  const updated = parseEpic(dir, epic.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Epic after update.')
  return updated
}

// --- Lifecycle transitions, outcome evidence, and completion (WI-078) --------
// Transitions enforce PLAN_TRANSITIONS/EPIC_TRANSITIONS and never fire from derived progress. Evidence
// is recorded per declared criterion (indexed by text). Completion is human-gated: it requires a READY
// evaluation and records the decision — it is never triggered automatically by finished Work Items.

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export class PlanningNotReadyError extends DeliveryPlanningWriteError {
  constructor(public evaluation: EntityCompletionEvaluation) {
    super(`${evaluation.kind === 'plan' ? 'Plan' : 'Epic'} ${evaluation.id} is not ready to complete (${evaluation.readiness}).`)
    this.name = 'PlanningNotReadyError'
  }
}

export function transitionDeliveryPlan(dir: string, id: string, to: PlanStatus, opts?: UpdateOptions): DeliveryPlan {
  const plan = getPlan(dir, id)
  if (!plan) throw new DeliveryPlanningWriteError(`Plan ${id} does not exist.`)
  if (!(PLAN_STATES as readonly string[]).includes(to)) throw new DeliveryPlanningWriteError(`Invalid plan status: ${to}.`)
  if (to === 'completed') throw new DeliveryPlanningWriteError(`Completing Plan ${id} requires evidence-based review — use completeDeliveryPlan.`)
  const raw = readFile(plan.filePath)
  assertFreshRevision(plan.id, raw, opts)
  if (plan.status === to) return plan
  if (!PLAN_TRANSITIONS[plan.status].includes(to)) throw new DeliveryPlanningWriteError(`Invalid transition ${plan.status} → ${to} for Plan ${id}.`)
  const { data, content } = matter(raw, {})
  data.status = to
  if (to === 'completed') data.completed_at = today()
  const newContent = matter.stringify(content, data)
  writeFile(plan.filePath, newContent)
  const updated = parseDeliveryPlan(dir, plan.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Plan after transition.')
  return updated
}

export function transitionEpic(dir: string, id: string, to: EpicStatus, opts?: UpdateOptions): Epic {
  const epic = getEpic(dir, id)
  if (!epic) throw new DeliveryPlanningWriteError(`Epic ${id} does not exist.`)
  if (!(EPIC_STATES as readonly string[]).includes(to)) throw new DeliveryPlanningWriteError(`Invalid epic status: ${to}.`)
  if (to === 'completed') throw new DeliveryPlanningWriteError(`Completing Epic ${id} requires evidence-based review — use completeEpic.`)
  const raw = readFile(epic.filePath)
  assertFreshRevision(epic.id, raw, opts)
  if (epic.status === to) return epic
  if (!EPIC_TRANSITIONS[epic.status].includes(to)) throw new DeliveryPlanningWriteError(`Invalid transition ${epic.status} → ${to} for Epic ${id}.`)
  const { data, content } = matter(raw, {})
  data.status = to
  if (to === 'completed') data.completed_at = today()
  const newContent = matter.stringify(content, data)
  writeFile(epic.filePath, newContent)
  const updated = parseEpic(dir, epic.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Epic after transition.')
  return updated
}

export type OutcomeEvidenceInput = {
  criterion: string
  status: AcceptanceCriterionEvidence['status']
  evidence?: string
  reference?: string
  method?: 'automated' | 'manual'
  verifiedBy?: string
}

function assertCriterionDeclared(declared: string[], criterion: string, kind: string): void {
  const key = normalizeCriterion(criterion)
  const matches = declared.filter((c) => normalizeCriterion(c) === key).length
  if (matches === 0) throw new DeliveryPlanningWriteError(`"${criterion}" is not a declared ${kind} criterion.`)
  // Evidence must never be shared between colliding criteria — require disambiguation first (adjustment 2).
  if (matches > 1) throw new DeliveryPlanningWriteError(`"${criterion}" matches more than one declared ${kind} criterion — rename them to disambiguate before recording evidence.`)
}

/** Upsert an evidence record by normalized criterion text (replace same criterion, else append). */
function upsertEvidence(existing: unknown, input: OutcomeEvidenceInput): Record<string, unknown>[] {
  const list = Array.isArray(existing) ? (existing as unknown[]).filter((e) => e && typeof e === 'object' && !Array.isArray(e)) as Record<string, unknown>[] : []
  const key = normalizeCriterion(input.criterion)
  const kept = list.filter((e) => normalizeCriterion(String(e.criterion ?? '')) !== key)
  const obj: Record<string, unknown> = { criterion: input.criterion.trim(), status: input.status }
  if (input.evidence?.trim()) obj.evidence = input.evidence.trim()
  if (input.reference?.trim()) obj.reference = input.reference.trim()
  if (input.method) obj.method = input.method
  obj.verified_at = today()
  if (input.verifiedBy?.trim()) obj.verified_by = input.verifiedBy.trim()
  return [...kept, obj]
}

export function recordEpicOutcomeVerification(dir: string, id: string, input: OutcomeEvidenceInput, opts?: UpdateOptions): Epic {
  const epic = getEpic(dir, id)
  if (!epic) throw new DeliveryPlanningWriteError(`Epic ${id} does not exist.`)
  assertCriterionDeclared(epic.successCriteria, input.criterion, 'success')
  const raw = readFile(epic.filePath)
  assertFreshRevision(epic.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.outcome_verifications = upsertEvidence(data.outcome_verifications, input)
  const newContent = matter.stringify(content, data)
  writeFile(epic.filePath, newContent)
  const updated = parseEpic(dir, epic.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Epic after recording evidence.')
  return updated
}

export function recordPlanOutcomeVerification(dir: string, id: string, input: OutcomeEvidenceInput, opts?: UpdateOptions): DeliveryPlan {
  const plan = getPlan(dir, id)
  if (!plan) throw new DeliveryPlanningWriteError(`Plan ${id} does not exist.`)
  assertCriterionDeclared(plan.successCriteria, input.criterion, 'success')
  const raw = readFile(plan.filePath)
  assertFreshRevision(plan.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.outcome_verifications = upsertEvidence(data.outcome_verifications, input)
  const newContent = matter.stringify(content, data)
  writeFile(plan.filePath, newContent)
  const updated = parseDeliveryPlan(dir, plan.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Plan after recording evidence.')
  return updated
}

/** Record verification for a milestone exit criterion, stored inside that milestone's Plan entry. */
export function recordMilestoneExitVerification(dir: string, planId: string, milestoneId: string, input: OutcomeEvidenceInput, opts?: UpdateOptions): DeliveryPlan {
  const plan = getPlan(dir, planId)
  if (!plan) throw new DeliveryPlanningWriteError(`Plan ${planId} does not exist.`)
  const milestone = plan.milestones.find((m) => m.id.toLowerCase() === milestoneId.toLowerCase())
  if (!milestone) throw new DeliveryPlanningWriteError(`Milestone ${milestoneId} is not defined in ${planId}.`)
  assertCriterionDeclared(milestone.exitCriteria, input.criterion, 'exit')
  const raw = readFile(plan.filePath)
  assertFreshRevision(plan.id, raw, opts)
  const { data, content } = matter(raw, {})
  const rawMs = Array.isArray(data.milestones) ? (data.milestones as Record<string, unknown>[]) : []
  const entry = rawMs.find((m) => m && typeof m === 'object' && String(m.id ?? '').toLowerCase() === milestoneId.toLowerCase())
  if (!entry) throw new DeliveryPlanningWriteError(`Milestone ${milestoneId} entry not found in ${planId} frontmatter.`)
  entry.exit_verifications = upsertEvidence(entry.exit_verifications, input)
  data.milestones = rawMs
  const newContent = matter.stringify(content, data)
  writeFile(plan.filePath, newContent)
  const updated = parseDeliveryPlan(dir, plan.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Plan after recording milestone evidence.')
  return updated
}

export type CompletionDecisionInput = { decidedBy?: string; note?: string }

function completionDecisionRecord(evaluation: EntityCompletionEvaluation, input: CompletionDecisionInput): Record<string, unknown> {
  const rec: Record<string, unknown> = { readiness: evaluation.readiness, decided_at: today(), reasons: evaluation.reasons }
  if (input.decidedBy?.trim()) rec.decided_by = input.decidedBy.trim()
  if (input.note?.trim()) rec.note = input.note.trim()
  const acceptedExceptions = evaluation.exceptions.filter((x) => x.status === 'accepted')
  if (acceptedExceptions.length > 0) rec.exceptions = acceptedExceptions
  return rec
}

/**
 * Complete an Epic — the only path from any state to `completed`. It re-reads the canonical artifact,
 * re-evaluates readiness at the moment of the call, checks the expected revision (rejecting a stale or
 * concurrent write), and records `completion_decision` with the responsible party. Genuine human
 * authorization is the caller's responsibility: an MCP `confirm: true` flag is a confirmation step, not
 * by itself proof of human approval (§3 of WI-078). A READY_* evaluation never completes on its own.
 */
export function completeEpic(dir: string, id: string, input: CompletionDecisionInput = {}, opts?: UpdateOptions): Epic {
  const epic = getEpic(dir, id)
  if (!epic) throw new DeliveryPlanningWriteError(`Epic ${id} does not exist.`)
  const evaluation = evaluateEpicCompletion(dir, epic)
  if (evaluation.readiness !== 'READY_TO_COMPLETE' && evaluation.readiness !== 'READY_WITH_EXCEPTIONS') throw new PlanningNotReadyError(evaluation)
  if (!EPIC_TRANSITIONS[epic.status].includes('completed')) throw new DeliveryPlanningWriteError(`Epic ${id} cannot move from ${epic.status} to completed.`)
  const raw = readFile(epic.filePath)
  assertFreshRevision(epic.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.status = 'completed'
  data.completed_at = today()
  data.completion_decision = completionDecisionRecord(evaluation, input)
  const newContent = matter.stringify(content, data)
  writeFile(epic.filePath, newContent)
  const updated = parseEpic(dir, epic.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Epic after completion.')
  return updated
}

/** Complete a Delivery Plan — only when its evaluation is READY; records the decision. */
export function completeDeliveryPlan(dir: string, id: string, input: CompletionDecisionInput = {}, opts?: UpdateOptions): DeliveryPlan {
  const plan = getPlan(dir, id)
  if (!plan) throw new DeliveryPlanningWriteError(`Plan ${id} does not exist.`)
  const evaluation = evaluatePlanCompletion(dir, plan)
  if (evaluation.readiness !== 'READY_TO_COMPLETE' && evaluation.readiness !== 'READY_WITH_EXCEPTIONS') throw new PlanningNotReadyError(evaluation)
  if (!PLAN_TRANSITIONS[plan.status].includes('completed')) throw new DeliveryPlanningWriteError(`Plan ${id} cannot move from ${plan.status} to completed.`)
  const raw = readFile(plan.filePath)
  assertFreshRevision(plan.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.status = 'completed'
  data.completed_at = today()
  data.completion_decision = completionDecisionRecord(evaluation, input)
  const newContent = matter.stringify(content, data)
  writeFile(plan.filePath, newContent)
  const updated = parseDeliveryPlan(dir, plan.filePath, newContent)
  if (!updated) throw new DeliveryPlanningWriteError('Failed to parse the Plan after completion.')
  return updated
}
