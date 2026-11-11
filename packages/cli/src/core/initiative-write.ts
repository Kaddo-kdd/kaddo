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
import { revisionOf } from './delivery-planning.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { parseSuccessCriteria } from './initiative-analysis.js'
import { evaluateInitiativeCompletion, normalizeCriterion, type InitiativeCompletionEvaluation } from './initiative-verification.js'
import type { AcceptanceCriterionEvidence } from './lifecycle.js'

const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'
const DRAFT_DIR = `${WORK_ITEMS_DIR}/draft`
const ROADMAP_PATH = 'knowledge/delivery/roadmap.md'

export type InitiativeWriteOptions = { expectedRevision?: string }

/** Guard a controlled write against a stale form (optimistic concurrency, WI-079). */
function assertFreshInitiative(id: string, currentContent: string, opts?: InitiativeWriteOptions): void {
  if (!opts?.expectedRevision) return
  const actual = revisionOf(currentContent)
  if (actual !== opts.expectedRevision) throw new InitiativeConflictError(id, opts.expectedRevision, actual)
}

/** Next monotonic candidate id within an Initiative: never reuses an id after a removal/reorder (D1). */
function nextCandidateId(existing: { id?: unknown }[]): string {
  let max = 0
  for (const c of existing) {
    const m = typeof c?.id === 'string' ? c.id.match(/^WI-CANDIDATE-(\d+)$/i) : null
    if (m) max = Math.max(max, Number.parseInt(m[1], 10))
  }
  return `WI-CANDIDATE-${String(max + 1).padStart(3, '0')}`
}

export class InitiativeWriteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitiativeWriteError'
  }
}

/** Raised when a controlled Initiative write targets an artifact that changed since it was read (WI-079). */
export class InitiativeConflictError extends InitiativeWriteError {
  constructor(
    public id: string,
    public expectedRevision: string,
    public actualRevision: string,
  ) {
    super(`Initiative "${id}" was modified since it was loaded (expected revision ${expectedRevision}, found ${actualRevision}). Reload and try again.`)
    this.name = 'InitiativeConflictError'
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
  if (l.externalStatus) out.external_status = l.externalStatus
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
  /** Optional Delivery Epic association + declared responsibilities (WI-074). */
  epic?: string
  owners?: string[]
  contributors?: string[]
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
  if (input.epic) data.epic = input.epic.trim()
  if (input.owners?.length) data.owners = input.owners.map((o) => o.trim()).filter(Boolean)
  if (input.contributors?.length) data.contributors = input.contributors.map((c) => c.trim()).filter(Boolean)

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

/**
 * Transition an Initiative to a new lifecycle state, enforcing valid transitions. Completion is NOT a
 * generic transition (WI-079 D7): `→ completed` is refused here and must go through `completeInitiative`,
 * which requires an evidence-based READY evaluation and records the human decision.
 */
export function transitionInitiative(dir: string, id: string, to: InitiativeStatus, opts?: InitiativeWriteOptions): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  if (!isValidInitiativeStatus(to)) throw new InitiativeWriteError(`Invalid status: ${to}.`)
  if (to === 'completed') throw new InitiativeWriteError(`Completing Initiative ${id} requires evidence-based review — use completeInitiative.`)
  if (ini.status === to) return ini
  if (!isValidInitiativeTransition(ini.status, to)) {
    throw new InitiativeWriteError(`Invalid transition ${ini.status} → ${to}.`)
  }
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.status = to
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after transition.')
  return updated
}

/** Find the Work Item that materialized a given candidate by provenance (source_initiative + source_id). */
function findMaterializedWorkItem(dir: string, initiativeId: string, candidateId: string): { id: string; initiative?: string } | null {
  for (const wi of discoverWorkItems(dir)) {
    const fm = wi.rawFrontmatter ?? {}
    const si = typeof fm.source_initiative === 'string' ? fm.source_initiative : undefined
    const sid = typeof fm.source_id === 'string' ? fm.source_id : undefined
    if (si?.toLowerCase() === initiativeId.toLowerCase() && sid === candidateId) {
      return { id: wi.id, initiative: typeof fm.initiative === 'string' ? fm.initiative : undefined }
    }
  }
  return null
}

/** Append a Work Item candidate to an Initiative (monotonic id, never materialized on creation). */
export function addCandidate(dir: string, id: string, candidate: CandidateInput, opts?: InitiativeWriteOptions): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  const { data, content } = matter(raw, {})
  const existing = (Array.isArray(data.candidates) ? data.candidates : []) as { id?: unknown }[]
  const removed = (Array.isArray(data.removed_candidates) ? data.removed_candidates : []) as { id?: unknown }[]
  // Monotonic id over both live and removed candidates — never reuse an id freed by a removal (D1, AC-11).
  const fallbackId = nextCandidateId([...existing, ...removed])
  const normalized = normalizeCandidate(candidate, fallbackId)
  normalized.materializedAs = null
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
  /** Optional Delivery Epic association + declared responsibilities (WI-074). */
  epic?: string | null
  owners?: string[]
  contributors?: string[]
  /** Structured Markdown-section edits (WI-079 D5): heading title → new section body. Other sections,
   * unknown frontmatter and provenance are preserved; the whole document is never replaced. */
  sections?: Record<string, string>
}

