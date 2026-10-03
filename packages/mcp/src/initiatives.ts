// MCP tools for Initiatives (WI-019).
//
// Read tools expose the Initiative Core read model; mutation tools follow the preview/confirm
// pattern (confirm=true to apply) so agents never make silent strategic changes. All logic is
// delegated to @kaddo/cli/core (WI-018) — these are thin, provider-neutral surfaces.

import {
  discoverInitiatives,
  getInitiative,
  computeInitiativeProgress,
  getInitiativeContext,
  createInitiative,
  transitionInitiative,
  updateInitiative,
  addCandidate,
  materializeCandidate,
  InitiativeWriteError,
  type InitiativeStatus,
} from '@kaddo/cli/core'
import type { ToolResult } from './tools.js'

const ok = (data: unknown): ToolResult => ({ ok: true, data })
const fail = (message: string): ToolResult => ({ ok: false, message })

export function listInitiativesTool(root: string): ToolResult {
  const all = discoverInitiatives(root).map((ini) => {
    const p = computeInitiativeProgress(root, ini)
    return {
      id: ini.id,
      title: ini.title,
      status: ini.status,
      planning: p.planning,
      delivery: p.delivery,
    }
  })
  return ok(all)
}

export function getInitiativeTool(root: string, id: string): ToolResult {
  const ini = getInitiative(root, id)
  if (!ini) return fail(`Initiative ${id} not found.`)
  return ok({
    id: ini.id,
    title: ini.title,
    status: ini.status,
    horizon: ini.horizon,
    priority: ini.priority,
    knowledgeLevel: ini.knowledgeLevel,
    domains: ini.domains,
    relatedCapabilities: ini.relatedCapabilities,
    source: ini.source,
    sourceId: ini.sourceId,
    externalLinks: ini.externalLinks,
    candidates: ini.candidates,
    body: ini.body,
  })
}

export function getInitiativeContextTool(root: string, id: string): ToolResult {
  const ini = getInitiative(root, id)
  if (!ini) return fail(`Initiative ${id} not found.`)
  return ok(getInitiativeContext(root, ini))
}

export function getInitiativeProgressTool(root: string, id: string): ToolResult {
  const ini = getInitiative(root, id)
  if (!ini) return fail(`Initiative ${id} not found.`)
  return ok(computeInitiativeProgress(root, ini))
}

function previewOrApply<T>(
  confirm: boolean | undefined,
  action: string,
  effect: string,
  apply: () => T,
): ToolResult {
  if (!confirm) {
    return ok({ action, effect, instruction: 'Call again with confirm=true to apply.' })
  }
  try {
    return ok({ applied: true, result: apply() })
  } catch (err) {
    if (err instanceof InitiativeWriteError) return fail(err.message)
    throw err
  }
}

export function createInitiativeTool(
  root: string,
  args: { title: string; domains?: string[]; relatedCapabilities?: string[]; horizon?: string; priority?: string; confirm?: boolean },
): ToolResult {
  if (!args.title?.trim()) return fail('title is required.')
  return previewOrApply(
    args.confirm,
    'create-initiative',
    `A new Initiative "${args.title.trim()}" will be created under knowledge/delivery/initiatives/.`,
    () => createInitiative(root, {
      title: args.title,
      domains: args.domains,
      relatedCapabilities: args.relatedCapabilities,
      horizon: args.horizon,
      priority: args.priority,
    }),
  )
}

export function updateInitiativeTool(
  root: string,
  args: {
    id: string
    status?: string
    title?: string
    horizon?: string
    priority?: string
    domains?: string[]
    relatedCapabilities?: string[]
    confirm?: boolean
  },
): ToolResult {
  if (!getInitiative(root, args.id)) return fail(`Initiative ${args.id} not found.`)
  const changingStatus = typeof args.status === 'string'
  const effect = changingStatus
    ? `Initiative ${args.id} status will transition to "${args.status}" (valid transitions only).`
    : `Initiative ${args.id} fields will be updated.`
  return previewOrApply(args.confirm, 'update-initiative', effect, () => {
    if (changingStatus) {
      return transitionInitiative(root, args.id, args.status as InitiativeStatus)
    }
    return updateInitiative(root, args.id, {
      title: args.title,
      horizon: args.horizon,
      priority: args.priority,
      domains: args.domains,
      relatedCapabilities: args.relatedCapabilities,
    })
  })
}

export function addInitiativeCandidateTool(
  root: string,
  args: {
    id: string
    title: string
    type?: string
    suggestedKnowledgeLevel?: string
    expectedValue?: string
    notes?: string
    confirm?: boolean
  },
): ToolResult {
  if (!args.title?.trim()) return fail('candidate title is required.')
  if (!getInitiative(root, args.id)) return fail(`Initiative ${args.id} not found.`)
  return previewOrApply(
    args.confirm,
    'add-initiative-candidate',
    `A Work Item candidate "${args.title.trim()}" will be added to ${args.id}.`,
    () => addCandidate(root, args.id, {
      title: args.title,
      type: args.type,
      suggestedKnowledgeLevel: args.suggestedKnowledgeLevel,
      expectedValue: args.expectedValue,
      notes: args.notes,
    }),
  )
}

export function materializeInitiativeCandidateTool(
  root: string,
  args: { id: string; candidateId: string; confirm?: boolean },
): ToolResult {
  const ini = getInitiative(root, args.id)
  if (!ini) return fail(`Initiative ${args.id} not found.`)
  const candidate = ini.candidates.find((c) => c.id === args.candidateId)
  if (!candidate) return fail(`Candidate ${args.candidateId} not found in ${args.id}.`)
  return previewOrApply(
    args.confirm,
    'materialize-initiative-candidate',
    `Candidate ${args.candidateId} ("${candidate.title}") will be materialized into a draft Work Item associated to ${args.id}.`,
    () => materializeCandidate(root, args.id, args.candidateId),
  )
}
