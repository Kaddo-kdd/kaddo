// Work Item write model for interfaces (VS-099).
//
// The single, deterministic entry point for CREATING and REFINING Work Items from a human
// interface (Admin). Core owns IDs, canonical paths, schema, serialization, validation and
// lifecycle transitions; interfaces send a structured model and an expected revision, and Core
// writes the canonical artifact. No LLM, no agents, no git.
//
// Two guarantees matter most:
//   1. No-lossy rewrite — updating an artifact never drops frontmatter keys or body sections the
//      structured editor does not understand. Unknown content is preserved verbatim.
//   2. Atomic write — the artifact is written to a temp file and atomically renamed into place, so
//      a failure never leaves a partially written artifact.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import matter from 'gray-matter'
import { exists, readFile, join, isFile } from '../utils/fs.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { lifecycleStateOf, type LifecycleState } from './lifecycle.js'
// Validate against the canonical Work Item type catalog (feature/bugfix/hotfix/spike/chore) — the
// same list the capture definition offers — not the artifact-discovery classifier set.
import { isValidType, normalizeType } from './knowledge-levels.js'
import { loadSystemTopology } from './system-topology.js'

const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'

// --- Public types ------------------------------------------------------------

export type WorkItemCoverageInput = { id: string; status: string; reason?: string }
export type WorkItemImpactInput = { surface: string; status: string; reason?: string; question?: string }
export type WorkItemCriterionInput = { text: string; checked: boolean | null }

/** The structured model the editor sends. Prose fields are plain strings; lists are arrays. */
export type WorkItemInput = {
  title: string
  type: string
  summary?: string
  actor?: string
  outcome?: string
  currentBehavior?: string
  targetBehavior?: string
  entryPoints?: string
  endToEndFlow?: string
  scopeConfidence?: { level: string; reasons: string[] } | null
  scopeUnknowns: string[]
  affectedModules: string[]
  moduleCoverage: WorkItemCoverageInput[]
  impactAnalysis: WorkItemImpactInput[]
  acceptanceCriteria: WorkItemCriterionInput[]
  decisions: string[]
  relatedKnowledge: string[]
}

export type WorkItemEditModel = WorkItemInput & {
  id: string
  status: LifecycleState
  /** Content hash of the canonical artifact — send it back with the write to detect conflicts. */
  revision: string
  path: string
  /** Whether the structured editor may write this Work Item. */
  editable: boolean
  /** When not editable, a human-readable reason. */
  editableReason?: string
}

export type ValidationFinding = { level: 'blocking' | 'warning' | 'fyi'; message: string }
export type ValidationResult = { findings: ValidationFinding[]; canMarkReady: boolean }

export type WriteErrorCode =
  | 'WORK_ITEM_NOT_FOUND'
  | 'WORK_ITEM_CONFLICT'
  | 'WORK_ITEM_NOT_EDITABLE'
  | 'INVALID_INPUT'
  | 'INVALID_TRANSITION'

export class WorkItemWriteError extends Error {
  constructor(public code: WriteErrorCode, message: string) {
    super(message)
    this.name = 'WorkItemWriteError'
  }
}

const VALID_COVERAGE = new Set(['affected', 'reviewed-not-affected', 'unknown', 'not-applicable'])
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low'])
/** Only draft may be freely edited; ready must be explicitly reopened to draft first. */
const EDITABLE_STATES: readonly LifecycleState[] = ['draft']

// --- Helpers -----------------------------------------------------------------

