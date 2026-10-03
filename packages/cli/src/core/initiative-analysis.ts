// Initiative intelligence — deterministic gap and completion analysis (WI-020).
//
// Core provides the deterministic, grounded part of initiative analysis: parse success criteria,
// compute coverage against candidates and associated Work Items, surface gaps, and evaluate
// completion readiness. It NEVER invents work (suggested candidates are the ones already on the
// Initiative, which carry their own source signals) and NEVER completes an Initiative — completion
// stays human-gated at the caller. Richer semantic judgment is the initiative-agent's job; this
// module gives it a factual base. No LLM, no git.

import {
  getInitiativeContext,
  computeInitiativeProgress,
  associatedWorkItems,
  type Initiative,
  type InitiativeCandidate,
  type InitiativeProgress,
  type InitiativeStatus,
} from './initiative.js'

export type SuccessCriterion = { text: string; checked: boolean | null }

export type InitiativeFinding = {
  code:
    | 'no-success-criteria'
    | 'uncovered-success-criteria'
    | 'pending-candidates'
    | 'incomplete-delivery'
    | 'no-delivery'
  severity: 'info' | 'warning' | 'blocking'
  message: string
  items?: string[]
}

export type InitiativeAnalysis = {
  initiative: string
  status: InitiativeStatus
  progress: InitiativeProgress
  successCriteria: SuccessCriterion[]
  pendingCandidates: InitiativeCandidate[]
  findings: InitiativeFinding[]
  /** Grounded suggestions: the Initiative's own pending candidates (they carry source signals). */
  suggestedCandidates: InitiativeCandidate[]
}

export type CompletionReadiness = {
  initiative: string
  ready: boolean
  readiness: 'ready' | 'not-ready'
  reasons: string[]
}

const SUCCESS_HEADING_RE = /^#{1,6}\s*(success criteria|criterios de[ét]xito|criterios de éxito)\s*$/i
const HEADING_RE = /^#{1,6}\s+/
const CHECK_ITEM_RE = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/
const BULLET_RE = /^\s*[-*]\s+(.*)$/
const PLACEHOLDER_RE = /^_.*_$/

/** Parse the "## Success Criteria" section of an Initiative body into criteria items. */
export function parseSuccessCriteria(body: string): SuccessCriterion[] {
  const lines = body.split(/\r?\n/)
  const out: SuccessCriterion[] = []
  let capture = false
  for (const line of lines) {
    if (capture && HEADING_RE.test(line)) break
    if (!capture) {
      if (SUCCESS_HEADING_RE.test(line.trim())) capture = true
      continue
    }
    const check = line.match(CHECK_ITEM_RE)
    if (check) {
      const text = check[2].trim()
      if (text && !PLACEHOLDER_RE.test(text)) {
        out.push({ text, checked: check[1].toLowerCase() === 'x' })
      }
      continue
    }
    const bullet = line.match(BULLET_RE)
    if (bullet) {
      const text = bullet[1].trim()
      if (text && !PLACEHOLDER_RE.test(text)) out.push({ text, checked: null })
    }
  }
  return out
}

/**
 * Analyze an Initiative against the current project state: success-criteria coverage, pending
 * candidates, and delivery status. Produces grounded findings and surfaces the Initiative's own
 * pending candidates as suggestions. Can be run repeatedly as the project evolves (AC-16/17/18).
 */
export function analyzeInitiative(dir: string, ini: Initiative): InitiativeAnalysis {
  const progress = computeInitiativeProgress(dir, ini)
  const successCriteria = parseSuccessCriteria(ini.body)
  const pendingCandidates = ini.candidates.filter((c) => !c.materializedAs)
  const associated = associatedWorkItems(dir, ini.id)

  const findings: InitiativeFinding[] = []

  if (successCriteria.length === 0) {
    findings.push({
      code: 'no-success-criteria',
      severity: 'warning',
      message: 'The Initiative has no explicit Success Criteria; completion cannot be judged by outcome, only by delivery.',
    })
  } else {
    const uncovered = successCriteria.filter((c) => c.checked === false)
    if (uncovered.length > 0) {
      findings.push({
        code: 'uncovered-success-criteria',
        severity: 'blocking',
        message: `${uncovered.length} success criterion/criteria remain uncovered.`,
        items: uncovered.map((c) => c.text),
      })
    }
  }

  if (pendingCandidates.length > 0) {
    findings.push({
      code: 'pending-candidates',
      severity: 'blocking',
      message: `${pendingCandidates.length} committed candidate(s) not yet materialized into Work Items.`,
      items: pendingCandidates.map((c) => `${c.id}: ${c.title}`),
    })
  }

  const notCompleted = associated.filter((w) => w.status !== 'completed' && w.status !== 'archived')
  if (associated.length === 0) {
    findings.push({
      code: 'no-delivery',
      severity: 'info',
      message: 'No Work Items are associated with this Initiative yet.',
    })
  } else if (notCompleted.length > 0) {
    findings.push({
      code: 'incomplete-delivery',
      severity: 'blocking',
      message: `${notCompleted.length} associated Work Item(s) are not completed.`,
      items: notCompleted.map((w) => `${w.id} (${w.status})`),
    })
  }

  return {
    initiative: ini.id,
    status: ini.status,
    progress,
    successCriteria,
    pendingCandidates,
    findings,
    suggestedCandidates: pendingCandidates,
  }
}

/**
 * Evaluate whether an Initiative looks complete. Reports only — it never transitions the Initiative
 * (completion is human-gated by the caller). An Initiative is "ready" only when committed scope is
 * covered: no pending candidates, no uncovered success criteria, and all associated Work Items
 * completed (with at least one). Detects committed-but-uncovered scope even if every Work Item is
 * done (AC-19).
 */
export function evaluateInitiativeCompletion(dir: string, ini: Initiative): CompletionReadiness {
  const analysis = analyzeInitiative(dir, ini)
  const reasons: string[] = []

  for (const f of analysis.findings) {
    if (f.severity === 'blocking') reasons.push(f.message)
  }
  if (analysis.progress.delivery.total === 0 && analysis.pendingCandidates.length === 0) {
    reasons.push('Nothing has been delivered or committed under this Initiative.')
  }

  const ready = reasons.length === 0
  return {
    initiative: ini.id,
    ready,
    readiness: ready ? 'ready' : 'not-ready',
    reasons,
  }
}

/** Re-export so analysis consumers can assemble context from one import. */
export { getInitiativeContext }
