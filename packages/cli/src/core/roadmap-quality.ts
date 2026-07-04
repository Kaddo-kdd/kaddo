// Roadmap grounding quality (VS-077).
//
// A roadmap candidate should not be a loose idea — it should be traceable to a capability domain, a
// related capability and a source signal (gap / risk / decision / business goal). This deterministic
// parser inspects `knowledge/delivery/roadmap.md` and reports how many candidates are grounded. No
// LLM, no writes. Tolerant of both `- Key:` bullet fields and `**Key:**` bold fields.

import { exists, readFile, join } from '../utils/fs.js'

const ROADMAP_PATH = 'knowledge/delivery/roadmap.md'
// A candidate initiative heading, e.g. `### RM-001 — Stabilize PRO Subscription Launch`.
const INITIATIVE_RE = /^#{2,4}\s+(RM-[\w.-]+)\s*[:\-–]?\s*(.*)$/

export type RoadmapCandidateQuality = {
  id: string
  title: string
  hasRelatedDomain: boolean
  hasRelatedCapability: boolean
  hasSourceSignals: boolean
  grounded: boolean
}

export type RoadmapQuality = {
  candidates: number
  grounded: number
  with_related_domain: number
  with_related_capability: number
  with_source_signals: number
  needs_refinement: boolean
  items: RoadmapCandidateQuality[]
}

/** A field is "present" when its label appears with an inline value or with sub-bullet content. */
function fieldPresent(lines: string[], label: RegExp): boolean {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(new RegExp(`^\\s*[-*]?\\s*(?:\\*\\*)?\\s*(${label.source})\\s*(?:\\*\\*)?\\s*:\\s*(.*)$`, 'i'))
    if (!m) continue
    const inline = m[2].trim()
    if (inline) return true
    // Otherwise look for an indented sub-bullet with real content on a following line.
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s{2,}[-*]\s+\S/.test(lines[j])) return true
      if (/^\S/.test(lines[j]) || /^#{2,4}\s/.test(lines[j])) break
      if (/^\s*[-*]\s+\S/.test(lines[j]) && !/^\s{2,}/.test(lines[j])) break
    }
  }
  return false
}

/** Parse each `### RM-xxx` candidate and check grounding fields. */
export function parseRoadmapCandidateQuality(md: string): RoadmapCandidateQuality[] {
  const lines = md.split(/\r?\n/)
  const items: RoadmapCandidateQuality[] = []
  let cur: { id: string; title: string; lines: string[] } | null = null
  const flush = () => {
    if (!cur) return
    const hasRelatedDomain = fieldPresent(cur.lines, /related domain/)
    const hasRelatedCapability = fieldPresent(cur.lines, /related capabilit(?:y|ies)/)
    const hasSourceSignals = fieldPresent(cur.lines, /source signals?/)
    items.push({
      id: cur.id,
      title: cur.title,
      hasRelatedDomain,
      hasRelatedCapability,
      hasSourceSignals,
      grounded: hasRelatedDomain && hasRelatedCapability && hasSourceSignals,
    })
    cur = null
  }
  for (const line of lines) {
    const m = line.match(INITIATIVE_RE)
    if (m) {
      flush()
      cur = { id: m[1], title: m[2].trim(), lines: [] }
      continue
    }
    if (cur) cur.lines.push(line)
  }
  flush()
  return items
}

/** Build the roadmap quality snapshot for a project (empty when no roadmap or no candidates). */
export function buildRoadmapQuality(dir: string): RoadmapQuality {
  let md = ''
  const p = join(dir, ROADMAP_PATH)
  if (exists(p)) {
    try {
      md = readFile(p)
    } catch {
      md = ''
    }
  }
  const items = parseRoadmapCandidateQuality(md)
  const count = (pred: (i: RoadmapCandidateQuality) => boolean) => items.filter(pred).length
  const grounded = count((i) => i.grounded)
  return {
    candidates: items.length,
    grounded,
    with_related_domain: count((i) => i.hasRelatedDomain),
    with_related_capability: count((i) => i.hasRelatedCapability),
    with_source_signals: count((i) => i.hasSourceSignals),
    // Only "needs refinement" when there are candidates and at least one isn't grounded.
    needs_refinement: items.length > 0 && grounded < items.length,
    items,
  }
}
