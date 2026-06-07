import { describe, it, expect } from 'vitest'
import {
  RESPONSIBILITY_MATRIX,
  canSuggestBranches,
  renderAgentTrace,
  renderResponsibilityMatrixMarkdown,
  BRANCH_SUGGESTING_AGENT,
} from '../src/agents/responsibility.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'

describe('agent responsibility matrix (VS-044)', () => {
  it('AC2: defines an official matrix with the key agents', () => {
    for (const a of [
      'business-agent',
      'product-agent',
      'capability-agent',
      'codebase-agent',
      'architecture-agent',
      'decision-agent',
      'roadmap-agent',
      'work-item-agent',
      'implementation-agent',
      'guard-agent',
    ]) {
      expect(RESPONSIBILITY_MATRIX[a]).toBeDefined()
    }
  })

  it('AC3: roadmap-agent cannot suggest branches/commits/PRs', () => {
    const r = RESPONSIBILITY_MATRIX['roadmap-agent']
    expect(r.cannotSuggest).toEqual(expect.arrayContaining(['branches', 'commits', 'pull requests']))
    expect(r.canSuggest).not.toContain('branch')
    expect(canSuggestBranches('roadmap-agent')).toBe(false)
    expect(r.next).toEqual(['kaddo create --from roadmap', 'work-item-agent'])
  })

  it('AC4: work-item-agent cannot suggest commits or pull requests', () => {
    const r = RESPONSIBILITY_MATRIX['work-item-agent']
    expect(r.cannotSuggest).toEqual(expect.arrayContaining(['commits', 'pull requests', 'branches']))
    expect(r.next).toEqual(['implementation-agent'])
    expect(canSuggestBranches('work-item-agent')).toBe(false)
  })

  it('AC5: implementation-agent is the ONLY agent allowed to suggest branches', () => {
    expect(BRANCH_SUGGESTING_AGENT).toBe('implementation-agent')
    expect(canSuggestBranches('implementation-agent')).toBe(true)
    const branchSuggesters = Object.keys(RESPONSIBILITY_MATRIX).filter((a) => canSuggestBranches(a))
    expect(branchSuggesters).toEqual(['implementation-agent'])
  })

  it('AC6: implementation-agent references the Git strategy', () => {
    const r = RESPONSIBILITY_MATRIX['implementation-agent']
    expect(r.canSuggest.some((s) => /git-strategy|\.kaddo\/git\.yml/.test(s))).toBe(true)
  })

  it('renders a trace block with Agent / Produced / Next', () => {
    const trace = renderAgentTrace('roadmap-agent')
    expect(trace).toContain('Agent: roadmap-agent')
    expect(trace).toContain('Produced:')
    expect(trace).toContain('knowledge/delivery/roadmap.md')
    expect(trace).toContain('Next:')
    expect(trace).toContain('kaddo create --from roadmap')
  })

  it('renders the matrix as markdown', () => {
    const md = renderResponsibilityMatrixMarkdown()
    expect(md).toContain('| Agent |')
    expect(md).toContain('`roadmap-agent`')
    expect(md).toContain('`implementation-agent`')
  })
})

describe('agent prompts carry Agent Trace (AC1)', () => {
  it('every official prompt ends with a Responsibility & Boundaries + Agent Trace block', () => {
    for (const p of AGENT_PROMPTS) {
      expect(p.content, p.fileName).toContain('## Responsibility & Boundaries')
      expect(p.content, p.fileName).toContain('## Agent Trace')
      expect(p.content, p.fileName).toContain(`Agent: ${p.fileName.replace(/\.md$/, '')}`)
    }
  })

  it('includes the new implementation-agent prompt', () => {
    expect(AGENT_PROMPTS.map((p) => p.fileName)).toContain('implementation-agent.md')
  })

  it('VS-050: backlog-agent exists, never implements and never auto-executes', () => {
    expect(RESPONSIBILITY_MATRIX['backlog-agent']).toBeDefined()
    const p = AGENT_PROMPTS.find((x) => x.fileName === 'backlog-agent.md')!
    expect(p, 'backlog-agent.md prompt').toBeDefined()
    const lower = p.content.toLowerCase()
    expect(lower).toContain('do not write code')
    expect(lower).toContain('never auto-execute')
    expect(lower).toMatch(/work item draft|roadmap candidate/)
    expect(lower).toContain('human decision')
    // It must not run git nor the downstream agents automatically.
    expect(RESPONSIBILITY_MATRIX['backlog-agent'].cannotSuggest.join(' ')).toMatch(
      /auto-executing other agents/
    )
  })

  it('roadmap-agent prompt explicitly forbids suggesting branches', () => {
    const roadmap = AGENT_PROMPTS.find((p) => p.fileName === 'roadmap-agent.md')!
    expect(roadmap.content.toLowerCase()).toContain('do not suggest branches')
  })

  it('work-item-agent prompt hands off to implementation-agent and not to commits', () => {
    const wi = AGENT_PROMPTS.find((p) => p.fileName === 'work-item-agent.md')!
    expect(wi.content).toContain('implementation-agent')
    expect(wi.content).not.toContain('Commit only with explicit human confirmation')
  })

  it('implementation-agent forbids running git / committing without confirmation', () => {
    const p = AGENT_PROMPTS.find((x) => x.fileName === 'implementation-agent.md')!
    expect(p.content.toLowerCase()).toContain('never run git')
    expect(p.content.toLowerCase()).toMatch(/do not create or switch branches/)
  })
})
