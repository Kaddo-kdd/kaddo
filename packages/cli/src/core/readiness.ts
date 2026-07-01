// Project readiness (VS-072 / folded into explain by VS-072.1).
//
// Deterministic diagnosis of where a project sits in the Kaddo cycle and the single next step. Reads
// existing signals only — config, scan, understand, agents/skills, knowledge files, open-questions
// readiness, roadmap, Work Items and adapter status. Never runs other commands, never writes, never
// edits knowledge, no git, no LLM. Surfaced inside `kaddo explain`.

import { exists, join } from '../utils/fs.js'
import { loadConfig } from './config.js'
import { buildOpenQuestionsReport } from './open-questions.js'
import { buildCodexAdapterContext } from './codex-adapter.js'
import { analyzeKnowledgeArtifact, type ArtifactQuality } from './artifact-quality.js'
import {
  resolveNextStep,
  roadmapSignal,
  workItemsSignal,
  installedAdapters,
  type NextStepRecommendation,
  type RoadmapSignal,
  type WorkItemsSignal,
} from './next-step.js'

export type ReadinessStatus =
  | 'not-initialized'
  | 'not-applicable'
  | 'legacy-project'
  | 'initialized'
  | 'scanned'
  | 'bootstrap-incomplete'
  | 'agents-missing'
  | 'skills-missing'
  | 'knowledge-incomplete'
  | 'needs-decisions'
  | 'ready-for-roadmap'
  | 'ready-for-work-item'
  | 'ready-for-implementation'

export type Presence = ArtifactQuality
export type { RoadmapSignal, WorkItemsSignal }

export type ReadinessReport = {
  project_name: string
  project_type: string
  overall: ReadinessStatus
  signals: {
    scan: 'available' | 'missing'
    understand: 'available' | 'missing'
    bootstrap_baseline: 'complete' | 'incomplete'
    agents: 'present' | 'missing'
    skills: 'present' | 'missing'
    current_state: Presence
    codebase: Presence
    capabilities: Presence
    product: Presence
    business: Presence
    roadmap: RoadmapSignal
    work_items: WorkItemsSignal
    adapters: string[]
    blocking_open_questions: number
    assumed_questions: number
    resolved_questions: number
    deferred_questions: number
  }
  recommended_next_step: { label: string; command?: string }
  /** The unified next-step recommendation shared across context/understand/explain (VS-073.2). */
  nextStepRecommendation: NextStepRecommendation
}

const KNOWLEDGE_FILES: { key: 'current_state' | 'codebase' | 'capabilities' | 'product' | 'business'; path: string; label: string; agent: string }[] = [
  { key: 'current_state', path: 'knowledge/tech/current-state.md', label: 'knowledge/tech/current-state.md', agent: 'architecture-agent' },
  { key: 'codebase', path: 'knowledge/tech/codebase.md', label: 'knowledge/tech/codebase.md', agent: 'codebase-agent' },
  { key: 'capabilities', path: 'knowledge/product/capabilities.md', label: 'knowledge/product/capabilities.md', agent: 'capability-agent' },
  { key: 'product', path: 'knowledge/product/product.md', label: 'knowledge/product/product.md', agent: 'product-agent' },
  { key: 'business', path: 'knowledge/business/business.md', label: 'knowledge/business/business.md', agent: 'business-agent' },
]

/** Build the deterministic project readiness diagnosis. */
export function buildReadinessReport(dir: string, now: Date = new Date()): ReadinessReport {
  const config = loadConfig(dir)

  const rec = resolveNextStep(dir, now)

  const stub = (overall: ReadinessStatus, label: string, command?: string): ReadinessReport => ({
    project_name: config?.project.name ?? 'unknown',
    project_type: config?.project.state ?? 'unknown',
    overall,
    signals: {
      scan: 'missing', understand: 'missing', bootstrap_baseline: 'incomplete', agents: 'missing', skills: 'missing',
      current_state: 'missing', codebase: 'missing', capabilities: 'missing', product: 'missing', business: 'missing',
      roadmap: 'missing', work_items: 'none', adapters: [],
      blocking_open_questions: 0, assumed_questions: 0, resolved_questions: 0, deferred_questions: 0,
    },
    recommended_next_step: { label, ...(command ? { command } : {}) },
    nextStepRecommendation: rec,
  })

  if (!config) return stub('not-initialized', rec.label, rec.command)
  if (config.project.state === 'new') return stub('not-applicable', 'This project uses the standard new-project Kaddo flow.')
  if (config.project.state === 'legacy') return stub('legacy-project', 'Use the legacy project flow.')

  const scan = exists(join(dir, '.kaddo', 'scan.json')) ? 'available' : 'missing'
  const understand = exists(join(dir, '.kaddo', 'understand.md')) ? 'available' : 'missing'
  const presence = Object.fromEntries(KNOWLEDGE_FILES.map((f) => [f.key, analyzeKnowledgeArtifact(dir, f.path)])) as Record<typeof KNOWLEDGE_FILES[number]['key'], Presence>
  const ctx = buildCodexAdapterContext(dir)
  const agents = ctx.hasAgents ? 'present' : 'missing'
  const skills = ctx.hasSkills ? 'present' : 'missing'
  // Bootstrap baseline "complete" = the core files exist (bootstrap has run). Placeholder/weak content
  // does not block this gate — it is handled later as `knowledge-incomplete` (refine, not re-bootstrap).
  const bootstrapBaseline = presence.business !== 'missing' && presence.product !== 'missing' ? 'complete' : 'incomplete'
  const roadmap = roadmapSignal(dir)
  const work_items = workItemsSignal(dir)
  const adapters = installedAdapters(dir)
  const oq = buildOpenQuestionsReport(dir, now)

  const signals: ReadinessReport['signals'] = {
    scan, understand, bootstrap_baseline: bootstrapBaseline, agents, skills,
    current_state: presence.current_state, codebase: presence.codebase, capabilities: presence.capabilities,
    product: presence.product, business: presence.business,
    roadmap, work_items, adapters,
    blocking_open_questions: oq.summary.blocking_open,
    assumed_questions: oq.summary.resolution.assumed,
    resolved_questions: oq.summary.resolution.resolved,
    deferred_questions: oq.summary.resolution.deferred,
  }

  // `overall` is the readiness status label; the actual next step comes from the unified resolver
  // (VS-073.2) so explain/context/understand never diverge.
  const firstWeak = KNOWLEDGE_FILES.find((f) => presence[f.key] !== 'useful')
  let overall: ReadinessStatus
  if (scan === 'missing') overall = 'initialized'
  else if (bootstrapBaseline === 'incomplete') overall = 'bootstrap-incomplete'
  else if (agents === 'missing') overall = 'agents-missing'
  else if (skills === 'missing') overall = 'skills-missing'
  else if (understand === 'missing') overall = 'scanned'
  else if (firstWeak) overall = 'knowledge-incomplete'
  else if (oq.summary.blocking_open > 0) overall = 'needs-decisions'
  else if (roadmap !== 'has-candidates') overall = 'ready-for-roadmap'
  else if (work_items === 'none' || work_items === 'none-ready') overall = 'ready-for-work-item'
  else overall = 'ready-for-implementation'

  return {
    project_name: config.project.name,
    project_type: config.project.state,
    overall,
    signals,
    recommended_next_step: { label: rec.label, ...(rec.command ? { command: rec.command } : {}) },
    nextStepRecommendation: rec,
  }
}
