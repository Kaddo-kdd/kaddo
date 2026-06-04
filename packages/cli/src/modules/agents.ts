import type { KaddoModule, ModuleFile } from './types.js'
import { AGENT_PROMPTS } from '../agents/prompts.js'
import { agentInstallPath } from '../agents/groups.js'

const agentReadme: ModuleFile = {
  path: 'knowledge/agents/README.md',
  content: [
    '# Agents',
    '',
    'This directory contains Kaddo agent prompt packs — versionable Markdown prompts you',
    'use in your preferred LLM chat (Claude, ChatGPT, Cursor, Copilot, Windsurf…).',
    '',
    '**Kaddo does not execute these agents.** The CLI prepares context; the LLM interprets.',
    '',
    '## How to use',
    '',
    '1. Run `kaddo scan` then `kaddo context` to generate `.kaddo/context-pack.md`.',
    '2. Open your LLM chat.',
    '3. Paste `.kaddo/context-pack.md` together with the agent prompt for your task.',
    '4. Save the agent output to the location each prompt specifies.',
    '',
    '## Recommended order by project state',
    '',
    '- **new** → business-agent → bootstrap-agent → codebase-agent → roadmap-agent',
    '- **pre-ai** → capability-agent → architecture-agent → roadmap-agent',
    '- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent',
    '',
    '## Installed agents',
    '',
    '### Bootstrap agents (new projects)',
    '',
    '- `business-agent.md` — turn an idea into a business definition.',
    '- `bootstrap-agent.md` — go from business to capabilities, quality attributes and roadmap.',
    '- `codebase-agent.md` — propose a codebase foundation (no code).',
    '',
    '### Understanding agents',
    '',
    '- `capability-agent.md` — extract/propose system capabilities.',
    '- `architecture-agent.md` — reconstruct/propose the architecture baseline.',
    '- `roadmap-agent.md` — propose roadmap candidates.',
    '- `legacy-agent.md` — analyze risks/unknowns before changing legacy code.',
    '- `adr-agent.md` — propose candidate architecture decisions.',
    '',
    '### Operational agents',
    '',
    '- `work-item-agent.md` — refine roadmap candidates or existing Work Items.',
    '- `git-strategy-agent.md` — define branch/commit/tag/release strategy.',
    '- `security-agent.md` — document security considerations (no scanning).',
    '- `standards-agent.md` — propose lightweight coding/docs/architecture standards.',
    '- `stack-agent.md` — document technologies and stack decisions.',
    '- `module-design-agent.md` — document the design of a mapped module.',
  ].join('\n'),
}

const agentFiles: ModuleFile[] = AGENT_PROMPTS.map((a) => ({
  path: agentInstallPath(a.fileName),
  content: a.content,
}))

export const agentsModule: KaddoModule = {
  name: 'agents',
  description: 'Agent prompt packs — Markdown prompts to turn context packs into knowledge in your LLM',
  configKey: 'module_agents',
  dirs: ['knowledge/agents'],
  files: [agentReadme, ...agentFiles],
  workItemTypes: [
    {
      name: 'agent',
      knowledgeLevel: 'K3',
      description: 'Agent — a reusable AI agent that operates over the Knowledge Repository.',
      questions: [
        {
          id: 'purpose',
          prompt: 'What does this agent do?',
          placeholder: 'e.g. Reviews guard FYIs and suggests which artifacts need updating',
          frontMatterField: 'purpose',
          required: true,
        },
        {
          id: 'knowledge_inputs',
          prompt: 'What knowledge does this agent need? (domains, artifact types)',
          placeholder: 'e.g. Active work items in payments domain, all ADRs with code globs',
          frontMatterField: 'knowledge_inputs',
          required: true,
        },
        {
          id: 'outputs',
          prompt: 'What does this agent produce?',
          placeholder: 'e.g. A prioritized list of artifacts to update with suggested changes',
          frontMatterField: 'outputs',
          required: true,
        },
      ],
      qualityGate: [
        'Agent purpose is specific and actionable.',
        'Required knowledge inputs are identified.',
        'Outputs are concrete and usable by a human or another agent.',
      ],
      extraFrontMatter: {
        agent_type: 'review',
        domains: [],
        code: [],
      },
    },
  ],
}
