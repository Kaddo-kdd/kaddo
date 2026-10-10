// Progressive disclosure for the Deprecation detail view (WI-057).
//
// Admin should show the complexity of a deprecation as it is DISCOVERED, not before. The sections a
// plan shows are derived from the information actually available (targets, waves) — never from the
// textual status, because a draft can already have targets discovered during refinement.

export type DeprecationViewInput = {
  targets: { length: number }
  dependency: { waves: string[][]; blocked: { target: string; reason: string }[] }
}

export type DeprecationStage = 'captured-intent' | 'targets' | 'analyzed'

export type DeprecationView = {
  stage: DeprecationStage
  /** Refinement empty state shown only before any target exists. */
  showEmptyState: boolean
  showPipeline: boolean
  showBoard: boolean
  showEnvironmentMatrix: boolean
  showTargets: boolean
  /** Retirement waves shown only when there is meaningful dependency structure. */
  showWaves: boolean
}

/**
 * Derive which detail sections to render. Rules:
 * - 0 targets  → Captured Intent: empty state only, no operational views;
 * - >0 targets → Targets: pipeline, board, environment matrix, target list;
 * - meaningful waves (more than one wave, or blocked targets) → add retirement waves.
 * A single trivial wave ([all targets]) is not "analyzed" — it carries no ordering information.
 */
export function deprecationView(plan: DeprecationViewInput): DeprecationView {
  const hasTargets = plan.targets.length > 0
  const waves = plan.dependency?.waves ?? []
  const blocked = plan.dependency?.blocked ?? []
  const hasMeaningfulWaves = waves.length > 1 || blocked.length > 0

  if (!hasTargets) {
    return {
      stage: 'captured-intent',
      showEmptyState: true,
      showPipeline: false,
      showBoard: false,
      showEnvironmentMatrix: false,
      showTargets: false,
      showWaves: false,
    }
  }

  return {
    stage: hasMeaningfulWaves ? 'analyzed' : 'targets',
    showEmptyState: false,
    showPipeline: true,
    showBoard: true,
    showEnvironmentMatrix: true,
    showTargets: true,
    showWaves: hasMeaningfulWaves,
  }
}
