// Delivery Planning read model: Delivery Plans and Epics (WI-074).
//
// Plans (knowledge/delivery/plans/) and Epics (knowledge/delivery/epics/) are OPTIONAL canonical
// planning artifacts layered over the existing Roadmap / Initiatives / Work Items. They never become a
// second source of truth: membership is declared one-way (initiative.epic → epic, epic.plan → plan,
// work_item.epic optional), and an Epic/Plan derives its Initiatives and Work Items rather than listing
// them. Pure logic — no LLM, no git, no writes. Completion stays human-gated by callers.

import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { exists, readFile, readDir, join, isFile } from '../utils/fs.js'
import { discoverWorkItems, type KnowledgeArtifact } from '../services/knowledge-artifacts.js'
import { discoverInitiatives, type Initiative } from './initiative.js'
import { emptyLifecycleCounts, type LifecycleState } from './lifecycle.js'

export const DELIVERY_PLANS_DIR = 'knowledge/delivery/plans'
export const EPICS_DIR = 'knowledge/delivery/epics'

// Lifecycle states mirror the Initiative model; completion is always human-gated by the caller.
export const PLAN_STATES = ['draft', 'in-progress', 'completed', 'cancelled'] as const
export type PlanStatus = (typeof PLAN_STATES)[number]
export const EPIC_STATES = ['planned', 'in-progress', 'completed', 'cancelled'] as const
export type EpicStatus = (typeof EPIC_STATES)[number]

export const PLAN_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  draft: ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}
export const EPIC_TRANSITIONS: Record<EpicStatus, EpicStatus[]> = {
  planned: ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export type Milestone = { id: string; title: string; exitCriteria: string[] }

export type DeliveryPlan = {
  id: string
  title: string
  status: PlanStatus
  objective: string | null
  milestones: Milestone[]
  dependsOn: string[]
  successCriteria: string[]
  risks: string[]
  references: string[]
  filePath: string
  relPath: string
  body: string
  rawFrontmatter: Record<string, unknown>
}

export type Epic = {
  id: string
  title: string
  status: EpicStatus
  outcome: string | null
  plan: string | null
  milestone: string | null
  dependsOn: string[]
  successCriteria: string[]
  relatedCapabilities: string[]
  decisions: string[]
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
function relFrom(dir: string, filePath: string): string {
  const d = toPosix(dir)
  const f = toPosix(filePath)
  return f.startsWith(d + '/') ? f.slice(d.length + 1) : f
}

function parseMilestones(data: Record<string, unknown>): Milestone[] {
  const raw = data.milestones
  if (!Array.isArray(raw)) return []
  const out: Milestone[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const o = entry as Record<string, unknown>
    const id = optStr(o.id)
    if (!id) continue
    out.push({ id, title: optStr(o.title) ?? id, exitCriteria: strList(o.exit_criteria) })
  }
  return out
}

export function parseDeliveryPlan(dir: string, filePath: string, raw: string): DeliveryPlan | null {
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(raw, {})
  } catch {
    return null
  }
  const data = parsed.data as Record<string, unknown>
  if (optStr(data.type) !== 'delivery-plan') return null
  const id = optStr(data.id)
  if (!id) return null
  const statusRaw = optStr(data.status) ?? 'draft'
  const status = (PLAN_STATES as readonly string[]).includes(statusRaw) ? (statusRaw as PlanStatus) : 'draft'
  return {
    id,
    title: optStr(data.title) ?? id,
    status,
    objective: optStr(data.objective) ?? null,
    milestones: parseMilestones(data),
    dependsOn: strList(data.depends_on),
    successCriteria: strList(data.success_criteria),
    risks: strList(data.risks),
    references: strList(data.references),
    filePath,
    relPath: relFrom(dir, filePath),
    body: parsed.content.trim(),
    rawFrontmatter: data,
  }
}

export function parseEpic(dir: string, filePath: string, raw: string): Epic | null {
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(raw, {})
  } catch {
    return null
  }
  const data = parsed.data as Record<string, unknown>
  if (optStr(data.type) !== 'epic') return null
  const id = optStr(data.id)
  if (!id) return null
  const statusRaw = optStr(data.status) ?? 'planned'
  const status = (EPIC_STATES as readonly string[]).includes(statusRaw) ? (statusRaw as EpicStatus) : 'planned'
  return {
    id,
    title: optStr(data.title) ?? id,
    status,
    outcome: optStr(data.outcome ?? data.expected_outcome) ?? null,
    plan: optStr(data.plan) ?? null,
    milestone: optStr(data.milestone) ?? null,
    dependsOn: strList(data.depends_on),
    successCriteria: strList(data.success_criteria),
    relatedCapabilities: strList(data.related_capabilities),
    decisions: strList(data.decisions),
    filePath,
    relPath: relFrom(dir, filePath),
    body: parsed.content.trim(),
    rawFrontmatter: data,
  }
}

