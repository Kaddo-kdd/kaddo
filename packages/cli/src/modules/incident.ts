import type { KaddoModule } from './types.js'

export const incidentModule: KaddoModule = {
  name: 'incident',
  description: 'Incident records — document incidents, learnings, and preventive actions',
  configKey: 'module_incident',
  dirs: ['knowledge/incidents'],
  files: [
    {
      path: 'knowledge/incidents/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'incident',
      knowledgeLevel: 'K3',
      description: 'Incident — production issue with impact, root cause, and preventive actions.',
      questions: [
        {
          id: 'what_happened',
          prompt: 'What happened?',
          placeholder: 'e.g. Payment service returned 500 errors for 18 minutes',
          frontMatterField: 'what_happened',
          required: true,
        },
        {
          id: 'impact',
          prompt: 'What was the impact?',
          placeholder: 'e.g. ~340 failed payment attempts, ~$12k in lost transactions',
          frontMatterField: 'impact',
          required: true,
        },
        {
          id: 'root_cause',
          prompt: 'What was the root cause?',
          placeholder: 'e.g. Null pointer when payment amount was missing from the request body',
          frontMatterField: 'root_cause',
          required: true,
        },
        {
          id: 'preventive_actions',
          prompt: 'What preventive actions will be taken?',
          placeholder: 'e.g. Add input validation, add alerting on 5xx rate > 1%',
          frontMatterField: 'preventive_actions',
          required: true,
        },
      ],
      qualityGate: [
        'What happened is described.',
        'Impact is quantified.',
        'Root cause is identified.',
        'Preventive actions are defined.',
      ],
      extraFrontMatter: {
        severity: 'medium',
        resolved_at: '',
        code: [],
      },
    },
  ],
}
