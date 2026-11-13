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

// --- Provenance diagnostics (WI-082) ---------------------------------------------------------------
//
// A candidate's `materialized_as` is a 1:1 field: it carries exactly one canonical Work Item id. Some
// historical artifacts put a composite string there (e.g. "AN-005, AN-006, AN-007"). Matching the whole
// string against a single id would falsely report it as a "missing Work Item". We classify instead, so a
// genuinely broken single reference stays a blocking integrity defect while an ambiguous historical value
// is diagnosed honestly — never claimed missing, never rewritten, never treated as validated.

export type ProvenanceCategory =
  | 'valid_single_reference'
  | 'missing_reference'
  | 'association_mismatch'
  | 'ambiguous_legacy_reference'

export type ProvenanceDiagnostic = {
  candidateId: string
  value: string
  category: ProvenanceCategory
  /** blocking = confirmed integrity defect; warning = ambiguous, needs manual inspection; info = resolves. */
  severity: 'blocking' | 'warning' | 'info'
  message: string
  /** The single resolved Work Item id, when the value is one canonical id (valid or mismatch). */
  workItemId?: string
}

/** A canonical id is one token shaped like PREFIX-NUMBER (e.g. WI-204, INI-10, AN-005). */
const CANONICAL_ID = /^[A-Za-z]+-\d+[A-Za-z0-9-]*$/

/** Split a materialized reference into its tokens — a composite value yields more than one. */
function referenceTokens(value: string): string[] {
  return value.split(/[,;/\s]+/).map((t) => t.trim()).filter(Boolean)
}

/**
 * Classify each materialized candidate's provenance (WI-082). Read-only: it never rewrites, splits or
 * migrates the reference. A value that is not exactly one canonical id is `ambiguous_legacy_reference`
 * (a warning, never claimed missing); a single canonical id resolves to valid / missing / mismatch.
 */
export function initiativeProvenanceDiagnostics(dir: string, ini: Initiative): ProvenanceDiagnostic[] {
  const wis = discoverWorkItems(dir)
  const out: ProvenanceDiagnostic[] = []
  for (const c of ini.candidates) {
    if (!c.materializedAs) continue
    const value = c.materializedAs
    const tokens = referenceTokens(value)
    if (tokens.length !== 1 || !CANONICAL_ID.test(tokens[0])) {
      out.push({
        candidateId: c.id, value, category: 'ambiguous_legacy_reference', severity: 'warning',
        message: `Candidate ${c.id} reference "${value}" is not a single canonical Work Item id — it cannot be confirmed to resolve to one Work Item (manual inspection required).`,
      })
      continue
    }
    const id = tokens[0]
    const wi = wis.find((w) => w.id.toLowerCase() === id.toLowerCase())
    if (!wi) {
      out.push({ candidateId: c.id, value, category: 'missing_reference', severity: 'blocking', message: `Candidate ${c.id} points at missing Work Item ${id}.` })
      continue
    }
    const owner = typeof wi.rawFrontmatter?.initiative === 'string' ? (wi.rawFrontmatter.initiative as string) : undefined
    if (owner && owner.toLowerCase() !== ini.id.toLowerCase()) {
      out.push({ candidateId: c.id, value, category: 'association_mismatch', severity: 'blocking', workItemId: wi.id, message: `Work Item ${wi.id} (materialized from ${c.id}) is associated with ${owner}, not ${ini.id}.` })
      continue
    }
    out.push({ candidateId: c.id, value, category: 'valid_single_reference', severity: 'info', workItemId: wi.id, message: `Candidate ${c.id} resolves to ${wi.id}.` })
  }
  return out
}

/** Confirmed integrity defects only (missing/mismatch) — the blocking subset, back-compatible. */
export function initiativeProvenanceIssues(dir: string, ini: Initiative): string[] {
  return initiativeProvenanceDiagnostics(dir, ini).filter((d) => d.severity === 'blocking').map((d) => d.message)
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
  provenanceDiagnostics: ProvenanceDiagnostic[]
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
  const provenanceDiagnostics = initiativeProvenanceDiagnostics(dir, ini)
  const provenanceBlocking = provenanceDiagnostics.filter((d) => d.severity === 'blocking')
  const provenanceAmbiguous = provenanceDiagnostics.filter((d) => d.category === 'ambiguous_legacy_reference')
  const provenanceIssues = provenanceBlocking.map((d) => d.message)

  const blockers: string[] = []
  const softBlocks: string[] = []
  const reasons: string[] = []
  const warnings: string[] = []

  for (const p of provenanceBlocking) blockers.push(p.message)
  // Ambiguous historical references are NOT claimed missing and NOT a confirmed defect, but they cannot
  // be treated as validated either — they keep the Initiative out of ready until inspected (WI-082 D2).
  if (provenanceAmbiguous.length > 0) {
    softBlocks.push('provenance-ambiguous')
    reasons.push(`${provenanceAmbiguous.length} materialization reference(s) are ambiguous or non-canonical — inspect before completing (not auto-resolved).`)
  }

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
    provenanceIssues, provenanceDiagnostics, exceptions,
  }
}

export function evaluateInitiativeById(dir: string, id: string): InitiativeCompletionEvaluation | null {
  const ini = getInitiative(dir, id)
  return ini ? evaluateInitiativeCompletion(dir, ini) : null
}

/** Stable identity helper re-exported for callers recording evidence. */
export { normalizeCriterion }
