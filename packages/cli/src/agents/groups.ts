// Agent groups (VS bootstrap-minimal-artifacts-agent-groups).
//
// Agents are organized by knowledge layer so installation can be progressive: by default
// `kaddo add agents` installs only the set recommended for the project's state, instead of
// every agent. Single source of truth for the agent → group map, reused by `understand`.

import type { ProjectState } from '../core/config.js'

export type AgentGroup = 'business' | 'product' | 'tech' | 'delivery' | 'utilities'

/** Agent file names (without path) per group. */
export const AGENT_GROUPS: Record<AgentGroup, string[]> = {
  business: ['business-agent.md'],
  product: ['bootstrap-agent.md', 'capability-agent.md'],
  tech: [
    'architecture-agent.md',
    'codebase-agent.md',
    'stack-agent.md',
    'security-agent.md',
    'standards-agent.md',
    'module-design-agent.md',
    'adr-agent.md',
  ],
  delivery: [
    'roadmap-agent.md',
    'work-item-agent.md',
    'implementation-agent.md',
    'git-strategy-agent.md',
  ],
  utilities: ['legacy-agent.md'],
}

export const AGENT_GROUP_NAMES = Object.keys(AGENT_GROUPS) as AgentGroup[]

/** The layer group a given agent file belongs to (or 'utilities' if unmapped). */
export function agentGroupOf(fileName: string): AgentGroup {
  for (const g of AGENT_GROUP_NAMES) {
    if (AGENT_GROUPS[g].includes(fileName)) return g
  }
  return 'utilities'
}

/** Install path (relative to project root) for an agent, organized per layer folder. */
export function agentInstallPath(fileName: string): string {
  return `knowledge/agents/${agentGroupOf(fileName)}/${fileName}`
}

/** The agents recommended to install for each project state (minimum sufficient set). */
const RECOMMENDED_BY_STATE: Record<ProjectState, string[]> = {
  new: [
    'business-agent.md',
    'bootstrap-agent.md',
    'capability-agent.md',
    'architecture-agent.md',
    'codebase-agent.md',
    'roadmap-agent.md',
    'work-item-agent.md',
    'implementation-agent.md',
    'adr-agent.md',
  ],
  'pre-ai': [
    'capability-agent.md',
    'architecture-agent.md',
    'roadmap-agent.md',
    'work-item-agent.md',
    'implementation-agent.md',
  ],
  legacy: [
    'legacy-agent.md',
    'architecture-agent.md',
    'capability-agent.md',
    'roadmap-agent.md',
    'work-item-agent.md',
    'implementation-agent.md',
  ],
}

/** Recommended agent file names for a project state (falls back to `pre-ai`). */
export function recommendedAgents(state: string | undefined): string[] {
  return RECOMMENDED_BY_STATE[(state as ProjectState) ?? 'pre-ai'] ?? RECOMMENDED_BY_STATE['pre-ai']
}

/** Resolve which agent file names to install given the requested selection. */
export function selectAgentFiles(opts: {
  all?: boolean
  group?: string
  state?: string
}): { files: string[]; label: string } {
  if (opts.all) {
    const all = AGENT_GROUP_NAMES.flatMap((g) => AGENT_GROUPS[g])
    return { files: all, label: 'all agents' }
  }
  if (opts.group) {
    const group = opts.group as AgentGroup
    const files = AGENT_GROUPS[group]
    if (!files) {
      throw new Error(
        `Unknown agent group "${opts.group}". Valid groups: ${AGENT_GROUP_NAMES.join(', ')}.`
      )
    }
    return { files, label: `group: ${group}` }
  }
  return {
    files: recommendedAgents(opts.state),
    label: `recommended for state: ${opts.state ?? 'pre-ai'}`,
  }
}
