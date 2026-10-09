// MCP tools (VS-057, VS-109).
//
// Each tool returns a plain JS value (string/object). The server wraps it as MCP content. Most
// tools only read project knowledge. Write tools: markWorkItemReady (VS-058), importWorkItemTool
// (VS-109). No tool runs git or calls an LLM.

import matter from 'gray-matter'
import {
  importWorkItem,
  ImportError,
  type ImportWorkItemResult,
  collectImplementationEvidence,
  verifyWorkItem,
  evaluateCompletion,
  WorkItemNotInProgressError,
  WorkItemNotFoundError,
  buildImplementationHandoff,
  WorkItemNotReadyError,
  type CollectEvidenceInput,
  getConsentState,
  persistConsent,
  isDeferralActive,
  deferConsent,
  consentNotice,
  getTelemetryStatus,
  loadConfig,
  buildPocReportContext,
  persistPocReport,
} from '@kaddo/cli/core'
import { listWorkItems, type WorkItemSummary } from './workitems.js'
import { listCapsules, getCapsule, listAgents, getAgentPrompt } from './catalog.js'
import { listSkills, getSkill } from './skills.js'
import { readJson, readText, writeWorkItemTransition, removeWorkItemFile } from './project.js'
import { getResources, getResource } from '../../cli/src/core/resources.js'
import {
  createResource,
  updateResource,
  deleteResource,
  validateResource,
  getResourceReferences,
  ResourceWriteError,
  type ResourceInput,
} from '../../cli/src/core/resource-write.js'

export type ToolResult = { ok: true; data: unknown } | { ok: false; message: string }

const ok = (data: unknown): ToolResult => ({ ok: true, data })
const fail = (message: string): ToolResult => ({ ok: false, message })

// --- POC final report -----------------------------------------------------

/** Prepare a bounded, deterministic context; synthesis remains the caller's responsibility. */
export function preparePocReportTool(root: string): ToolResult {
  const context = buildPocReportContext(root)
  return context.eligible ? ok(context) : fail(context.handoff)
}

/** Preview by default; write only after explicit human confirmation. */
export function persistPocReportTool(root: string, proposal: string, confirm?: boolean, force?: boolean): ToolResult {
  try {
    return ok(persistPocReport(root, proposal, { confirm, force }))
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err))
  }
}

// --- kaddo_project_status -------------------------------------------------

type ExplainJson = {
  project?: { name?: string; state?: string }
  knowledge?: Record<string, unknown>
  workItems?: { total?: number; byState?: Record<string, number>; byType?: Record<string, number> }
  ownership?: { workItemsWithOwnership?: number; workItemsTotal?: number }
  layers?: { layer: string; status: string }[]
  isModuleRepo?: boolean
  readiness?: { overall?: string; project_role?: string; signals?: Record<string, unknown> }
  deliverySummary?: { completedWorkItems?: number; archivedWorkItems?: number; activeWorkItems?: number; implementationCompleted?: number; releaseBlocked?: number; releaseReady?: number }
  scopeCoverage?: { id: string; scopeConfidence?: { level: string }; unknownModules?: string[]; hasScopeCoverage?: boolean }[]
}

type GraphHintsJson = { quality?: string; scope?: string; scope_reason?: string; summary?: { hints?: number } }

