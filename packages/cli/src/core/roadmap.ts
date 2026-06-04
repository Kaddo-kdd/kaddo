// Deterministic parser for the roadmap-agent output (knowledge/roadmap.md).
//
// VS-009 standardized the roadmap format. This parser extracts candidate work items so the
// CLI can turn them into real Work Items (`kaddo create --from roadmap`). It is a simple,
// line-based parser — no markdown AST — kept deliberately aligned with the roadmap-agent
// prompt. It never calls an LLM.

export type RoadmapInitiative = {
  id?: string
  title?: string
}

export type RoadmapCandidateWorkItem = {
  /** Candidate id, e.g. "WI-CANDIDATE-001" */
  id: string
  title: string
  type?: string
  suggestedKnowledgeLevel?: string
  expectedValue?: string
  notes?: string
  initiative?: RoadmapInitiative
  relatedCapabilities?: string[]
  domain?: string
  impact?: string
  risk?: string
  dependencies?: string[]
  openQuestions?: string[]
  /** Raw markdown excerpt for the candidate, kept as fallback context. */
  rawMarkdown: string
}

const INITIATIVE_RE = /^#{2,4}\s+(RM-[\w.-]+)\s*[:\-–]?\s*(.*)$/
const FIELD_RE = /^\*\*(.+?):\*\*\s*(.*)$/
// A candidate list item: "- WI-CANDIDATE-001: Title" (any WI-* id).
const CANDIDATE_RE = /^\s*[-*]\s+(WI-[\w-]+)\s*[:\-–]\s*(.+)$/
// A nested property under a candidate: "  - key: value".
const PROPERTY_RE = /^\s+[-*]\s+([\w /]+?)\s*:\s*(.+)$/
// A plain bullet (used for related capabilities / dependencies / open questions lists).
const BULLET_RE = /^\s*[-*]\s+(.+)$/

function normalizeKey(key: string): string {
  return key.trim().toLowerCase()
}

type InitiativeBlock = {
  initiative: RoadmapInitiative
  lines: string[]
}

/** Split the roadmap into per-initiative blocks. Content before the first initiative is dropped. */
function splitInitiatives(markdown: string): InitiativeBlock[] {
  const blocks: InitiativeBlock[] = []
  let current: InitiativeBlock | null = null

  for (const line of markdown.split(/\r?\n/)) {
    const m = line.match(INITIATIVE_RE)
    if (m) {
      if (current) blocks.push(current)
      current = { initiative: { id: m[1], title: m[2].trim() || undefined }, lines: [] }
      continue
    }
    if (current) current.lines.push(line)
  }
  if (current) blocks.push(current)
  return blocks
}

type BlockMeta = {
  relatedCapabilities: string[]
  domain?: string
  impact?: string
  risk?: string
  dependencies: string[]
  openQuestions: string[]
}

/** Parse one initiative block into its metadata and candidate work items. */
function parseBlock(block: InitiativeBlock): RoadmapCandidateWorkItem[] {
  const meta: BlockMeta = { relatedCapabilities: [], dependencies: [], openQuestions: [] }
  const rawCandidates: RoadmapCandidateWorkItem[] = []

  let listField: 'relatedCapabilities' | 'dependencies' | 'openQuestions' | null = null
  let inCandidateSection = false
  let current: RoadmapCandidateWorkItem | null = null

  const flush = () => {
    if (current) {
      current.rawMarkdown = current.rawMarkdown.trimEnd()
      rawCandidates.push(current)
      current = null
    }
  }

  for (const line of block.lines) {
    // Candidate work item line.
    const candMatch = line.match(CANDIDATE_RE)
    if (candMatch && inCandidateSection) {
      flush()
      current = { id: candMatch[1], title: candMatch[2].trim(), rawMarkdown: line.trim() + '\n' }
      listField = null
      continue
    }

    // Nested property under the current candidate.
    if (current) {
      const propMatch = line.match(PROPERTY_RE)
      if (propMatch) {
        current.rawMarkdown += line.trim() + '\n'
        const key = normalizeKey(propMatch[1])
        const value = propMatch[2].trim()
        if (key === 'type') current.type = value
        else if (key === 'suggested knowledge level' || key === 'knowledge level')
          current.suggestedKnowledgeLevel = value
        else if (key === 'expected value') current.expectedValue = value
        else if (key === 'notes') current.notes = value
        continue
      }
      if (line.trim() === '') {
        flush()
        continue
      }
    }

    // Field headings (initiative-level metadata).
    const fieldMatch = line.match(FIELD_RE)
    if (fieldMatch) {
      const key = normalizeKey(fieldMatch[1])
      const value = fieldMatch[2].trim()
      listField = null
      inCandidateSection = false
      if (key === 'candidate work items') {
        inCandidateSection = true
      } else if (key === 'impact') {
        meta.impact = value || undefined
      } else if (key === 'risk') {
        meta.risk = value || undefined
      } else if (key === 'project area / domain' || key === 'domain' || key === 'project area') {
        meta.domain = value || undefined
      } else if (key === 'related capabilities') {
        listField = 'relatedCapabilities'
        if (value) meta.relatedCapabilities.push(value)
      } else if (key === 'dependencies') {
        listField = 'dependencies'
        if (value) meta.dependencies.push(value)
      } else if (key === 'open questions') {
        listField = 'openQuestions'
        if (value) meta.openQuestions.push(value)
      }
      continue
    }

    // Bullets feeding an initiative-level list.
    if (listField) {
      const bulletMatch = line.match(BULLET_RE)
      if (bulletMatch) {
        const item = bulletMatch[1].trim().replace(/^candidate\s*:\s*/i, '')
        meta[listField].push(item)
        continue
      }
      if (line.trim() === '') {
        listField = null
        continue
      }
    }
  }
  flush()

  // Attach the fully-parsed initiative metadata to every candidate in the block.
  return rawCandidates.map((c) => ({
    ...c,
    initiative:
      block.initiative.id || block.initiative.title ? { ...block.initiative } : undefined,
    relatedCapabilities: meta.relatedCapabilities.length ? [...meta.relatedCapabilities] : undefined,
    domain: meta.domain,
    impact: meta.impact,
    risk: meta.risk,
    dependencies: meta.dependencies.length ? [...meta.dependencies] : undefined,
    openQuestions: meta.openQuestions.length ? [...meta.openQuestions] : undefined,
  }))
}

/**
 * Parse candidate work items from a roadmap-agent generated `knowledge/roadmap.md`.
 * Returns an empty array if no candidates can be found.
 */
export function parseRoadmapCandidates(markdown: string): RoadmapCandidateWorkItem[] {
  return splitInitiatives(markdown).flatMap(parseBlock)
}
