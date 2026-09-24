// Work Item read model for interfaces (VS-098).
//
// The single, deterministic source of truth for "what does this Work Item mean" when a
// human interface (Admin) needs to present it. Core owns lifecycle, delivery-state, scope,
// coverage, evidence, release and acceptance semantics — interfaces only present the result.
//
// No LLM, no git, no writes. The canonical artifact stays in the project; this is a normalized
// projection of it. Legacy Work Items (pre VS-094/VS-095) parse without error: absent optional
// metadata is simply omitted, never invented.

import matter from 'gray-matter'
import { readFile } from '../utils/fs.js'
import {
  discoverWorkItems,
  discoverKnowledge,
  type KnowledgeArtifact,
} from '../services/knowledge-artifacts.js'
import {
  lifecycleStateOf,
  isActiveState,
  type LifecycleState,
} from './lifecycle.js'
import { parseWorkItemSource, type WorkItemSource } from './work-item-source.js'
import type { ExternalSnapshot } from './work-item-write.js'
import { loadSystemTopology } from './system-topology.js'

// --- Public types ------------------------------------------------------------

export type WorkItemsSummary = {
  total: number
  active: number
  draft: number
  ready: number
  inProgress: number
  blocked: number
  completed: number
  archived: number
}

export type WorkItemListItem = {
  id: string
  title: string
  type: string
  /** Canonical lifecycle state. */
  status: LifecycleState
  implementationStatus: string | null
  validationStatus: string | null
  releaseStatus: string | null
  affectedModules: string[]
  scopeConfidenceLevel: string | null
  initiative: string | null
}

export type WorkItemsResult = {
  summary: WorkItemsSummary
  items: WorkItemListItem[]
  /** Distinct affected-module ids across all Work Items — powers the module filter. */
  modules: string[]
}

export type WorkItemFilters = {
  status?: string
  module?: string
  query?: string
}

export type CoverageEntry = { id: string; status: string; reason?: string }
export type ImpactEntry = { surface: string; status: string; reason?: string; question?: string }
export type AcceptanceCriterion = { text: string; checked: boolean | null }
export type ReleaseGateEntry = { id: string; status: string; reason?: string; requiredFor?: string }
export type CompletionExceptionEntry = { id: string; status: string; reason?: string; category?: string; impact?: string }
export type RepoValidation = { command: string; status: string; reason?: string }
export type RepoMigration = { id: string; environment: string; status: string; reason?: string }
export type EvidenceRepo = {
  module: string
  role: string
  status: string
  changedPaths: string[]
  validations: RepoValidation[]
  migrations: RepoMigration[]
}
export type LinkedDecision = { id: string; title?: string; knowledgeId?: string; knowledgeLayer?: string }
export type LinkedKnowledge = { id: string; title: string; layer: string }

export type WorkItemDetail = WorkItemListItem & {
  /** The captured intent (frontmatter summary), i.e. what the human asked for. */
  summary: string | null
  /** Prose outcome sections (absent when not written; placeholders are treated as absent). */
  actor: string | null
  outcome: string | null
  currentBehavior: string | null
  targetBehavior: string | null
  entryPoints: string | null
  endToEndFlow: string | null
  scopeConfidence: { level: string; reasons: string[] } | null
  scopeUnknowns: string[]
  moduleCoverage: CoverageEntry[]
  impactAnalysis: ImpactEntry[]
  acceptanceCriteria: AcceptanceCriterion[]
  implementationEvidence: EvidenceRepo[]
  releaseGates: ReleaseGateEntry[]
  completionExceptions: CompletionExceptionEntry[]
  decisions: LinkedDecision[]
  relatedKnowledge: LinkedKnowledge[]
  source: WorkItemSource
  originalSnapshot: ExternalSnapshot | null
  /** POSIX path relative to the project root. */
  path: string
  /** How far the Work Item has been refined (independent of lifecycle). */
  refinement: RefinementStatus
  /** Graph-assisted impact (VS-101): semantic system entities the agent classified. */
  affectedSystemEntities: SystemImpactEntity[]
  reviewedSystemEntities: ReviewedSystemEntity[]
  /** The topology revision the impact analysis was performed against, when recorded. */
  graphRevision: string | null
  /** Topology coverage at read time, so Admin never presents a missing edge as proof of no impact. */
  graphCoverage: 'unavailable' | 'partial' | 'available'
}

