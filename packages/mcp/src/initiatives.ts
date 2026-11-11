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
  updateCandidate,
  removeCandidate,
  materializeCandidate,
  recordInitiativeOutcomeVerification,
  completeInitiative,
  addExternalLink,
  analyzeInitiative,
  evaluateInitiativeCompletion,
  evaluateInitiativeById,
  suggestInitiativesForExternalItem,
  InitiativeWriteError,
  InitiativeNotReadyError,
  type InitiativeStatus,
  type UpdateCandidateInput,
  type InitiativeEvidenceInput,
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

export function addInitiativeExternalLinkTool(
  root: string,
  args: {
    id: string
    integration: string
    externalId: string
    externalType?: string
    url?: string
    externalStatus?: string
    confirm?: boolean
  },
): ToolResult {
  if (!args.integration?.trim() || !args.externalId?.trim()) {
    return fail('integration and externalId are required.')
  }
  if (!getInitiative(root, args.id)) return fail(`Initiative ${args.id} not found.`)
  return previewOrApply(
    args.confirm,
    'add-initiative-external-link',
    `A provider-neutral reference ${args.integration}:${args.externalId} will be added to ${args.id}. An external status is stored as a signal only and never changes the Initiative lifecycle.`,
    () => addExternalLink(root, args.id, {
      integration: args.integration,
      externalId: args.externalId,
      externalType: args.externalType,
      url: args.url,
      externalStatus: args.externalStatus,
    }),
  )
}

export function suggestInitiativeForExternalItemTool(
  root: string,
  args: { integration: string; externalId: string },
): ToolResult {
  if (!args.integration?.trim() || !args.externalId?.trim()) {
    return fail('integration and externalId are required.')
  }
  const matches = suggestInitiativesForExternalItem(root, args.integration, args.externalId)
  return ok({
    integration: args.integration,
    externalId: args.externalId,
    suggestions: matches.map((i) => ({ id: i.id, title: i.title, status: i.status })),
    note: 'Suggestion only — associating a Work Item with an Initiative requires human confirmation.',
  })
}

export function analyzeInitiativeTool(root: string, id: string): ToolResult {
  const ini = getInitiative(root, id)
  if (!ini) return fail(`Initiative ${id} not found.`)
  return ok(analyzeInitiative(root, ini))
}

/**
 * Human-gated, evidence-based completion (WI-079). Without confirm, returns the readiness evaluation
 * (declared success criteria vs recorded evidence, pending candidates, delivery, provenance) and does
 * NOT complete. With confirm=true (the human decision relayed by the agent), it routes through the
 * gated `completeInitiative`: when readiness is not READY_*, Core refuses — a Markdown checkbox is not
 * evidence and cannot be bypassed. Record outcome evidence first (recordInitiativeEvidenceTool).
 */
export function completeInitiativeTool(
  root: string,
  args: { id: string; confirm?: boolean; decidedBy?: string },
): ToolResult {
  const ini = getInitiative(root, args.id)
  if (!ini) return fail(`Initiative ${args.id} not found.`)
  const readiness = evaluateInitiativeCompletion(root, ini)
  if (!args.confirm) {
    return ok({
      action: 'complete-initiative',
      readiness,
      instruction: readiness.ready
        ? `Initiative is ${readiness.readiness}. Call again with confirm=true to complete (human decision).`
        : 'Initiative is NOT ready (see readiness.reasons). Resolve blockers and record outcome evidence for each success criterion, then call again with confirm=true.',
    })
  }
  try {
    const done = completeInitiative(root, args.id, args.decidedBy ? { decidedBy: args.decidedBy } : {})
    return ok({ applied: true, readiness, result: { id: done.id, status: done.status } })
  } catch (err) {
    if (err instanceof InitiativeNotReadyError) {
      return fail(`${err.message} Completion is evidence-gated and cannot be forced; record evidence and resolve blockers first.`)
    }
    if (err instanceof InitiativeWriteError) return fail(err.message)
    throw err
  }
}

/**
 * Record outcome evidence for one declared success criterion (preview/confirm). The criterion text
 * must match a criterion in the Initiative's "## Success Criteria"; undeclared criteria are rejected.
 * Evidence is what moves an Initiative toward READY (a checkbox never does).
 */
export function recordInitiativeEvidenceTool(
  root: string,
  args: { id: string; criterion: string; status: InitiativeEvidenceInput['status']; evidence?: string; reference?: string; method?: InitiativeEvidenceInput['method']; confirm?: boolean },
): ToolResult {
  const ini = getInitiative(root, args.id)
  if (!ini) return fail(`Initiative ${args.id} not found.`)
  const input: InitiativeEvidenceInput = {
    criterion: args.criterion,
    status: args.status,
    ...(args.evidence ? { evidence: args.evidence } : {}),
    ...(args.reference ? { reference: args.reference } : {}),
    ...(args.method ? { method: args.method } : {}),
  }
  if (!args.confirm) {
    return ok({ action: 'record-initiative-evidence', preview: input, instruction: 'Call again with confirm=true to record this evidence.' })
  }
  try {
    recordInitiativeOutcomeVerification(root, args.id, input)
    return ok({ applied: true, readiness: evaluateInitiativeById(root, args.id) })
  } catch (err) {
    if (err instanceof InitiativeWriteError) return fail(err.message)
    throw err
  }
}

/** Edit a pending candidate (id, source signals and provenance are preserved). Materialized candidates are rejected. */
export function updateCandidateTool(
  root: string,
  args: { id: string; candidateId: string; patch: UpdateCandidateInput; confirm?: boolean },
): ToolResult {
  const ini = getInitiative(root, args.id)
  if (!ini) return fail(`Initiative ${args.id} not found.`)
  if (!args.confirm) {
    return ok({ action: 'update-candidate', preview: { candidateId: args.candidateId, patch: args.patch }, instruction: 'Call again with confirm=true to apply.' })
  }
  try {
    const updated = updateCandidate(root, args.id, args.candidateId, args.patch)
    return ok({ applied: true, candidates: updated.candidates })
  } catch (err) {
    if (err instanceof InitiativeWriteError) return fail(err.message)
    throw err
  }
}

/** Remove a pending candidate with a logged justification (never silently). Materialized candidates are rejected. */
export function removeCandidateTool(
  root: string,
  args: { id: string; candidateId: string; reason: string; confirm?: boolean },
): ToolResult {
  const ini = getInitiative(root, args.id)
  if (!ini) return fail(`Initiative ${args.id} not found.`)
  if (!args.confirm) {
    return ok({ action: 'remove-candidate', preview: { candidateId: args.candidateId, reason: args.reason }, instruction: 'Call again with confirm=true to remove.' })
  }
  try {
    const updated = removeCandidate(root, args.id, args.candidateId, args.reason)
    return ok({ applied: true, candidates: updated.candidates })
  } catch (err) {
    if (err instanceof InitiativeWriteError) return fail(err.message)
    throw err
  }
}
