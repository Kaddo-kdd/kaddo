// Read-only MCP tools (VS-057).
//
// Each tool returns a plain JS value (string/object). The server wraps it as MCP content. Tools
// only read project knowledge — they never modify files, run git or call an LLM.

import { listWorkItems, type WorkItemSummary } from './workitems.js'
import { listCapsules, getCapsule, listAgents, getAgentPrompt } from './catalog.js'
import { listSkills, getSkill } from './skills.js'
import { readJson, readText } from './project.js'

export type ToolResult = { ok: true; data: unknown } | { ok: false; message: string }

const ok = (data: unknown): ToolResult => ({ ok: true, data })
const fail = (message: string): ToolResult => ({ ok: false, message })

// --- kaddo_project_status -------------------------------------------------

type ExplainJson = {
  project?: { name?: string; state?: string }
  knowledge?: Record<string, unknown>
  workItems?: { total?: number; byState?: Record<string, number>; byType?: Record<string, number> }
  ownership?: { workItemsWithOwnership?: number; workItemsTotal?: number }
  layers?: { layer: string; status: string }[]
}

type GraphHintsJson = { quality?: string; summary?: { hints?: number } }

export function projectStatus(root: string): ToolResult {
  const explain = readJson<ExplainJson>(root, '.kaddo/explain.json')
  const hints = readJson<GraphHintsJson>(root, '.kaddo/graph-hints.json')
  const capsules = listCapsules(root)

  if (!explain) {
    return fail('Project status needs `.kaddo/explain.json`. Run `kaddo explain` first.')
  }

  const maturity = (explain.layers ?? []).map((l) => `${l.layer}: ${l.status}`)
  return ok({
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
    graphQuality: hints?.quality ?? 'unknown (run `kaddo graph export`)',
    graphHints: hints?.summary?.hints ?? 0,
    capsules: capsules.length,
  })
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
type GraphHintsReport = { quality?: string; summary?: unknown; hints?: GraphHint[] }

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
  return ok({ quality: report.quality ?? 'unknown', count: hints.length, hints })
}
