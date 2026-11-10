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
  transitionDeliveryPlan,
  transitionEpic,
  recordPlanOutcomeVerification,
  recordEpicOutcomeVerification,
  recordMilestoneExitVerification,
  completeDeliveryPlan,
  completeEpic,
  evaluatePlanCompletion,
  evaluateEpicCompletion,
  DeliveryPlanningWriteError,
  PlanningNotReadyError,
  type OutcomeEvidenceInput,
} from '@kaddo/cli/core'
import type { ToolResult } from './tools.js'

type EvidenceArgs = { id: string; criterion: string; status?: string; evidence?: string; reference?: string; method?: string; verifiedBy?: string; confirm?: boolean }
const EVIDENCE_STATUSES = ['passed', 'failed', 'not-verified', 'manual-review-required']
function toEvidence(a: EvidenceArgs): OutcomeEvidenceInput | string {
  if (!a.criterion?.trim()) return 'criterion is required.'
  const status = a.status ?? 'passed'
  if (!EVIDENCE_STATUSES.includes(status)) return `status must be one of: ${EVIDENCE_STATUSES.join(', ')}.`
  const method = a.method === 'automated' || a.method === 'manual' ? a.method : undefined
  return { criterion: a.criterion.trim(), status: status as OutcomeEvidenceInput['status'], evidence: a.evidence, reference: a.reference, method, verifiedBy: a.verifiedBy }
}

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

// --- Lifecycle, outcome verification and completion (WI-078) ------------------
// Read tools expose the evidence-based readiness; mutations follow preview/confirm. Completion is a
// human decision: confirm=true is a confirmation step, NOT by itself proof of human approval.

export function verifyPlanTool(root: string, id: string): ToolResult {
  const plan = getPlan(root, id)
  if (!plan) return fail(`Plan ${id} not found.`)
  return ok(evaluatePlanCompletion(root, plan))
}

export function verifyEpicTool(root: string, id: string): ToolResult {
  const epic = getEpic(root, id)
  if (!epic) return fail(`Epic ${id} not found.`)
  return ok(evaluateEpicCompletion(root, epic))
}

export function recordPlanEvidenceTool(root: string, args: EvidenceArgs & { milestone?: string }): ToolResult {
  const input = toEvidence(args)
  if (typeof input === 'string') return fail(input)
  const target = args.milestone ? `milestone ${args.milestone}` : 'Plan outcome'
  return previewOrApply(args.confirm, 'record-plan-evidence', `Evidence [${input.status}] for ${target} criterion "${input.criterion}" on ${args.id} will be recorded.`,
    () => args.milestone ? recordMilestoneExitVerification(root, args.id, args.milestone, input) : recordPlanOutcomeVerification(root, args.id, input))
}

export function recordEpicEvidenceTool(root: string, args: EvidenceArgs): ToolResult {
  const input = toEvidence(args)
  if (typeof input === 'string') return fail(input)
  return previewOrApply(args.confirm, 'record-epic-evidence', `Evidence [${input.status}] for Epic outcome criterion "${input.criterion}" on ${args.id} will be recorded.`,
    () => recordEpicOutcomeVerification(root, args.id, input))
}

export function transitionPlanTool(root: string, args: { id: string; to: string; confirm?: boolean }): ToolResult {
  if (args.to === 'completed') return fail('Use complete_plan for an evidence-based completion.')
  return previewOrApply(args.confirm, 'transition-plan', `Plan ${args.id} will transition to ${args.to}.`,
    () => transitionDeliveryPlan(root, args.id, args.to as never))
}

export function transitionEpicTool(root: string, args: { id: string; to: string; confirm?: boolean }): ToolResult {
  if (args.to === 'completed') return fail('Use complete_epic for an evidence-based completion.')
  return previewOrApply(args.confirm, 'transition-epic', `Epic ${args.id} will transition to ${args.to}.`,
    () => transitionEpic(root, args.id, args.to as never))
}

const APPROVAL_NOTE = 'confirm=true is a confirmation step, not by itself proof of human approval — only complete with genuine human authorization.'

export function completePlanTool(root: string, args: { id: string; decidedBy?: string; confirm?: boolean }): ToolResult {
  const plan = getPlan(root, args.id)
  if (!plan) return fail(`Plan ${args.id} not found.`)
  const evaluation = evaluatePlanCompletion(root, plan)
  const ready = evaluation.readiness === 'READY_TO_COMPLETE' || evaluation.readiness === 'READY_WITH_EXCEPTIONS'
  if (!args.confirm) return ok({ action: 'complete-plan', readiness: evaluation.readiness, evaluation, note: APPROVAL_NOTE, instruction: ready ? 'Review the evaluation; call again with confirm=true to record the human completion decision.' : `Not ready (${evaluation.readiness}). Resolve the blockers first.` })
  try { return ok({ applied: true, result: completeDeliveryPlan(root, args.id, { decidedBy: args.decidedBy }) }) }
  catch (err) { if (err instanceof PlanningNotReadyError || err instanceof DeliveryPlanningWriteError) return fail(err.message); throw err }
}

export function completeEpicTool(root: string, args: { id: string; decidedBy?: string; confirm?: boolean }): ToolResult {
  const epic = getEpic(root, args.id)
  if (!epic) return fail(`Epic ${args.id} not found.`)
  const evaluation = evaluateEpicCompletion(root, epic)
  const ready = evaluation.readiness === 'READY_TO_COMPLETE' || evaluation.readiness === 'READY_WITH_EXCEPTIONS'
  if (!args.confirm) return ok({ action: 'complete-epic', readiness: evaluation.readiness, evaluation, note: APPROVAL_NOTE, instruction: ready ? 'Review the evaluation; call again with confirm=true to record the human completion decision.' : `Not ready (${evaluation.readiness}). Resolve the blockers first.` })
  try { return ok({ applied: true, result: completeEpic(root, args.id, { decidedBy: args.decidedBy }) }) }
  catch (err) { if (err instanceof PlanningNotReadyError || err instanceof DeliveryPlanningWriteError) return fail(err.message); throw err }
}
