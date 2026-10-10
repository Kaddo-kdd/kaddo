// Controlled Deprecation — Core Model (WI-047, slice A of WI-046).
//
// A Deprecation Plan (DEP-xxx) is a first-class, versionable artifact under
// knowledge/legacy/deprecations/ that orchestrates the safe, traceable retirement of legacy
// functionality. It does NOT replace Work Items (the plan orchestrates; WIs execute) and it never
// executes anything — this module is read + validation only. Mutation lives in the CLI/MCP slice (C).
//
// Each plan carries typed Deprecation Targets (DEP-TGT-xxx): the unit of analysis and tracking. A
// target has a global lifecycle state AND an independent per-environment state (development/test/
// production), because Dev/Test retirement must never be confused with a production change.
//
// Guiding principle (enforced here as validation, not inference): absence of a code reference is NOT
// evidence of no usage, and a target is never globally "completed" while any environment is still
// active. Soft deprecation precedes physical decommission.

import matter from 'gray-matter'
import { readFile } from '../utils/fs.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'

export const DEPRECATION_ARTIFACT_TYPE = 'deprecation-plan'
export const DEPRECATION_PLANS_DIR = 'knowledge/legacy/deprecations'

/** The kind of thing being retired. The `locator` shape depends on this (a route is not a file). */
export const TARGET_TYPES = [
  'module', 'route', 'function', 'ui', 'job', 'database-object', 'integration', 'config', 'other',
] as const
export type DeprecationTargetType = (typeof TARGET_TYPES)[number]

/**
 * Global lifecycle of a target. Soft deprecation always precedes physical removal; `deprecated-
 * retained` is a terminal outcome for things that must not be used but must be kept (audit/legal/
 * historical/reporting/support).
 */
export const LIFECYCLE_STATES = [
  'candidate',
  'usage-validated',
  'soft-deprecated',
  'disabled',
  'removed-devtest',
  'production-ready',
  'production-changed',
  'observing',
  'completed',
  'deprecated-retained',
] as const
export type DeprecationLifecycleState = (typeof LIFECYCLE_STATES)[number]

/** Allowed forward transitions. `completed` and `deprecated-retained` are terminal. */
export const LIFECYCLE_TRANSITIONS: Record<DeprecationLifecycleState, DeprecationLifecycleState[]> = {
  candidate: ['usage-validated', 'deprecated-retained'],
  'usage-validated': ['soft-deprecated', 'deprecated-retained'],
  'soft-deprecated': ['disabled', 'deprecated-retained'],
  disabled: ['removed-devtest', 'deprecated-retained'],
  'removed-devtest': ['production-ready', 'deprecated-retained'],
  'production-ready': ['production-changed'],
  'production-changed': ['observing'],
  observing: ['completed', 'deprecated-retained'],
  completed: [],
  'deprecated-retained': [],
}

export const ENVIRONMENTS = ['development', 'test', 'production'] as const
export type DeprecationEnvironment = (typeof ENVIRONMENTS)[number]

/** Per-environment state, independent of the global lifecycle. */
export const ENVIRONMENT_STATES = ['active', 'soft-deprecated', 'disabled', 'removed'] as const
export type EnvironmentState = (typeof ENVIRONMENT_STATES)[number]

/**
 * Orientative assessments. Free-form strings (e.g. "high" / "low" / a short note) so the schema can
 * grow without a release, and so missing evidence stays `null` rather than being faked as a score.
 */
export type TargetAssessment = {
  unusedConfidence: string | null
  blastRadius: string | null
  reversibility: string | null
}

// --- Usage evidence (WI-048) -------------------------------------------------
// Evidence is collected per signal and never collapsed: "no reference found" (absence) is NOT
// "no usage". Each signal records what was observed (its usage reading) AND the quality of that
// reading, keeping `unknown` and `not-evaluated` first-class so they can never silently become
// `no-usage`.

/** The sources a usage reading can come from. */
export const EVIDENCE_SIGNALS = [
  'static', 'runtime', 'database', 'external_consumers', 'human_review',
] as const
export type EvidenceSignalName = (typeof EVIDENCE_SIGNALS)[number]

/** What a signal observed about usage. `not-evaluated` ≠ `unknown` ≠ `no-usage`. */
export const USAGE_STATUSES = ['no-usage', 'usage-found', 'unknown', 'not-evaluated'] as const
export type UsageStatus = (typeof USAGE_STATUSES)[number]

/** How trustworthy the reading is. `inferred` is weaker than an observed fact. */
export const EVIDENCE_QUALITIES = ['observed-fact', 'human-confirmed', 'inferred', 'unknown'] as const
export type EvidenceQuality = (typeof EVIDENCE_QUALITIES)[number]

export type UsageSignal = {
  status: UsageStatus | string
  quality: EvidenceQuality | string
  detail: string | null
}

