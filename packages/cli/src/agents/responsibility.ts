// Agent responsibility boundaries & trace (VS-044).
//
// Single source of truth for: what each official Kaddo agent is responsible for, what it
// produces, which agents/commands it may suggest, what it must NOT suggest, and the next step
// in the flow. Agents produce KNOWLEDGE only — they never run Git, code or commands. The only
// agent allowed to suggest branches is the implementation-agent (and only by respecting the
// project Git strategy; it still never executes git).

import { SKILLS } from '../skills/skills.js'

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
  'module-context-agent': {
    agent: 'module-context-agent',
    responsibleFor: ['Module context', 'Responsibility', 'Boundaries', 'Interfaces', 'Dependencies'],
    produces: ['knowledge/module/module-context.md'],
    canSuggest: ['architecture-agent'],
    cannotSuggest: ['Git', 'branches', 'code', 'business.md', 'product.md', 'Work Items'],
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
    canSuggest: ['kaddo ready', 'mark_work_item_ready', 'implementation-agent'],
    cannotSuggest: ['branches', 'commits', 'pull requests', 'code'],
    next: ['kaddo ready (human review)', 'implementation-agent'],
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
  'capsule-agent': {
    agent: 'capsule-agent',
    responsibleFor: ['Refining/validating a Knowledge Capsule for external sharing'],
    produces: ['.kaddo/exports/<system>.capsule.md'],
    canSuggest: ['kaddo capsule export'],
    cannotSuggest: [
      'exporting secrets',
      'exporting source code',
      'inventing contracts',
      'code',
      'git',
    ],
    next: ['kaddo capsule export'],
  },
  'graph-agent': {
    agent: 'graph-agent',
    responsibleFor: ['Reviewing graph hints', 'Proposing precise relationship front matter'],
    produces: ['proposed front matter (code/capabilities/decisions/source/capsules)'],
    canSuggest: ['kaddo graph export', 'kaddo owners suggest'],
    cannotSuggest: [
      'code',
      'git',
      'modifying files without confirmation',
      'inventing relationships',
    ],
    next: ['kaddo graph export'],
  },
  'ownership-agent': {
    agent: 'ownership-agent',
    responsibleFor: ['Precise code: ownership for Work Items and artifacts'],
    produces: ['proposed code: globs'],
    canSuggest: ['kaddo owners suggest', 'kaddo guard'],
    cannotSuggest: [
      'code',
      'branches',
      'commits',
      'modifying files without confirmation',
    ],
    next: ['kaddo owners suggest', 'kaddo guard'],
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

/**
 * Standard project-language rule (VS-051) appended to every prompt: knowledge is written in the
 * configured language; technical identifiers are never translated. The CLI itself stays English.
 */
export function renderLanguageRule(): string {
  return [
    '## Project Language',
    '',
    'The project knowledge language is defined in `.kaddo/config.yml` (`project.language`) and shown',
    "in the context pack's Project Metadata (`Language:`). Write **all** generated knowledge",
    'artifacts in that language (default: English).',
    '',
    'Do not translate: code, file names, CLI commands or configuration keys.',
    '',
  ].join('\n')
}

/**
 * Reusable skills (VS-059) section: which standardized skills this agent should apply. Skills are
 * reusable capabilities — the agent orchestrates, the skill standardizes how to do one thing well.
 */
export function renderSkillsSection(agent: string): string {
  const applicable = SKILLS.filter((s) => s.appliesTo.includes(agent))
  if (applicable.length === 0) return ''
  return [
    '## Reusable Skills',
    '',
    'Apply these reusable skills when relevant (install with `kaddo add skills`; read them in',
    '`knowledge/skills/` or via the Kaddo MCP server):',
    '',
    ...applicable.map((s) => `- **${s.id}** — ${s.title}.`),
    '',
  ].join('\n')
}

/**
 * Agents that refine knowledge files created by `kaddo bootstrap` or templates. These agents
 * get frontmatter preservation rules appended to their prompts (VS-084).
 */
const KNOWLEDGE_REFINING_AGENTS: Record<string, string> = {
  'business-agent': 'business-agent',
  'capability-agent': 'capability-agent',
  'bootstrap-agent': 'bootstrap-agent',
  'codebase-agent': 'codebase-agent',
  'architecture-agent': 'architecture-agent',
  'roadmap-agent': 'roadmap-agent',
  'legacy-agent': 'legacy-agent',
  'work-item-agent': 'work-item-agent',
  'backlog-agent': 'backlog-agent',
  'adr-agent': 'adr-agent',
  'implementation-agent': 'implementation-agent',
  'module-context-agent': 'module-context-agent',
}

/**
 * Frontmatter preservation rules (VS-084) for agents that rewrite existing Kaddo knowledge files.
 */
export function renderFrontmatterRules(agent: string): string {
  if (!KNOWLEDGE_REFINING_AGENTS[agent]) return ''
  return [
    '## Frontmatter Rules',
    '',
    'When rewriting an existing Kaddo knowledge file:',
    '',
    '- Preserve the existing YAML frontmatter.',
    '- Do not remove `type`, `generated_by`, or `template_version`.',
    '- If the document is no longer a placeholder, set `project_state: ai-assisted`.',
    `- Add or update \`refined_by: ${agent}\`.`,
    '- Preserve unknown frontmatter keys — do not strip fields you do not recognize.',
    '- Only rewrite the markdown body unless metadata changes are explicitly required by these rules.',
    '- Preserve structural sections like `## Open Questions` — leave them empty rather than removing them.',
    '',
  ].join('\n')
}

/** Append language rule + frontmatter rules + boundaries + skills + trace sections to a prompt (no-op if no entry). */
export function withResponsibilityTrace(fileName: string, content: string): string {
  const agent = fileName.replace(/\.md$/, '')
  if (!RESPONSIBILITY_MATRIX[agent]) return content
  const skills = renderSkillsSection(agent)
  const skillsBlock = skills ? `${skills}\n` : ''
  const frontmatter = renderFrontmatterRules(agent)
  const frontmatterBlock = frontmatter ? `${frontmatter}\n` : ''
  return `${content.trimEnd()}\n\n${renderLanguageRule()}\n${frontmatterBlock}${renderAgentBoundaries(agent)}\n${skillsBlock}${renderAgentTrace(agent)}`
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
    'ownership-agent',
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
