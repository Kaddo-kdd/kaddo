import { exists, join } from '../utils/fs.js'
import type { KaddoConfig, ProjectState } from './config.js'

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
        { agent: 'roadmap-agent.md', output: 'knowledge/roadmap.md' },
        { agent: 'architecture-agent.md', output: 'knowledge/current-state.md' },
      ]
    case 'legacy':
      return [
        { agent: 'legacy-agent.md', output: 'knowledge/legacy/risks.md' },
        { agent: 'architecture-agent.md', output: 'knowledge/current-state.md' },
        { agent: 'capability-agent.md', output: 'knowledge/capabilities.md' },
        { agent: 'roadmap-agent.md', output: 'knowledge/roadmap.md' },
      ]
    case 'pre-ai':
    default:
      return [
        { agent: 'capability-agent.md', output: 'knowledge/capabilities.md' },
        { agent: 'architecture-agent.md', output: 'knowledge/current-state.md' },
        { agent: 'roadmap-agent.md', output: 'knowledge/roadmap.md' },
      ]
  }
}

/**
 * Build a deterministic understand plan: which agents to use, in what order, and the
 * expected output for each — based on project state. Does not call an LLM.
 */
export function buildUnderstandPlan(dir: string, config: KaddoConfig): UnderstandPlan {
  const state = config.project.state
  const flow = flowForState(state)

  const steps: AgentStep[] = flow.map((s) => {
    const installed = exists(join(dir, 'knowledge', 'agents', s.agent))
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