export function projectStatus(root: string): ToolResult {
  const explain = readJson<ExplainJson>(root, '.kaddo/explain.json')
  const hints = readJson<GraphHintsJson>(root, '.kaddo/graph-hints.json')
  const capsules = listCapsules(root)

  if (!explain) {
    return fail('Project status needs `.kaddo/explain.json`. Run `kaddo explain` first.')
  }

  const maturity = (explain.layers ?? []).map((l) => `${l.layer}: ${l.status}`)
  const result: Record<string, unknown> = {
    project: explain.project?.name ?? 'unknown',
    state: explain.project?.state ?? 'unknown',
    knowledgeMaturity: maturity,
    workItems: {
      total: explain.workItems?.total ?? 0,
      byState: explain.workItems?.byState ?? {},
      byType: explain.workItems?.byType ?? {},
    },
    ownership: {
      withOwnership: explain.ownership?.workItemsWithOwnership ?? 0,
      total: explain.ownership?.workItemsTotal ?? 0,
    },
    graph: {
      scope: hints?.scope ?? 'unknown (run `kaddo graph export`)',
      scope_reason: hints?.scope_reason ?? '',
      quality: hints?.quality ?? 'unknown (run `kaddo graph export`)',
      hints: hints?.summary?.hints ?? 0,
    },
    capsules: capsules.length,
  }

  if (explain.isModuleRepo) {
    result.isModuleRepo = true
    result.readiness = {
      overall: explain.readiness?.overall ?? 'unknown',
      project_role: explain.readiness?.project_role ?? 'module',
      agents: 'managed-by-core',
      skills: 'managed-by-core',
    }
  } else {
    result.readiness = {
      overall: explain.readiness?.overall ?? 'unknown',
    }
  }

  if (explain.deliverySummary) {
    result.deliverySummary = explain.deliverySummary
  }

  if (explain.scopeCoverage && Array.isArray(explain.scopeCoverage) && explain.scopeCoverage.length > 0) {
    result.scopeCoverage = explain.scopeCoverage
  }

  return ok(result)
}

// --- Work Items -----------------------------------------------------------

export function listWorkItemsTool(
  root: string,
  filter: { status?: string; type?: string; knowledge_level?: string } = {}
): ToolResult {
  let items = listWorkItems(root)
  if (filter.status) items = items.filter((w) => w.status === filter.status)
  if (filter.type) items = items.filter((w) => w.type === filter.type)
  if (filter.knowledge_level) items = items.filter((w) => w.knowledge_level === filter.knowledge_level)
  return ok(items)
}

export function getWorkItem(root: string, id: string): ToolResult {
  const item = listWorkItems(root).find((w: WorkItemSummary) => w.id === id)
  if (!item) return fail(`Work Item "${id}" not found.`)
  const content = readText(root, item.path)
  return ok({ ...item, content: content ?? '' })
}

export function markWorkItemReady(root: string, id: string, confirm?: boolean): ToolResult {
  const item = listWorkItems(root).find((w: WorkItemSummary) => w.id === id)
  if (!item) return fail(`Work Item "${id}" not found.`)

  if (item.status === 'ready') {
    return ok({ status: 'already_ready', id: item.id, message: `Work Item ${item.id} is already ready.` })
  }
  if (item.status !== 'draft') {
    return fail(`Work Item ${item.id} is in state "${item.status}", not "draft". Only draft Work Items can be marked as ready.`)
  }

  const warnings = item.readiness?.warnings ?? []

  if (!confirm) {
    return ok({
      status: 'needs_confirmation',
      workItem: {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        domains: item.domains,
        source: item.source,
        code: item.code,
        readiness: item.readiness,
      },
      command: `kaddo ready ${item.id}`,
      message: `Review this Work Item and call mark_work_item_ready with confirm=true to mark it ready.`,
    })
  }

  const raw = readText(root, item.path)
  if (!raw) return fail(`Could not read Work Item file: ${item.path}`)

  const parsed = matter(raw)
  const data = { ...(parsed.data as Record<string, unknown>) }
  const today = new Date().toISOString().slice(0, 10)
  data.status = 'ready'
  data.ready_at = today
  const newContent = matter.stringify(parsed.content, data)

  const posixPath = item.path.replace(/\\/g, '/')
  let newRelPath = item.path
  if (posixPath.includes('/work-items/draft/')) {
    newRelPath = item.path.replace(/[/\\]draft[/\\]/, '/ready/')
  }

  writeWorkItemTransition(root, newRelPath, newContent)
  if (newRelPath !== item.path) {
    removeWorkItemFile(root, item.path)
  }

  const status = warnings.length > 0 ? 'ready_with_warnings' : 'ready'
  return ok({
    status,
    id: item.id,
    from: 'draft',
    to: 'ready',
    ready_at: today,
    moved: newRelPath !== item.path ? { from: item.path, to: newRelPath } : undefined,
    ...(warnings.length > 0 ? { warnings } : {}),
    next: ['Run kaddo context', 'Run kaddo understand'],
  })
}