/**
 * Replace the body under a `## Heading` (case-insensitive), keeping every other section intact. The
 * section runs from its heading to the next heading of the same or a higher level. A missing section is
 * appended at the end. Returns the new body.
 */
export function replaceBodySection(body: string, heading: string, newContent: string): string {
  const lines = body.split(/\r?\n/)
  const want = heading.trim().toLowerCase()
  let start = -1
  let level = 0
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+(.*)$/)
    if (h && h[2].trim().toLowerCase() === want) { start = i; level = h[1].length; break }
  }
  const block = `${'#'.repeat(level || 2)} ${heading.trim()}\n\n${newContent.trim()}\n`
  if (start === -1) {
    return `${body.trimEnd()}\n\n${block}`
  }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+/)
    if (h && h[1].length <= level) { end = i; break }
  }
  const before = lines.slice(0, start).join('\n').replace(/\s+$/, '')
  const after = lines.slice(end).join('\n').replace(/^\s+/, '')
  return [before, before ? '' : null, block.trimEnd(), after ? '' : null, after].filter((x) => x !== null).join('\n').replace(/\n{3,}/g, '\n\n')
}

/**
 * Update non-lifecycle fields of an Initiative (frontmatter metadata and/or structured Markdown
 * sections). Status changes go through `transitionInitiative`/`completeInitiative` — this never changes
 * `status`, and preserves unknown frontmatter keys and provenance (`source`, `source_id`).
 */
export function updateInitiative(dir: string, id: string, patch: UpdateInitiativeInput, opts?: InitiativeWriteOptions): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  let { data, content } = matter(raw, {})
  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new InitiativeWriteError('Initiative title cannot be empty.')
    data.title = patch.title.trim()
  }
  if (patch.horizon !== undefined) data.horizon = patch.horizon
  if (patch.priority !== undefined) data.priority = patch.priority
  if (patch.knowledgeLevel !== undefined) data.knowledge_level = patch.knowledgeLevel
  if (patch.domains !== undefined) data.domains = patch.domains
  if (patch.relatedCapabilities !== undefined) data.related_capabilities = patch.relatedCapabilities
  if (patch.epic !== undefined) {
    if (patch.epic === null || patch.epic.trim() === '') delete data.epic
    else data.epic = patch.epic.trim()
  }
  if (patch.owners !== undefined) data.owners = patch.owners.map((o) => o.trim()).filter(Boolean)
  if (patch.contributors !== undefined) data.contributors = patch.contributors.map((c) => c.trim()).filter(Boolean)
  if (patch.sections) {
    for (const [heading, value] of Object.entries(patch.sections)) content = replaceBodySection(content, heading, value)
  }
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after update.')
  return updated
}

// --- Candidate editing, removal, and canonical completion (WI-079) -----------