/** Per-signal usage evidence for a target. Absent signals are treated as `not-evaluated`. */
export type UsageEvidence = Partial<Record<EvidenceSignalName, UsageSignal>>

export type DeprecationTarget = {
  id: string
  type: DeprecationTargetType | string
  /** Type-appropriate locator: a path+symbol, an HTTP route, a DB object name, a job id, etc. */
  locator: string | null
  title: string | null
  lifecycle: DeprecationLifecycleState | string
  /** Independent state per environment. Absent environments default (conceptually) to active. */
  environments: Partial<Record<DeprecationEnvironment, EnvironmentState | string>>
  assessment: TargetAssessment
  /** Per-signal usage evidence. Absence of a signal is `not-evaluated`, never `no-usage`. */
  usageEvidence: UsageEvidence
  /** Target ids that must be physically retired (or stop depending) BEFORE this one. */
  dependsOnRemoval: string[]
  /** Project Resource id (RES-…) for database/external targets. Null otherwise. */
  resource: string | null
  /** Module id (validated against .kaddo/modules.yml in slice D). Null otherwise. */
  module: string | null
}

export type DeprecationPlanSummary = {
  id: string
  title: string
  /** POSIX path relative to the project root. */
  path: string
  status: string | null
  targetCount: number
  /** Count of targets per global lifecycle state. */
  lifecycleCounts: Record<string, number>
}

export type DeprecationPlanDetail = DeprecationPlanSummary & {
  purpose: string | null
  targets: DeprecationTarget[]
  /** The canonical Markdown body (verbatim), for faithful human display. */
  markdownBody: string
}

export type DeprecationFinding = {
  severity: 'error' | 'warning'
  target?: string
  message: string
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return [v.trim()]
  return []
}

export function isValidTargetType(t: string): t is DeprecationTargetType {
  return (TARGET_TYPES as readonly string[]).includes(t)
}

export function isValidLifecycleState(s: string): s is DeprecationLifecycleState {
  return (LIFECYCLE_STATES as readonly string[]).includes(s)
}

export function isValidEnvironmentState(s: string): s is EnvironmentState {
  return (ENVIRONMENT_STATES as readonly string[]).includes(s)
}

/** Whether `to` is a permitted next lifecycle state from `from`. Unknown states are never valid. */
export function isValidLifecycleTransition(
  from: string,
  to: string,
): boolean {
  if (!isValidLifecycleState(from) || !isValidLifecycleState(to)) return false
  return LIFECYCLE_TRANSITIONS[from].includes(to)
}

function parseAssessment(v: unknown): TargetAssessment {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return { unusedConfidence: null, blastRadius: null, reversibility: null }
  }
  const o = v as Record<string, unknown>
  return {
    unusedConfidence: str(o.unused_confidence),
    blastRadius: str(o.blast_radius),
    reversibility: str(o.reversibility),
  }
}

/** Parse `usage_evidence: { static: {status, quality, detail}, ... }`. Unknown signals are ignored. */
export function parseUsageEvidence(v: unknown): UsageEvidence {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: UsageEvidence = {}
  for (const signal of EVIDENCE_SIGNALS) {
    const raw = (v as Record<string, unknown>)[signal]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const o = raw as Record<string, unknown>
    // Default a declared-but-partial signal to the safest readings, never to no-usage.
    out[signal] = {
      status: str(o.status) ?? 'unknown',
      quality: str(o.quality) ?? 'unknown',
      detail: str(o.detail),
    }
  }
  return out
}

function parseEnvironments(v: unknown): DeprecationTarget['environments'] {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: DeprecationTarget['environments'] = {}
  for (const env of ENVIRONMENTS) {
    const s = str((v as Record<string, unknown>)[env])
    if (s) out[env] = s
  }
  return out
}

/** Parse one raw target object. Returns null when it has no id (the minimum identity). */
export function parseTarget(raw: unknown): DeprecationTarget | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const id = str(o.id)
  if (!id) return null
  return {
    id,
    type: str(o.type) ?? 'other',
    locator: str(o.locator),
    title: str(o.title),
    lifecycle: str(o.lifecycle) ?? 'candidate',
    environments: parseEnvironments(o.environments),
    assessment: parseAssessment(o.assessment),
    usageEvidence: parseUsageEvidence(o.usage_evidence),
    dependsOnRemoval: strArray(o.depends_on_removal),
    resource: str(o.resource),
    module: str(o.module),
  }
}

export function parseTargets(v: unknown): DeprecationTarget[] {
  if (!Array.isArray(v)) return []
  const out: DeprecationTarget[] = []
  for (const raw of v) {
    const t = parseTarget(raw)
    if (t) out.push(t)
  }
  return out
}

function lifecycleCountsOf(targets: DeprecationTarget[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const t of targets) counts[t.lifecycle] = (counts[t.lifecycle] ?? 0) + 1
  return counts
}

