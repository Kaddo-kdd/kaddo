// Initiative write operations (WI-018).
//
// Deterministic writes for the Initiative lifecycle: create, transition, add/ materialize candidates,
// and materialize a roadmap initiative (RM-xxx) into a first-class Initiative (INI-xxx). No LLM, no
// git. Reads/model live in initiative.ts. Work Item generation here produces a normal draft Work
// Item carrying an explicit `initiative: INI-xxx` association.

import matter from 'gray-matter'
import { exists, readFile, readDir, writeFile, join, isFile, ensureDir } from '../utils/fs.js'
import {
  INITIATIVES_DIR,
  discoverInitiatives,
  getInitiative,
  nextInitiativeId,
  parseInitiative,
  isValidInitiativeStatus,
  isValidInitiativeTransition,
  type Initiative,
  type InitiativeStatus,
  type InitiativeCandidate,
  type InitiativeExternalLink,
} from './initiative.js'
import { parseRoadmapCandidates } from './roadmap.js'

const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'
const DRAFT_DIR = `${WORK_ITEMS_DIR}/draft`
const ROADMAP_PATH = 'knowledge/delivery/roadmap.md'

export class InitiativeWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitiativeWriteError'
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export type CandidateInput = {
  id?: string
  title: string
  type?: string
  suggestedKnowledgeLevel?: string
  expectedValue?: string
  notes?: string
  sourceSignals?: string[]
  dependencies?: string[]
  materializedAs?: string | null
}

function candidateToData(c: InitiativeCandidate): Record<string, unknown> {
  const out: Record<string, unknown> = { id: c.id, title: c.title }
  if (c.type) out.type = c.type
  if (c.suggestedKnowledgeLevel) out.suggested_knowledge_level = c.suggestedKnowledgeLevel
  if (c.expectedValue) out.expected_value = c.expectedValue
  if (c.notes) out.notes = c.notes
  if (c.sourceSignals.length) out.source_signals = c.sourceSignals
  if (c.dependencies.length) out.dependencies = c.dependencies
  if (c.materializedAs) out.materialized_as = c.materializedAs
  return out
}

function externalLinkToData(l: InitiativeExternalLink): Record<string, unknown> {
  const out: Record<string, unknown> = { integration: l.integration, external_id: l.externalId }
  if (l.externalType) out.external_type = l.externalType
  if (l.url) out.url = l.url
  return out
}

function normalizeCandidate(input: CandidateInput, fallbackId: string): InitiativeCandidate {
  return {
    id: input.id?.trim() || fallbackId,
    title: input.title.trim(),
    type: input.type?.trim() || undefined,
    suggestedKnowledgeLevel: input.suggestedKnowledgeLevel?.trim() || undefined,
    expectedValue: input.expectedValue?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    sourceSignals: input.sourceSignals ?? [],
    dependencies: input.dependencies ?? [],
    materializedAs: input.materializedAs ?? null,
  }
}

function defaultBody(title: string): string {
  return [
    `# ${title}`,
    '',
    '## Goal',
    '',
    '_What outcome does this Initiative pursue?_',
    '',
    '## Expected Value',
    '',
    '_Why it matters._',
    '',
    '## Scope',
    '',
    '_What this Initiative covers._',
    '',
    '## Out of Scope',
    '',
    '_What it explicitly does not cover._',
    '',
    '## Success Criteria',
    '',
    '_Observable outcomes that define completion (not just "all Work Items done")._',
    '',
    '## Dependencies',
    '',
    '_Other Initiatives, modules, or external work this depends on._',
    '',
    '## Work Item Candidates',
    '',
    '_Candidates live in frontmatter `candidates`; summarize them here as they evolve._',
    '',
    '## Open Questions',
    '',
    '_Unresolved questions for this Initiative._',
    '',
    '## Learning',
    '',
    '_Captured on completion: what was delivered, what stayed out of scope, outcome reached._',
    '',
  ].join('\n')
}

export type CreateInitiativeInput = {
  title: string
  status?: InitiativeStatus
  horizon?: string
  priority?: string
  knowledgeLevel?: string
  domains?: string[]
  relatedCapabilities?: string[]
  source?: string
  sourceId?: string
  candidates?: CandidateInput[]
  externalLinks?: InitiativeExternalLink[]
  body?: string
}

