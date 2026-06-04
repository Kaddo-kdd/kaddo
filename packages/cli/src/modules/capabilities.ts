import type { KaddoModule } from './types.js'

export const capabilitiesModule: KaddoModule = {
  name: 'capabilities',
  description: 'Product capabilities — map what the product can do and link it to domains and decisions',
  configKey: 'module_capabilities',
  dirs: ['knowledge/capabilities'],
  files: [
    {
      path: 'knowledge/capabilities/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'capability',
      knowledgeLevel: 'K3',
      description: 'Capability — a product capability that maps to engineering domains and decisions.',
      questions: [
        {
          id: 'what_it_enables',
          prompt: 'What does this capability enable for users or the business?',
          placeholder: 'e.g. Users can pay with saved cards without re-entering details',
          frontMatterField: 'what_it_enables',
          required: true,
        },
        {
          id: 'domains',
          prompt: 'Which engineering domains implement this capability?',
          placeholder: 'e.g. payments, auth, user-profile',
          frontMatterField: 'domains_involved',
          required: true,
        },
        {
          id: 'constraints',
          prompt: 'What are the key constraints or non-goals?',
          placeholder: 'e.g. Does not support crypto payments, max 3 saved cards per user',
          frontMatterField: 'constraints',
          required: false,
        },
      ],
      qualityGate: [
        'Capability is described in terms of user or business value.',
        'Implementing domains are identified.',
        'Constraints or non-goals are noted.',
      ],
      extraFrontMatter: {
        status: 'active',
        domains_involved: [],
        code: [],
      },
    },
  ],
}