/** Why a candidate surfaced from the Graph — the relationship and path, not the agent's reasoning. */
export type SystemImpactGraphReason = { relationship: string | null; path: string[] }
/**
 * A system entity the agent reviewed (VS-101.1). Carries the explainability the UI renders:
 * why it was reviewed (reason), how the Graph surfaced it (graphReason), what was found in the
 * repository (evidenceRefs/evidenceSummary). None of this is chain-of-thought — it is evidence.
 */
export type SystemImpactEntity = {
  id: string
  nodeId: string
  label: string
  kind: string
  moduleId: string | null
  reason: string | null
  graphReason: SystemImpactGraphReason | null
  evidenceRefs: string[]
  evidenceSummary: string | null
}
export type ReviewedSystemEntity = SystemImpactEntity & { status: string }

/**
 * Refinement status — a deterministic, presentation-only signal of how much end-to-end scope the
 * artifact carries. It is NOT a lifecycle state: a Work Item can be lifecycle `draft` and
 * refinement `refined` at the same time. Derived here in Core so interfaces never invent their own.
 */
export type RefinementStatus = {
  status: 'needs-refinement' | 'refined'
  aspects: { outcome: boolean; journey: boolean; modules: boolean; impact: boolean; acceptance: boolean }
}

export function computeRefinementStatus(wi: {
  currentBehavior: string | null
  targetBehavior: string | null
  entryPoints: string | null
  endToEndFlow: string | null
  affectedModules: string[]
  moduleCoverage: CoverageEntry[]
  impactAnalysis: ImpactEntry[]
  acceptanceCriteria: AcceptanceCriterion[]
}): RefinementStatus {
  const aspects = {
    outcome: Boolean(wi.currentBehavior?.trim() || wi.targetBehavior?.trim()),
    journey: Boolean(wi.entryPoints?.trim() || wi.endToEndFlow?.trim()),
    modules: wi.affectedModules.length > 0 || wi.moduleCoverage.length > 0,
    impact: wi.impactAnalysis.length > 0,
    acceptance: wi.acceptanceCriteria.length > 0,
  }
  // "Materially refined": the scope tells an end-to-end story — a target behavior, the modules it
  // touches, and how it will be accepted. Otherwise the item still only carries captured intent.
  const refined = aspects.outcome && aspects.modules && aspects.acceptance
  return { status: refined ? 'refined' : 'needs-refinement', aspects }
}

export class WorkItemNotFoundError extends Error {
  constructor(public workItemId: string) {
    super(`Work Item "${workItemId}" was not found.`)
    this.name = 'WorkItemNotFoundError'
  }
}

// --- Summary -----------------------------------------------------------------

export function getWorkItemsSummary(dir: string): WorkItemsSummary {
  return summarize(discoverWorkItems(dir))
}

function summarize(artifacts: KnowledgeArtifact[]): WorkItemsSummary {
  const states = artifacts.map((a) => lifecycleStateOf({ status: a.status, filePath: a.filePath }))
  const count = (s: LifecycleState) => states.filter((x) => x === s).length
  return {
    total: states.length,
    active: states.filter((s) => isActiveState(s)).length,
    draft: count('draft'),
    ready: count('ready'),
    inProgress: count('in-progress'),
    blocked: count('blocked'),
    completed: count('completed'),
    archived: count('archived'),
  }
}

// --- List --------------------------------------------------------------------

export function getWorkItems(dir: string, filters: WorkItemFilters = {}): WorkItemsResult {
  const artifacts = discoverWorkItems(dir)
  const summary = summarize(artifacts)

  const allModules = new Set<string>()
  for (const a of artifacts) for (const m of a.affectedModules) allModules.add(m)

  let items = artifacts.map(toListItem)

  if (filters.status && filters.status !== 'all') {
    items = items.filter((i) => i.status === filters.status)
  }
  if (filters.module && filters.module !== 'all') {
    items = items.filter((i) => i.affectedModules.includes(filters.module!))
  }
  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase()
    items = items.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.affectedModules.some((m) => m.toLowerCase().includes(q)),
    )
  }

  // Stable ordering: active work first, then by id.
  items.sort((a, b) => {
    const rank = (s: LifecycleState) => (isActiveState(s) ? 0 : s === 'completed' ? 1 : 2)
    const r = rank(a.status) - rank(b.status)
    if (r !== 0) return r
    return a.id.localeCompare(b.id, undefined, { numeric: true })
  })

  return { summary, items, modules: [...allModules].sort() }
}

