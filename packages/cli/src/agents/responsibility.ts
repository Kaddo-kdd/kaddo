// Agent responsibility boundaries & trace (VS-044).
//
// Single source of truth for: what each official Kaddo agent is responsible for, what it
// produces, which agents/commands it may suggest, what it must NOT suggest, and the next step
// in the flow. Agents produce KNOWLEDGE only — they never run Git, code or commands. The only
// agent allowed to suggest branches is the implementation-agent (and only by respecting the
// project Git strategy; it still never executes git).

export type AgentResponsibility = {
  /** Agent key, e.g. "roadmap-agent" (matches the prompt file name without .md). */
  agent: string
  /** What the agent is responsible for. */
  responsibleFor: string[]
  /** Artifacts the agent produces. */
  produces: string[]
  /** Agents or `kaddo` commands the agent MAY suggest. */
  canSuggest: string[]
  /** Actions the agent must NOT suggest. */
  cannotSuggest: string[]
  /** Recommended next step(s) in the flow (agents and/or commands). */
  next: string[]
}

// The official responsibility matrix. Keyed by agent name.
export const RESPONSIBILITY_MATRIX: Record<string, AgentResponsibility> = {
  'business-agent': {
    agent: 'business-agent',
    responsibleFor: ['Problem', 'Users', 'Rules', 'Constraints'],
    produces: ['knowledge/business/business.md'],
    canSuggest: ['product-agent'],
    cannotSuggest: ['Git', 'branches', 'commits', 'code'],
    next: ['product-agent'],
  },
  'product-agent': {
    agent: 'product-agent',
    responsibleFor: ['Product', 'Capabilities', 'Scope'],
    produces: ['knowledge/product/product.md', 'knowledge/product/capabilities.md'],
    canSuggest: ['roadmap-agent'],
    cannotSuggest: ['Git', 'implementation', 'branches', 'code'],
    next: ['roadmap-agent'],
  },
  'capability-agent': {
    agent: 'capability-agent',
    responsibleFor: ['Capabilities'],
    produces: ['knowledge/product/capabilities.md'],
    canSuggest: ['roadmap-agent'],
    cannotSuggest: ['Git', 'implementation', 'branches', 'code'],
    next: ['roadmap-agent'],
  },
  'bootstrap-agent': {
    agent: 'bootstrap-agent',
    responsibleFor: ['Initial direction', 'Capabilities', 'Quality attributes', 'Roadmap seed'],
    produces: [
      'knowledge/bootstrap-summary.md',
      'knowledge/product/capabilities.md',
      'knowledge/delivery/roadmap.md',
    ],
    canSuggest: ['capability-agent', 'architecture-agent', 'roadmap-agent'],
    cannotSuggest: ['Git', 'branches', 'commits', 'code'],
    next: ['capability-agent', 'architecture-agent'],
  },
  'codebase-agent': {
    agent: 'codebase-agent',
    responsibleFor: ['Stack', 'Structure', 'Standards'],
    produces: ['knowledge/tech/codebase.md'],
    canSuggest: ['architecture-agent', 'decision-agent'],
    cannotSuggest: ['Git', 'branches', 'commits', 'production code'],
    next: ['architecture-agent'],
  },
  'stack-agent': {
    agent: 'stack-agent',
    responsibleFor: ['Technologies', 'Stack classification'],
    produces: ['knowledge/tech/stack.md'],
    canSuggest: ['architecture-agent', 'standards-agent'],
    cannotSuggest: ['Git', 'branches', 'code'],
    next: ['architecture-agent'],
  },
  'standards-agent': {
    agent: 'standards-agent',
    responsibleFor: ['Coding/doc/testing standards'],
    produces: ['knowledge/tech/standards.md'],
    canSuggest: ['architecture-agent'],
    cannotSuggest: ['Git', 'branches', 'code'],
    next: ['architecture-agent'],
  },
  'security-agent': {
    agent: 'security-agent',
    responsibleFor: ['Security considerations'],
    produces: ['knowledge/tech/security.md'],
    canSuggest: ['architecture-agent', 'decision-agent'],
    cannotSuggest: ['Git', 'branches', 'code', 'vulnerability scanning'],
    next: ['architecture-agent'],
  },
  'module-design-agent': {
    agent: 'module-design-agent',
    responsibleFor: ['Module design', 'Boundaries'],
    produces: ['knowledge/tech/modules/<module>/module-design.md'],
    canSuggest: ['architecture-agent', 'decision-agent'],
    cannotSuggest: ['Git', 'branches', 'code'],
    next: ['architecture-agent'],
  },
  'architecture-agent': {
    agent: 'architecture-agent',
    responsibleFor: ['Architecture', 'Technical state', 'Risks'],
    produces: ['knowledge/tech/current-state.md'],
    canSuggest: ['decision-agent', 'roadmap-agent'],
    cannotSuggest: ['Git', 'branches', 'commits', 'code'],
    next: ['decision-agent', 'roadmap-agent'],
  },
  'decision-agent': {
    agent: 'decision-agent',
    responsibleFor: ['ADRs'],
    produces: ['knowledge/tech/decisions/'],
    canSuggest: ['implementation-agent'],
    cannotSuggest: ['Git', 'branches', 'commits', 'code'],
    next: ['implementation-agent'],
  },
  // The shipped prompt file is `adr-agent.md`; it plays the decision-agent role.
  'adr-agent': {
    agent: 'adr-agent',
    responsibleFor: ['ADRs', 'Decision candidates'],
    produces: ['knowledge/tech/decision-candidates.md', 'knowledge/tech/decisions/'],
    canSuggest: ['implementation-agent'],
    cannotSuggest: ['Git', 'branches', 'commits', 'code'],
    next: ['implementation-agent'],
  },
  'roadmap-agent': {
    agent: 'roadmap-agent',
    responsibleFor: ['Roadmap', 'Initiatives', 'Work Item candidates'],
    produces: ['knowledge/delivery/roadmap.md'],
    canSuggest: ['kaddo create --from roadmap', 'work-item-agent'],
    cannotSuggest: ['branches', 'commits', 'pull requests', 'code'],
    next: ['kaddo create --from roadmap', 'work-item-agent'],
  },
  'backlog-agent': {
    agent: 'backlog-agent',
    responsibleFor: ['Capturing ideas', 'Structuring new work'],
    produces: ['knowledge/delivery/work-items/draft/', 'roadmap candidates'],
    canSuggest: ['work-item-agent', 'roadmap-agent'],
    cannotSuggest: [
      'code',
      'branches',
      'commits',
      'editing the roadmap automatically',
      'auto-executing other agents',
    ],
    next: ['human decision (refine / add candidate / split / keep draft)'],
  },
  'work-item-agent': {
    agent: 'work-item-agent',
    responsibleFor: ['Work Item refinement'],
    produces: ['knowledge/delivery/work-items/'],
    canSuggest: ['implementation-agent'],
    cannotSuggest: ['branches', 'commits', 'pull requests', 'code'],
    next: ['implementation-agent'],
  },
  'implementation-agent': {
    agent: 'implementation-agent',
    responsibleFor: ['Implementation'],
    produces: ['Code', 'Tests', 'Migrations'],
    // The ONLY agent allowed to suggest branches — and only respecting the Git strategy.
    canSuggest: [
      'a branch (per knowledge/tech/git-strategy.md / .kaddo/git.yml)',
      'kaddo scan',
      'kaddo owners suggest',
      'kaddo guard',
    ],
    cannotSuggest: [
      'running git itself',
      'committing without human confirmation',
      'pushing or merging',
    ],
    next: ['kaddo scan', 'kaddo owners suggest', 'kaddo guard', 'kaddo explain'],
  },
  'guard-agent': {
    agent: 'guard-agent',
    responsibleFor: ['Knowledge drift'],
    produces: ['Findings', 'Warnings'],
    canSuggest: ['update knowledge', 'update ownership'],
    cannotSuggest: ['branches', 'commits', 'code'],
    next: ['update knowledge', 'kaddo owners suggest'],
  },
  'git-strategy-agent': {
    agent: 'git-strategy-agent',
    responsibleFor: ['Branch/commit/tag/release strategy (documentation)'],
    produces: ['knowledge/tech/git-strategy.md'],
    canSuggest: ['implementation-agent'],
    // It documents a strategy; it never creates branches/commits itself.
    cannotSuggest: ['creating branches', 'creating commits', 'creating tags'],
    next: ['implementation-agent'],
  },
  'legacy-agent': {
    agent: 'legacy-agent',
    responsibleFor: ['Risks', 'Unknowns', 'Safe first steps'],
    produces: ['knowledge/legacy/risks.md', 'knowledge/legacy/unknowns.md'],
    canSuggest: ['architecture-agent', 'capability-agent'],
    cannotSuggest: ['Git', 'branches', 'code', 'large rewrites'],
    next: ['architecture-agent'],
  },
}