function buildInitiativeContent(id: string, input: CreateInitiativeInput): string {
  const status: InitiativeStatus = input.status ?? 'planned'
  if (!isValidInitiativeStatus(status)) {
    throw new InitiativeWriteError(`Invalid initiative status: ${status}.`)
  }
  const candidates = (input.candidates ?? []).map((c, i) =>
    normalizeCandidate(c, `WI-CANDIDATE-${String(i + 1).padStart(3, '0')}`),
  )
  const data: Record<string, unknown> = {
    type: 'initiative',
    id,
    title: input.title.trim(),
    status,
    knowledge_level: input.knowledgeLevel ?? 'K2',
    domains: input.domains ?? [],
    related_capabilities: input.relatedCapabilities ?? [],
    created_at: today(),
    external_links: (input.externalLinks ?? []).map(externalLinkToData),
    candidates: candidates.map(candidateToData),
  }
  if (input.horizon) data.horizon = input.horizon
  if (input.priority) data.priority = input.priority
  if (input.source) data.source = input.source
  if (input.sourceId) data.source_id = input.sourceId

  return matter.stringify('\n' + (input.body ?? defaultBody(input.title.trim())), data)
}

/** Create a new Initiative artifact and return its parsed model. */
export function createInitiative(dir: string, input: CreateInitiativeInput): Initiative {
  if (!input.title?.trim()) throw new InitiativeWriteError('Initiative title is required.')
  const id = nextInitiativeId(dir)
  const fileName = `${id}-${slugify(input.title)}.md`
  const iniDir = join(dir, INITIATIVES_DIR)
  ensureDir(iniDir)
  const filePath = join(iniDir, fileName)
  const content = buildInitiativeContent(id, input)
  writeFile(filePath, content)
  const ini = parseInitiative(dir, filePath, content)
  if (!ini) throw new InitiativeWriteError('Failed to parse the Initiative just written.')
  return ini
}

/** Transition an Initiative to a new lifecycle state, enforcing valid transitions. */
export function transitionInitiative(dir: string, id: string, to: InitiativeStatus): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  if (!isValidInitiativeStatus(to)) throw new InitiativeWriteError(`Invalid status: ${to}.`)
  if (ini.status === to) return ini
  if (!isValidInitiativeTransition(ini.status, to)) {
    throw new InitiativeWriteError(`Invalid transition ${ini.status} → ${to}.`)
  }
  const raw = readFile(ini.filePath)
  const { data, content } = matter(raw, {})
  data.status = to
  if (to === 'completed') data.completed_at = today()
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after transition.')
  return updated
}

/** Append a Work Item candidate to an Initiative. */
export function addCandidate(dir: string, id: string, candidate: CandidateInput): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const raw = readFile(ini.filePath)
  const { data, content } = matter(raw, {})
  const existing = Array.isArray(data.candidates) ? (data.candidates as unknown[]) : []
  const fallbackId = `WI-CANDIDATE-${String(existing.length + 1).padStart(3, '0')}`
  const normalized = normalizeCandidate(candidate, fallbackId)
  if (ini.candidates.some((c) => c.id === normalized.id)) {
    throw new InitiativeWriteError(`Candidate ${normalized.id} already exists in ${id}.`)
  }
  data.candidates = [...existing, candidateToData(normalized)]
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after adding a candidate.')
  return updated
}

export type UpdateInitiativeInput = {
  title?: string
  horizon?: string
  priority?: string
  knowledgeLevel?: string
  domains?: string[]
  relatedCapabilities?: string[]
}

/**
 * Update non-lifecycle fields of an Initiative. Status changes go through `transitionInitiative`
 * (which enforces valid transitions) — this function never changes `status`.
 */
export function updateInitiative(dir: string, id: string, patch: UpdateInitiativeInput): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const raw = readFile(ini.filePath)
  const { data, content } = matter(raw, {})
  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new InitiativeWriteError('Initiative title cannot be empty.')
    data.title = patch.title.trim()
  }
  if (patch.horizon !== undefined) data.horizon = patch.horizon
  if (patch.priority !== undefined) data.priority = patch.priority
  if (patch.knowledgeLevel !== undefined) data.knowledge_level = patch.knowledgeLevel
  if (patch.domains !== undefined) data.domains = patch.domains
  if (patch.relatedCapabilities !== undefined) data.related_capabilities = patch.relatedCapabilities
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after update.')
  return updated
}

/** Highest WI-NNN across the work-items tree + 1, zero-padded. */
function nextWorkItemId(dir: string): string {
  const wiDir = join(dir, WORK_ITEMS_DIR)
  let max = 0
  const walk = (d: string) => {
    if (!exists(d)) return
    for (const entry of readDir(d)) {
      const full = join(d, entry)
      if (isFile(full)) {
        const m = entry.match(/WI-(\d+)/)
        if (m) max = Math.max(max, parseInt(m[1], 10))
      } else if (!entry.startsWith('.')) {
        walk(full)
      }
    }
  }
  walk(wiDir)
  return `WI-${String(max + 1).padStart(3, '0')}`
}