function toListItem(a: KnowledgeArtifact): WorkItemListItem {
  return {
    id: a.id || a.title,
    title: a.title || a.id,
    type: a.type,
    status: lifecycleStateOf({ status: a.status, filePath: a.filePath }),
    implementationStatus: a.implementationStatus || null,
    validationStatus: a.validationStatus || null,
    releaseStatus: a.releaseStatus || null,
    affectedModules: a.affectedModules,
    scopeConfidenceLevel: a.scopeConfidence?.level ?? null,
    initiative: a.initiative || null,
  }
}

// --- Detail ------------------------------------------------------------------

export function getWorkItem(dir: string, workItemId: string): WorkItemDetail {
  const artifacts = discoverWorkItems(dir)
  const match = artifacts.find((a) => (a.id || a.title) === workItemId)
  if (!match) throw new WorkItemNotFoundError(workItemId)

  const base = toListItem(match)
  const body = readBody(match.filePath)
  const sections = splitSections(body)
  const fm = match.rawFrontmatter

  const knowledge = discoverKnowledge(dir).filter((a) => !a.isWorkItem)
  const knowledgeById = new Map(knowledge.filter((k) => k.id).map((k) => [k.id, k]))

  const detail = {
    ...base,
    summary: match.summary?.trim() || null,
    actor: sectionText(sections, ['actor']),
    outcome: sectionText(sections, ['actor and outcome', 'outcome', 'expected result']),
    currentBehavior: sectionText(sections, ['current behavior', 'current behaviour']),
    targetBehavior: sectionText(sections, ['target behavior', 'target behaviour']),
    entryPoints: sectionText(sections, ['entry points']),
    endToEndFlow: sectionText(sections, ['end-to-end flow', 'end to end flow', 'flow']),
    scopeConfidence: match.scopeConfidence,
    scopeUnknowns: sectionBullets(sections, ['scope unknowns', 'open scope questions']),
    moduleCoverage: normalizeCoverage(match.moduleCoverage),
    impactAnalysis: normalizeImpact(match.impactAnalysis),
    acceptanceCriteria: parseAcceptanceCriteria(sections),
    implementationEvidence: parseEvidence(fm),
    releaseGates: parseReleaseGates(fm),
    completionExceptions: parseExceptions(fm),
    decisions: parseDecisions(match.decisions, knowledgeById),
    relatedKnowledge: parseRelatedKnowledge(fm, knowledgeById),
    source: parseWorkItemSource(fm),
    originalSnapshot: parseOriginalSnapshot(fm),
    path: match.relPath,
    ...parseSystemImpact(dir, fm),
  }
  return { ...detail, refinement: computeRefinementStatus(detail) }
}

/** Resolve the Work Item's declared system-impact ids against the semantic topology. */
function parseGraphReason(v: unknown): SystemImpactGraphReason | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const relationship = typeof o.relationship === 'string' && o.relationship.trim() ? o.relationship.trim() : null
  const path = Array.isArray(o.path) ? o.path.map(String).filter(Boolean) : []
  return relationship || path.length ? { relationship, path } : null
}

function parseExplain(o: Record<string, unknown>): Pick<SystemImpactEntity, 'reason' | 'graphReason' | 'evidenceRefs' | 'evidenceSummary'> {
  const refs = Array.isArray(o.evidence) ? o.evidence : Array.isArray(o.evidence_refs) ? o.evidence_refs : []
  return {
    reason: typeof o.reason === 'string' && o.reason.trim() ? o.reason.trim() : null,
    graphReason: parseGraphReason(o.graph_reason),
    evidenceRefs: (refs as unknown[]).map(String).filter(Boolean),
    evidenceSummary: typeof o.evidence_summary === 'string' && o.evidence_summary.trim() ? o.evidence_summary.trim() : null,
  }
}

function emptyExplain(): Pick<SystemImpactEntity, 'reason' | 'graphReason' | 'evidenceRefs' | 'evidenceSummary'> {
  return { reason: null, graphReason: null, evidenceRefs: [], evidenceSummary: null }
}

