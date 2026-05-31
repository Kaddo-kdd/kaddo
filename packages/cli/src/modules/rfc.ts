import type { KaddoModule } from './types.js'

export const rfcModule: KaddoModule = {
  name: 'rfc',
  description: 'Request for Comments — explore relevant changes before building them',
  configKey: 'module_rfc',
  dirs: ['architecture/rfcs'],
  files: [
    {
      path: 'architecture/rfcs/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'rfc',
      knowledgeLevel: 'K3',
      description: 'RFC — proposal to explore or validate before committing to implementation.',
      questions: [
        {
          id: 'motivation',
          prompt: 'What motivates this proposal?',
          placeholder: 'e.g. Current auth flow blocks SSO adoption by enterprise clients',
          frontMatterField: 'motivation',
          required: true,
        },
        {
          id: 'proposal',
          prompt: 'What are you proposing?',
          placeholder: 'e.g. Replace session-based auth with OIDC + JWT hybrid',
          frontMatterField: 'proposal',
          required: true,
        },
        {
          id: 'open_questions',
          prompt: 'What questions need to be answered before proceeding?',
          placeholder: 'e.g. How do we migrate existing sessions? What is the rollback plan?',
          frontMatterField: 'open_questions',
          required: true,
        },
      ],
      qualityGate: [
        'Motivation is clear.',
        'Proposal is specific enough to discuss.',
        'Open questions are listed.',
      ],
      extraFrontMatter: {
        status: 'draft',
        code: [],
      },
    },
  ],
}