// --- Capsules -------------------------------------------------------------

export function listCapsulesTool(root: string): ToolResult {
  return ok(listCapsules(root))
}

export function getCapsuleTool(root: string, id: string): ToolResult {
  const cap = getCapsule(root, id)
  if (!cap) return fail(`Knowledge Capsule "${id}" not found.`)
  return ok(cap)
}

// --- Agents ---------------------------------------------------------------

export function listAgentsTool(root: string): ToolResult {
  return ok(listAgents(root))
}

export function getAgentPromptTool(root: string, name: string): ToolResult {
  const agent = getAgentPrompt(root, name)
  if (!agent) return fail(`Agent "${name}" is not installed. Run \`kaddo add agents\` first.`)
  return ok(agent)
}

// --- Skills ---------------------------------------------------------------

export function listSkillsTool(root: string): ToolResult {
  return ok(listSkills(root))
}

export function getSkillTool(root: string, id: string): ToolResult {
  const skill = getSkill(root, id)
  if (!skill) return fail(`Skill "${id}" is not installed. Run \`kaddo add skills\` first.`)
  return ok(skill)
}

// --- Graph hints ----------------------------------------------------------

type GraphHint = {
  artifact_id: string
  artifact_type: string
  severity: string
  missing: string[]
  message: string
}
type GraphHintsReport = { quality?: string; scope?: string; scope_reason?: string; summary?: unknown; hints?: GraphHint[] }

export function listGraphHints(
  root: string,
  filter: { artifact_type?: string; severity?: string; active_only?: boolean } = {}
): ToolResult {
  const report = readJson<GraphHintsReport>(root, '.kaddo/graph-hints.json')
  if (!report) return fail('Graph hints not found. Run `kaddo graph export` first.')
  let hints = Array.isArray(report.hints) ? report.hints : []
  if (filter.artifact_type) hints = hints.filter((h) => h.artifact_type === filter.artifact_type)
  if (filter.severity) hints = hints.filter((h) => h.severity === filter.severity)
  if (filter.active_only) hints = hints.filter((h) => h.artifact_type === 'work-item')
  return ok({
    scope: report.scope ?? 'active',
    scope_reason: report.scope_reason ?? '',
    quality: report.quality ?? 'unknown',
    count: hints.length,
    hints,
  })
}

// --- Work Item Import (VS-109) -------------------------------------------

export function importWorkItemTool(
  root: string,
  args: { content: string; source?: string; type?: string; onConflict?: string },
): ToolResult {
  const source = (args.source === 'cli' || args.source === 'admin') ? args.source : 'chat' as const
  const onConflict = (args.onConflict === 'replace' || args.onConflict === 'new-id') ? args.onConflict : undefined
  try {
    const result: ImportWorkItemResult = importWorkItem(root, {
      content: args.content,
      source,
      type: args.type,
      onConflict,
    })

    if (result.conflict) {
      return ok({
        created: false,
        conflict: true,
        importedId: result.conflict.importedId,
        existingPath: result.conflict.existingPath,
        message: `The imported content has id "${result.conflict.importedId}" which already exists. `
          + 'Call again with onConflict: "replace" to delete the existing Work Item and create the new one, '
          + 'or onConflict: "new-id" to assign a new consecutive ID.',
        executed: false,
      })
    }

    return ok({
      created: result.created,
      workItemId: result.workItemId,
      path: result.path,
      status: result.status,
      source: result.source,
      sourceFormat: result.sourceFormat,
      duplicateOf: result.duplicateOf,
      executed: false,
      refinementHandoff: result.refinementHandoff
        ? { agent: result.refinementHandoff.recommendedAgent, skill: result.refinementHandoff.recommendedSkill, text: result.refinementHandoff.text }
        : undefined,
      ...(result.discardedFields?.length ? { discardedFields: result.discardedFields } : {}),
      ...(result.replacedWorkItem ? { replacedWorkItem: result.replacedWorkItem } : {}),
    })
  } catch (err) {
    if (err instanceof ImportError) return fail(`[${err.code}] ${err.message}`)
    return fail('Work Item import failed.')
  }
}

