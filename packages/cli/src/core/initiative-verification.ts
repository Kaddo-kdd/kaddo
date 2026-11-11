// Initiative outcome verification & evidence-based completion evaluation (WI-079).
//
// Read-only and pure. Reuses WI-078's evidence engine (buildOutcomeVerification) so Initiatives, Epics
// and Plans share one verification contract — no parallel verifier. Declared success criteria are read
// from the Initiative's "## Success Criteria" section; evidence lives in frontmatter
// `outcome_verifications` (same shape as Epics/Plans). Conservative: unverified/failed/ambiguous
// criteria, pending candidates, incomplete delivery, missing deliverables and broken provenance all
// keep an Initiative from being ready. Completion stays a human action (see completeInitiative).

import {
  computeInitiativeProgress,
  associatedWorkItems,
  getInitiative,
  type Initiative,
} from './initiative.js'
import { parseSuccessCriteria } from './initiative-analysis.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import {
  buildOutcomeVerification,
  parseEvidenceList,
  normalizeCriterion,
  type OutcomeVerification,
  type CompletionReadiness,
  type CompletionException,
} from './delivery-verification.js'

export type { CompletionReadiness } from './delivery-verification.js'

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

export function parseCompletionExceptions(raw: unknown): CompletionException[] {
  if (!Array.isArray(raw)) return []
  const out: CompletionException[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const o = entry as Record<string, unknown>
    const id = optStr(o.id)
    if (!id) continue
    const st = optStr(o.status)
    out.push({
      id,
      status: st === 'accepted' || st === 'rejected' ? st : 'proposed',
      ...(optStr(o.criterion) ? { criterion: optStr(o.criterion) } : {}),
      ...(optStr(o.reason) ? { reason: optStr(o.reason) } : {}),
    })
  }
  return out
}

/** Declared success criteria (from the body section) + recorded evidence (from frontmatter). */
export function initiativeOutcomeVerification(ini: Initiative): OutcomeVerification {
  const declared = parseSuccessCriteria(ini.body).map((c) => c.text)
  const evidence = parseEvidenceList(ini.rawFrontmatter?.outcome_verifications)
  const exceptions = parseCompletionExceptions(ini.rawFrontmatter?.completion_exceptions)
  return buildOutcomeVerification(declared, evidence, exceptions)
}

/** Broken provenance relations for an Initiative's materialized candidates (integrity — never auto-fixed). */
export function initiativeProvenanceIssues(dir: string, ini: Initiative): string[] {
  const issues: string[] = []
  const wis = discoverWorkItems(dir)
  for (const c of ini.candidates) {
    if (!c.materializedAs) continue
    const wi = wis.find((w) => w.id.toLowerCase() === c.materializedAs!.toLowerCase())
    if (!wi) { issues.push(`Candidate ${c.id} points at missing Work Item ${c.materializedAs}.`); continue }
    const owner = typeof wi.rawFrontmatter?.initiative === 'string' ? (wi.rawFrontmatter.initiative as string) : undefined
    if (owner && owner.toLowerCase() !== ini.id.toLowerCase()) {
      issues.push(`Work Item ${wi.id} (materialized from ${c.id}) is associated with ${owner}, not ${ini.id}.`)
    }
  }
  return issues
}

export type InitiativeCompletionEvaluation = {
  id: string
  kind: 'initiative'
  status: string
  readiness: CompletionReadiness
  ready: boolean
  reasons: string[]
  blockers: string[]
  warnings: string[]
  outcome: OutcomeVerification
  delivery: { total: number; completed: number; incomplete: number }
  pendingCandidates: string[]
  provenanceIssues: string[]
  exceptions: CompletionException[]
}

function decide(blockers: string[], softBlocks: string[], hasAcceptedExceptions: boolean): CompletionReadiness {
  if (blockers.length > 0) return 'BLOCKED'
  if (softBlocks.length > 0) return 'NEEDS_WORK'
  return hasAcceptedExceptions ? 'READY_WITH_EXCEPTIONS' : 'READY_TO_COMPLETE'
}

