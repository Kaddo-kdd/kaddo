import type { KaddoModule } from './types.js'

export const agentsModule: KaddoModule = {
  name: 'agents',
  description: 'Reusable agents — define AI agents that operate over the Knowledge Repository',
  configKey: 'module_agents',
  dirs: ['architecture/agents'],
  files: [
    {
      path: 'architecture/agents/.gitkeep',
      content: '',
    },
    {
      path: 'architecture/agents/README.md',
      content: [
        '# Agents',
        '',
        'This directory contains agent definitions for the Knowledge Repository.',
        '',
        'Each agent is a markdown file declaring:',
        '- What the agent does',
        '- What knowledge it needs',
        '- What outputs it produces',
        '- Which domains it operates in',
        '',
        'Agents are consumed by `kaddo explain --for agent` and external orchestrators.',
      ].join('\n'),
    },
  ],
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
