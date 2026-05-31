import type { KaddoModule } from './types.js'

export const contractsModule: KaddoModule = {
  name: 'contracts',
  description: 'API, event, and integration contracts — document shared interfaces before changing them',
  configKey: 'module_contracts',
  dirs: ['architecture/contracts'],
  files: [
    {
      path: 'architecture/contracts/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'contract',
      knowledgeLevel: 'K4',
      description: 'Contract — API, event, or integration interface shared with other systems.',
      questions: [
        {
          id: 'contract_type',
          prompt: 'What type of contract is this? (api, event, integration)',
          placeholder: 'e.g. api',
          frontMatterField: 'contract_type',
          required: true,
        },
        {
          id: 'interface',
          prompt: 'What is the interface? (endpoints, event names, data shape)',
          placeholder: 'e.g. POST /payments/charge — accepts { amount, currency, customerId }',
          frontMatterField: 'interface',
          required: true,
        },
        {
          id: 'consumers',
          prompt: 'Who consumes this contract?',
          placeholder: 'e.g. checkout-service, mobile-app, billing-worker',
          frontMatterField: 'consumers',
          required: true,
        },
        {
          id: 'breaking_changes',
          prompt: 'What changes would be breaking for consumers?',
          placeholder: 'e.g. Removing the customerId field, changing the event schema',
          frontMatterField: 'breaking_changes',
          required: true,
        },
      ],
      qualityGate: [
        'Contract type is specified (api, event, integration).',
        'Interface is described with enough detail to implement against.',
        'Known consumers are listed.',
        'Breaking changes are identified.',
      ],
      extraFrontMatter: {
        contract_type: 'api',
        consumers: [],
        code: [],
      },
    },
  ],
}