function parseSystemImpact(dir: string, fm: Record<string, unknown>): {
  affectedSystemEntities: SystemImpactEntity[]
  reviewedSystemEntities: ReviewedSystemEntity[]
  graphRevision: string | null
  graphCoverage: 'unavailable' | 'partial' | 'available'
} {
  const topology = loadSystemTopology(dir)
  const byId = new Map(topology.entities.map((e) => [e.id, e]))
  const resolve = (id: string): Omit<SystemImpactEntity, 'reason' | 'graphReason' | 'evidenceRefs' | 'evidenceSummary'> => {
    const e = byId.get(id)
    return { id, nodeId: `sys:${id}`, label: e?.label ?? id, kind: e?.kind ?? 'unknown', moduleId: e?.moduleId ?? null }
  }
  // affected_system_entities accepts a bare id (string) or an object carrying explainability.
  const affected: SystemImpactEntity[] = Array.isArray(fm.affected_system_entities)
    ? fm.affected_system_entities
        .map((raw): SystemImpactEntity | null => {
          if (typeof raw === 'string') return raw ? { ...resolve(raw), ...emptyExplain() } : null
          if (raw && typeof raw === 'object') {
            const o = raw as Record<string, unknown>
            const id = String(o.id ?? '')
            return id ? { ...resolve(id), ...parseExplain(o) } : null
          }
          return null
        })
        .filter((e): e is SystemImpactEntity => e != null)
    : []
  const reviewed: ReviewedSystemEntity[] = Array.isArray(fm.reviewed_system_entities)
    ? (fm.reviewed_system_entities as unknown[])
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
        .map((r) => ({ ...resolve(String(r.id ?? '')), ...parseExplain(r), status: String(r.status ?? 'unknown') }))
        .filter((r) => r.id)
    : []
  const graphRevision = typeof fm.graph_revision === 'string' && fm.graph_revision.trim() ? fm.graph_revision.trim() : null
  const graphCoverage: 'unavailable' | 'partial' | 'available' =
    topology.entities.length === 0 ? 'unavailable' : topology.relationships.length > 0 ? 'available' : 'partial'
  return { affectedSystemEntities: affected, reviewedSystemEntities: reviewed, graphRevision, graphCoverage }
}

function parseOriginalSnapshot(fm: Record<string, unknown>): ExternalSnapshot | null {
  const raw = fm.original_snapshot
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const title = typeof o.title === 'string' ? o.title : undefined
  if (!title) return null
  return {
    title,
    description: typeof o.description === 'string' ? o.description : undefined,
    type: typeof o.type === 'string' ? o.type : undefined,
    status: typeof o.status === 'string' ? o.status : undefined,
    labels: Array.isArray(o.labels) ? o.labels.map(String) : undefined,
    assignee: typeof o.assignee === 'string' ? o.assignee : undefined,
    created_at: typeof o.created_at === 'string' ? o.created_at : undefined,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : undefined,
  }
}

// --- Body parsing ------------------------------------------------------------

function readBody(filePath: string): string {
  try {
    const raw = readFile(filePath)
    return matter(raw).content
  } catch {
    return ''
  }
}

