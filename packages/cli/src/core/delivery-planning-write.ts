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
  type DeliveryPlan,
  type Epic,
  type PlanStatus,
  type EpicStatus,
  type Milestone,
} from './delivery-planning.js'
import { getInitiative, type Initiative } from './initiative.js'
import { updateInitiative } from './initiative-write.js'

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

export type UpdateOptions = { expectedRevision?: string }

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

/** Normalize a milestone patch to canonical frontmatter shape, enforcing unique ids within the Plan. */
function normalizeMilestones(planId: string, input: MilestoneInput[]): { data: Record<string, unknown>[]; model: Milestone[] } {
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
    const entry: Record<string, unknown> = { id, title }
    if (exit.length > 0) entry.exit_criteria = exit
    data.push(entry)
    model.push({ id, title, exitCriteria: exit })
  }
  return { data, model }
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
    const { data: msData, model } = normalizeMilestones(plan.id, patch.milestones)
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
