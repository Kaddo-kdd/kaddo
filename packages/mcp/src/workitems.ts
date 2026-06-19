// Work Item discovery for the MCP server (VS-057).
//
// Reads + summarizes Work Items under knowledge/delivery/work-items/** by front matter only.
// Never reads source code. Mirrors the CLI's lifecycle resolution at a summary level.

import matter from 'gray-matter'
import { listFiles, readText } from './project.js'

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
    })
  }
  return items.sort((a, b) => a.id.localeCompare(b.id))
}

export function isActiveStatus(status: string): boolean {
  return ACTIVE_STATES.has(status)
}