export type UpdateCandidateInput = Partial<Omit<CandidateInput, 'id'>>

/** Edit a PENDING candidate (D2). Keeps its id, source signals, provenance and unknown fields; refuses
 * a materialized candidate (reconcile via its Work Item instead). */
export function updateCandidate(dir: string, id: string, candidateId: string, patch: UpdateCandidateInput, opts?: InitiativeWriteOptions): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const current = ini.candidates.find((c) => c.id === candidateId)
  if (!current) throw new InitiativeWriteError(`Candidate ${candidateId} not found in ${id}.`)
  if (current.materializedAs) throw new InitiativeWriteError(`Candidate ${candidateId} is materialized as ${current.materializedAs}; edit the Work Item instead.`)
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  const { data, content } = matter(raw, {})
  const cands = (Array.isArray(data.candidates) ? data.candidates : []) as Record<string, unknown>[]
  const entry = cands.find((c) => c && typeof c === 'object' && String(c.id) === candidateId)
  if (!entry) throw new InitiativeWriteError(`Candidate ${candidateId} entry not found in ${id} frontmatter.`)
  // Patch only provided fields; never touch id, materialized_as, or unknown keys.
  if (patch.title !== undefined) entry.title = patch.title.trim()
  if (patch.type !== undefined) entry.type = patch.type?.trim() || undefined
  if (patch.suggestedKnowledgeLevel !== undefined) entry.suggested_knowledge_level = patch.suggestedKnowledgeLevel?.trim() || undefined
  if (patch.expectedValue !== undefined) entry.expected_value = patch.expectedValue?.trim() || undefined
  if (patch.notes !== undefined) entry.notes = patch.notes?.trim() || undefined
  if (patch.sourceSignals !== undefined) entry.source_signals = patch.sourceSignals
  if (patch.dependencies !== undefined) entry.dependencies = patch.dependencies
  for (const k of Object.keys(entry)) if (entry[k] === undefined) delete entry[k]
  data.candidates = cands
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after editing a candidate.')
  return updated
}

/** Retire a PENDING candidate from committed scope (D2), recording a justification in a canonical
 * `removed_candidates` log. Refuses a materialized candidate; never touches Work Items. */
export function removeCandidate(dir: string, id: string, candidateId: string, reason: string, opts?: InitiativeWriteOptions): Initiative {
  if (!reason?.trim()) throw new InitiativeWriteError('A justification is required to remove a candidate.')
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const current = ini.candidates.find((c) => c.id === candidateId)
  if (!current) throw new InitiativeWriteError(`Candidate ${candidateId} not found in ${id}.`)
  if (current.materializedAs) throw new InitiativeWriteError(`Candidate ${candidateId} is materialized as ${current.materializedAs}; it cannot be removed from scope.`)
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  const { data, content } = matter(raw, {})
  const cands = (Array.isArray(data.candidates) ? data.candidates : []) as Record<string, unknown>[]
  data.candidates = cands.filter((c) => !(c && typeof c === 'object' && String(c.id) === candidateId))
  const log = (Array.isArray(data.removed_candidates) ? data.removed_candidates : []) as Record<string, unknown>[]
  log.push({ id: candidateId, title: current.title, reason: reason.trim(), removed_at: today() })
  data.removed_candidates = log
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after removing a candidate.')
  return updated
}

/**
 * Add a provider-neutral external planning reference to an Initiative (AC-22). Kaddo stores the
 * reference (and an optional external status as a SIGNAL only); it never lets an external status
 * drive the Initiative lifecycle (AC-23).
 */
export function addExternalLink(dir: string, id: string, link: InitiativeExternalLink): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  if (!link.integration?.trim() || !link.externalId?.trim()) {
    throw new InitiativeWriteError('External link requires integration and externalId.')
  }
  if (
    ini.externalLinks.some(
      (l) =>
        l.integration.trim().toLowerCase() === link.integration.trim().toLowerCase() &&
        l.externalId.trim().toLowerCase() === link.externalId.trim().toLowerCase(),
    )
  ) {
    throw new InitiativeWriteError(`External link ${link.integration}:${link.externalId} already exists on ${id}.`)
  }
  const raw = readFile(ini.filePath)
  const { data, content } = matter(raw, {})
  const existing = Array.isArray(data.external_links) ? (data.external_links as unknown[]) : []
  data.external_links = [...existing, externalLinkToData(link)]
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after adding an external link.')
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
  fileName: string | null
  initiative: Initiative
  /** True when the Work Item already existed (idempotent re-run), so nothing new was created. */
  alreadyMaterialized: boolean
}