/** Only this agent may suggest Git branches. */
export const BRANCH_SUGGESTING_AGENT = 'implementation-agent'

/** Whether an agent is allowed to suggest creating a branch. */
export function canSuggestBranches(agent: string): boolean {
  return agent === BRANCH_SUGGESTING_AGENT
}

function list(items: string[]): string {
  return items.length > 0 ? items.join(', ') : '—'
}

/**
 * Responsibility & boundaries block appended to an agent prompt. Makes explicit what the agent
 * owns and what it must never suggest, so agents stop drifting outside their responsibility.
 */
export function renderAgentBoundaries(agent: string): string {
  const r = RESPONSIBILITY_MATRIX[agent]
  if (!r) return ''
  return [
    '## Responsibility & Boundaries',
    '',
    `**Responsible for:** ${list(r.responsibleFor)}`,
    `**Produces:** ${list(r.produces)}`,
    `**May suggest:** ${list(r.canSuggest)}`,
    `**Must NOT suggest:** ${list(r.cannotSuggest)}`,
    '',
    'This agent produces **knowledge only**. It never runs Git, never runs code and never runs ' +
      'commands. It may only suggest actions inside its own responsibility.',
    '',
  ].join('\n')
}

/**
 * The standard Agent Trace footer every official prompt ends with, so each response makes clear
 * who produced the result, what it produced and what comes next.
 */
