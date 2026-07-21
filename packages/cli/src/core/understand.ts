import { exists, join } from '../utils/fs.js'
import type { KaddoConfig, ProjectState } from './config.js'
import { agentInstallPath } from '../agents/groups.js'
import type { NextStepRecommendation, DeliveryState } from './next-step.js'
import type { ProjectRoute } from './project-route.js'
import type { MetadataHealth } from './metadata-health.js'

/** An agent is installed if present in its layer folder, or (legacy) the flat folder. */
export function agentIsInstalled(dir: string, fileName: string): boolean {
  return (
    exists(join(dir, agentInstallPath(fileName))) ||
    exists(join(dir, 'knowledge', 'agents', fileName))
  )
}

export type AgentStep = {
  /** Agent file name under knowledge/agents/, e.g. "capability-agent.md" */
  agent: string
  /** Expected output artifact path, relative to project root */
  output: string
  /** Whether the agent prompt is installed */
  installed: boolean
}

/** An active Work Item shown in the understand handoff (VS-079.1). */
export type UnderstandWorkItem = {
  id: string
  title: string
  type: string
  lifecycle: string
  knowledgeLevel: string
  hasOwnership: boolean
  /** Source metadata (VS-082). */
  source?: { type: string; id?: string }
  affectedModules?: string[]
}

export type UnderstandPlan = {
  project: {
    name: string
    state: ProjectState
    teamSize: string
    structure: string
    language: string
  }
  scanAvailable: boolean
  contextPackPath: string
  agentsInstalled: boolean
  missingAgents: string[]
  steps: AgentStep[]
  /** State-aware phase + recommendation (VS-079.1). */
  phase?: string
  nextStepRecommendation?: NextStepRecommendation
  deliveryState?: DeliveryState
  /** Active Work Items (draft/ready/in-progress/blocked). */
  activeWorkItems?: UnderstandWorkItem[]
  /** Paths to recommended agent/skill files that exist on disk. */
  recommendedPaths?: string[]
  /** Installed skill paths relevant to the recommendation. */
  recommendedSkillPaths?: string[]
  /** Project route progress map (VS-080). */
  projectRoute?: ProjectRoute
  /** Knowledge file metadata health (VS-084). */
  metadataHealth?: MetadataHealth
}

/** State-aware agent flow: each agent mapped to its expected output artifact. */
function flowForState(state: ProjectState): { agent: string; output: string }[] {
  switch (state) {
    case 'new':
      return [
        { agent: 'roadmap-agent.md', output: 'knowledge/delivery/roadmap.md' },
        { agent: 'architecture-agent.md', output: 'knowledge/tech/current-state.md' },
      ]
    case 'legacy':
      return [
        { agent: 'legacy-agent.md', output: 'knowledge/legacy/risks.md' },
        { agent: 'architecture-agent.md', output: 'knowledge/tech/current-state.md' },
        { agent: 'capability-agent.md', output: 'knowledge/product/capabilities.md' },
        { agent: 'roadmap-agent.md', output: 'knowledge/delivery/roadmap.md' },
      ]
    case 'pre-ai':
    default:
      return [
        { agent: 'capability-agent.md', output: 'knowledge/product/capabilities.md' },
        { agent: 'architecture-agent.md', output: 'knowledge/tech/current-state.md' },
        { agent: 'roadmap-agent.md', output: 'knowledge/delivery/roadmap.md' },
      ]
  }
}

/**
 * Build a deterministic understand plan: which agents to use, in what order, and the
 * expected output for each — based on project state. Does not call an LLM.
 */
export function buildUnderstandPlan(dir: string, config: KaddoConfig): UnderstandPlan {
  const state = config.project.state
  // Knowledge-aware (VS-047): drop foundational steps whose output already exists, so the plan
  // never recommends re-generating a roadmap/architecture/capabilities that are already present.
  const flow = flowForState(state).filter((s) => !exists(join(dir, s.output)))

  const steps: AgentStep[] = flow.map((s) => {
    const installed = agentIsInstalled(dir, s.agent)
    return { agent: s.agent, output: s.output, installed }
  })

  const missingAgents = steps.filter((s) => !s.installed).map((s) => s.agent)
  const agentsInstalled = exists(join(dir, 'knowledge', 'agents')) && missingAgents.length === 0

  return {
    project: {
      name: config.project.name,
      state,
      teamSize: config.team.size,
      structure: config.project.structure,
      language: 'English',
    },
    scanAvailable: exists(join(dir, '.kaddo', 'scan.json')),
    contextPackPath: '.kaddo/context-pack.md',
    agentsInstalled,
    missingAgents,
    steps,
  }
}

/**
 * Enrich an UnderstandPlan with state-aware delivery data from the project explanation (VS-079.1).
 * The enrichment is separate from buildUnderstandPlan so the core plan stays testable without
 * needing the full project explanation.
 */
export function enrichUnderstandPlan(
  plan: UnderstandPlan,
  opts: {
    phase: string
    nextStepRecommendation: NextStepRecommendation
    deliveryState: DeliveryState
    activeWorkItems: UnderstandWorkItem[]
    recommendedPaths: string[]
    recommendedSkillPaths: string[]
    language: string
    projectRoute?: ProjectRoute
    metadataHealth?: MetadataHealth
  },
): UnderstandPlan {
  return {
    ...plan,
    project: { ...plan.project, language: opts.language },
    phase: opts.phase,
    nextStepRecommendation: opts.nextStepRecommendation,
    deliveryState: opts.deliveryState,
    activeWorkItems: opts.activeWorkItems,
    recommendedPaths: opts.recommendedPaths,
    recommendedSkillPaths: opts.recommendedSkillPaths,
    projectRoute: opts.projectRoute,
    metadataHealth: opts.metadataHealth,
  }
}
