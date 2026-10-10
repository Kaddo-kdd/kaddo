// Controlled Deprecation — Discovery + Dependency Intelligence (WI-048, slice B of WI-046).
//
// Deterministic intelligence layered on top of the Core Model (WI-047): it turns per-target usage
// evidence into an orientative "unused" assessment, and turns `depends_on_removal` edges into an
// explainable removal order (waves). It NEVER connects anywhere, NEVER infers that something is
// unused from the absence of a signal, and NEVER decides a removal — eligibility is a review signal,
// not an approval. Elimination stays a human decision.

import {
  type DeprecationPlanDetail,
  type DeprecationTarget,
  type UsageEvidence,
  type DeprecationLifecycleState,
  EVIDENCE_SIGNALS,
} from './deprecation.js'

// --- Usage → unused confidence ----------------------------------------------

export type UnusedConfidence = 'in-use' | 'high' | 'medium' | 'low' | 'insufficient-evidence'

export type UnusedAssessment = {
  confidence: UnusedConfidence
  /** Always true unless the target is clearly in-use: removal is never automatic. */
  requiresHumanConfirmation: boolean
  /** Human-readable reasons, so the score is explainable and never a bare number. */
  rationale: string[]
}

function isStrongNoUsage(sig: { status: string; quality: string }): boolean {
  return sig.status === 'no-usage' && (sig.quality === 'observed-fact' || sig.quality === 'human-confirmed')
}

/**
 * Derive an orientative unused-confidence from a target's usage evidence. Rules, in order:
 * - any signal reports `usage-found`      → `in-use` (not a removal candidate);
 * - no strong (observed/human-confirmed) no-usage signal → `insufficient-evidence`
 *   (absence of references is NOT evidence of no usage);
 * - an explicit `unknown` signal present  → caps at `medium`;
 * - ≥2 strong no-usage signals, no unknown → `high`;
 * - otherwise                              → `medium`.
 * `not-evaluated` / missing signals never raise confidence and never count as no-usage, but they do
 * not cap it either (they are noted in the rationale). Removal always requires human confirmation.
 */
export function deriveUnusedConfidence(evidence: UsageEvidence): UnusedAssessment {
  const present = EVIDENCE_SIGNALS.map((name) => ({ name, sig: evidence[name] })).filter(
    (e): e is { name: typeof EVIDENCE_SIGNALS[number]; sig: NonNullable<UsageEvidence[keyof UsageEvidence]> } =>
      Boolean(e.sig),
  )

  const usageFound = present.filter((e) => e.sig.status === 'usage-found')
  if (usageFound.length > 0) {
    return {
      confidence: 'in-use',
      requiresHumanConfirmation: false,
      rationale: [`Usage found via: ${usageFound.map((e) => e.name).join(', ')}.`],
    }
  }

  const strong = present.filter((e) => isStrongNoUsage(e.sig))
  const unknown = present.filter((e) => e.sig.status === 'unknown')
  const notEvaluated = EVIDENCE_SIGNALS.filter(
    (name) => !evidence[name] || evidence[name]?.status === 'not-evaluated',
  )

  const rationale: string[] = []
  if (strong.length > 0) rationale.push(`No usage observed via: ${strong.map((e) => e.name).join(', ')}.`)
  if (unknown.length > 0) {
    rationale.push(`Unknown (looked but could not determine): ${unknown.map((e) => e.name).join(', ')} — NOT treated as no-usage.`)
  }
  if (notEvaluated.length > 0) {
    rationale.push(`Not evaluated: ${notEvaluated.join(', ')} — absence of a reference is not evidence of no usage.`)
  }

  let confidence: UnusedConfidence
  if (strong.length === 0) {
    confidence = 'insufficient-evidence'
  } else if (unknown.length > 0) {
    confidence = 'medium'
  } else if (strong.length >= 2) {
    confidence = 'high'
  } else {
    confidence = 'medium'
  }

  return { confidence, requiresHumanConfirmation: true, rationale }
}