export function renderAgentTrace(agent: string): string {
  const r = RESPONSIBILITY_MATRIX[agent]
  if (!r) return ''
  const produced = r.produces.length > 0 ? r.produces.join('\n') : '(none)'
  const next = r.next.length > 0 ? r.next.join('\n') : '(end of flow)'
  return [
    '## Agent Trace',
    '',
    'End **every** response with this trace block so the flow stays auditable:',
    '',
    '```text',
    '────────────────────────',
    `Agent: ${r.agent}`,
    '',
    'Produced:',
    produced,
    '',
    'Next:',
    next,
    '────────────────────────',
    '```',
    '',
  ].join('\n')
}

/** Append the boundaries + trace sections to an agent prompt (no-op if no matrix entry). */
export function withResponsibilityTrace(fileName: string, content: string): string {
  const agent = fileName.replace(/\.md$/, '')
  if (!RESPONSIBILITY_MATRIX[agent]) return content
  return `${content.trimEnd()}\n\n${renderAgentBoundaries(agent)}\n${renderAgentTrace(agent)}`
}

/** Render the full responsibility matrix as Markdown (docs + reference). */
export function renderResponsibilityMatrixMarkdown(): string {
  const order = [
    'business-agent',
    'product-agent',
    'capability-agent',
    'codebase-agent',
    'architecture-agent',
    'decision-agent',
    'backlog-agent',
    'roadmap-agent',
    'work-item-agent',
    'implementation-agent',
    'guard-agent',
  ]
  const lines: string[] = []
  lines.push('| Agent | Responsible for | Produces | May suggest | Must NOT suggest |')
  lines.push('|---|---|---|---|---|')
  for (const key of order) {
    const r = RESPONSIBILITY_MATRIX[key]
    if (!r) continue
    lines.push(
      `| \`${r.agent}\` | ${list(r.responsibleFor)} | ${list(r.produces)} | ${list(
        r.canSuggest
      )} | ${list(r.cannotSuggest)} |`
    )
  }
  return lines.join('\n')
}
