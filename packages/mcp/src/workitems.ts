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
}

const VALID_SOURCES = new Set(['manual', 'roadmap', 'jira', 'github', 'notion', 'xlsx', 'csv', 'api', 'external', 'unknown'])

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function parseSource(data: Record<string, unknown>): WorkItemSourceMeta {
  const raw = data.source ? String(data.source) : ''
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
    items.push({
      id: String(data.id ?? '') || rel,
      title: String(data.title ?? ''),
      status: lifecycleOf(data, rel),
      type: String(data.type ?? ''),
      knowledge_level: String(data.knowledge_level ?? ''),
      path: rel,
      summary: String(data.summary ?? '') || firstParagraph(parsed.content),
      code: strArray(data.code),
      capabilities: strArray(data.capabilities),
      decisions: strArray(data.decisions),
      capsules: strArray(data.capsules),
      source: parseSource(data),
    })
  }
  return items.sort((a, b) => a.id.localeCompare(b.id))
}

export function isActiveStatus(status: string): boolean {
  return ACTIVE_STATES.has(status)
}