/** Set a candidate's materialized_as pointer and return the parsed Initiative (used to repair/complete). */
function setCandidateMaterialized(dir: string, ini: Initiative, candidateId: string, wiId: string): Initiative {
  const raw = readFile(ini.filePath)
  const { data, content } = matter(raw, {})
  const cands = (Array.isArray(data.candidates) ? data.candidates : []) as Record<string, unknown>[]
  for (const c of cands) if (c && typeof c === 'object' && String(c.id) === candidateId) c.materialized_as = wiId
  data.candidates = cands
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after materialization.')
  return updated
}

/**
 * Materialize a pending candidate into a draft Work Item, preserving provenance (`initiative`,
 * `source: initiative`, `source_id`, `source_initiative`) and source signals, and marking the candidate
 * `materialized_as`. Idempotent and partial-failure-safe (WI-079 D3): the Work Item's provenance is the
 * idempotency key, so a re-run never creates a duplicate and a half-applied state is reconciled. Never
 * starts or completes the Work Item.
 */
export function materializeCandidate(
  dir: string,
  id: string,
  candidateId: string,
  opts?: InitiativeWriteOptions,
): MaterializeCandidateResult {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  assertFreshInitiative(ini.id, readFile(ini.filePath), opts)
  const candidate = ini.candidates.find((c) => c.id === candidateId)
  if (!candidate) throw new InitiativeWriteError(`Candidate ${candidateId} not found in ${id}.`)

  // A declared pointer must resolve; a dangling one is a broken relation, never silently re-created.
  if (candidate.materializedAs) {
    const exists = discoverWorkItems(dir).some((w) => w.id.toLowerCase() === candidate.materializedAs!.toLowerCase())
    if (!exists) throw new InitiativeWriteError(`Candidate ${candidateId} points at missing Work Item ${candidate.materializedAs} (broken relation). Resolve it before materializing.`)
    return { workItemId: candidate.materializedAs, fileName: null, initiative: ini, alreadyMaterialized: true }
  }

  // Idempotency / partial-failure recovery: a Work Item with this candidate's provenance already exists.
  const existing = findMaterializedWorkItem(dir, ini.id, candidateId)
  if (existing) {
    if (existing.initiative && existing.initiative.toLowerCase() !== ini.id.toLowerCase()) {
      throw new InitiativeWriteError(`A Work Item for candidate ${candidateId} already belongs to ${existing.initiative} (conflicting provenance).`)
    }
    const repaired = setCandidateMaterialized(dir, ini, candidateId, existing.id)
    return { workItemId: existing.id, fileName: null, initiative: repaired, alreadyMaterialized: true }
  }

  // Create: write the Work Item first (it carries the idempotency key), then set the forward pointer.
  const wiId = nextWorkItemId(dir)
  const fileName = `${wiId}-${slugify(candidate.title)}.md`
  ensureDir(join(dir, DRAFT_DIR))
  writeFile(join(dir, DRAFT_DIR, fileName), buildWorkItemContent(wiId, ini.id, candidate))
  const updated = setCandidateMaterialized(dir, ini, candidateId, wiId)
  return { workItemId: wiId, fileName, initiative: updated, alreadyMaterialized: false }
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

// --- Outcome evidence & canonical completion (WI-079 D6/D7) -------------------

export type InitiativeEvidenceInput = {
  criterion: string
  status: AcceptanceCriterionEvidence['status']
  evidence?: string
  reference?: string
  method?: 'automated' | 'manual'
  verifiedBy?: string
}

function assertDeclaredCriterion(declared: string[], criterion: string): void {
  const key = normalizeCriterion(criterion)
  const matches = declared.filter((c) => normalizeCriterion(c) === key).length
  if (matches === 0) throw new InitiativeWriteError(`"${criterion}" is not a declared success criterion.`)
  if (matches > 1) throw new InitiativeWriteError(`"${criterion}" matches more than one declared criterion — disambiguate before recording evidence.`)
}

function upsertEvidence(existing: unknown, input: InitiativeEvidenceInput): Record<string, unknown>[] {
  const list = (Array.isArray(existing) ? existing : []).filter((e) => e && typeof e === 'object' && !Array.isArray(e)) as Record<string, unknown>[]
  const key = normalizeCriterion(input.criterion)
  const kept = list.filter((e) => normalizeCriterion(String(e.criterion ?? '')) !== key)
  const obj: Record<string, unknown> = { criterion: input.criterion.trim(), status: input.status }
  if (input.evidence?.trim()) obj.evidence = input.evidence.trim()
  if (input.reference?.trim()) obj.reference = input.reference.trim()
  if (input.method) obj.method = input.method
  obj.verified_at = today()
  if (input.verifiedBy?.trim()) obj.verified_by = input.verifiedBy.trim()
  return [...kept, obj]
}

/** Record evidence for one declared Initiative success criterion (reuses WI-078's evidence shape). */
export function recordInitiativeOutcomeVerification(dir: string, id: string, input: InitiativeEvidenceInput, opts?: InitiativeWriteOptions): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  assertDeclaredCriterion(parseSuccessCriteria(ini.body).map((c) => c.text), input.criterion)
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.outcome_verifications = upsertEvidence(data.outcome_verifications, input)
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after recording evidence.')
  return updated
}