function revisionOf(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf-8').digest('hex')
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

function nextWorkItemId(dir: string): string {
  const wiDir = join(dir, WORK_ITEMS_DIR)
  let max = 0
  const walk = (d: string) => {
    if (!exists(d)) return
    for (const entry of fs.readdirSync(d)) {
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

/** Write to a temp file in the same directory, then atomically rename into place. */
function atomicWrite(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, content, 'utf-8')
  try {
    fs.renameSync(tmp, filePath)
  } catch (err) {
    try { fs.rmSync(tmp, { force: true }) } catch { /* best effort */ }
    throw err
  }
}

function findArtifact(dir: string, id: string): { filePath: string; relPath: string } {
  const match = discoverWorkItems(dir).find((a) => (a.id || a.title) === id)
  if (!match) throw new WorkItemWriteError('WORK_ITEM_NOT_FOUND', `Work Item "${id}" was not found.`)
  return { filePath: match.filePath, relPath: match.relPath }
}

function validModuleIds(dir: string): Set<string> {
  const ids = new Set<string>(['core'])
  for (const m of loadMappedModules(dir)) ids.add(m.id)
  return ids
}

// --- Body (Markdown) parsing & serialization ---------------------------------

// Known sections the structured editor owns. Everything else in the body is preserved verbatim.
const SECTION_ORDER = [
  'Actor', 'Outcome', 'Current behavior', 'Target behavior',
  'Entry points', 'End-to-end flow', 'Scope unknowns', 'Acceptance criteria',
] as const
const KNOWN_HEADINGS = new Set(SECTION_ORDER.map((s) => s.toLowerCase()))

type BodySection = { heading: string; normalized: string; body: string }

function parseBody(content: string): { preamble: string[]; sections: BodySection[] } {
  const lines = content.split(/\r?\n/)
  const preamble: string[] = []
  const sections: BodySection[] = []
  let current: BodySection | null = null
  let buffer: string[] = []
  let seenHeading = false
  const flush = () => {
    if (current) { current.body = buffer.join('\n').trim(); sections.push(current) }
    buffer = []
  }
  for (const line of lines) {
    const m = line.match(/^##\s+(.*?)\s*$/)
    if (m) {
      seenHeading = true
      flush()
      current = { heading: m[1].trim(), normalized: m[1].trim().toLowerCase(), body: '' }
    } else if (!seenHeading) {
      preamble.push(line)
    } else {
      buffer.push(line)
    }
  }
  flush()
  return { preamble, sections }
}

function renderList(items: string[]): string {
  return items.map((i) => `- ${i.trim()}`).filter((l) => l.trim() !== '-').join('\n')
}

function renderCriteria(items: WorkItemCriterionInput[]): string {
  return items
    .filter((c) => c.text.trim())
    .map((c) => (c.checked === true ? `- [x] ${c.text.trim()}` : c.checked === false ? `- [ ] ${c.text.trim()}` : `- ${c.text.trim()}`))
    .join('\n')
}

/** Desired bodies for known sections, or null to remove a section that has no content. */
function desiredSections(input: WorkItemInput): Map<string, string | null> {
  const d = new Map<string, string | null>()
  const put = (heading: string, value: string) => d.set(heading.toLowerCase(), value.trim() ? value.trim() : null)
  put('Actor', input.actor ?? '')
  put('Outcome', input.outcome ?? '')
  put('Current behavior', input.currentBehavior ?? '')
  put('Target behavior', input.targetBehavior ?? '')
  put('Entry points', input.entryPoints ?? '')
  put('End-to-end flow', input.endToEndFlow ?? '')
  d.set('scope unknowns', input.scopeUnknowns.some((u) => u.trim()) ? renderList(input.scopeUnknowns) : null)
  d.set('acceptance criteria', input.acceptanceCriteria.some((c) => c.text.trim()) ? renderCriteria(input.acceptanceCriteria) : null)
  return d
}

function headingFor(normalized: string): string {
  return SECTION_ORDER.find((s) => s.toLowerCase() === normalized) ?? normalized
}

/**
 * Merge the structured input into an existing body, preserving every section the editor does not
 * own. Known sections are updated (or removed when emptied); unknown sections are kept verbatim.
 */
function mergeBody(existing: string, input: WorkItemInput): string {
  const { preamble, sections } = parseBody(existing)
  const desired = desiredSections(input)
  const handled = new Set<string>()

  // Rebuild the H1 in the preamble to match the (possibly new) title; keep the rest of the preamble.
  const preambleLines = [...preamble]
  const h1Index = preambleLines.findIndex((l) => /^#\s+/.test(l))
  if (h1Index >= 0) preambleLines[h1Index] = `# ${input.title}`

  const out: string[] = []
  for (const s of sections) {
    if (KNOWN_HEADINGS.has(s.normalized)) {
      handled.add(s.normalized)
      const body = desired.get(s.normalized)
      if (body != null) out.push(`## ${headingFor(s.normalized)}\n\n${body}`)
      // body === null → section emptied → drop it
    } else {
      // Unknown section — preserve verbatim.
      out.push(`## ${s.heading}${s.body ? `\n\n${s.body}` : ''}`)
    }
  }
  // Append known sections that were not already present, in canonical order.
  for (const heading of SECTION_ORDER) {
    const norm = heading.toLowerCase()
    if (handled.has(norm)) continue
    const body = desired.get(norm)
    if (body != null) out.push(`## ${heading}\n\n${body}`)
  }

  const preambleText = preambleLines.join('\n').trim()
  return `${preambleText}\n\n${out.join('\n\n')}\n`
}

function freshBody(input: WorkItemInput): string {
  const preamble = `# ${input.title}\n\n> Type: ${input.type}`
  const out: string[] = []
  const desired = desiredSections(input)
  for (const heading of SECTION_ORDER) {
    const body = desired.get(heading.toLowerCase())
    if (body != null) out.push(`## ${heading}\n\n${body}`)
  }
  return `${preamble}\n\n${out.join('\n\n')}\n`.replace(/\n{3,}/g, '\n\n')
}

// --- Frontmatter merge -------------------------------------------------------

/** Apply the structured input onto a frontmatter object, preserving unknown keys (no-lossy). */
function applyFrontmatter(data: Record<string, unknown>, input: WorkItemInput): Record<string, unknown> {
  const next: Record<string, unknown> = { ...data }
  next.title = input.title
  next.type = input.type
  next.work_type = input.type
  if (input.summary != null) next.summary = input.summary
  next.affected_modules = [...input.affectedModules]

  if (input.scopeConfidence && VALID_CONFIDENCE.has(input.scopeConfidence.level)) {
    next.scope_confidence = { level: input.scopeConfidence.level, reasons: input.scopeConfidence.reasons.filter((r) => r.trim()) }
  } else {
    delete next.scope_confidence
  }

  const coverage: Record<string, unknown> = {}
  for (const c of input.moduleCoverage) {
    if (!VALID_COVERAGE.has(c.status)) continue
    coverage[c.id] = c.reason?.trim() ? { status: c.status, reason: c.reason.trim() } : { status: c.status }
  }
  if (Object.keys(coverage).length > 0) next.module_coverage = coverage
  else delete next.module_coverage

  const surfaces: Record<string, unknown> = {}
  for (const s of input.impactAnalysis) {
    if (!VALID_COVERAGE.has(s.status)) continue
    const entry: Record<string, unknown> = { status: s.status }
    if (s.reason?.trim()) entry.reason = s.reason.trim()
    if (s.question?.trim()) entry.question = s.question.trim()
    surfaces[s.surface] = entry
  }
  if (Object.keys(surfaces).length > 0) next.impact_analysis = { surfaces }
  else delete next.impact_analysis

  if (input.decisions.length > 0) next.decisions = [...input.decisions]
  else delete next.decisions
  if (input.relatedKnowledge.length > 0) next.related_knowledge = [...input.relatedKnowledge]
  else delete next.related_knowledge

  return next
}

function serialize(data: Record<string, unknown>, body: string): string {
  // gray-matter dumps every key in `data` (including unknown ones) via js-yaml — no-lossy.
  return matter.stringify(`\n${body.trim()}\n`, data)
}

// --- Read for edit -----------------------------------------------------------

function toInput(data: Record<string, unknown>, content: string): WorkItemInput {
  const { sections } = parseBody(content)
  const sec = (name: string): string | undefined => {
    const s = sections.find((x) => x.normalized === name)
    return s && s.body.trim() ? s.body.trim() : undefined
  }
  const bullets = (name: string): string[] => {
    const body = sec(name)
    if (!body) return []
    return body.split(/\r?\n/).map((l) => l.replace(/^\s*[-*+]\s+(\[[ xX]\]\s*)?/, '').trim()).filter(Boolean)
  }
  const criteria = ((): WorkItemCriterionInput[] => {
    const body = sec('acceptance criteria')
    if (!body) return []
    const out: WorkItemCriterionInput[] = []
    for (const line of body.split(/\r?\n/)) {
      const m = line.match(/^\s*[-*+]\s+(.*)$/)
      if (!m) continue
      let text = m[1].trim(); let checked: boolean | null = null
      const cb = text.match(/^\[([ xX])\]\s*(.*)$/)
      if (cb) { checked = cb[1].toLowerCase() === 'x'; text = cb[2].trim() }
      if (text) out.push({ text, checked })
    }
    return out
  })()

  const sc = data.scope_confidence as { level?: string; reasons?: unknown[] } | undefined
  const mc = data.module_coverage as Record<string, { status?: string; reason?: string }> | undefined
  const ia = (data.impact_analysis as { surfaces?: Record<string, { status?: string; reason?: string; question?: string }> } | undefined)?.surfaces

  return {
    title: String(data.title ?? ''),
    type: String(data.type ?? 'feature'),
    summary: data.summary ? String(data.summary) : undefined,
    actor: sec('actor'),
    outcome: sec('outcome'),
    currentBehavior: sec('current behavior'),
    targetBehavior: sec('target behavior'),
    entryPoints: sec('entry points'),
    endToEndFlow: sec('end-to-end flow'),
    scopeConfidence: sc && sc.level ? { level: String(sc.level), reasons: Array.isArray(sc.reasons) ? sc.reasons.map(String) : [] } : null,
    scopeUnknowns: bullets('scope unknowns'),
    affectedModules: Array.isArray(data.affected_modules) ? data.affected_modules.map(String) : [],
    moduleCoverage: mc ? Object.entries(mc).map(([id, v]) => ({ id, status: String(v.status ?? ''), ...(v.reason ? { reason: String(v.reason) } : {}) })) : [],
    impactAnalysis: ia ? Object.entries(ia).map(([surface, v]) => ({ surface, status: String(v.status ?? ''), ...(v.reason ? { reason: String(v.reason) } : {}), ...(v.question ? { question: String(v.question) } : {}) })) : [],
    acceptanceCriteria: criteria,
    decisions: Array.isArray(data.decisions) ? data.decisions.map(String) : [],
    relatedKnowledge: Array.isArray(data.related_knowledge) ? data.related_knowledge.map(String) : [],
  }
}

export function getWorkItemForEdit(dir: string, id: string): WorkItemEditModel {
  const { filePath, relPath } = findArtifact(dir, id)
  const raw = readFile(filePath)
  const { data, content } = matter(raw)
  const status = lifecycleStateOf({ status: String(data.status ?? ''), filePath })
  const input = toInput(data as Record<string, unknown>, content)
  const editable = EDITABLE_STATES.includes(status)
  return {
    ...input,
    id,
    status,
    revision: revisionOf(raw),
    path: relPath,
    editable,
    ...(editable ? {} : { editableReason: status === 'ready'
      ? 'This Work Item is Ready. Reopen it as Draft to edit its scope.'
      : `This Work Item is ${status} and cannot be edited from the structured editor.` }),
  }
}

// --- Create ------------------------------------------------------------------

// Capture answers (from the shared capture definition) map to these body sections, matching the
// CLI's create flow. Anything the capture flow does not cover belongs to refinement.
const CAPTURE_SECTIONS: { field: string; heading: string; list?: boolean }[] = [
  { field: 'problem', heading: 'Problem' },
  { field: 'expected_result', heading: 'Expected result' },
  { field: 'impact', heading: 'Impact' },
  { field: 'acceptance_criteria', heading: 'Acceptance criteria', list: true },
  { field: 'design', heading: 'Design' },
  { field: 'risks', heading: 'Risks' },
]

function captureBody(title: string, type: string, answers: Record<string, string>): string {
  const out: string[] = [`# ${title}`, '', `> Type: ${type}`]
  for (const { field, heading, list } of CAPTURE_SECTIONS) {
    const value = answers[field]?.trim()
    if (!value) continue
    if (list) {
      const items = value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => (/^[-*+]\s/.test(l) ? l : `- ${l}`))
      out.push('', `## ${heading}`, '', items.join('\n'))
    } else {
      out.push('', `## ${heading}`, '', value)
    }
  }
  return out.join('\n') + '\n'
}

/**
 * External-origin metadata for an imported Work Item (VS-102). Describes where the request came from
 * — never where the current truth lives. Contains no secrets. Written verbatim into `source:`.
 */
export type WorkItemSourceInput = {
  type: string
  provider?: string
  integration?: string
  id?: string
  url?: string
  imported_at?: string
  external_updated_at?: string
}

export type ExternalSnapshot = {
  title: string
  description?: string
  type?: string
  status?: string
  labels?: string[]
  assignee?: string
  created_at?: string
  updated_at?: string
}

export function createWorkItem(
  dir: string,
  opts: { intent: string; type: string; answers?: Record<string, string>; source?: WorkItemSourceInput; originalSnapshot?: ExternalSnapshot },
): { id: string; path: string; revision: string } {
  const intent = opts.intent.trim()
  if (!intent) throw new WorkItemWriteError('INVALID_INPUT', 'An intent or summary is required.')
  const type = normalizeType(opts.type.trim()) ?? ''
  if (!type) throw new WorkItemWriteError('INVALID_INPUT', `Unknown Work Item type "${opts.type}".`)

  const id = nextWorkItemId(dir)
  const title = intent.split(/\r?\n/)[0].trim().slice(0, 120)
  const today = new Date().toISOString().split('T')[0]
  const source: Record<string, unknown> = opts.source
    ? { ...opts.source, inferred: false }
    : { type: 'manual', inferred: false }
  const data: Record<string, unknown> = {
    type,
    id,
    title,
    status: 'draft',
    work_type: type,
    created_at: today,
    source,
    generated_by: 'kaddo-admin',
    affected_modules: [],
    summary: intent,
  }
  if (opts.originalSnapshot) data.original_snapshot = opts.originalSnapshot
  const answers = opts.answers ?? {}
  const hasAnswers = Object.values(answers).some((v) => v?.trim())
  const body = hasAnswers
    ? captureBody(title, type, answers)
    : freshBody({
        title, type, summary: intent,
        scopeUnknowns: [], affectedModules: [], moduleCoverage: [], impactAnalysis: [],
        acceptanceCriteria: [], decisions: [], relatedKnowledge: [], scopeConfidence: null,
      })
  const relPath = `${WORK_ITEMS_DIR}/draft/${id}-${slugify(title)}.md`
  const filePath = join(dir, relPath)
  if (exists(filePath)) throw new WorkItemWriteError('INVALID_INPUT', `Work Item file already exists: ${relPath}`)
  const raw = serialize(data, body)
  atomicWrite(filePath, raw)
  return { id, path: relPath, revision: revisionOf(raw) }
}

// --- Update ------------------------------------------------------------------

function validateInput(input: WorkItemInput): void {
  if (!input.title.trim()) throw new WorkItemWriteError('INVALID_INPUT', 'Title is required.')
  if (!isValidType(input.type)) throw new WorkItemWriteError('INVALID_INPUT', `Unknown Work Item type "${input.type}".`)
}

export function updateWorkItem(dir: string, id: string, input: WorkItemInput, expectedRevision: string): { revision: string; path: string } {
  validateInput(input)
  const { filePath, relPath } = findArtifact(dir, id)
  const raw = readFile(filePath)
  if (revisionOf(raw) !== expectedRevision) {
    throw new WorkItemWriteError('WORK_ITEM_CONFLICT', 'This Work Item changed outside Kaddo Admin. Reload the latest version before saving.')
  }
  const { data, content } = matter(raw)
  const status = lifecycleStateOf({ status: String((data as Record<string, unknown>).status ?? ''), filePath })
  if (!EDITABLE_STATES.includes(status)) {
    throw new WorkItemWriteError('WORK_ITEM_NOT_EDITABLE', `A ${status} Work Item cannot be edited. Reopen it as Draft first.`)
  }
  const nextData = applyFrontmatter(data as Record<string, unknown>, input)
  const nextBody = mergeBody(content, input)
  const nextRaw = serialize(nextData, nextBody)
  atomicWrite(filePath, nextRaw)
  return { revision: revisionOf(nextRaw), path: relPath }
}

// --- Validation --------------------------------------------------------------

export function validateWorkItem(dir: string, id: string): ValidationResult {
  const { filePath } = findArtifact(dir, id)
  const raw = readFile(filePath)
  const { data, content } = matter(raw)
  const input = toInput(data as Record<string, unknown>, content)
  const findings: ValidationFinding[] = []
  const modules = validModuleIds(dir)

  // Affected/coverage consistency (the canonical example).
  for (const c of input.moduleCoverage) {
    if (c.status === 'affected' && !input.affectedModules.includes(c.id)) {
      findings.push({ level: 'blocking', message: `${c.id} is marked affected in module coverage but is missing from affected_modules.` })
    }
  }
  for (const m of input.affectedModules) {
    if (!modules.has(m)) findings.push({ level: 'blocking', message: `Module "${m}" is not registered in this project.` })
  }

  // Scope completeness.
  if (!input.targetBehavior?.trim()) findings.push({ level: 'warning', message: 'Target behavior is not defined.' })
  if (input.acceptanceCriteria.length === 0) findings.push({ level: 'warning', message: 'No acceptance criteria have been defined.' })
  if (input.scopeConfidence?.level === 'low') findings.push({ level: 'warning', message: 'Scope confidence is Low.' })
  if (!input.scopeConfidence) findings.push({ level: 'warning', message: 'Scope confidence has not been assessed.' })

  // FYI signals.
  for (const c of input.moduleCoverage) {
    if (c.status === 'reviewed-not-affected') findings.push({ level: 'fyi', message: `${c.id} was reviewed and is not affected.` })
  }
  for (const s of input.impactAnalysis) {
    if (s.status === 'unknown') findings.push({ level: 'fyi', message: `Impact on ${s.surface} is unknown.` })
  }

  // Graph-assisted system impact consistency (VS-101).
  const topology = loadSystemTopology(dir)
  const entityById = new Map(topology.entities.map((e) => [e.id, e]))
  const fm = data as Record<string, unknown>
  // Accept a bare id or an object carrying explainability (VS-101.1).
  const idOf = (raw: unknown): string =>
    typeof raw === 'string' ? raw : raw && typeof raw === 'object' ? String((raw as Record<string, unknown>).id ?? '') : ''
  const affectedEntities = Array.isArray(fm.affected_system_entities)
    ? fm.affected_system_entities.map(idOf).filter(Boolean)
    : []
  for (const eid of affectedEntities) {
    const e = entityById.get(eid)
    if (!e) { findings.push({ level: 'blocking', message: `Affected system entity "${eid}" does not exist in the semantic topology.` }); continue }
    if (e.moduleId && !input.affectedModules.includes(e.moduleId)) {
      findings.push({ level: 'warning', message: `System entity "${e.label}" belongs to module "${e.moduleId}", which is not in affected_modules.` })
    }
  }
  if (Array.isArray(fm.reviewed_system_entities)) {
    for (const r of fm.reviewed_system_entities as Record<string, unknown>[]) {
      const rid = r && typeof r === 'object' ? String(r.id ?? '') : ''
      if (rid && !entityById.has(rid)) findings.push({ level: 'warning', message: `Reviewed system entity "${rid}" does not exist in the semantic topology.` })
    }
  }

  const canMarkReady = !findings.some((f) => f.level === 'blocking')
  return { findings, canMarkReady }
}

// --- Lifecycle transitions ---------------------------------------------------

const ALLOWED: Record<string, LifecycleState[]> = { draft: ['ready'], ready: ['draft'] }

export function transitionWorkItem(dir: string, id: string, to: LifecycleState, expectedRevision: string): { revision: string; status: LifecycleState; path: string } {
  const { filePath } = findArtifact(dir, id)
  const raw = readFile(filePath)
  if (revisionOf(raw) !== expectedRevision) {
    throw new WorkItemWriteError('WORK_ITEM_CONFLICT', 'This Work Item changed outside Kaddo Admin. Reload the latest version before continuing.')
  }
  const { data, content } = matter(raw)
  const from = lifecycleStateOf({ status: String((data as Record<string, unknown>).status ?? ''), filePath })
  if (!(ALLOWED[from] ?? []).includes(to)) {
    throw new WorkItemWriteError('INVALID_TRANSITION', `Cannot transition a ${from} Work Item to ${to}.`)
  }
  if (to === 'ready') {
    const { canMarkReady } = validateWorkItem(dir, id)
    if (!canMarkReady) throw new WorkItemWriteError('INVALID_TRANSITION', 'This Work Item has blocking issues and cannot be marked Ready.')
  }

  const nextData = { ...(data as Record<string, unknown>), status: to }
  const nextRaw = serialize(nextData, content)

  // Move the file into the matching lifecycle folder so the artifact stays canonical.
  const filename = path.basename(filePath)
  const targetRel = `${WORK_ITEMS_DIR}/${to}/${filename}`
  const targetPath = join(dir, targetRel)
  atomicWrite(targetPath, nextRaw)
  if (path.resolve(targetPath) !== path.resolve(filePath)) {
    try { fs.rmSync(filePath, { force: true }) } catch { /* best effort */ }
  }
  return { revision: revisionOf(nextRaw), status: to, path: targetRel }
}
