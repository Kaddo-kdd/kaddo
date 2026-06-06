export type KLevel = 'K0' | 'K1' | 'K2' | 'K3' | 'K4'

export type WorkItemType = 'feature' | 'bugfix' | 'hotfix' | 'spike' | 'chore'

/** The official Work Item type catalog (VS-045). */
export const WORK_ITEM_TYPES: WorkItemType[] = ['feature', 'bugfix', 'hotfix', 'spike', 'chore']

/**
 * Optional aliases that resolve to an official type. Lets roadmaps/agents use natural words for
 * technical/maintenance work without forcing it to be a `feature`.
 */
const TYPE_ALIASES: Record<string, WorkItemType> = {
  setup: 'chore',
  maintenance: 'chore',
  tooling: 'chore',
  infrastructure: 'chore',
  infra: 'chore',
  config: 'chore',
  configuration: 'chore',
  refactor: 'chore',
}

export type Question = {
  id: string
  prompt: string
  placeholder: string
  frontMatterField: string
  required: boolean
}

export type KnowledgeLevel = {
  level: KLevel
  description: string
  questions: Question[]
  qualityGate: string[]
}

const LEVELS: Record<KLevel, KnowledgeLevel> = {
  K0: {
    level: 'K0',
    description: 'Trivial change. No formal knowledge required.',
    questions: [],
    qualityGate: [],
  },
  K1: {
    level: 'K1',
    description: 'Simple fix or hotfix.',
    questions: [
      {
        id: 'problem',
        prompt: 'What problem does this fix?',
        placeholder: 'e.g. Button is not clickable on mobile',
        frontMatterField: 'problem',
        required: true,
      },
      {
        id: 'expected_result',
        prompt: 'What is the expected result after the fix?',
        placeholder: 'e.g. Button works correctly on all screen sizes',
        frontMatterField: 'expected_result',
        required: true,
      },
    ],
    qualityGate: ['Problem is clear.', 'Expected result is defined.'],
  },
  K2: {
    level: 'K2',
    description: 'Feature or bugfix with functional impact.',
    questions: [
      {
        id: 'problem',
        prompt: 'What problem does this solve?',
        placeholder: 'e.g. Users cannot complete checkout without email verification',
        frontMatterField: 'problem',
        required: true,
      },
      {
        id: 'expected_result',
        prompt: 'What is the expected result?',
        placeholder: 'e.g. Users can verify email inline during checkout',
        frontMatterField: 'expected_result',
        required: true,
      },
      {
        id: 'impact',
        prompt: 'What is the impact if this is not done?',
        placeholder: 'e.g. ~30% of users drop off at checkout',
        frontMatterField: 'impact',
        required: true,
      },
      {
        id: 'acceptance_criteria',
        prompt: 'What are the acceptance criteria? (one per line, press Enter twice to finish)',
        placeholder: 'e.g. Email is verified before payment step',
        frontMatterField: 'acceptance_criteria',
        required: true,
      },
    ],
    qualityGate: [
      'Problem is clear.',
      'Expected result is defined.',
      'Impact of not doing it is stated.',
      'Acceptance criteria are verifiable.',
    ],
  },
  K3: {
    level: 'K3',
    description: 'Capability, integration, or significant functional change.',
    questions: [
      {
        id: 'problem',
        prompt: 'What problem does this solve?',
        placeholder: 'e.g. Payments need to support multiple providers',
        frontMatterField: 'problem',
        required: true,
      },
      {
        id: 'impact',
        prompt: 'What is the impact if this is not done?',
        placeholder: 'e.g. We are locked into a single provider with no fallback',
        frontMatterField: 'impact',
        required: true,
      },
      {
        id: 'acceptance_criteria',
        prompt: 'What are the acceptance criteria?',
        placeholder: 'e.g. System routes to provider B when provider A fails',
        frontMatterField: 'acceptance_criteria',
        required: true,
      },
      {
        id: 'design',
        prompt: 'What is the proposed design or approach?',
        placeholder: 'e.g. Abstract provider interface + strategy pattern',
        frontMatterField: 'design',
        required: true,
      },
    ],
    qualityGate: [
      'Problem is clear.',
      'Impact is stated.',
      'Acceptance criteria are verifiable.',
      'Design is sufficient to start.',
    ],
  },
  K4: {
    level: 'K4',
    description: 'Architecture change, migration, or high-risk decision.',
    questions: [
      {
        id: 'problem',
        prompt: 'What problem does this solve?',
        placeholder: 'e.g. Current auth system does not support SSO',
        frontMatterField: 'problem',
        required: true,
      },
      {
        id: 'impact',
        prompt: 'What is the impact if this is not done?',
        placeholder: 'e.g. Enterprise clients cannot onboard',
        frontMatterField: 'impact',
        required: true,
      },
      {
        id: 'design',
        prompt: 'What is the proposed design or approach?',
        placeholder: 'e.g. Replace JWT-only auth with OIDC + JWT hybrid',
        frontMatterField: 'design',
        required: true,
      },
      {
        id: 'risks',
        prompt: 'What are the main risks?',
        placeholder: 'e.g. Existing sessions may be invalidated during migration',
        frontMatterField: 'risks',
        required: true,
      },
    ],
    qualityGate: [
      'Problem is clear.',
      'Impact is stated.',
      'Design is documented.',
      'Risks are identified.',
      'ADR is created or linked if applicable.',
    ],
  },
}

const TYPE_TO_LEVEL: Record<WorkItemType, KLevel> = {
  hotfix: 'K1',
  bugfix: 'K2',
  feature: 'K2',
  spike: 'K3',
  // Chores are maintenance/config/tooling work — low ceremony (problem + expected result).
  chore: 'K1',
}

export function getLevel(level: KLevel): KnowledgeLevel {
  return LEVELS[level]
}

export function getLevelForType(type: WorkItemType): KLevel {
  return TYPE_TO_LEVEL[type]
}

export function isValidType(type: string): type is WorkItemType {
  return (WORK_ITEM_TYPES as string[]).includes(type)
}

/**
 * Normalize a raw type string to an official Work Item type, applying aliases
 * (setup/maintenance/tooling/infrastructure/… → chore). Returns null if unrecognized.
 */
export function normalizeType(raw: string | undefined): WorkItemType | null {
  if (!raw) return null
  const t = raw.trim().toLowerCase()
  if (isValidType(t)) return t
  return TYPE_ALIASES[t] ?? null
}
