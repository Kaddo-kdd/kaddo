import type { KaddoModule } from './types.js'

export const legacyModule: KaddoModule = {
  name: 'legacy',
  description: 'Legacy records — document systems with technical debt before modifying them',
  configKey: 'module_legacy',
  dirs: ['architecture/legacy'],
  files: [
    {
      path: 'architecture/legacy/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'legacy',
      knowledgeLevel: 'K3',
      description: 'Legacy — document a system with high debt or low knowledge before touching it.',
      questions: [
        {
          id: 'what_exists',
          prompt: 'What does this system or module currently do?',
          placeholder: 'e.g. Handles subscription billing via a third-party webhook processor from 2018',
          frontMatterField: 'what_exists',
          required: true,
        },
        {
          id: 'known_issues',
          prompt: 'What are the known issues or debt?',
          placeholder: 'e.g. No tests, hardcoded credentials, uses deprecated SDK',
          frontMatterField: 'known_issues',
          required: true,
        },
        {
          id: 'change_intent',
          prompt: 'What do you intend to change and why?',
          placeholder: 'e.g. Replace webhook processor with native Stripe webhooks',
          frontMatterField: 'change_intent',
          required: true,
        },
      ],
      qualityGate: [
        'What exists is documented.',
        'Known issues are listed.',
        'Change intent is clear.',
      ],
      extraFrontMatter: {
        risk_level: 'high',
        code: [],
      },
    },
  ],
}