// --- Dependency ordering (waves) --------------------------------------------

export type RemovalWavePlan = {
  /** Ordered layers of target ids: wave[0] can be retired first, then wave[1], etc. */
  waves: string[][]
  /** Targets that cannot be ordered (cycle) or reference an unknown dependency. */
  blocked: { target: string; reason: string }[]
}

/**
 * Derive removal waves from `depends_on_removal` via Kahn's algorithm. An edge `dep → target`
 * (i.e. `target.depends_on_removal` contains `dep`) means `dep` must be retired BEFORE `target`,
 * so dependents are retired first and the depended-upon thing last (function → stored proc → table).
 * The order is derived and explainable, never a manual `priority`.
 */
export function deriveRemovalWaves(plan: DeprecationPlanDetail): RemovalWavePlan {
  const ids = new Set(plan.targets.map((t) => t.id))
  // Count only dependencies that actually resolve within the plan; dangling ones are reported.
  const deps = new Map<string, string[]>()
  const blocked: { target: string; reason: string }[] = []
  for (const t of plan.targets) {
    const resolved: string[] = []
    for (const d of t.dependsOnRemoval) {
      if (d === t.id) {
        blocked.push({ target: t.id, reason: 'Target depends on its own removal.' })
        continue
      }
      if (!ids.has(d)) {
        blocked.push({ target: t.id, reason: `depends_on_removal references unknown target: ${d}.` })
        continue
      }
      resolved.push(d)
    }
    deps.set(t.id, resolved)
  }

  const placed = new Set<string>()
  const waves: string[][] = []
  // Iteratively place every target whose resolved deps are already placed.
  let remaining = plan.targets.map((t) => t.id)
  while (remaining.length > 0) {
    const wave = remaining.filter((id) => (deps.get(id) ?? []).every((d) => placed.has(d)))
    if (wave.length === 0) break // cycle among the remaining targets
    for (const id of wave) placed.add(id)
    waves.push(wave)
    remaining = remaining.filter((id) => !placed.has(id))
  }
  for (const id of remaining) {
    blocked.push({ target: id, reason: 'Involved in a removal dependency cycle — cannot be ordered.' })
  }

  return { waves, blocked }
}

// --- Removal eligibility (review signal, not approval) -----------------------

/** Lifecycle states in which a target is considered already retired for dependency purposes. */
const RETIRED_STATES: ReadonlySet<string> = new Set<DeprecationLifecycleState>([
  'removed-devtest', 'production-changed', 'observing', 'completed', 'deprecated-retained',
])

export function isRetiredLifecycle(state: string): boolean {
  return RETIRED_STATES.has(state)
}

/**
 * Targets whose dependents (`depends_on_removal`) are all already retired and which are not retired
 * themselves. This is an "eligible for removal review" signal — a human still decides.
 */
export function targetsEligibleForRemoval(plan: DeprecationPlanDetail): string[] {
  const byId = new Map(plan.targets.map((t) => [t.id, t]))
  return plan.targets
    .filter((t) => !isRetiredLifecycle(String(t.lifecycle)))
    .filter((t) =>
      t.dependsOnRemoval.every((d) => {
        const dep = byId.get(d)
        return dep ? isRetiredLifecycle(String(dep.lifecycle)) : false
      }),
    )
    .map((t) => t.id)
}

// --- Convenience projection --------------------------------------------------

export type TargetIntelligence = {
  id: string
  unused: UnusedAssessment
  eligibleForRemovalReview: boolean
  blockedBy: string[]
}

