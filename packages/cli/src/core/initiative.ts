// Initiative read model and lifecycle (WI-018).
//
// Initiatives are first-class delivery artifacts under knowledge/delivery/initiatives/. They are an
// OPTIONAL traceability layer over Work Items: a Work Item never requires an Initiative. This module
// owns the read model, lifecycle, candidate model, Work Item association resolution and progress
// computation. Pure logic — no LLM, no git, no writes. Writes live in initiative-write.ts.

import matter from 'gray-matter'
import { exists, readFile, readDir, join, isFile } from '../utils/fs.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { emptyLifecycleCounts, type LifecycleState } from './lifecycle.js'

export const INITIATIVES_DIR = 'knowledge/delivery/initiatives'

export const INITIATIVE_STATES = [
  'candidate',
  'planned',
  'in-progress',
  'completed',
  'deferred',
  'cancelled',
] as const

export type InitiativeStatus = (typeof INITIATIVE_STATES)[number]

/** Valid Initiative lifecycle transitions. Completion to `completed` stays human-gated by callers. */
export const INITIATIVE_TRANSITIONS: Record<InitiativeStatus, InitiativeStatus[]> = {
  candidate: ['planned', 'cancelled'],
  planned: ['in-progress', 'deferred', 'cancelled'],
  'in-progress': ['completed', 'deferred', 'cancelled'],
  deferred: ['planned', 'cancelled'],
  completed: [],
  cancelled: [],
}

const STATUS_SET = new Set<string>(INITIATIVE_STATES)

export function isValidInitiativeStatus(s: string): s is InitiativeStatus {
  return STATUS_SET.has(s)
}

export function isValidInitiativeTransition(from: InitiativeStatus, to: InitiativeStatus): boolean {
  return INITIATIVE_TRANSITIONS[from].includes(to)
}

export type InitiativeCandidate = {
  id: string
  title: string
  type?: string
  suggestedKnowledgeLevel?: string
  expectedValue?: string
  notes?: string
  sourceSignals: string[]
  dependencies: string[]
  /** The Work Item id this candidate was materialized into, or null when still a candidate. */
  materializedAs: string | null
}

export type InitiativeExternalLink = {
  integration: string
  externalId: string
  externalType?: string
  url?: string
}

export type Initiative = {
  id: string
  title: string
  status: InitiativeStatus
  horizon: string | null
  priority: string | null
  knowledgeLevel: string | null
  domains: string[]
  relatedCapabilities: string[]
  source: string | null
  sourceId: string | null
  createdAt: string | null
  externalLinks: InitiativeExternalLink[]
  candidates: InitiativeCandidate[]
  filePath: string
  relPath: string
  body: string
  rawFrontmatter: Record<string, unknown>
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function optStr(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'number') return String(v)
  return undefined
}

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean)
}

function parseCandidates(data: Record<string, unknown>): InitiativeCandidate[] {
  const raw = data.candidates
  if (!Array.isArray(raw)) return []
  const out: InitiativeCandidate[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const o = entry as Record<string, unknown>
    const id = optStr(o.id)
    const title = optStr(o.title)
    if (!id || !title) continue
    out.push({
      id,
      title,
      type: optStr(o.type),
      suggestedKnowledgeLevel: optStr(o.suggested_knowledge_level ?? o.knowledge_level),
      expectedValue: optStr(o.expected_value),
      notes: optStr(o.notes),
      sourceSignals: strList(o.source_signals),
      dependencies: strList(o.dependencies),
      materializedAs: optStr(o.materialized_as) ?? null,
    })
  }
  return out
}

function parseExternalLinks(data: Record<string, unknown>): InitiativeExternalLink[] {
  const raw = data.external_links
  if (!Array.isArray(raw)) return []
  const out: InitiativeExternalLink[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const o = entry as Record<string, unknown>
    const integration = optStr(o.integration)
    const externalId = optStr(o.external_id)
    if (!integration || !externalId) continue
    out.push({
      integration,
      externalId,
      externalType: optStr(o.external_type),
      url: optStr(o.url),
    })
  }
  return out
}

/** Parse a single Initiative artifact from raw markdown. Returns null if it is not an initiative. */
export function parseInitiative(dir: string, filePath: string, raw: string): Initiative | null {
  let parsed: matter.GrayMatterFile<string>
  try {
    // Pass options to bypass gray-matter's content-keyed cache: write paths mutate the returned
    // `data`, and two byte-identical artifacts would otherwise share (and corrupt) one cache entry.
    parsed = matter(raw, {})
  } catch {
    return null
  }
  const data = parsed.data as Record<string, unknown>
  if (optStr(data.type) !== 'initiative') return null
  const id = optStr(data.id)
  if (!id) return null

  const statusRaw = optStr(data.status) ?? 'planned'
  const status: InitiativeStatus = isValidInitiativeStatus(statusRaw) ? statusRaw : 'planned'

  return {
    id,
    title: optStr(data.title) ?? id,
    status,
    horizon: optStr(data.horizon) ?? null,
    priority: optStr(data.priority) ?? null,
    knowledgeLevel: optStr(data.knowledge_level) ?? null,
    domains: strList(data.domains),
    relatedCapabilities: strList(data.related_capabilities),
    source: optStr(data.source) ?? null,
    sourceId: optStr(data.source_id) ?? null,
    createdAt: optStr(data.created_at) ?? null,
    externalLinks: parseExternalLinks(data),
    candidates: parseCandidates(data),
    filePath,
    relPath: toPosix(filePath).startsWith(toPosix(dir) + '/')
      ? toPosix(filePath).slice(toPosix(dir).length + 1)
      : toPosix(filePath),
    body: parsed.content.trim(),
    rawFrontmatter: data,
  }
}

