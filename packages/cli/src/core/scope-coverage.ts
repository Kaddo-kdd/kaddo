// Scope coverage analysis for Work Items (VS-095).
//
// Validates module_coverage, impact_analysis and scope_confidence consistency.
// Deterministic, no LLM, no git.

import type { Artifact } from '../services/artifact-reader.js'

export type ScopeFinding = {
  id: string
  severity: 'blocking' | 'warning' | 'fyi'
  message: string
}

export type ScopeCoverageSummary = {
  id: string
  scopeConfidence: { level: string; reasons: string[] } | null
  moduleCoverage: Record<string, { status: string; reason?: string }> | null
  impactAnalysis: Record<string, { status: string; reason?: string }> | null
  findings: ScopeFinding[]
  unknownModules: string[]
  hasScopeCoverage: boolean
}

const VALID_CONFIDENCE_LEVELS = new Set(['high', 'medium', 'low'])
const VALID_COVERAGE_STATUSES = new Set(['affected', 'reviewed-not-affected', 'unknown', 'not-applicable'])

const USER_FACING_KEYWORDS_EN = [
  'user', 'visitor', 'page', 'registration', 'login', 'form', 'show', 'display',
  'cta', 'flow', 'screen', 'dashboard', 'ui', 'frontend', 'interface', 'button',
  'menu', 'navigation', 'modal', 'dialog', 'notification', 'toast', 'message',
]

const USER_FACING_KEYWORDS_ES = [
  'usuario', 'visitante', 'página', 'registro', 'login', 'formulario', 'mostrar',
  'cta', 'flujo', 'pantalla', 'interfaz', 'botón', 'menú', 'navegación',
  'modal', 'diálogo', 'notificación', 'mensaje',
]

const USER_FACING_KEYWORDS = new Set([...USER_FACING_KEYWORDS_EN, ...USER_FACING_KEYWORDS_ES])

export function analyzeScopeCoverage(
  artifact: Artifact,
  registeredModuleIds: string[],
  frontendModuleIds: string[],
): ScopeCoverageSummary {
  const findings: ScopeFinding[] = []
  const id = artifact.id || artifact.title
  const mc = artifact.moduleCoverage
  const ia = artifact.impactAnalysis
  const sc = artifact.scopeConfidence
  const affectedModules = artifact.affectedModules
  const lifecycle = artifact.status
  const isCompleted = lifecycle === 'completed' || lifecycle === 'archived'
  const isReady = lifecycle === 'ready'
  const hasScopeCoverage = mc !== null || ia !== null || sc !== null
  const unknownModules: string[] = []

  // Validate scope_confidence level
  if (sc) {
    if (!VALID_CONFIDENCE_LEVELS.has(sc.level)) {
      findings.push({ id, severity: 'blocking', message: `Invalid scope_confidence level "${sc.level}". Must be high, medium, or low.` })
    }
    if (isReady && sc.level === 'low') {
      findings.push({ id, severity: 'warning', message: 'Work Item is ready but scope confidence is low.' })
    }
  }

  if (mc) {
    // Validate module IDs exist (core is always valid)
    for (const modId of Object.keys(mc)) {
      if (modId === 'core') continue
      if (!registeredModuleIds.includes(modId)) {
        findings.push({ id, severity: 'blocking', message: `Module "${modId}" in module_coverage is not registered in .kaddo/modules.yml.` })
      }
    }

    // Validate statuses
    for (const [modId, entry] of Object.entries(mc)) {
      if (!VALID_COVERAGE_STATUSES.has(entry.status)) {
        findings.push({ id, severity: 'blocking', message: `Invalid module_coverage status "${entry.status}" for module "${modId}".` })
      }
      if (entry.status === 'affected' && !entry.reason) {
        findings.push({ id, severity: 'warning', message: `Module "${modId}" is affected but has no reason.` })
      }
      if (entry.status === 'unknown') {
        unknownModules.push(modId)
      }
    }

    // AC13: Every affected module in module_coverage must appear in affected_modules
    for (const [modId, entry] of Object.entries(mc)) {
      if (entry.status === 'affected' && !affectedModules.includes(modId)) {
        findings.push({ id, severity: 'blocking', message: `Module "${modId}" is marked affected in module_coverage but missing from affected_modules.` })
      }
    }

    // AC14: Every module in affected_modules must be affected in module_coverage
    for (const modId of affectedModules) {
      const entry = mc[modId]
      if (entry && entry.status !== 'affected') {
        findings.push({ id, severity: 'blocking', message: `Module "${modId}" is in affected_modules but module_coverage status is "${entry.status}", not "affected".` })
      }
    }

    // Unknown modules when ready = warning
    if (isReady && unknownModules.length > 0) {
      for (const modId of unknownModules) {
        findings.push({ id, severity: 'warning', message: `Work Item is ready but module "${modId}" scope remains unknown.` })
      }
    }
  }

  // Impact analysis surface validation
  if (ia) {
    for (const [surface, entry] of Object.entries(ia)) {
      if (!VALID_COVERAGE_STATUSES.has(entry.status)) {
        findings.push({ id, severity: 'blocking', message: `Invalid impact_analysis status "${entry.status}" for surface "${surface}".` })
      }
      if (entry.status === 'unknown' && !entry.question && !entry.reason) {
        findings.push({ id, severity: 'warning', message: `Surface "${surface}" is unknown but has no question or explanation.` })
      }
    }
  }

  // User-facing heuristic: if WI text contains user-facing keywords and a mapped frontend module
  // exists but was not assessed in module_coverage, produce a warning.
  if (!isCompleted && frontendModuleIds.length > 0) {
    const wiText = `${artifact.title} ${artifact.rawFrontmatter?.target_behavior ?? ''} ${artifact.rawFrontmatter?.current_behavior ?? ''}`.toLowerCase()
    const isUserFacing = [...USER_FACING_KEYWORDS].some((kw) => wiText.includes(kw))
    if (isUserFacing && mc) {
      for (const fid of frontendModuleIds) {
        if (!mc[fid]) {
          findings.push({ id, severity: 'warning', message: `A mapped user-facing module "${fid}" was not assessed in module_coverage.` })
        }
      }
    }
  }

  return {
    id,
    scopeConfidence: sc,
    moduleCoverage: mc,
    impactAnalysis: ia,
    findings,
    unknownModules,
    hasScopeCoverage,
  }
}
