import type { KaddoModule } from './types.js'

export const skillsModule: KaddoModule = {
  name: 'skills',
  description: 'Reusable skills — capabilities shared across agents, teams, or projects',
  configKey: 'module_skills',
  dirs: ['architecture/skills'],
  files: [
    {
      path: 'architecture/skills/.gitkeep',
      content: '',
    },
    {
      path: 'architecture/skills/README.md',
      content: [
        '# Skills',
        '',
        'This directory contains skill definitions — reusable capabilities that agents',
        'or team members can invoke.',
        '',
        'A skill is a well-defined, repeatable capability with:',
        '- Clear inputs and outputs',
        '- A defined trigger (when to use it)',
        '- Known preconditions',
        '',
        'Skills differ from agents: a skill is a single capability,',
        'an agent is an orchestrator that uses skills.',
      ].join('\n'),
    },
  ],
  workItemTypes: [
    {
      name: 'skill',
      knowledgeLevel: 'K3',
      description: 'Skill — a reusable capability shared across agents, teams, or projects.',
      questions: [
        {
          id: 'what_it_does',
          prompt: 'What does this skill do?',
          placeholder: 'e.g. Reads the artifact front matters and returns ownership gaps',
          frontMatterField: 'what_it_does',
          required: true,
        },
        {
          id: 'trigger',
          prompt: 'When should this skill be invoked?',
          placeholder: 'e.g. When a guard FYI has no matching artifact with code globs',
          frontMatterField: 'trigger',
          required: true,
        },
        {
          id: 'inputs_outputs',
          prompt: 'What are the inputs and outputs?',
          placeholder: 'e.g. Input: list of touched files. Output: suggested artifact IDs to update',
          frontMatterField: 'inputs_outputs',
          required: true,
        },
      ],
      qualityGate: [
        'Skill is scoped to a single, reusable capability.',
        'Trigger condition is explicit.',
        'Inputs and outputs are defined.',
      ],
      extraFrontMatter: {
        skill_type: 'analysis',
        reusable_by: [],
        code: [],
      },
    },
  ],
}