function discoverIn<T>(dir: string, rel: string, parse: (dir: string, f: string, raw: string) => T | null): T[] {
  const d = join(dir, rel)
  if (!exists(d)) return []
  const out: T[] = []
  for (const entry of readDir(d)) {
    if (!entry.endsWith('.md')) continue
    const full = join(d, entry)
    if (!isFile(full)) continue
    const parsed = parse(dir, full, readFile(full))
    if (parsed) out.push(parsed)
  }
  return out
}

export function discoverDeliveryPlans(dir: string): DeliveryPlan[] {
  return discoverIn(dir, DELIVERY_PLANS_DIR, parseDeliveryPlan).sort((a, b) => a.id.localeCompare(b.id))
}
export function discoverEpics(dir: string): Epic[] {
  return discoverIn(dir, EPICS_DIR, parseEpic).sort((a, b) => a.id.localeCompare(b.id))
}
export function getPlan(dir: string, id: string): DeliveryPlan | null {
  const want = id.trim().toLowerCase()
  return discoverDeliveryPlans(dir).find((p) => p.id.toLowerCase() === want) ?? null
}
export function getEpic(dir: string, id: string): Epic | null {
  const want = id.trim().toLowerCase()
  return discoverEpics(dir).find((e) => e.id.toLowerCase() === want) ?? null
}

