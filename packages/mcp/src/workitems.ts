// Work Item discovery for the MCP server (VS-057).
//
// Reads + summarizes Work Items under knowledge/delivery/work-items/** by front matter only.
// Never reads source code. Mirrors the CLI's lifecycle resolution at a summary level.

import matter from 'gray-matter'
import { listFiles, readText } from './project.js'

export type WorkItemSourceMeta = {
  type: string
  id?: string
  title?: string
  url?: string
  provider?: string
  inferred: boolean
}

export type WorkItemReadiness = {
  readyCandidate: boolean
  warnings: string[]
  recommendedAction?: string
}

export type WorkItemSummary = {
  id: string
  title: string
  status: string
  type: string
  knowledge_level: string
  path: string
  summary: string
  code: string[]
  capabilities: string[]
  decisions: string[]
  capsules: string[]
  source: WorkItemSourceMeta
  domains: string[]
  readiness?: WorkItemReadiness
  implementation_status?: string
  validation_status?: string
  release_status?: string
  affected_modules?: string[]
  refined_by?: string
  implemented_by?: string
  closed_by?: string
  release_gates?: { id: string; status: string; reason?: string }[]
  completion_exceptions?: { id: string; status: string; reason?: string }[]
  scope_confidence?: { level: string; reasons: string[] }
  module_coverage?: Record<string, { status: string; reason?: string }>
  impact_analysis?: Record<string, { status: string; reason?: string }>
  scope_unknowns?: string[]
}

const VALID_SOURCES = new Set(['manual', 'roadmap', 'jira', 'github', 'notion', 'xlsx', 'csv', 'api', 'external', 'unknown'])

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function parseSource(data: Record<string, unknown>): WorkItemSourceMeta {
  const rawSource = data.source
  if (rawSource != null && typeof rawSource === 'object' && !Array.isArray(rawSource)) {
    const obj = rawSource as Record<string, unknown>
    const t = optStr(obj.type)
    const type = t && VALID_SOURCES.has(t) ? t : 'unknown'
    return { type, id: optStr(obj.id) ?? optStr(data.source_id), title: optStr(obj.title) ?? optStr(data.source_title), url: optStr(obj.url) ?? optStr(data.source_url), provider: optStr(obj.provider) ?? optStr(data.source_provider), inferred: obj.inferred === true || obj.inferred === 'true' }
  }
  const raw = rawSource ? String(rawSource) : ''
  if (raw && VALID_SOURCES.has(raw)) {
    return { type: raw, id: optStr(data.source_id), title: optStr(data.source_title), url: optStr(data.source_url), provider: optStr(data.source_provider), inferred: false }
  }
  if (data.source_work_item_candidate || data.source_roadmap_initiative) {
    return { type: 'roadmap', id: optStr(data.source_id) ?? optStr(data.source_work_item_candidate), title: optStr(data.source_initiative_title), inferred: true }
  }
  return { type: 'unknown', inferred: true }
}

const ACTIVE_STATES = new Set(['draft', 'ready', 'in-progress', 'blocked'])

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []
}

/** Lifecycle status from front matter `status`, falling back to the parent folder name. */
function lifecycleOf(data: Record<string, unknown>, relPath: string): string {
  const status = String(data.status ?? '').trim()
  if (status) return status
  const segs = relPath.split('/')
  const folder = segs[segs.length - 2]
  return ACTIVE_STATES.has(folder) || folder === 'completed' || folder === 'archived'
    ? folder
    : 'ready'
}

function firstParagraph(body: string): string {
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim()
    if (t && !t.startsWith('#') && !t.startsWith('>')) return t.replace(/\s+/g, ' ')
  }
  return ''
}

const VALID_COVERAGE_STATUSES = new Set(['affected', 'reviewed-not-affected', 'unknown', 'not-applicable'])

