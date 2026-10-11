// Shared, evidence-first context for Impact, Drift and Savings reports (WI-060).
// It deliberately separates what Kaddo has observed from what it derives or estimates.

import { loadConfig, projectMode } from './config.js'

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
