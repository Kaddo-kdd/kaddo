import type { KaddoModule } from './types.js'

export const adrModule: KaddoModule = {
  name: 'adr',
  description: 'Architectural Decision Records — document decisions when risk justifies it',
  configKey: 'module_adr',
  dirs: ['knowledge/decisions'],
  files: [
    {
      path: 'knowledge/decisions/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'adr',
      knowledgeLevel: 'K4',
      description: 'Architectural Decision Record — high-risk decision with alternatives considered.',
      questions: [
        {
          id: 'context',
          prompt: 'What is the context and problem this decision addresses?',
          placeholder: 'e.g. We need to choose a payment provider that supports retries and webhooks',
          frontMatterField: 'context',
          required: true,
        },
        {
          id: 'decision',
          prompt: 'What is the decision?',
          placeholder: 'e.g. Use Stripe as primary provider with a Braintree fallback',
          frontMatterField: 'decision',
          required: true,
        },
        {
          id: 'alternatives',
          prompt: 'What alternatives were considered?',
          placeholder: 'e.g. Braintree only, PayPal, in-house implementation',
          frontMatterField: 'alternatives',
          required: true,
        },
        {
          id: 'consequences',
          prompt: 'What are the consequences (positive and negative)?',
          placeholder: 'e.g. Faster integration (+), vendor lock-in risk (-)',
          frontMatterField: 'consequences',
          required: true,
        },
      ],
      qualityGate: [
        'Context is clear.',
        'Decision is explicit.',
        'Alternatives were considered.',
        'Consequences are stated.',
      ],
      extraFrontMatter: {
        status: 'proposed',
        code: [],
      },
    },
  ],
}
