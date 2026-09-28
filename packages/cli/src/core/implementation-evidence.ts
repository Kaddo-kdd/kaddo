// Implementation Evidence & Verification — deterministic Core surface (VS-111).
//
// Collects structured evidence of what changed, verifies Acceptance Criteria,
// evaluates Release Gates and Completion Exceptions, and produces a Completion
// Decision. Follows the implementation-handoff.ts pattern: no LLM, no git,
// never writes/decides. Git data is passed in as input.

import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { WorkItemNotFoundError } from './work-items.js'
import { lifecycleStateOf } from './lifecycle.js'
import { analyzeCrossRepoEvidence, type EvidenceFinding } from './cross-repo-evidence.js'
import type {
  ImplementationEvidence,
  RepoEvidence,
  ReleaseGate,
  CompletionException,
  ValidationStatus,
  ImplementationStatus,
} from './lifecycle.js'

// --- Error classes -----------------------------------------------------------

export class WorkItemNotInProgressError extends Error {
  constructor(
    public workItemId: string,
    public actualState: string,
  ) {
    super(`Work Item "${workItemId}" must be in "in-progress" state for verification, but is "${actualState}".`)
    this.name = 'WorkItemNotInProgressError'
  }
}

// --- Input types -------------------------------------------------------------

export type ValidationInput = {
  command: string
  status: 'passed' | 'failed' | 'skipped' | 'error'
  reason?: string
}

export type RepoEvidenceInput = {
  repoId: string
  role?: string
  changedPaths: string[]
  validations: ValidationInput[]
  migrations?: { id: string; environment: string; status: string; reason?: string }[]
}

export type ACVerificationInput = {
  criterion: string
  status: 'passed' | 'failed' | 'not-verified' | 'manual-review-required'
  evidence?: string
}

export type CollectEvidenceInput = {
  repos: RepoEvidenceInput[]
  summary?: string
  deviations?: string[]
  issues?: string[]
  knowledgeGaps?: string[]
  acVerifications: ACVerificationInput[]
}

// --- Output types ------------------------------------------------------------

export type ACVerificationResult = ACVerificationInput

export type PlannedVsActual = {
  hasHandoff: boolean
  plannedModules: string[]
  actualModules: string[]
  addedModules: string[]
  missingModules: string[]
}

export type ACSummary = {
  total: number
  passed: number
  failed: number
  notVerified: number
  manualReview: number
}

export type VerificationResult = {
  workItemId: string
  lifecycle: string
  implementationEvidence: ImplementationEvidence
  acVerifications: ACVerificationResult[]
  acSummary: ACSummary
  releaseGates: ReleaseGate[]
  completionExceptions: CompletionException[]
  findings: EvidenceFinding[]
  plannedVsActual: PlannedVsActual | null
  validationStatus: ValidationStatus
  implementationStatus: ImplementationStatus
}

export type CompletionReadiness =
  | 'READY_TO_COMPLETE'
  | 'NEEDS_WORK'
  | 'BLOCKED'
  | 'READY_WITH_EXCEPTIONS'

export type CompletionEvaluation = {
  readiness: CompletionReadiness
  reasons: string[]
  blockers: string[]
  warnings: string[]
}

// --- Secret path filtering ---------------------------------------------------

const SECRET_PATTERNS = [
  /\.env($|\.)/i,
  /credential/i,
  /secret/i,
  /token/i,
  /\.key$/i,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
]

export function filterSecretPaths(paths: string[]): string[] {
  return paths.filter((p) => !SECRET_PATTERNS.some((re) => re.test(p)))
}

// --- AC text normalization ---------------------------------------------------