export type InitiativeCompletionDecisionInput = { decidedBy?: string; note?: string }

export class InitiativeNotReadyError extends InitiativeWriteError {
  constructor(public evaluation: InitiativeCompletionEvaluation) {
    super(`Initiative ${evaluation.id} is not ready to complete (${evaluation.readiness}).`)
    this.name = 'InitiativeNotReadyError'
  }
}

/**
 * Complete an Initiative — the only path to `completed`. Re-reads the artifact, re-evaluates readiness
 * at call time, checks the expected revision, requires a READY_* evaluation, and records a
 * completion_decision. Completion is never automatic; a generic status update cannot reach `completed`.
 */
export function completeInitiative(dir: string, id: string, input: InitiativeCompletionDecisionInput = {}, opts?: InitiativeWriteOptions): Initiative {
  const ini = getInitiative(dir, id)
  if (!ini) throw new InitiativeWriteError(`Initiative ${id} not found.`)
  const evaluation = evaluateInitiativeCompletion(dir, ini)
  if (evaluation.readiness !== 'READY_TO_COMPLETE' && evaluation.readiness !== 'READY_WITH_EXCEPTIONS') throw new InitiativeNotReadyError(evaluation)
  if (!isValidInitiativeTransition(ini.status, 'completed')) throw new InitiativeWriteError(`Initiative ${id} cannot move from ${ini.status} to completed.`)
  const raw = readFile(ini.filePath)
  assertFreshInitiative(ini.id, raw, opts)
  const { data, content } = matter(raw, {})
  data.status = 'completed'
  data.completed_at = today()
  const decision: Record<string, unknown> = { readiness: evaluation.readiness, decided_at: today(), reasons: evaluation.reasons }
  if (input.decidedBy?.trim()) decision.decided_by = input.decidedBy.trim()
  if (input.note?.trim()) decision.note = input.note.trim()
  const accepted = evaluation.exceptions.filter((x) => x.status === 'accepted')
  if (accepted.length > 0) decision.exceptions = accepted
  data.completion_decision = decision
  const newContent = matter.stringify(content, data)
  writeFile(ini.filePath, newContent)
  const updated = parseInitiative(dir, ini.filePath, newContent)
  if (!updated) throw new InitiativeWriteError('Failed to parse the Initiative after completion.')
  return updated
}