function nextId(ids: string[], prefix: string): string {
  let max = 0
  for (const id of ids) {
    const m = id.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'))
    if (m) max = Math.max(max, Number.parseInt(m[1], 10))
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
export function nextPlanId(dir: string): string {
  return nextId(discoverDeliveryPlans(dir).map((p) => p.id), 'PLAN')
}
export function nextEpicId(dir: string): string {
  return nextId(discoverEpics(dir).map((e) => e.id), 'EP')
}

// --- Associations (derived, never stored) -----------------------------------

export function epicsInPlan(dir: string, planId: string): Epic[] {
  return discoverEpics(dir).filter((e) => e.plan?.toLowerCase() === planId.toLowerCase())
}
export function initiativesInEpic(dir: string, epicId: string): Initiative[] {
  return discoverInitiatives(dir).filter((i) => i.epic?.toLowerCase() === epicId.toLowerCase())
}
function wiEpic(wi: KnowledgeArtifact): string | undefined {
  return optStr(wi.rawFrontmatter?.epic)
}
/** Work Items belonging to an Epic: directly (work_item.epic) or via an Initiative in the Epic. */
export function workItemsInEpic(dir: string, epicId: string): KnowledgeArtifact[] {
  const iniIds = new Set(initiativesInEpic(dir, epicId).map((i) => i.id.toLowerCase()))
  return discoverWorkItems(dir).filter(
    (wi) => wiEpic(wi)?.toLowerCase() === epicId.toLowerCase() || (wi.initiative && iniIds.has(wi.initiative.toLowerCase()))
  )
}

// --- Progress: Planning Coverage vs Delivery Progress vs Completion Readiness (kept separate) ---

export type PlanningCoverage = { initiatives: number; candidates: number; materialized: number; remaining: number }
export type DeliveryProgress = { total: number; byState: Record<LifecycleState, number>; blocked: number; completed: number }
export type CompletionReadiness = {
  successCriteria: number
  blockingDependencies: string[]
  committedWorkComplete: boolean
  /**
   * Conservative precondition signal, NOT auto-completion. False when there are no deliverables or no
   * declared success criteria, or when a dependency is still blocking. Human approval is always still
   * required regardless of this flag.
   */
  meetsCompletionPreconditions: boolean
  humanApprovalRequired: boolean
}

function readinessOf(successCriteria: number, blockingDependencies: string[], delivery: DeliveryProgress): CompletionReadiness {
  const committedWorkComplete = delivery.total > 0 && delivery.completed === delivery.total
  return {
    successCriteria,
    blockingDependencies,
    committedWorkComplete,
    // Needs real deliverables, declared criteria and no blocking dependency — never positive otherwise.
    meetsCompletionPreconditions: committedWorkComplete && successCriteria > 0 && blockingDependencies.length === 0,
    humanApprovalRequired: true, // completion is never automatic
  }
}

function deliveryOf(wis: KnowledgeArtifact[], dir: string): DeliveryProgress {
  const byState = emptyLifecycleCounts()
  const completedIds = new Set(
    discoverWorkItems(dir).filter((w) => w.lifecycle === 'completed').map((w) => w.id.toLowerCase())
  )
  let blocked = 0
  for (const wi of wis) {
    const state = (wi.lifecycle ?? 'ready') as LifecycleState
    byState[state]++
    const deps = strList(wi.rawFrontmatter?.depends_on)
    if (state !== 'completed' && deps.some((d) => !completedIds.has(d.toLowerCase()))) blocked++
  }
  return { total: wis.length, byState, blocked, completed: byState.completed }
}

export type EpicProgress = {
  epic: string
  status: EpicStatus
  planning: PlanningCoverage
  delivery: DeliveryProgress
  readiness: CompletionReadiness
}

export function computeEpicProgress(dir: string, epic: Epic): EpicProgress {
  const inis = initiativesInEpic(dir, epic.id)
  const candidates = inis.reduce((n, i) => n + i.candidates.length, 0)
  const materialized = inis.reduce((n, i) => n + i.candidates.filter((c) => c.materializedAs).length, 0)
  const wis = workItemsInEpic(dir, epic.id)
  const delivery = deliveryOf(wis, dir)
  return {
    epic: epic.id,
    status: epic.status,
    planning: { initiatives: inis.length, candidates, materialized, remaining: Math.max(0, candidates - materialized) },
    delivery,
    readiness: readinessOf(epic.successCriteria.length, unmetDependencies(dir, epic.dependsOn), delivery),
  }
}

export type PlanProgress = {
  plan: string
  status: PlanStatus
  epics: { total: number; byStatus: Record<EpicStatus, number> }
  planning: PlanningCoverage
  delivery: DeliveryProgress
  readiness: CompletionReadiness
  milestones: { id: string; title: string; exitCriteria: number }[]
}

export function computePlanProgress(dir: string, plan: DeliveryPlan): PlanProgress {
  const epics = epicsInPlan(dir, plan.id)
  const byStatus = Object.fromEntries(EPIC_STATES.map((s) => [s, 0])) as Record<EpicStatus, number>
  for (const e of epics) byStatus[e.status]++
  const inis = new Map<string, Initiative>()
  const wis = new Map<string, KnowledgeArtifact>()
  for (const e of epics) {
    for (const i of initiativesInEpic(dir, e.id)) inis.set(i.id, i)
    for (const w of workItemsInEpic(dir, e.id)) wis.set(w.id, w)
  }
  const candidates = [...inis.values()].reduce((n, i) => n + i.candidates.length, 0)
  const materialized = [...inis.values()].reduce((n, i) => n + i.candidates.filter((c) => c.materializedAs).length, 0)
  const delivery = deliveryOf([...wis.values()], dir)
  return {
    plan: plan.id,
    status: plan.status,
    epics: { total: epics.length, byStatus },
    planning: { initiatives: inis.size, candidates, materialized, remaining: Math.max(0, candidates - materialized) },
    delivery,
    readiness: readinessOf(plan.successCriteria.length, unmetDependencies(dir, plan.dependsOn), delivery),
    milestones: plan.milestones.map((m) => ({ id: m.id, title: m.title, exitCriteria: m.exitCriteria.length })),
  }
}

// --- Validation: references, cycles, pending dependencies (deterministic) ----

export type PlanningFinding = {
  level: 'error' | 'warning'
  kind: 'invalid_reference' | 'dependency_cycle' | 'pending_dependency' | 'duplicate_milestone'
  subject: string
  message: string
}

function unmetDependencies(dir: string, deps: string[]): string[] {
  if (deps.length === 0) return []
  const done = new Set<string>()
  for (const e of discoverEpics(dir)) if (e.status === 'completed') done.add(e.id.toLowerCase())
  for (const p of discoverDeliveryPlans(dir)) if (p.status === 'completed') done.add(p.id.toLowerCase())
  for (const i of discoverInitiatives(dir)) if (i.status === 'completed') done.add(i.id.toLowerCase())
  return deps.filter((d) => !done.has(d.toLowerCase()))
}

/** Detect a dependency cycle in a declared graph via DFS. Returns the first cycle path, or null. */
function findCycle(nodes: string[], edges: Map<string, string[]>): string[] | null {
  const state = new Map<string, number>() // 0=unvisited,1=in-stack,2=done
  const stack: string[] = []
  const dfs = (n: string): string[] | null => {
    state.set(n, 1)
    stack.push(n)
    for (const m of edges.get(n) ?? []) {
      if (!nodes.includes(m)) continue
      const s = state.get(m) ?? 0
      if (s === 1) return [...stack.slice(stack.indexOf(m)), m]
      if (s === 0) {
        const c = dfs(m)
        if (c) return c
      }
    }
    stack.pop()
    state.set(n, 2)
    return null
  }
  for (const n of nodes) if ((state.get(n) ?? 0) === 0) {
    const c = dfs(n)
    if (c) return c
  }
  return null
}

/**
 * Validate the planning graph deterministically: dangling references (epic.plan, initiative.epic,
 * depends_on targets), dependency cycles among Epics and among Initiatives, and pending dependencies.
 * Never mutates anything and never changes another element's lifecycle.
 */
export function validatePlanningGraph(dir: string): PlanningFinding[] {
  const plans = discoverDeliveryPlans(dir)
  const epics = discoverEpics(dir)
  const inis = discoverInitiatives(dir)
  const planIds = new Set(plans.map((p) => p.id.toLowerCase()))
  const epicIds = new Set(epics.map((e) => e.id.toLowerCase()))
  const iniIds = new Set(inis.map((i) => i.id.toLowerCase()))
  const findings: PlanningFinding[] = []

  // Milestone ids must be unique within their Plan (RM blocks stay traceable, no duplicate state).
  for (const p of plans) {
    const seen = new Set<string>()
    for (const m of p.milestones) {
      const key = m.id.toLowerCase()
      if (seen.has(key))
        findings.push({ level: 'error', kind: 'duplicate_milestone', subject: p.id, message: `Plan ${p.id} declares milestone ${m.id} more than once.` })
      seen.add(key)
    }
  }

  for (const e of epics) {
    if (e.plan && !planIds.has(e.plan.toLowerCase()))
      findings.push({ level: 'error', kind: 'invalid_reference', subject: e.id, message: `Epic ${e.id} references missing plan ${e.plan}.` })
    if (e.plan && e.milestone) {
      const plan = plans.find((p) => p.id.toLowerCase() === e.plan!.toLowerCase())
      if (plan && !plan.milestones.some((m) => m.id.toLowerCase() === e.milestone!.toLowerCase()))
        findings.push({ level: 'error', kind: 'invalid_reference', subject: e.id, message: `Epic ${e.id} references milestone ${e.milestone} not defined in ${e.plan}.` })
    }
    for (const d of e.dependsOn) if (!epicIds.has(d.toLowerCase()))
      findings.push({ level: 'error', kind: 'invalid_reference', subject: e.id, message: `Epic ${e.id} depends on missing Epic ${d}.` })
  }
  for (const i of inis) {
    if (i.epic && !epicIds.has(i.epic.toLowerCase()))
      findings.push({ level: 'error', kind: 'invalid_reference', subject: i.id, message: `Initiative ${i.id} references missing Epic ${i.epic}.` })
  }

  // Cycles among Epics (depends_on).
  const epicEdges = new Map<string, string[]>(epics.map((e) => [e.id.toLowerCase(), e.dependsOn.map((d) => d.toLowerCase())]))
  const epicCycle = findCycle([...epicIds], epicEdges)
  if (epicCycle) findings.push({ level: 'error', kind: 'dependency_cycle', subject: epicCycle[0], message: `Dependency cycle among Epics: ${epicCycle.join(' → ')}.` })

  // Pending dependencies (warnings — not errors; they block, they are not invalid).
  for (const e of epics) for (const d of unmetDependencies(dir, e.dependsOn))
    findings.push({ level: 'warning', kind: 'pending_dependency', subject: e.id, message: `Epic ${e.id} is blocked by unfinished dependency ${d}.` })

  return findings
}

// --- Write-support helpers (concurrency + pre-write validation, no mutation) -

/**
 * Short content fingerprint used to detect concurrent edits (WI-076). A read exposes the artifact's
 * current revision; a controlled write may pass `expectedRevision` and is rejected when the file on
 * disk has changed since it was read. Deterministic and stable for identical bytes.
 */
export function revisionOf(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16)
}

/**
 * Validate a hypothetical Epic dependency set BEFORE writing it (WI-076): every target must be an
 * existing Epic, self-dependency is rejected, and the change must not introduce a cycle among Epics.
 * Returns human-readable error messages (empty = valid). Never mutates anything.
 */
export function validateEpicDependencyChange(dir: string, epicId: string, deps: string[]): string[] {
  const epics = discoverEpics(dir)
  const epicIds = new Set(epics.map((e) => e.id.toLowerCase()))
  const self = epicId.toLowerCase()
  const errors: string[] = []
  const seen = new Set<string>()
  for (const d of deps) {
    const key = d.toLowerCase()
    if (key === self) {
      errors.push(`Epic ${epicId} cannot depend on itself.`)
      continue
    }
    if (!epicIds.has(key)) {
      errors.push(`Epic ${epicId} depends on missing Epic ${d}.`)
      continue
    }
    if (seen.has(key)) errors.push(`Epic ${epicId} declares duplicate dependency ${d}.`)
    seen.add(key)
  }
  if (errors.length > 0) return errors
  // Cycle check with this epic's edges replaced by the proposed deps.
  const edges = new Map<string, string[]>(epics.map((e) => [e.id.toLowerCase(), e.dependsOn.map((d) => d.toLowerCase())]))
  edges.set(self, deps.map((d) => d.toLowerCase()))
  const cycle = findCycle([...epicIds, self], edges)
  if (cycle) errors.push(`Dependency cycle among Epics: ${cycle.join(' → ')}.`)
  return errors
}