// --- Implementation Handoff (VS-110) -------------------------------------

export function implementationHandoffTool(
  root: string,
  args: { workItemId: string },
): ToolResult {
  try {
    const handoff = buildImplementationHandoff(root, args.workItemId)
    return ok(handoff)
  } catch (err) {
    if (err instanceof WorkItemNotFoundError) return fail(err.message)
    if (err instanceof WorkItemNotReadyError) return fail(err.message)
    return fail('Implementation handoff failed.')
  }
}

// --- Evidence Collection (VS-111) ----------------------------------------

export function collectEvidenceTool(
  root: string,
  args: { workItemId: string; evidence: CollectEvidenceInput },
): ToolResult {
  try {
    const result = collectImplementationEvidence(root, args.workItemId, args.evidence)
    return ok({ workItemId: args.workItemId, evidence: result })
  } catch (err) {
    if (err instanceof WorkItemNotFoundError) return fail(err.message)
    if (err instanceof WorkItemNotInProgressError) return fail(err.message)
    return fail('Evidence collection failed.')
  }
}

// --- Work Item Verification (VS-111) ------------------------------------

export function verifyWorkItemTool(
  root: string,
  args: { workItemId: string; evidence: CollectEvidenceInput },
): ToolResult {
  try {
    const verification = verifyWorkItem(root, args.workItemId, args.evidence)
    const evaluation = evaluateCompletion(verification)
    return ok({ verification, evaluation })
  } catch (err) {
    if (err instanceof WorkItemNotFoundError) return fail(err.message)
    if (err instanceof WorkItemNotInProgressError) return fail(err.message)
    return fail('Work Item verification failed.')
  }
}

// --- Telemetry (WI-016) ---------------------------------------------------

export function telemetryStatusTool(root: string): ToolResult {
  const status = getTelemetryStatus(root)
  const result: Record<string, unknown> = {
    consent: status.consent,
    registered: status.registered,
    pendingEvents: status.pendingEvents,
  }
  if (status.consent === 'unset' && !isDeferralActive(root)) {
    result.notice = consentNotice()
  }
  return ok(result)
}

export function setTelemetryConsentTool(
  root: string,
  args: { consent: string; confirm?: boolean },
): ToolResult {
  const valid = ['enabled', 'disabled', 'not-now']
  if (!valid.includes(args.consent)) {
    return fail(`consent must be one of: ${valid.join(', ')}`)
  }

  if (!args.confirm) {
    const preview: Record<string, string> = {
      action: args.consent,
      effect:
        args.consent === 'enabled'
          ? 'Anonymous usage telemetry will be activated. Kaddo will send command usage, version, and lifecycle events to telemetry.kaddo.org. No source code, knowledge, prompts or PII is ever transmitted.'
          : args.consent === 'disabled'
            ? 'Telemetry will be permanently disabled. No data will be sent. Kaddo will not ask again.'
            : 'Consent decision deferred for 24 hours. Telemetry remains inactive. Kaddo will remind again after the deferral expires.',
      instruction: 'Call again with confirm=true to apply.',
    }
    return ok(preview)
  }

  if (args.consent === 'not-now') {
    deferConsent(root)
    return ok({ applied: true, consent: 'unset', deferred: true, message: 'Consent deferred for 24 hours.' })
  }

  const consent = args.consent as 'enabled' | 'disabled'
  persistConsent(root, consent)
  return ok({ applied: true, consent, message: `Telemetry ${consent}.` })
}