/** Discover every Initiative artifact under knowledge/delivery/initiatives/. */
export function discoverInitiatives(dir: string): Initiative[] {
  const iniDir = join(dir, INITIATIVES_DIR)
  if (!exists(iniDir)) return []
  const out: Initiative[] = []
  for (const entry of readDir(iniDir)) {
    if (!entry.endsWith('.md')) continue
    const full = join(iniDir, entry)
    if (!isFile(full)) continue
    const ini = parseInitiative(dir, full, readFile(full))
    if (ini) out.push(ini)
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

/** Resolve one Initiative by id (case-insensitive), or null. */
export function getInitiative(dir: string, id: string): Initiative | null {
  const want = id.trim().toLowerCase()
  return discoverInitiatives(dir).find((i) => i.id.toLowerCase() === want) ?? null
}

/** Highest INI-NNN across the initiatives directory + 1, zero-padded. Deterministic, collision-safe. */
export function nextInitiativeId(dir: string): string {
  const iniDir = join(dir, INITIATIVES_DIR)
  let max = 0
  if (exists(iniDir)) {
    for (const entry of readDir(iniDir)) {
      const m = entry.match(/INI-(\d+)/)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
  }
  return `INI-${String(max + 1).padStart(3, '0')}`
}

/** True when a Work Item is explicitly associated to the given Initiative id (by metadata). */
export function workItemBelongsToInitiative(workItemInitiative: string | undefined, iniId: string): boolean {
  const v = (workItemInitiative ?? '').trim().toLowerCase()
  return v !== '' && v === iniId.trim().toLowerCase()
}

export type AssociatedWorkItem = { id: string; title: string; status: LifecycleState }

/** Work Items explicitly associated to an Initiative, resolved from the Work Item artifacts. */
export function associatedWorkItems(dir: string, iniId: string): AssociatedWorkItem[] {
  return discoverWorkItems(dir)
    .filter((wi) => workItemBelongsToInitiative(wi.initiative, iniId))
    .map((wi) => ({
      id: wi.id,
      title: wi.title,
      status: (wi.lifecycle ?? 'ready') as LifecycleState,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

export type InitiativePlanning = {
  totalCandidates: number
  materialized: number
  remaining: number
}

export type InitiativeDelivery = {
  total: number
  byState: Record<LifecycleState, number>
}

export type InitiativeProgress = {
  initiative: string
  status: InitiativeStatus
  planning: InitiativePlanning
  delivery: InitiativeDelivery
}

/**
 * Compute planning coverage (candidates materialized vs total) and delivery progress (associated
 * Work Items by lifecycle state). Planning and delivery are kept separate on purpose — no single
 * arbitrary percentage, and no assumption that all Work Items carry equal weight.
 */
export function computeInitiativeProgress(dir: string, ini: Initiative): InitiativeProgress {
  const totalCandidates = ini.candidates.length
  const materialized = ini.candidates.filter((c) => c.materializedAs).length

  const byState = emptyLifecycleCounts()
  const associated = associatedWorkItems(dir, ini.id)
  for (const wi of associated) byState[wi.status]++

  return {
    initiative: ini.id,
    status: ini.status,
    planning: {
      totalCandidates,
      materialized,
      remaining: Math.max(0, totalCandidates - materialized),
    },
    delivery: {
      total: associated.length,
      byState,
    },
  }
}

export type InitiativeContext = {
  initiative: {
    id: string
    title: string
    status: InitiativeStatus
    horizon: string | null
    priority: string | null
    knowledgeLevel: string | null
    domains: string[]
    relatedCapabilities: string[]
    source: string | null
    sourceId: string | null
  }
  progress: InitiativeProgress
  candidates: {
    total: number
    materialized: InitiativeCandidate[]
    pending: InitiativeCandidate[]
  }
  workItems: AssociatedWorkItem[]
  externalLinks: InitiativeExternalLink[]
}

/**
 * Assemble a focused, initiative-scoped context for analysis. Proportional by design: it carries
 * the Initiative, its progress, candidates (split materialized/pending), associated Work Items and
 * external links — never the whole project. Callers (CLI/MCP) present this; richer knowledge
 * assembly (business/product/graph) is layered in a later Work Item.
 */
export function getInitiativeContext(dir: string, ini: Initiative): InitiativeContext {
  return {
    initiative: {
      id: ini.id,
      title: ini.title,
      status: ini.status,
      horizon: ini.horizon,
      priority: ini.priority,
      knowledgeLevel: ini.knowledgeLevel,
      domains: ini.domains,
      relatedCapabilities: ini.relatedCapabilities,
      source: ini.source,
      sourceId: ini.sourceId,
    },
    progress: computeInitiativeProgress(dir, ini),
    candidates: {
      total: ini.candidates.length,
      materialized: ini.candidates.filter((c) => c.materializedAs),
      pending: ini.candidates.filter((c) => !c.materializedAs),
    },
    workItems: associatedWorkItems(dir, ini.id),
    externalLinks: ini.externalLinks,
  }
}
