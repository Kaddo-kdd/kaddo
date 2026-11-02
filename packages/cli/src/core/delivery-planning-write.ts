// Delivery Planning write contract: create Plans and Epics, associate an Initiative with an Epic.
//
// Controlled writes only — no lifecycle inference, no silent changes to other artifacts. Status
// transitions and completion stay human-gated and are not performed here. Mutations validate their
// references against the current planning graph before writing.

import matter from 'gray-matter'
import { ensureDir, writeFile, join } from '../utils/fs.js'
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
  type DeliveryPlan,
  type Epic,
  type PlanStatus,
  type EpicStatus,
} from './delivery-planning.js'
import { getInitiative, type Initiative } from './initiative.js'
import { updateInitiative } from './initiative-write.js'

export class DeliveryPlanningWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeliveryPlanningWriteError'
  }
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
