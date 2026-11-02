// MCP tools for Delivery Planning: Plans and Epics (WI-074).
//
// Read tools expose the Delivery Planning Core read model; mutation tools follow the preview/confirm
// pattern (confirm=true to apply) so agents never make silent planning changes. All logic is
// delegated to @kaddo/cli/core — thin, provider-neutral surfaces. Never changes another element's
// lifecycle, never infers responsibility from Git.

import {
  discoverDeliveryPlans,
  discoverEpics,
  getPlan,
  getEpic,
  epicsInPlan,
  initiativesInEpic,
  workItemsInEpic,
  computePlanProgress,
  computeEpicProgress,
  validatePlanningGraph,
  createDeliveryPlan,
  createEpic,
  associateInitiativeWithEpic,
  DeliveryPlanningWriteError,
} from '@kaddo/cli/core'
import type { ToolResult } from './tools.js'

const ok = (data: unknown): ToolResult => ({ ok: true, data })
const fail = (message: string): ToolResult => ({ ok: false, message })

function previewOrApply<T>(confirm: boolean | undefined, action: string, effect: string, apply: () => T): ToolResult {
  if (!confirm) return ok({ action, effect, instruction: 'Call again with confirm=true to apply.' })
  try {
    return ok({ applied: true, result: apply() })
  } catch (err) {
    if (err instanceof DeliveryPlanningWriteError) return fail(err.message)
    throw err
  }
}

export function listPlansTool(root: string): ToolResult {
  return ok(discoverDeliveryPlans(root).map((p) => {
    const prog = computePlanProgress(root, p)
    return { id: p.id, title: p.title, status: p.status, milestones: p.milestones.length, epics: prog.epics.total, delivery: prog.delivery }
  }))
}

export function getPlanTool(root: string, id: string): ToolResult {
  const plan = getPlan(root, id)
  if (!plan) return fail(`Plan ${id} not found.`)
  return ok({
    id: plan.id,
    title: plan.title,
    status: plan.status,
    objective: plan.objective,
    milestones: plan.milestones,
    dependsOn: plan.dependsOn,
    successCriteria: plan.successCriteria,
    risks: plan.risks,
    references: plan.references,
    epics: epicsInPlan(root, plan.id).map((e) => ({ id: e.id, title: e.title, status: e.status, milestone: e.milestone })),
  })
}

export function getPlanProgressTool(root: string, id: string): ToolResult {
  const plan = getPlan(root, id)
  if (!plan) return fail(`Plan ${id} not found.`)
  return ok(computePlanProgress(root, plan))
}

export function listEpicsTool(root: string): ToolResult {
  return ok(discoverEpics(root).map((e) => {
    const prog = computeEpicProgress(root, e)
    return { id: e.id, title: e.title, status: e.status, plan: e.plan, milestone: e.milestone, delivery: prog.delivery }
  }))
}

export function getEpicTool(root: string, id: string): ToolResult {
  const epic = getEpic(root, id)
  if (!epic) return fail(`Epic ${id} not found.`)
  return ok({
    id: epic.id,
    title: epic.title,
    status: epic.status,
    outcome: epic.outcome,
    plan: epic.plan,
    milestone: epic.milestone,
    dependsOn: epic.dependsOn,
    successCriteria: epic.successCriteria,
    relatedCapabilities: epic.relatedCapabilities,
    initiatives: initiativesInEpic(root, epic.id).map((i) => ({ id: i.id, title: i.title, status: i.status, owners: i.owners, contributors: i.contributors })),
    workItems: workItemsInEpic(root, epic.id).map((w) => ({ id: w.id, title: w.title, status: w.lifecycle })),
  })
}

export function getEpicProgressTool(root: string, id: string): ToolResult {
  const epic = getEpic(root, id)
  if (!epic) return fail(`Epic ${id} not found.`)
  return ok(computeEpicProgress(root, epic))
}

export function validatePlanningTool(root: string): ToolResult {
  return ok({ findings: validatePlanningGraph(root) })
}

export function createPlanTool(root: string, args: { title: string; objective?: string; confirm?: boolean }): ToolResult {
  if (!args.title?.trim()) return fail('title is required.')
  return previewOrApply(args.confirm, 'create-delivery-plan', `A new Delivery Plan "${args.title.trim()}" will be created under knowledge/delivery/plans/.`,
    () => createDeliveryPlan(root, { title: args.title, objective: args.objective }))
}

export function createEpicTool(root: string, args: { title: string; plan?: string; milestone?: string; outcome?: string; confirm?: boolean }): ToolResult {
  if (!args.title?.trim()) return fail('title is required.')
  return previewOrApply(args.confirm, 'create-epic', `A new Epic "${args.title.trim()}"${args.plan ? ` in ${args.plan}` : ''} will be created under knowledge/delivery/epics/.`,
    () => createEpic(root, { title: args.title, plan: args.plan, milestone: args.milestone, outcome: args.outcome }))
}

export function associateInitiativeTool(root: string, args: { epic: string; initiative: string; confirm?: boolean }): ToolResult {
  if (!args.epic?.trim() || !args.initiative?.trim()) return fail('epic and initiative are required.')
  return previewOrApply(args.confirm, 'associate-initiative-epic', `Initiative ${args.initiative} will be associated with Epic ${args.epic}.`,
    () => associateInitiativeWithEpic(root, args.initiative, args.epic))
}
