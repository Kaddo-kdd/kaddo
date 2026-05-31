import type { KaddoModule } from './types.js'

export const migrationModule: KaddoModule = {
  name: 'migration',
  description: 'Migration records — data, infra, or technology changes with more rigor',
  configKey: 'module_migration',
  dirs: ['architecture/migrations'],
  files: [
    {
      path: 'architecture/migrations/.gitkeep',
      content: '',
    },
  ],
  workItemTypes: [
    {
      name: 'migration',
      knowledgeLevel: 'K4',
      description: 'Migration — data schema, infrastructure, or technology change with rollback plan.',
      questions: [
        {
          id: 'what_changes',
          prompt: 'What is being migrated?',
          placeholder: 'e.g. Payments table adding a new non-null column with backfill',
          frontMatterField: 'what_changes',
          required: true,
        },
        {
          id: 'impact',
          prompt: 'What is the impact on existing data or systems?',
          placeholder: 'e.g. All existing rows will get default value null → will be backfilled to "pending"',
          frontMatterField: 'impact',
          required: true,
        },
        {
          id: 'rollback_plan',
          prompt: 'What is the rollback plan?',
          placeholder: 'e.g. Drop the column, revert migration file, redeploy previous version',
          frontMatterField: 'rollback_plan',
          required: true,
        },
        {
          id: 'risks',
          prompt: 'What are the risks?',
          placeholder: 'e.g. Long-running migration may lock the table under concurrent writes',
          frontMatterField: 'risks',
          required: true,
        },
      ],
      qualityGate: [
        'What changes is described.',
        'Impact on existing data/systems is stated.',
        'Rollback plan is defined.',
        'Risks are identified.',
      ],
      extraFrontMatter: {
        migration_type: 'schema',
        code: [],
      },
    },
  ],
}
