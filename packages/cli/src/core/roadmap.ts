// Deterministic parser for the roadmap-agent output (knowledge/delivery/roadmap.md).
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

// ---------------------------------------------------------------------------
// Flexible parsing (VS flexible-roadmap-parsing): recognize Work Item candidates across
// reasonable human/agent roadmap formats — tables, bullets, checklists, mixed initiatives —
// when the strict VS-010 parser finds nothing. Still deterministic; never calls an LLM.
// ---------------------------------------------------------------------------

const WI_ID_RE = /\bWI-[A-Za-z0-9-]*\d/
const HEADING_RE = /^#{2,4}\s+(.*)$/
// A bullet or checklist line: "- [ ] WI-001 Title", "- WI-001: Title", "- WI-001 — Title".
const FLEX_BULLET_RE = /^\s*[-*]\s+(?:\[[ xX]?\]\s+)?(WI-[A-Za-z0-9-]*\d)\b[\s:.\-–)]*\s*(.*)$/
const SEPARATOR_CELL_RE = /^:?-{2,}:?$/

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => SEPARATOR_CELL_RE.test(c) || c === '')
}

function initiativeFromHeading(text: string): RoadmapInitiative {
  const rm = text.match(/^(RM-[\w.-]+)\s*[:\-–]?\s*(.*)$/)
  if (rm) return { id: rm[1], title: rm[2].trim() || undefined }
  return { title: text.trim() || undefined }
}

function extractDeps(cell: string | undefined): string[] | undefined {
  if (!cell) return undefined
  const ids = cell.match(/WI-[A-Za-z0-9-]*\d/g)
  return ids && ids.length ? [...new Set(ids)] : undefined
}

/** Flexible scan used when the strict parser yields nothing. */
function parseFlexible(markdown: string): RoadmapCandidateWorkItem[] {
  const out: RoadmapCandidateWorkItem[] = []
  const seen = new Set<string>()
  let initiative: RoadmapInitiative | undefined
  let cols: { id: number; title: number; deps: number } | null = null

  const push = (id: string, title: string, deps: string[] | undefined, raw: string) => {
    if (seen.has(id)) return
    seen.add(id)
    out.push({
      id,
      title: title.trim() || id,
      dependencies: deps,
      initiative: initiative?.id || initiative?.title ? { ...initiative } : undefined,
      rawMarkdown: raw.trim(),
    })
  }

  for (const line of markdown.split(/\r?\n/)) {
    const h = line.match(HEADING_RE)
    if (h) {
      initiative = initiativeFromHeading(h[1])
      cols = null
      continue
    }

    if (line.includes('|')) {
      const cells = splitRow(line)
      if (isSeparatorRow(cells)) continue
      // Header row: locate the id / title / depends-on columns.
      const lower = cells.map((c) => c.toLowerCase())
      const idIdx = lower.findIndex((c) => c === 'id' || c === 'wi' || c === 'work item id')
      if (idIdx >= 0 && !WI_ID_RE.test(line)) {
        cols = {
          id: idIdx,
          title: lower.findIndex((c) => /work item|title|item|name|description/.test(c)),
          deps: lower.findIndex((c) => /depend/.test(c)),
        }
        continue
      }
      // Data row with a WI id.
      if (WI_ID_RE.test(line)) {
        let idCell = cols && cols.id >= 0 ? cells[cols.id] : cells.find((c) => /^WI-/.test(c))
        const idMatch = (idCell ?? line).match(/WI-[A-Za-z0-9-]*\d/)
        if (!idMatch) continue
        const id = idMatch[0]
        const title =
          cols && cols.title >= 0 ? cells[cols.title] ?? '' : cells.find((c) => !/^WI-/.test(c) && c) ?? ''
        const deps = cols && cols.deps >= 0 ? extractDeps(cells[cols.deps]) : undefined
        push(id, title, deps, line)
        continue
      }
      continue
    }

    const b = line.match(FLEX_BULLET_RE)
    if (b) {
      push(b[1], b[2] ?? '', undefined, line)
      continue
    }
  }
  return out
}

/**
 * Parse candidate work items from `knowledge/delivery/roadmap.md`. Tries the strict VS-010
 * format first (back-compat); if no candidates are found, falls back to flexible recognition
 * (tables, bullets, checklists, mixed initiatives). Returns [] when nothing is recognized.
 */
export function parseRoadmapCandidates(markdown: string): RoadmapCandidateWorkItem[] {
  const strict = splitInitiatives(markdown).flatMap(parseBlock)
  if (strict.length > 0) return strict
  return parseFlexible(markdown)
}

export type RoadmapStats = {
  present: boolean
  candidates: number
  materialized: number
  remaining: number
}

/** Roadmap candidate vs materialized stats for explain/context. */
export function roadmapStats(markdown: string | null, materialized: number): RoadmapStats {
  if (markdown == null) return { present: false, candidates: 0, materialized, remaining: 0 }
  const candidates = parseRoadmapCandidates(markdown).length
  return { present: true, candidates, materialized, remaining: Math.max(0, candidates - materialized) }
}