function parseScopeMeta(data: Record<string, unknown>): Partial<WorkItemSummary> {
  const result: Partial<WorkItemSummary> = {}
  const sc = data.scope_confidence
  if (sc && typeof sc === 'object' && !Array.isArray(sc)) {
    const obj = sc as Record<string, unknown>
    const level = String(obj.level ?? '')
    if (['high', 'medium', 'low'].includes(level)) {
      result.scope_confidence = { level, reasons: Array.isArray(obj.reasons) ? obj.reasons.map(String) : [] }
    }
  }
  const mc = data.module_coverage
  if (mc && typeof mc === 'object' && !Array.isArray(mc)) {
    const parsed: Record<string, { status: string; reason?: string }> = {}
    const unknowns: string[] = []
    for (const [id, val] of Object.entries(mc as Record<string, unknown>)) {
      if (!val || typeof val !== 'object' || Array.isArray(val)) continue
      const v = val as Record<string, unknown>
      const status = String(v.status ?? '')
      if (!VALID_COVERAGE_STATUSES.has(status)) continue
      parsed[id] = { status, ...(v.reason ? { reason: String(v.reason) } : {}) }
      if (status === 'unknown') unknowns.push(id)
    }
    if (Object.keys(parsed).length > 0) result.module_coverage = parsed
    if (unknowns.length > 0) result.scope_unknowns = unknowns
  }
  const ia = data.impact_analysis
  if (ia && typeof ia === 'object' && !Array.isArray(ia)) {
    const surfaces = (ia as Record<string, unknown>).surfaces
    if (surfaces && typeof surfaces === 'object' && !Array.isArray(surfaces)) {
      const parsed: Record<string, { status: string; reason?: string }> = {}
      for (const [id, val] of Object.entries(surfaces as Record<string, unknown>)) {
        if (!val || typeof val !== 'object' || Array.isArray(val)) continue
        const v = val as Record<string, unknown>
        const status = String(v.status ?? '')
        if (!VALID_COVERAGE_STATUSES.has(status)) continue
        parsed[id] = { status, ...(v.reason ? { reason: String(v.reason) } : {}) }
      }
      if (Object.keys(parsed).length > 0) result.impact_analysis = parsed
    }
  }
  return result
}

/** Discover and summarize all Work Items in the project. */
export function listWorkItems(root: string): WorkItemSummary[] {
  const files = listFiles(root, 'knowledge/delivery/work-items', '.md')
  const items: WorkItemSummary[] = []
  for (const rel of files) {
    const raw = readText(root, rel)
    if (raw === null) continue
    let parsed
    try {
      parsed = matter(raw)
    } catch {
      continue
    }
    const data = parsed.data as Record<string, unknown>
    if (!data.type) continue // only typed Work Items
    const status = lifecycleOf(data, rel)
    const code = strArray(data.code)
    const domains = strArray(data.domains)
    const source = parseSource(data)
    const readiness = status === 'draft' ? assessReadiness(data, parsed.content, code, domains, source) : undefined
    items.push({
      id: String(data.id ?? '') || rel,
      title: String(data.title ?? ''),
      status,
      type: String(data.type ?? ''),
      knowledge_level: String(data.knowledge_level ?? ''),
      path: rel,
      summary: String(data.summary ?? '') || firstParagraph(parsed.content),
      code,
      capabilities: strArray(data.capabilities),
      decisions: strArray(data.decisions),
      capsules: strArray(data.capsules),
      source,
      domains,
      readiness,
      ...(data.implementation_status ? { implementation_status: String(data.implementation_status) } : {}),
      ...(data.validation_status ? { validation_status: String(data.validation_status) } : {}),
      ...(data.release_status ? { release_status: String(data.release_status) } : {}),
      ...(Array.isArray(data.affected_modules) && data.affected_modules.length > 0
        ? { affected_modules: data.affected_modules.map(String) } : {}),
      ...(data.refined_by ? { refined_by: String(data.refined_by) } : {}),
      ...(data.implemented_by ? { implemented_by: String(data.implemented_by) } : {}),
      ...(data.closed_by ? { closed_by: String(data.closed_by) } : {}),
      ...(Array.isArray(data.release_gates) && data.release_gates.length > 0
        ? { release_gates: data.release_gates as { id: string; status: string; reason?: string }[] } : {}),
      ...(Array.isArray(data.completion_exceptions) && data.completion_exceptions.length > 0
        ? { completion_exceptions: data.completion_exceptions as { id: string; status: string; reason?: string }[] } : {}),
      ...parseScopeMeta(data),
    })
  }
  return items.sort((a, b) => a.id.localeCompare(b.id))
}

export function isActiveStatus(status: string): boolean {
  return ACTIVE_STATES.has(status)
}

function assessReadiness(data: Record<string, unknown>, content: string, code: string[], domains: string[], source: WorkItemSourceMeta): WorkItemReadiness {
  const body = content.trim()
  const lower = body.toLowerCase()
  const warnings: string[] = []

  if (domains.length === 0) warnings.push('No domains declared.')
  if (code.length === 0) warnings.push('No code ownership globs declared.')
  if (!/## acceptance criteria|## criterios de aceptación/i.test(body)) warnings.push('No acceptance criteria section found.')
  if (!/## validation|## validación/i.test(body)) warnings.push('No validation section found.')

  const oqMatch = body.match(/## (?:open questions|preguntas abiertas)\s*\n([\s\S]*?)(?=\n##|\n*$)/i)
  if (oqMatch) {
    const oqText = oqMatch[1].trim().toLowerCase()
    if (oqText && !/^(none|ninguna|resolved|resueltas|deferred|diferidas)\.?$/i.test(oqText)) {
      warnings.push('Open questions are still present.')
    }
  }

  const hasRefinedBy = Boolean(data.refined_by)
  const readyCandidate = hasRefinedBy && warnings.length === 0

  return {
    readyCandidate,
    warnings,
    recommendedAction: readyCandidate ? 'mark_work_item_ready' : undefined,
  }
}
