// Controlled Deprecation — Soft Deprecation + Observation (WI-051, slice E of WI-046).
//
// Deterministic helpers over the Core soft-deprecation model: compute whether a target's observation
// window has elapsed and its exit criteria are met, and therefore whether it is ELIGIBLE FOR REMOVAL
// REVIEW. Eligibility is a review signal, never an approval — removal stays a human decision. A
// `deprecated-retained` target is a legitimate terminal outcome that must not block the plan.

import {
  type DeprecationTarget,
  type DeprecationPlanDetail,
  type DeprecationEnvironment,
  ENVIRONMENTS,
} from './deprecation.js'

export type ObservationStatus = {
  /** Whether the target declares a soft-deprecation / observation window at all. */
  declared: boolean
  /** The observation window has fully elapsed since started_at (false when either is unknown). */
  windowElapsed: boolean
  /** ISO date the window ends, when both started_at and observation_window_days are known. */
  windowEndsAt: string | null
  /** Exit criteria tallies. */
  criteriaTotal: number
  criteriaMet: number
  allCriteriaMet: boolean
  /** True only when the window elapsed AND all exit criteria are met. A REVIEW signal, not approval. */
  eligibleForRemovalReview: boolean
  /** Human-readable explanation of what still blocks eligibility. */
  reasons: string[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function addDaysIso(startIso: string, days: number): string | null {
  const start = Date.parse(startIso)
  if (Number.isNaN(start)) return null
  return new Date(start + days * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Compute the observation status of a target. `now` is injectable for determinism (defaults to the
 * current date). Missing window/criteria never fabricate eligibility: an undeclared window is simply
 * "not eligible yet", and absence is explained in `reasons`, never treated as satisfied.
 */
export function observationStatus(target: DeprecationTarget, now: Date = new Date()): ObservationStatus {
  const sd = target.softDeprecation
  const reasons: string[] = []

  if (!sd) {
    return {
      declared: false, windowElapsed: false, windowEndsAt: null,
      criteriaTotal: 0, criteriaMet: 0, allCriteriaMet: false, eligibleForRemovalReview: false,
      reasons: ['No soft-deprecation/observation window declared — not eligible for removal review.'],
    }
  }

  const criteriaTotal = sd.exitCriteria.length
  const criteriaMet = sd.exitCriteria.filter((c) => c.met).length
  // No declared criteria means there is nothing proving it is safe — do not treat as "all met".
  const allCriteriaMet = criteriaTotal > 0 && criteriaMet === criteriaTotal

  let windowElapsed = false
  let windowEndsAt: string | null = null
  if (sd.startedAt && sd.observationWindowDays != null) {
    windowEndsAt = addDaysIso(sd.startedAt, sd.observationWindowDays)
    if (windowEndsAt) {
      windowElapsed = now.getTime() >= Date.parse(windowEndsAt)
    }
  }

  if (!sd.startedAt) reasons.push('Observation has not started (no started_at).')
  else if (sd.observationWindowDays == null) reasons.push('No observation_window_days declared.')
  else if (!windowElapsed) reasons.push(`Observation window not elapsed (ends ${windowEndsAt ?? 'unknown'}).`)

  if (criteriaTotal === 0) reasons.push('No exit criteria declared.')
  else if (!allCriteriaMet) reasons.push(`Exit criteria not all met (${criteriaMet}/${criteriaTotal}).`)

  const eligibleForRemovalReview = windowElapsed && allCriteriaMet
  if (eligibleForRemovalReview) {
    reasons.length = 0
    reasons.push('Observation window elapsed and all exit criteria met — eligible for removal REVIEW (human decision).')
  }

  return {
    declared: true, windowElapsed, windowEndsAt,
    criteriaTotal, criteriaMet, allCriteriaMet, eligibleForRemovalReview, reasons,
  }
}

/** Targets whose observation window has elapsed and exit criteria are met (eligible for review). */
export function targetsPastObservation(plan: DeprecationPlanDetail, now: Date = new Date()): string[] {
  return plan.targets.filter((t) => observationStatus(t, now).eligibleForRemovalReview).map((t) => t.id)
}

/** A `deprecated-retained` target: must not be used, must be kept. A legitimate terminal outcome. */
export function isRetainedOutcome(target: DeprecationTarget): boolean {
  return String(target.lifecycle) === 'deprecated-retained'
}

/**
 * Environment summary for a target: Dev/Test retirement must never be read as a production change.
 * `removedInDevTest` is true only when both development and test are removed; `productionActive`
 * reflects production independently.
 */
export function environmentSummary(target: DeprecationTarget): {
  perEnvironment: Record<DeprecationEnvironment, string>
  removedInDevTest: boolean
  productionActive: boolean
} {
  const perEnvironment = {} as Record<DeprecationEnvironment, string>
  for (const env of ENVIRONMENTS) perEnvironment[env] = String(target.environments[env] ?? 'active')
  return {
    perEnvironment,
    removedInDevTest: perEnvironment.development === 'removed' && perEnvironment.test === 'removed',
    productionActive: perEnvironment.production === 'active',
  }
}