export function planIntelligence(plan: DeprecationPlanDetail): {
  waves: RemovalWavePlan
  eligible: string[]
  targets: TargetIntelligence[]
} {
  const waves = deriveRemovalWaves(plan)
  const eligible = new Set(targetsEligibleForRemoval(plan))
  const byId = new Map(plan.targets.map((t) => [t.id, t]))
  const targets: TargetIntelligence[] = plan.targets.map((t: DeprecationTarget) => ({
    id: t.id,
    unused: deriveUnusedConfidence(t.usageEvidence),
    eligibleForRemovalReview: eligible.has(t.id),
    blockedBy: t.dependsOnRemoval.filter((d) => {
      const dep = byId.get(d)
      return !dep || !isRetiredLifecycle(String(dep.lifecycle))
    }),
  }))
  return { waves, eligible: [...eligible], targets }
}

// --- Work Item candidates (WI-050) -------------------------------------------

/**
 * A proposed Work Item to materialize from the plan. One candidate per (wave, module) so each
 * becomes one WI → one branch → one PR, and multirepo plans fan out to the owning repos. The WI will
 * REFERENCE these target ids (deprecation_targets), never copy their definitions.
 */
export type WorkItemCandidate = {
  wave: number
  /** Owning module id, or null for targets with no module (e.g. a shared/core surface). */
  module: string | null
  title: string
  deprecationTargets: string[]
  /** Distinct Project Resource ids across the grouped targets. */
  resources: string[]
}

/**
 * Propose Work Item candidates from a plan's removal waves, grouped by (wave, module). Deterministic
 * and side-effect-free: materializing an actual Work Item is a separate, human-gated step.
 */
export function proposeWorkItemCandidates(plan: DeprecationPlanDetail): WorkItemCandidate[] {
  const { waves } = deriveRemovalWaves(plan)
  const byId = new Map(plan.targets.map((t) => [t.id, t]))
  const candidates: WorkItemCandidate[] = []

  waves.forEach((waveIds, waveIndex) => {
    const wave = waveIndex + 1
    // Group this wave's targets by owning module (null grouped under a stable key).
    const groups = new Map<string | null, DeprecationTarget[]>()
    for (const id of waveIds) {
      const t = byId.get(id)
      if (!t) continue
      const key = t.module
      const list = groups.get(key) ?? []
      list.push(t)
      groups.set(key, list)
    }
    // Stable order: modules alphabetically, null last.
    const keys = [...groups.keys()].sort((a, b) => {
      if (a === null) return 1
      if (b === null) return -1
      return a.localeCompare(b)
    })
    for (const key of keys) {
      const targets = groups.get(key)!
      const resources = [...new Set(targets.map((t) => t.resource).filter((r): r is string => Boolean(r)))]
      candidates.push({
        wave,
        module: key,
        title: `${plan.id} wave ${wave}${key ? ` (${key})` : ''}: retire ${targets.map((t) => t.id).join(', ')}`,
        deprecationTargets: targets.map((t) => t.id),
        resources,
      })
    }
  })

  return candidates
}

// --- Candidate discovery guidance (for legacy/architecture agents) -----------

/**
 * Guidance surfaced to agents proposing deprecation candidates. Discovery ≠ materialization: an
 * agent proposes typed candidates and ALWAYS explains why, from several sources, and degrades safely
 * when a source is unavailable (→ unknown / human investigation, never → unused).
 */
export const CANDIDATE_DISCOVERY_GUIDANCE = [
  'Propose deprecation candidates from multiple sources: static references (code/routes/UI/jobs),',
  'the System Graph (dependencies and blast radius), Legacy Knowledge (risks/unknowns/modernization',
  'candidates), Project Resources (databases/external systems and their boundaries), runtime evidence',
  'when telemetry exists, and database metadata when reachable.',
  '',
  'Rules:',
  '- Discovery is a PROPOSAL, not a materialization: never create or retire anything automatically.',
  '- Always explain WHY something is a candidate, citing the signal(s) observed.',
  '- Absence of a reference is NOT evidence of no usage. If a source cannot be evaluated, record it',
  '  as not-evaluated/unknown and require human investigation — never collapse it to no-usage.',
  '- A modernization candidate is not automatically a deprecation target.',
  '- Soft deprecation precedes physical removal; order retirements by dependency, dependents first.',
].join('\n')
