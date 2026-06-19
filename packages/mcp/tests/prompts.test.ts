import { describe, it, expect, afterEach } from 'vitest'
import { listPrompts, getPrompt } from '../src/prompts.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

describe('MCP prompts (VS-057 AC8)', () => {
  it('lists installed agent prompts with recommended inputs', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/agents/delivery/graph-agent.md', '# Graph Agent\n\nReview hints.')
    write(root, 'knowledge/agents/business/business-agent.md', '# Business Agent\n\nProblem.')
    const prompts = listPrompts(root)
    const names = prompts.map((p) => p.name).sort()
    expect(names).toEqual(['business-agent', 'graph-agent'])
    const graph = prompts.find((p) => p.name === 'graph-agent')!
    expect(graph.recommended_inputs).toContain('.kaddo/context-pack.md')
    expect(graph.recommended_inputs).toContain('.kaddo/graph-hints.md')
  })

  it('getPrompt returns full content or null', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/agents/business/business-agent.md', '# Business Agent\n\nProblem, users.')
    expect(getPrompt(root, 'business-agent')?.content).toContain('Problem, users')
    expect(getPrompt(root, 'nope-agent')).toBeNull()
  })
})