function buildWorkItemContent(
  wiId: string,
  iniId: string,
  candidate: InitiativeCandidate,
): string {
  const data: Record<string, unknown> = {
    type: candidate.type ?? 'feature',
    id: wiId,
    title: candidate.title,
    knowledge_level: candidate.suggestedKnowledgeLevel ?? 'K2',
    status: 'draft',
    phase: 'now',
    initiative: iniId,
    domains: [],
    code: [],
    created_at: today(),
    source: 'initiative',
    source_id: candidate.id,
    source_initiative: iniId,
    affected_modules: [],
  }
  if (candidate.sourceSignals.length) data.source_signals = candidate.sourceSignals
  if (candidate.dependencies.length) data.dependencies = candidate.dependencies

  const body = [
    `# ${candidate.title}`,
    '',
    `> Materialized from Initiative ${iniId}, candidate ${candidate.id}.`,
    '',
    '## Problem',
    '',
    candidate.expectedValue ? `_Expected value:_ ${candidate.expectedValue}` : '_Describe the problem._',
    '',
    '## Acceptance Criteria',
    '',
    '- [ ] _Define at least one testable criterion._',
    '',
    '## Out of scope',
    '',
    '_Not included in this Work Item._',
    '',
    '## Validation',
    '',
    '_How will this be validated?_',
    '',
    '## Learning',
    '',
    '_What did we learn? Update after completion._',
    '',
  ].join('\n')

  return matter.stringify('\n' + body, data)
}

export type MaterializeCandidateResult = {
  workItemId: string
  fileName: string
  initiative: Initiative
}

/**
 * Materialize an Initiative candidate into a draft Work Item, preserving the Initiative association
 * (`initiative: INI-xxx`), the candidate id and its source signals. Marks the candidate as
 * materialized so planning coverage reflects it.
 */
export function materializeCandidate(
  dir: string,
  id: string,
  candidateId: string,
): MaterializeCandidateResult {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const candidate = ini.candidates.find((c) => c.id === candidateId)
  if (!candidate) throw new InitiativeWriteError(`Candidate ${candidateId} not found in ${id}.`)
  if (candidate.materializedAs) {
    throw new InitiativeWriteError(
      `Candidate ${candidateId} is already materialized as ${candidate.materializedAs}.`,
    )
  }

  const wiId = nextWorkItemId(dir)
  const fileName = `${wiId}-${slugify(candidate.title)}.md`
  ensureDir(join(dir, DRAFT_DIR))
  writeFile(join(dir, DRAFT_DIR, fileName), buildWorkItemContent(wiId, ini.id, candidate))

  // Mark the candidate materialized on the Initiative.
  const raw = readFile(ini.filePath)
  const { data, content } = matter(raw, {})
  const cands = (Array.isArray(data.candidates) ? data.candidates : []) as Record<string, unknown>[]
  for (const c of cands) {
    if (c && typeof c === 'object' && String(c.id) === candidateId) c.materialized_as = wiId
  }
  data.candidates = cands
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after materialization.')

  return { workItemId: wiId, fileName, initiative: updated }
}

/**
 * Materialize a roadmap initiative (RM-xxx) into a first-class Initiative (INI-xxx), carrying its
 * Work Item candidates and preserving provenance (`source: roadmap`, `source_id: RM-xxx`).
 */
export function materializeRoadmapInitiative(dir: string, rmId: string): Initiative {
  const roadmapFull = join(dir, ROADMAP_PATH)
  if (!exists(roadmapFull)) throw new InitiativeWriteError(`No roadmap found at ${ROADMAP_PATH}.`)
  const all = parseRoadmapCandidates(readFile(roadmapFull))
  const want = rmId.trim().toLowerCase()
  const belonging = all.filter((c) => (c.initiative?.id ?? '').toLowerCase() === want)
  if (belonging.length === 0) {
    throw new InitiativeWriteError(`No roadmap initiative "${rmId}" with candidates found.`)
  }
  const title = belonging[0].initiative?.title?.trim() || rmId
  const candidates: CandidateInput[] = belonging.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    suggestedKnowledgeLevel: c.suggestedKnowledgeLevel,
    expectedValue: c.expectedValue,
    notes: c.notes,
    sourceSignals: c.sourceSignals ?? [],
    dependencies: c.dependencies ?? [],
    materializedAs: null,
  }))
  const domains = belonging[0].domain ? [belonging[0].domain] : []
  const relatedCapabilities = Array.from(
    new Set(belonging.flatMap((c) => c.relatedCapabilities ?? [])),
  )

  return createInitiative(dir, {
    title,
    status: 'planned',
    domains,
    relatedCapabilities,
    source: 'roadmap',
    sourceId: rmId,
    candidates,
  })
}

/** Convenience alias for discovery, re-exported so callers import writes + reads from one place. */
export { discoverInitiatives }
