import { exists, join } from '../utils/fs.js'
import type { KaddoConfig, ProjectState } from './config.js'
import { agentInstallPath } from '../agents/groups.js'

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

export type UnderstandPlan = {
  project: {
    name: string
    state: ProjectState
    teamSize: string
    structure: string
  }
  scanAvailable: boolean
  contextPackPath: string
  agentsInstalled: boolean
  missingAgents: string[]
  steps: AgentStep[]
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
    },
    scanAvailable: exists(join(dir, '.kaddo', 'scan.json')),
    contextPackPath: '.kaddo/context-pack.md',
    agentsInstalled,
    missingAgents,
    steps,
  }
}