/** The text under a `# Purpose` / `## Purpose` heading in the body, if present. */
function purposeFromBody(body: string): string | null {
  const m = body.match(/^#{1,2}\s+Purpose\s*\n+([\s\S]*?)(?=\n#{1,2}\s|\s*$)/m)
  const text = m ? m[1].trim() : ''
  return text || null
}

/** All Deprecation Plans (type: deprecation-plan) under knowledge/legacy/deprecations/. */
export function getDeprecationPlans(dir: string): DeprecationPlanSummary[] {
  return discoverKnowledge(dir)
    .filter((a) => a.type === DEPRECATION_ARTIFACT_TYPE)
    .map((a) => {
      const fm = a.rawFrontmatter
      const targets = parseTargets(fm.targets)
      return {
        id: a.id || str(fm.id) || a.title,
        title: a.title || str(fm.title) || a.id,
        path: a.relPath,
        status: str(fm.status),
        targetCount: targets.length,
        lifecycleCounts: lifecycleCountsOf(targets),
      }
    })
    .sort((x, y) => x.id.localeCompare(y.id))
}

/** One Deprecation Plan by id, with its targets and canonical body. */
export function getDeprecationPlan(dir: string, id: string): DeprecationPlanDetail | null {
  const match = discoverKnowledge(dir).find(
    (a) => a.type === DEPRECATION_ARTIFACT_TYPE && (a.id === id || a.title === id),
  )
  if (!match) return null
  const raw = readFile(match.filePath)
  const parsed = matter(raw)
  const fm = (parsed.data ?? {}) as Record<string, unknown>
  const body = parsed.content.trim()
  const targets = parseTargets(fm.targets)
  return {
    id: str(fm.id) ?? match.id,
    title: str(fm.title) ?? match.title,
    path: match.relPath,
    status: str(fm.status),
    targetCount: targets.length,
    lifecycleCounts: lifecycleCountsOf(targets),
    purpose: str(fm.purpose) ?? purposeFromBody(body),
    targets,
    markdownBody: body,
  }
}

/**
 * Validate a single target's model invariants. Returns findings (empty = consistent). Does NOT
 * connect anywhere or infer usage — it only checks the declared state for internal consistency.
 */
export function validateTarget(target: DeprecationTarget): DeprecationFinding[] {
  const findings: DeprecationFinding[] = []
  const at = target.id

  if (!isValidTargetType(String(target.type))) {
    findings.push({ severity: 'error', target: at, message: `Unknown target type: ${target.type}` })
  }
  if (!isValidLifecycleState(String(target.lifecycle))) {
    findings.push({ severity: 'error', target: at, message: `Unknown lifecycle state: ${target.lifecycle}` })
  }
  if (!target.locator) {
    findings.push({ severity: 'warning', target: at, message: 'Target has no locator — it may be ambiguous.' })
  }

  for (const [env, state] of Object.entries(target.environments)) {
    if (!isValidEnvironmentState(String(state))) {
      findings.push({ severity: 'error', target: at, message: `Unknown environment state for ${env}: ${state}` })
    }
  }

  // Environment-aware safety: a target cannot be globally completed while any environment is still
  // active. Dev/Test removal must never be confused with a production change.
  const prodActive = target.environments.production === 'active'
  if (target.lifecycle === 'completed') {
    const stillActive = ENVIRONMENTS.filter((e) => target.environments[e] === 'active')
    if (stillActive.length > 0) {
      findings.push({
        severity: 'error',
        target: at,
        message: `Target is 'completed' but still active in: ${stillActive.join(', ')}.`,
      })
    }
  }
  // A production change cannot be claimed while production is still marked active.
  if ((target.lifecycle === 'production-changed' || target.lifecycle === 'observing') && prodActive) {
    findings.push({
      severity: 'error',
      target: at,
      message: `Target is '${target.lifecycle}' but production is still 'active'.`,
    })
  }

  return findings
}

/**
 * Validate a plan: every target, plus dependency integrity (every depends_on_removal id resolves to a
 * target in the same plan). Returns findings (empty = consistent).
 */
export function validatePlan(plan: DeprecationPlanDetail): DeprecationFinding[] {
  const findings: DeprecationFinding[] = []
  const ids = new Set(plan.targets.map((t) => t.id))
  for (const t of plan.targets) {
    findings.push(...validateTarget(t))
    for (const dep of t.dependsOnRemoval) {
      if (!ids.has(dep)) {
        findings.push({
          severity: 'error',
          target: t.id,
          message: `depends_on_removal references unknown target: ${dep}`,
        })
      }
      if (dep === t.id) {
        findings.push({ severity: 'error', target: t.id, message: 'Target depends on its own removal.' })
      }
    }
  }
  return findings
}
