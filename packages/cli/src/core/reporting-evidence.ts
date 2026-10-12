// Shared, evidence-first context for Impact, Drift and Savings reports (WI-060).
// It deliberately separates what Kaddo has observed from what it derives or estimates.

import { loadConfig, projectMode } from './config.js'
import { getResources } from './resources.js'
import { discoverInitiatives } from './initiative.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import type { GraphHint } from './graph-hints.js'

export type EvidenceKind = 'observed' | 'derived' | 'estimated' | 'projected' | 'unknown' | 'not_applicable'

export type ReportingProjectContext = {
  state: 'new' | 'pre-ai' | 'legacy' | 'ai-assisted' | 'unknown'
  mode: 'standard' | 'poc' | 'unknown'
  repository_structure: 'monorepo' | 'multirepo' | 'unknown'
}

export type EvidenceItem = {
  id: string
  label: string
  classification: EvidenceKind
  reason: string
}

/** A deterministic, traceable report finding. Findings never execute their suggested action. */
export type ReportFinding = {
  id: string
  category: 'knowledge' | 'delivery' | 'topology' | 'consistency'
  source: string
  affected_artifacts: string[]
  priority: 'high' | 'medium' | 'low' | 'unknown'
  evidence: string
  explanation: string
  suggested_action: string
}

/** Reuse Graph Hints as report findings instead of creating another topology validator. */
export function graphHintFinding(hint: GraphHint): ReportFinding {
  const affected = [hint.artifact_id, ...(hint.path ? [hint.path] : [])]
  return {
    id: `graph-hint:${hint.artifact_id}:${hint.missing.join(',')}`,
    category: 'topology',
    source: 'graph-hints',
    affected_artifacts: affected,
    // Graph Hints are intentionally informational; review is useful but not a blocking error.
    priority: 'medium',
    evidence: hint.reason,
    explanation: hint.message,
    suggested_action: `Review the declared relationships for ${hint.artifact_id}${hint.path ? ` at ${hint.path}` : ''}.`,
  }
}

export function reportingProjectContext(dir: string): ReportingProjectContext {
  const config = loadConfig(dir)
  if (!config) return { state: 'unknown', mode: 'unknown', repository_structure: 'unknown' }
  return {
    state: config.project.state,
    mode: projectMode(config),
    repository_structure: config.project.structure,
  }
}

/** Optional capabilities are not delivery failures. In POC mode only Tech and Delivery are baseline layers. */
export function knowledgeLayerEvidence(context: ReportingProjectContext, layer: string, present: boolean): EvidenceItem {
  const baseline = context.mode === 'poc' ? ['Tech', 'Delivery'] : ['Business', 'Product', 'Tech', 'Delivery']
  if (!baseline.includes(layer)) {
    return { id: `knowledge.${layer.toLowerCase()}`, label: `${layer} knowledge`, classification: 'not_applicable', reason: 'This layer is outside the configured POC baseline.' }
  }
  return {
    id: `knowledge.${layer.toLowerCase()}`,
    label: `${layer} knowledge`,
    classification: present ? 'observed' : 'unknown',
    reason: present ? 'A structured knowledge artifact is present.' : 'No structured artifact was found; absence is not proof that knowledge does not exist.',
  }
}

/** Optional delivery capabilities are reported when present, never scored as missing. */
export function deliveryCapabilityEvidence(dir: string, context: ReportingProjectContext): EvidenceItem[] {
  const initiatives = discoverInitiatives(dir)
  const resources = getResources(dir)
  const modules = loadMappedModules(dir)
  return [
    { id: 'initiatives', label: 'Initiatives', classification: initiatives.length ? 'observed' : 'not_applicable', reason: initiatives.length ? `${initiatives.length} optional Initiative artifact(s) were discovered.` : 'Initiatives are optional and no Initiative artifacts were discovered.' },
    { id: 'resources', label: 'Project Resources', classification: resources.length ? 'observed' : 'not_applicable', reason: resources.length ? `${resources.length} Project Resource artifact(s) were discovered.` : 'Resources are optional and no Resource artifacts were discovered.' },
    { id: 'multirepo', label: 'Multirepo mapping', classification: context.repository_structure === 'multirepo' ? (modules.length ? 'observed' : 'unknown') : 'not_applicable', reason: context.repository_structure === 'multirepo' ? (modules.length ? `${modules.length} module mapping(s) were discovered.` : 'Project is multirepo but no module mappings were found.') : 'The project is configured as a monorepo.' },
  ]
}
