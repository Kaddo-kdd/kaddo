// Cross-repo implementation evidence analysis (VS-094).
//
// Validates that Work Items with affected_modules have coherent evidence:
// repos declared vs modified, validation per repo, migration status,
// lifecycle/validation/release coherence. Deterministic, no LLM, no git.

import type { ImplementationStatus, ValidationStatus, ReleaseStatus, ReleaseGate, CompletionException } from './lifecycle.js'

export type EvidenceFinding = {
  id: string
  severity: 'blocking' | 'warning' | 'fyi'
  message: string
}

export type WIEvidenceSummary = {
  id: string
  lifecycle: string
  implementationStatus: string
  validationStatus: string
  releaseStatus: string
  affectedModules: string[]
  findings: EvidenceFinding[]
  releaseGates: ReleaseGate[]
  completionExceptions: CompletionException[]
  repoEvidence: Record<string, { role: string; status: string }>
}

export type CrossRepoInput = {
  id: string
  lifecycle: string
  implementationStatus: string
  validationStatus: string
  releaseStatus: string
  affectedModules: string[]
  rawFrontmatter: Record<string, unknown>
  registeredModuleIds: string[]
  modifiedRepoIds: string[]
}

export function analyzeCrossRepoEvidence(input: CrossRepoInput): WIEvidenceSummary {
  const findings: EvidenceFinding[] = []
  const { id, lifecycle, implementationStatus, validationStatus, releaseStatus, affectedModules } = input

  // Parse structured evidence from frontmatter
  const raw = input.rawFrontmatter
  const evidence = raw.implementation_evidence as { repositories?: Record<string, unknown> } | undefined
  const repos = evidence?.repositories ?? {}
  const releaseGates = (Array.isArray(raw.release_gates) ? raw.release_gates : []) as ReleaseGate[]
  const exceptions = (Array.isArray(raw.completion_exceptions) ? raw.completion_exceptions : []) as CompletionException[]

  const repoEvidence: Record<string, { role: string; status: string }> = {}
  for (const [repoId, data] of Object.entries(repos)) {
    const d = data as Record<string, unknown>
    repoEvidence[repoId] = {
      role: String(d.role ?? (repoId === 'core' ? 'core' : 'module')),
      status: String(d.status ?? 'unknown'),
    }
  }

  // AC9: core is a reserved valid repo ID
  // AC10: other modules must be registered
  for (const mod of affectedModules) {
    if (mod === 'core') continue
    if (!input.registeredModuleIds.includes(mod)) {
      findings.push({ id, severity: 'blocking', message: `Affected module "${mod}" is not registered in .kaddo/modules.yml.` })
    }
  }

  // AC30: modified repo not declared in affected_modules
  for (const repoId of input.modifiedRepoIds) {
    if (!affectedModules.includes(repoId) && repoId !== 'core') {
      findings.push({ id, severity: 'blocking', message: `Repository "${repoId}" was modified but not declared in affected_modules.` })
    }
  }

  // AC31: declared repo without evidence
  for (const mod of affectedModules) {
    if (!repoEvidence[mod] && Object.keys(repos).length > 0) {
      findings.push({ id, severity: 'warning', message: `Declared affected module "${mod}" has no implementation evidence.` })
    }
  }

  // AC32: validations not run
  for (const [repoId, data] of Object.entries(repos)) {
    const d = data as Record<string, unknown>
    const validations = Array.isArray(d.validations) ? d.validations as { command: string; status: string }[] : []
    for (const v of validations) {
      if (v.status === 'not-run') {
        findings.push({ id, severity: 'warning', message: `Validation "${v.command}" in ${repoId} was not executed.` })
      }
    }

    // AC33: migrations blocked
    const migrations = Array.isArray(d.migrations) ? d.migrations as { id: string; status: string; environment: string }[] : []
    for (const m of migrations) {
      if (m.status === 'blocked') {
        findings.push({ id, severity: 'warning', message: `Migration "${m.id}" (${m.environment}) in ${repoId} is blocked.` })
      }
    }
  }

  // AC34: lifecycle/validation/release coherence
  if (lifecycle === 'completed') {
    // Completed with proposed (not accepted) exception is invalid
    const proposedExceptions = exceptions.filter((e) => e.status === 'proposed')
    if (proposedExceptions.length > 0) {
      findings.push({ id, severity: 'blocking', message: 'Work Item is completed but has proposed (not accepted) exceptions.' })
    }

    // Release ready with blocked gates is invalid
    if (releaseStatus === 'ready') {
      const blockedGates = releaseGates.filter((g) => g.status === 'blocked' || g.status === 'failed')
      if (blockedGates.length > 0) {
        findings.push({ id, severity: 'blocking', message: `Release status is "ready" but ${blockedGates.length} gate(s) are blocked/failed.` })
      }
    }
  }

  // AC12: evidence marked passed without command record
  for (const [repoId, data] of Object.entries(repos)) {
    const d = data as Record<string, unknown>
    const validations = Array.isArray(d.validations) ? d.validations as { command: string; status: string }[] : []
    for (const v of validations) {
      if (v.status === 'passed' && (!v.command || !v.command.trim())) {
        findings.push({ id, severity: 'blocking', message: `Evidence in ${repoId} marked "passed" without a command record.` })
      }
    }
  }

  // Legacy status warning
  if (raw.status === 'done') {
    findings.push({ id, severity: 'warning', message: 'Legacy status `done` detected. Canonical status is `completed`.' })
  }

  // Agent history: refined_by overwritten
  if (raw.refined_by && raw.implemented_by && raw.refined_by === raw.implemented_by) {
    findings.push({ id, severity: 'fyi', message: 'refined_by and implemented_by point to the same agent.' })
  }

  return {
    id,
    lifecycle,
    implementationStatus: implementationStatus || 'not-started',
    validationStatus: validationStatus || 'not-started',
    releaseStatus: releaseStatus || 'not-assessed',
    affectedModules,
    findings,
    releaseGates,
    completionExceptions: exceptions,
    repoEvidence,
  }
}