function normalizeAC(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

// --- Core functions ----------------------------------------------------------

export function collectImplementationEvidence(
  dir: string,
  workItemId: string,
  input: CollectEvidenceInput,
): ImplementationEvidence {
  const artifacts = discoverWorkItems(dir)
  const match = artifacts.find((a) => (a.id || a.title) === workItemId)
  if (!match) throw new WorkItemNotFoundError(workItemId)

  const lifecycle = lifecycleStateOf({ status: match.status, filePath: match.filePath })
  if (lifecycle !== 'in-progress') throw new WorkItemNotInProgressError(workItemId, lifecycle)

  const repositories: Record<string, RepoEvidence> = {}
  for (const repo of input.repos) {
    repositories[repo.repoId] = {
      role: repo.role ?? (repo.repoId === 'core' ? 'core' : 'module'),
      status: deriveRepoStatus(repo),
      changed_paths: filterSecretPaths(repo.changedPaths),
      validations: repo.validations.map((v) => ({
        command: v.command,
        status: v.status,
        ...(v.reason ? { reason: v.reason } : {}),
      })),
      ...(repo.migrations?.length ? {
        migrations: repo.migrations.map((m) => ({
          id: m.id,
          environment: m.environment,
          status: m.status,
          ...(m.reason ? { reason: m.reason } : {}),
        })),
      } : {}),
    }
  }

  return { repositories }
}

export function verifyWorkItem(
  dir: string,
  workItemId: string,
  input: CollectEvidenceInput,
): VerificationResult {
  const evidence = collectImplementationEvidence(dir, workItemId, input)

  const artifacts = discoverWorkItems(dir)
  const match = artifacts.find((a) => (a.id || a.title) === workItemId)!
  const lifecycle = lifecycleStateOf({ status: match.status, filePath: match.filePath })
  const fm = match.rawFrontmatter

  // AC verification: map input verifications against WI acceptance criteria
  const acVerifications = mapACVerifications(input.acVerifications)
  const acSummary = computeACSummary(acVerifications)

  // Release gates and completion exceptions from frontmatter
  const releaseGates = (Array.isArray(fm.release_gates) ? fm.release_gates : []) as ReleaseGate[]
  const completionExceptions = (Array.isArray(fm.completion_exceptions) ? fm.completion_exceptions : []) as CompletionException[]

  // Planned vs actual
  const plannedVsActual = computePlannedVsActual(match.affectedModules, input.repos)

  // Cross-repo coherence findings
  const registeredModuleIds = loadMappedModules(dir).map((m) => m.id)
  const modifiedRepoIds = input.repos.map((r) => r.repoId)
  const crossRepo = analyzeCrossRepoEvidence({
    id: workItemId,
    lifecycle,
    implementationStatus: match.implementationStatus || 'not-started',
    validationStatus: match.validationStatus || 'not-started',
    releaseStatus: match.releaseStatus || 'not-assessed',
    affectedModules: match.affectedModules,
    rawFrontmatter: fm,
    registeredModuleIds,
    modifiedRepoIds,
  })

  // Derive statuses from evidence
  const validationStatus = deriveValidationStatus(input.repos, acVerifications, completionExceptions)
  const implementationStatus = deriveImplementationStatus(input.repos)

  return {
    workItemId,
    lifecycle,
    implementationEvidence: evidence,
    acVerifications,
    acSummary,
    releaseGates,
    completionExceptions,
    findings: crossRepo.findings,
    plannedVsActual,
    validationStatus,
    implementationStatus,
  }
}

export function evaluateCompletion(verification: VerificationResult): CompletionEvaluation {
  const blockers: string[] = []
  const warnings: string[] = []
  const reasons: string[] = []

  // Check release gates
  for (const gate of verification.releaseGates) {
    if (gate.status === 'failed' || gate.status === 'blocked') {
      blockers.push(`Release gate "${gate.id}" is ${gate.status}${gate.reason ? ': ' + gate.reason : ''}.`)
    } else if (gate.status === 'pending') {
      warnings.push(`Release gate "${gate.id}" is still pending.`)
    }
  }

  // Check completion exceptions
  for (const ex of verification.completionExceptions) {
    if (ex.status === 'rejected') {
      blockers.push(`Completion exception "${ex.id}" was rejected${ex.reason ? ': ' + ex.reason : ''}.`)
    } else if (ex.status === 'proposed') {
      warnings.push(`Completion exception "${ex.id}" is still proposed (not yet accepted).`)
    }
  }

  // Check ACs
  if (verification.acSummary.failed > 0) {
    const failedACs = verification.acVerifications.filter((ac) => ac.status === 'failed')
    for (const ac of failedACs) {
      blockers.push(`AC failed: "${ac.criterion}".`)
    }
  }

  // Check blocking findings
  const blockingFindings = verification.findings.filter((f) => f.severity === 'blocking')
  for (const f of blockingFindings) {
    blockers.push(f.message)
  }

  // Check manual review ACs
  if (verification.acSummary.manualReview > 0) {
    warnings.push(`${verification.acSummary.manualReview} AC(s) require manual review.`)
  }

  // Check not-verified ACs
  if (verification.acSummary.notVerified > 0) {
    warnings.push(`${verification.acSummary.notVerified} AC(s) not yet verified.`)
  }

  // Warning findings
  const warningFindings = verification.findings.filter((f) => f.severity === 'warning')
  for (const f of warningFindings) {
    warnings.push(f.message)
  }

  // Planned vs actual deviations
  if (verification.plannedVsActual) {
    const pva = verification.plannedVsActual
    if (pva.missingModules.length > 0) {
      warnings.push(`Planned modules not touched: ${pva.missingModules.join(', ')}.`)
    }
    if (pva.addedModules.length > 0) {
      warnings.push(`Unplanned modules modified: ${pva.addedModules.join(', ')}.`)
    }
  }

  // Determine readiness
  let readiness: CompletionReadiness

  if (blockers.length > 0) {
    const hasOnlyACFailures = blockers.every((b) => b.startsWith('AC failed:'))
    if (hasOnlyACFailures) {
      readiness = 'NEEDS_WORK'
      reasons.push('Acceptance criteria have failures that must be addressed.')
    } else {
      readiness = 'BLOCKED'
      reasons.push('Blocking conditions prevent completion.')
    }
  } else {
    const hasAcceptedExceptions = verification.completionExceptions.some((e) => e.status === 'accepted')
    if (hasAcceptedExceptions) {
      readiness = 'READY_WITH_EXCEPTIONS'
      reasons.push('All required criteria pass. Accepted exceptions are documented.')
    } else {
      readiness = 'READY_TO_COMPLETE'
      reasons.push('All acceptance criteria pass. No blocking conditions.')
    }
  }

  return { readiness, reasons, blockers, warnings }
}

// --- Helpers -----------------------------------------------------------------

function deriveRepoStatus(repo: RepoEvidenceInput): string {
  if (repo.validations.length === 0 && repo.changedPaths.length === 0) return 'not-started'
  const hasFailure = repo.validations.some((v) => v.status === 'failed' || v.status === 'error')
  if (hasFailure) return 'failed'
  const allPassed = repo.validations.length > 0 && repo.validations.every((v) => v.status === 'passed' || v.status === 'skipped')
  if (allPassed) return 'completed'
  return 'in-progress'
}

function mapACVerifications(verifications: ACVerificationInput[]): ACVerificationResult[] {
  return verifications.map((v) => ({ ...v }))
}

function computeACSummary(verifications: ACVerificationResult[]): ACSummary {
  return {
    total: verifications.length,
    passed: verifications.filter((v) => v.status === 'passed').length,
    failed: verifications.filter((v) => v.status === 'failed').length,
    notVerified: verifications.filter((v) => v.status === 'not-verified').length,
    manualReview: verifications.filter((v) => v.status === 'manual-review-required').length,
  }
}

function computePlannedVsActual(
  affectedModules: string[],
  repos: RepoEvidenceInput[],
): PlannedVsActual | null {
  if (affectedModules.length === 0) return null

  const actualModules = [...new Set(repos.map((r) => r.repoId))]
  const plannedSet = new Set(affectedModules)
  const actualSet = new Set(actualModules)

  return {
    hasHandoff: true,
    plannedModules: affectedModules,
    actualModules,
    addedModules: actualModules.filter((m) => !plannedSet.has(m)),
    missingModules: affectedModules.filter((m) => !actualSet.has(m)),
  }
}

function deriveValidationStatus(
  repos: RepoEvidenceInput[],
  acVerifications: ACVerificationResult[],
  completionExceptions: CompletionException[],
): ValidationStatus {
  const allValidations = repos.flatMap((r) => r.validations)

  if (allValidations.length === 0 && acVerifications.length === 0) return 'not-started'

  const hasFailed = allValidations.some((v) => v.status === 'failed' || v.status === 'error') ||
    acVerifications.some((v) => v.status === 'failed')
  if (hasFailed) {
    const hasAccepted = completionExceptions.some((e) => e.status === 'accepted')
    if (hasAccepted) return 'accepted-with-exceptions'
    return 'failed'
  }

  const hasBlocked = allValidations.some((v) => v.status === 'error')
  if (hasBlocked) return 'blocked'

  const allComplete = allValidations.every((v) => v.status === 'passed' || v.status === 'skipped') &&
    acVerifications.every((v) => v.status === 'passed' || v.status === 'not-verified')
  if (allComplete && allValidations.length > 0) return 'passed'

  return 'in-progress'
}

function deriveImplementationStatus(repos: RepoEvidenceInput[]): ImplementationStatus {
  if (repos.length === 0) return 'not-started'

  const hasChanges = repos.some((r) => r.changedPaths.length > 0)
  if (!hasChanges) return 'not-started'

  const allComplete = repos.every((r) => {
    const status = deriveRepoStatus(r)
    return status === 'completed'
  })
  if (allComplete) return 'completed'

  const hasFailed = repos.some((r) => deriveRepoStatus(r) === 'failed')
  if (hasFailed) return 'partial'

  return 'in-progress'
}
