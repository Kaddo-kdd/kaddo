// MCP prompts (VS-057): expose installed agent prompts as MCP prompts.
// Read-only — reads knowledge/agents/** only.

import { listAgents, getAgentPrompt } from './catalog.js'

export type McpPromptInfo = {
  name: string
  description: string
  content: string
  recommended_inputs: string[]
}

// The context pack is always the primary input; a few agents benefit from extra artifacts.
const EXTRA_INPUTS: Record<string, string[]> = {
  'graph-agent': ['.kaddo/graph.json', '.kaddo/graph-hints.md'],
  'ownership-agent': ['knowledge/delivery/work-items/', 'knowledge/inventory.md'],
  'capsule-agent': ['knowledge/product/capabilities.md', 'knowledge/tech/decisions/'],
  'work-item-agent': ['knowledge/delivery/roadmap.md'],
  'implementation-agent': ['knowledge/tech/git-strategy.md'],
}

function recommendedInputs(name: string): string[] {
  return ['.kaddo/context-pack.md', ...(EXTRA_INPUTS[name] ?? [])]
}

/** List installed agent prompts as MCP prompt descriptors. */
export function listPrompts(root: string): McpPromptInfo[] {
  return listAgents(root).map((a) => ({
    name: a.name,
    description: a.description || `Kaddo ${a.name}`,
    content: '',
    recommended_inputs: recommendedInputs(a.name),
  }))
}

/** Full prompt content for one installed agent, or null if not installed. */
export function getPrompt(root: string, name: string): McpPromptInfo | null {
  const agent = getAgentPrompt(root, name)
  if (!agent) return null
  return {
    name: agent.name,
    description: agent.description || `Kaddo ${agent.name}`,
    content: agent.content,
    recommended_inputs: recommendedInputs(agent.name),
  }
}
