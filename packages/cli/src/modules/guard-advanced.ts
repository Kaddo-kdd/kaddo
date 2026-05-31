import type { KaddoModule } from './types.js'

export const guardAdvancedModule: KaddoModule = {
  name: 'guard-advanced',
  description: 'Advanced guard rules — CI blocking, critical artifact protection, domain-level thresholds',
  configKey: 'module_guard_advanced',
  dirs: ['architecture/guard-rules'],
  files: [
    {
      path: 'architecture/guard-rules/rules.yml',
      content: [
        '# Kaddo Guard Advanced — rules configuration',
        '# Uncomment and configure the rules you want to enforce.',
        '',
        '# Block CI when a critical artifact was not updated (default: false)',
        '# ci_block_on_critical: true',
        '',
        '# Artifacts marked critical: true in front matter will trigger blocking',
        '# Add to any artifact front matter: critical: true',
        '',
        '# Minimum evidence score to trigger a FYI (0-1, default: 0)',
        '# min_evidence_score: 0.5',
        '',
        '# Domain-level rules: require artifact update for specific domains',
        '# domain_rules:',
        '#   payments:',
        '#     require_artifact_update: true',
        '#   auth:',
        '#     require_artifact_update: true',
        '',
        '# Notification targets (used by kaddo guard --ci output)',
        '# notify:',
        '#   slack_channel: "#engineering-reviews"',
        '#   mention_owners: true',
      ].join('\n'),
    },
  ],
  workItemTypes: [
    {
      name: 'guard-rule',
      knowledgeLevel: 'K3',
      description: 'Guard Rule — document a guard enforcement decision for your team.',
      questions: [
        {
          id: 'rule',
          prompt: 'What guard rule are you establishing?',
          placeholder: 'e.g. Block CI when a payments artifact is touched but not updated',
          frontMatterField: 'rule',
          required: true,
        },
        {
          id: 'rationale',
          prompt: 'Why is this rule needed?',
          placeholder: 'e.g. After 3 incidents where payments code changed without updating the ADR',
          frontMatterField: 'rationale',
          required: true,
        },
        {
          id: 'scope',
          prompt: 'Which domains or artifacts does this rule apply to?',
          placeholder: 'e.g. payments domain, WI-012, all ADRs with critical: true',
          frontMatterField: 'scope',
          required: true,
        },
      ],
      qualityGate: [
        'Rule is stated explicitly.',
        'Rationale is documented.',
        'Scope (domain or artifact) is defined.',
      ],
      extraFrontMatter: {
        rule_type: 'ci-block',
        enabled: true,
        code: [],
      },
    },
  ],
}
