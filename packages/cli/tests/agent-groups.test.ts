import { describe, it, expect } from 'vitest'
import {
  AGENT_GROUPS,
  AGENT_GROUP_NAMES,
  recommendedAgents,
  selectAgentFiles,
  agentInstallPath,
} from '../src/agents/groups.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'

describe('agent groups', () => {
  it('covers every installed agent exactly once across groups', () => {
    const grouped = AGENT_GROUP_NAMES.flatMap((g) => AGENT_GROUPS[g]).sort()
    const all = AGENT_PROMPTS.map((a) => a.fileName).sort()
    expect(grouped).toEqual(all)
    expect(new Set(grouped).size).toBe(grouped.length) // no duplicates
  })

  it('recommends a minimal set per state', () => {
    expect(recommendedAgents('new')).toContain('business-agent.md')
    // VS-031: capability + architecture are needed during Business → Product → Tech
    expect(recommendedAgents('new')).toContain('capability-agent.md')
    expect(recommendedAgents('new')).toContain('architecture-agent.md')
    expect(recommendedAgents('new')).not.toContain('git-strategy-agent.md')
    expect(recommendedAgents('legacy')).toContain('legacy-agent.md')
    // unknown state falls back to pre-ai
    expect(recommendedAgents(undefined)).toEqual(recommendedAgents('pre-ai'))
  })

  it('agentInstallPath nests agents under their layer folder', () => {
    expect(agentInstallPath('business-agent.md')).toBe('knowledge/agents/business/business-agent.md')
    expect(agentInstallPath('codebase-agent.md')).toBe('knowledge/agents/tech/codebase-agent.md')
    expect(agentInstallPath('roadmap-agent.md')).toBe('knowledge/agents/delivery/roadmap-agent.md')
  })

  it('selectAgentFiles honors --all, --group and default', () => {
    expect(selectAgentFiles({ all: true }).files.length).toBe(AGENT_PROMPTS.length)
    expect(selectAgentFiles({ group: 'tech' }).files).toContain('codebase-agent.md')
    expect(selectAgentFiles({ state: 'new' }).files).toContain('bootstrap-agent.md')
  })

  it('throws on an unknown group', () => {
    expect(() => selectAgentFiles({ group: 'nope' })).toThrow('Unknown agent group')
  })
})