/**
 * Evaluate whether an Initiative is ready to complete, from declared success criteria + recorded
 * evidence + committed candidates + associated Work Items + provenance integrity. Read-only — it never
 * transitions the Initiative (AC-28). Completed delivery with unverified outcome is NOT ready (AC-22).
 */
export function evaluateInitiativeCompletion(dir: string, ini: Initiative): InitiativeCompletionEvaluation {
  const progress = computeInitiativeProgress(dir, ini)
  const outcome = initiativeOutcomeVerification(ini)
  const exceptions = parseCompletionExceptions(ini.rawFrontmatter?.completion_exceptions)
  const pending = ini.candidates.filter((c) => !c.materializedAs)
  const associated = associatedWorkItems(dir, ini.id)
  const incomplete = associated.filter((w) => w.status !== 'completed' && w.status !== 'archived')
  const provenanceIssues = initiativeProvenanceIssues(dir, ini)

  const blockers: string[] = []
  const softBlocks: string[] = []
  const reasons: string[] = []
  const warnings: string[] = []

  for (const p of provenanceIssues) blockers.push(p)

  if (outcome.total === 0) { softBlocks.push('no-success-criteria'); reasons.push('No success criteria to verify — completion cannot be judged by outcome.') }
  if (outcome.ambiguous > 0) { softBlocks.push('criteria-ambiguous'); reasons.push(`${outcome.ambiguous} success criterion(s) collide in text — disambiguate before verifying.`) }
  if (outcome.failed > 0) { softBlocks.push('criteria-failed'); reasons.push(`${outcome.failed} success criterion(s) failed verification.`) }
  const unverified = outcome.notVerified + outcome.manualReview - outcome.ambiguous
  if (unverified > 0) { softBlocks.push('criteria-unverified'); reasons.push(`${unverified} success criterion(s) not verified (no or insufficient evidence).`) }
  if (outcome.stale.length > 0) warnings.push(`${outcome.stale.length} evidence record(s) no longer match a declared criterion (stale).`)

  if (pending.length > 0) { softBlocks.push('pending-candidates'); reasons.push(`${pending.length} committed candidate(s) not yet materialized.`) }
  if (incomplete.length > 0) { softBlocks.push('incomplete-delivery'); reasons.push(`${incomplete.length} associated Work Item(s) are not completed.`) }
  if (associated.length === 0 && pending.length === 0) { softBlocks.push('no-deliverables'); reasons.push('Nothing has been delivered or committed under this Initiative.') }

  const readiness = decide(blockers, softBlocks, exceptions.some((x) => x.status === 'accepted'))
  if (readiness === 'READY_TO_COMPLETE') reasons.unshift('All success criteria are verified and committed scope is delivered. Human approval is still required to close.')
  else if (readiness === 'READY_WITH_EXCEPTIONS') reasons.unshift('Remaining gaps are covered by accepted exceptions. Human approval is still required to close.')

  const completed = progress.delivery.byState?.completed ?? 0
  return {
    id: ini.id, kind: 'initiative', status: ini.status, readiness,
    ready: readiness === 'READY_TO_COMPLETE' || readiness === 'READY_WITH_EXCEPTIONS',
    reasons, blockers, warnings, outcome,
    delivery: { total: progress.delivery.total, completed, incomplete: incomplete.length },
    pendingCandidates: pending.map((c) => c.id),
    provenanceIssues, exceptions,
  }
}

export function evaluateInitiativeById(dir: string, id: string): InitiativeCompletionEvaluation | null {
  const ini = getInitiative(dir, id)
  return ini ? evaluateInitiativeCompletion(dir, ini) : null
}

/** Stable identity helper re-exported for callers recording evidence. */
export { normalizeCriterion }
