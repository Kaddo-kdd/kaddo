import { describe, it, expect } from 'vitest'
import {
  AGENT_GROUPS,
  AGENT_GROUP_NAMES,
  recommendedAgents,
  selectAgentFiles,
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
    expect(recommendedAgents('new')).not.toContain('git-strategy-agent.md')
    expect(recommendedAgents('legacy')).toContain('legacy-agent.md')
    // unknown state falls back to pre-ai
    expect(recommendedAgents(undefined)).toEqual(recommendedAgents('pre-ai'))
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