// Project Resources (WI-031) — read-only. Never connects to the system; never exposes secret values.
export function listResourcesTool(root: string): ToolResult {
  return ok(getResources(root))
}

export function getResourceTool(root: string, id: string): ToolResult {
  const resource = getResource(root, id)
  if (!resource) return fail(`Project Resource "${id}" not found.`)
  return ok(resource)
}

// --- Project Resource mutations (WI-038) — LLM proposes, human confirms, Core persists. ----------
// No surface writes Markdown itself; all go through the WI-036 Core contract. Never stores secrets.

type ResourceArgs = {
  title?: string
  resource_type?: string
  provider?: string
  environments?: string[]
  scope?: string
  module?: string
  modules?: string[]
  purpose?: string
  access_interfaces?: { type: string; tool?: string; provider?: string; purpose?: string; operations?: string[]; environments?: string[]; constraints?: string }[]
  authentication?: { mode?: string; refs?: string[] }
}

function toResourceInput(args: ResourceArgs): ResourceInput {
  const input: ResourceInput = {}
  if (args.title != null) input.title = args.title
  if (args.resource_type != null) input.resourceType = args.resource_type
  if (args.provider != null) input.provider = args.provider
  if (args.environments != null) input.environments = args.environments
  if (args.scope != null || args.module != null) {
    const type = args.scope || (args.module ? 'module' : 'system')
    input.scope = type === 'module' ? { type: 'module', module: args.module ?? null } : { type: 'system' }
  }
  if (args.modules != null) input.modules = args.modules
  if (args.purpose != null) input.purpose = args.purpose
  if (args.access_interfaces != null) input.accessInterfaces = args.access_interfaces
  if (args.authentication != null) input.authentication = args.authentication
  return input
}

export function createResourceTool(root: string, args: ResourceArgs, confirm?: boolean): ToolResult {
  const input = toResourceInput(args)
  const findings = validateResource(root, input)
  if (!confirm) {
    return ok({ status: 'needs_confirmation', action: 'create', proposal: input, findings, message: 'Re-call with confirm=true to create this resource.' })
  }
  try {
    return ok({ status: 'created', ...createResource(root, input) })
  } catch (e) {
    return fail(e instanceof ResourceWriteError ? e.message : String(e))
  }
}

export function updateResourceTool(root: string, id: string, args: ResourceArgs, confirm?: boolean): ToolResult {
  if (!getResource(root, id)) return fail(`Project Resource "${id}" not found.`)
  const input = toResourceInput(args)
  const findings = validateResource(root, input)
  if (!confirm) {
    return ok({ status: 'needs_confirmation', action: 'update', id, changes: input, findings, message: 'Re-call with confirm=true to apply this update.' })
  }
  try {
    return ok({ status: 'updated', ...updateResource(root, id, input) })
  } catch (e) {
    return fail(e instanceof ResourceWriteError ? e.message : String(e))
  }
}

export function deleteResourceTool(root: string, id: string, confirm?: boolean): ToolResult {
  if (!getResource(root, id)) return fail(`Project Resource "${id}" not found.`)
  if (!confirm) {
    const references = getResourceReferences(root, id)
    return ok({ status: 'needs_confirmation', action: 'delete', id, references, message: 'Re-call with confirm=true to delete. References in other artifacts are NOT removed.' })
  }
  try {
    return ok({ status: 'deleted', ...deleteResource(root, id, { confirm: true }) })
  } catch (e) {
    return fail(e instanceof ResourceWriteError ? e.message : String(e))
  }
}