/** Map of normalized heading → body text (until the next `##`/`#` heading). */
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = body.split(/\r?\n/)
  let current: string | null = null
  let buffer: string[] = []
  const flush = () => {
    if (current !== null) sections.set(current, buffer.join('\n').trim())
    buffer = []
  }
  for (const line of lines) {
    const m = line.match(/^#{1,6}\s+(.*?)\s*$/)
    if (m) {
      flush()
      current = m[1].toLowerCase().replace(/[`*_]/g, '').trim()
    } else if (current !== null) {
      buffer.push(line)
    }
  }
  flush()
  return sections
}

/** True when a section body is empty or only a template placeholder (e.g. `_..._`, `TBD`). */
function isPlaceholder(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  if (/^tbd$/i.test(t)) return true
  // Single italic prompt line: _..._  (the templates use these as guidance)
  if (/^_[^_]*_$/.test(t) && !t.includes('\n')) return true
  return false
}

function sectionText(sections: Map<string, string>, headings: string[]): string | null {
  for (const h of headings) {
    const body = sections.get(h)
    if (body != null && !isPlaceholder(body)) return body.trim()
  }
  return null
}

function sectionBullets(sections: Map<string, string>, headings: string[]): string[] {
  for (const h of headings) {
    const body = sections.get(h)
    if (body == null || isPlaceholder(body)) continue
    const bullets = extractBullets(body)
    if (bullets.length > 0) return bullets.map((b) => b.text)
  }
  return []
}

type Bullet = { text: string; checked: boolean | null }

function extractBullets(body: string): Bullet[] {
  const out: Bullet[] = []
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*[-*+]\s+(.*)$/)
    if (!m) continue
    let text = m[1].trim()
    let checked: boolean | null = null
    const cb = text.match(/^\[([ xX])\]\s*(.*)$/)
    if (cb) {
      checked = cb[1].toLowerCase() === 'x'
      text = cb[2].trim()
    }
    if (!text || isPlaceholder(text)) continue
    out.push({ text, checked })
  }
  return out
}

function parseAcceptanceCriteria(sections: Map<string, string>): AcceptanceCriterion[] {
  const body = sections.get('acceptance criteria')
  if (body == null || isPlaceholder(body)) return []
  return extractBullets(body).map((b) => ({ text: b.text, checked: b.checked }))
}

// --- Frontmatter-derived structures ------------------------------------------

function normalizeCoverage(
  mc: Record<string, { status: string; reason?: string }> | null,
): CoverageEntry[] {
  if (!mc) return []
  return Object.entries(mc).map(([id, v]) => ({ id, status: v.status, ...(v.reason ? { reason: v.reason } : {}) }))
}

function normalizeImpact(
  ia: Record<string, { status: string; reason?: string; question?: string }> | null,
): ImpactEntry[] {
  if (!ia) return []
  return Object.entries(ia).map(([surface, v]) => ({
    surface,
    status: v.status,
    ...(v.reason ? { reason: v.reason } : {}),
    ...(v.question ? { question: v.question } : {}),
  }))
}

function optStr(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return undefined
}

function parseEvidence(fm: Record<string, unknown>): EvidenceRepo[] {
  const evidence = fm.implementation_evidence as { repositories?: Record<string, unknown> } | undefined
  const repos = evidence?.repositories
  if (!repos || typeof repos !== 'object' || Array.isArray(repos)) return []
  const out: EvidenceRepo[] = []
  for (const [module, val] of Object.entries(repos)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue
    const d = val as Record<string, unknown>
    const validations = Array.isArray(d.validations)
      ? (d.validations as Record<string, unknown>[]).map((v) => ({
          command: String(v.command ?? ''),
          status: String(v.status ?? 'unknown'),
          ...(optStr(v.reason) ? { reason: optStr(v.reason) } : {}),
        }))
      : []
    const migrations = Array.isArray(d.migrations)
      ? (d.migrations as Record<string, unknown>[]).map((m) => ({
          id: String(m.id ?? ''),
          environment: String(m.environment ?? ''),
          status: String(m.status ?? 'unknown'),
          ...(optStr(m.reason) ? { reason: optStr(m.reason) } : {}),
        }))
      : []
    out.push({
      module,
      role: String(d.role ?? (module === 'core' ? 'core' : 'module')),
      status: String(d.status ?? 'unknown'),
      changedPaths: Array.isArray(d.changed_paths) ? d.changed_paths.map(String).filter(Boolean) : [],
      validations,
      migrations,
    })
  }
  return out
}

function parseReleaseGates(fm: Record<string, unknown>): ReleaseGateEntry[] {
  if (!Array.isArray(fm.release_gates)) return []
  return (fm.release_gates as Record<string, unknown>[])
    .filter((g) => g && typeof g === 'object')
    .map((g) => ({
      id: String(g.id ?? ''),
      status: String(g.status ?? 'pending'),
      ...(optStr(g.reason) ? { reason: optStr(g.reason) } : {}),
      ...(optStr(g.required_for) ? { requiredFor: optStr(g.required_for) } : {}),
    }))
}

function parseExceptions(fm: Record<string, unknown>): CompletionExceptionEntry[] {
  if (!Array.isArray(fm.completion_exceptions)) return []
  return (fm.completion_exceptions as Record<string, unknown>[])
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      id: String(e.id ?? ''),
      status: String(e.status ?? 'proposed'),
      ...(optStr(e.reason) ? { reason: optStr(e.reason) } : {}),
      ...(optStr(e.category) ? { category: optStr(e.category) } : {}),
      ...(optStr(e.impact) ? { impact: optStr(e.impact) } : {}),
    }))
}

function parseDecisions(
  decisions: string[],
  knowledgeById: Map<string, KnowledgeArtifact>,
): LinkedDecision[] {
  return decisions.map((id) => {
    const k = knowledgeById.get(id)
    return {
      id,
      ...(k?.title ? { title: k.title } : {}),
      ...(k ? { knowledgeId: k.id, knowledgeLayer: k.layer } : {}),
    }
  })
}

function parseRelatedKnowledge(
  fm: Record<string, unknown>,
  knowledgeById: Map<string, KnowledgeArtifact>,
): LinkedKnowledge[] {
  const refs = new Set<string>()
  for (const field of ['related_knowledge', 'knowledge', 'related']) {
    const v = fm[field]
    if (Array.isArray(v)) for (const r of v) if (typeof r === 'string' && r.trim()) refs.add(r.trim())
  }
  const out: LinkedKnowledge[] = []
  for (const ref of refs) {
    const k = knowledgeById.get(ref)
    if (k && k.id) out.push({ id: k.id, title: k.title || k.id, layer: k.layer })
  }
  return out
}
