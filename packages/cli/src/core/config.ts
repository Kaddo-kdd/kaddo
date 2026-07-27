import { z } from 'zod'
import { exists, readFile, join } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'

export type ProjectState = 'new' | 'pre-ai' | 'legacy'
export type TeamSize = 'indie' | 'small' | 'medium' | 'enterprise'
export type RepositoryStructure = 'monorepo' | 'multirepo'
/** Language of the project KNOWLEDGE (not the CLI, which is always English). VS-051. */
export type ProjectLanguage = 'en' | 'es'
/** Role of a repository in a multirepo system (VS-091). */
export type MultirepoRole = 'core' | 'module'

export const PROJECT_STATES: ProjectState[] = ['new', 'pre-ai', 'legacy']
export const TEAM_SIZES: TeamSize[] = ['indie', 'small', 'medium', 'enterprise']
export const REPOSITORY_STRUCTURES: RepositoryStructure[] = ['monorepo', 'multirepo']
export const PROJECT_LANGUAGES: ProjectLanguage[] = ['en', 'es']
export const MULTIREPO_ROLES: MultirepoRole[] = ['core', 'module']

/** Safe defaults applied only when optional fields are absent. */
const DEFAULTS = {
  state: 'pre-ai' as ProjectState,
  structure: 'monorepo' as RepositoryStructure,
  teamSize: 'indie' as TeamSize,
  language: 'en' as ProjectLanguage,
}

/** Human-readable label for a project knowledge language. */
export function languageLabel(lang: string | undefined): string {
  return lang === 'es' ? 'Spanish' : 'English'
}

/** The configured knowledge language, defaulting to English (back-compat). */
export function projectLanguage(config: KaddoConfig): ProjectLanguage {
  const lang = (config.project as { language?: string }).language
  return lang === 'es' ? 'es' : 'en'
}

/** Raised when config exists but cannot be read or fails validation. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

const projectStateSchema = z.enum(['new', 'pre-ai', 'legacy'], {
  errorMap: () => ({
    message: `project.state must be one of: ${PROJECT_STATES.join(', ')}`,
  }),
})

const teamSizeSchema = z.enum(['indie', 'small', 'medium', 'enterprise'], {
  errorMap: () => ({
    message: `team.size must be one of: ${TEAM_SIZES.join(', ')}`,
  }),
})

const structureSchema = z.enum(['monorepo', 'multirepo'], {
  errorMap: () => ({
    message: `project.structure must be one of: ${REPOSITORY_STRUCTURES.join(', ')}`,
  }),
})

const languageSchema = z.enum(['en', 'es'], {
  errorMap: () => ({
    message: `project.language must be one of: ${PROJECT_LANGUAGES.join(', ')}`,
  }),
})

const multirepoRoleSchema = z.enum(['core', 'module']).optional()

const configSchema = z
  .object({
    version: z.union([z.string(), z.number()]).optional(),
    project: z
      .object({
        name: z.string().default('project'),
        state: projectStateSchema.default(DEFAULTS.state),
        structure: structureSchema.default(DEFAULTS.structure),
        language: languageSchema.default(DEFAULTS.language),
        role: multirepoRoleSchema,
        domains: z.array(z.string()).optional(),
      })
      .passthrough()
      .default({}),
    team: z
      .object({
        size: teamSizeSchema.default(DEFAULTS.teamSize),
      })
      .passthrough()
      .default({}),
    system: z
      .object({
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
    multirepo: z
      .object({
        role: multirepoRoleSchema,
        modules_file: z.string().optional(),
        parent_system: z.string().optional(),
        workspace_roots: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    module: z
      .object({
        id: z.string().optional(),
      })
      .passthrough()
      .optional(),
    knowledge: z.unknown().optional(),
    guard: z.unknown().optional(),
    scan: z.unknown().optional(),
  })
  .passthrough()

export type KaddoConfig = z.infer<typeof configSchema>

function configPathFor(dir: string): string {
  return join(dir, '.kaddo', 'config.yml')
}

/**
 * Load and validate `.kaddo/config.yml`.
 * Returns null when the file is missing. Throws ConfigError on invalid YAML
 * or schema validation failure (e.g. unknown enum values).
 */
export function loadConfig(dir: string): KaddoConfig | null {
  const configPath = configPathFor(dir)
  if (!exists(configPath)) return null

  let raw: unknown
  try {
    raw = parseYaml(readFile(configPath))
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new ConfigError(`Could not parse .kaddo/config.yml: ${detail}`)
  }

  const parsed = configSchema.safeParse(raw ?? {})
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => {
        const path = i.path.join('.')
        return path ? `  - ${path}: ${i.message}` : `  - ${i.message}`
      })
      .join('\n')
    throw new ConfigError(`Invalid .kaddo/config.yml:\n${issues}`)
  }

  return parsed.data
}

/**
 * Load config or exit with a helpful message if the project is not initialized.
 * Use in commands that genuinely require config.
 */
export function requireConfig(dir: string): KaddoConfig {
  let config: KaddoConfig | null
  try {
    config = loadConfig(dir)
  } catch (err) {
    const message = err instanceof ConfigError ? err.message : String(err)
    console.error(message)
    process.exit(1)
  }

  if (!config) {
    console.error('No .kaddo/config.yml found. Run `kaddo init` first.')
    process.exit(1)
  }

  return config
}

/** State-aware next-step guidance for `kaddo scan`. */
export function nextStepsForState(state: ProjectState): string {
  switch (state) {
    case 'new':
      return 'Define initial knowledge, create your first work item, and grow the roadmap gradually.'
    case 'legacy':
      return 'Use this baseline to identify risks, unknowns and safe modernization candidates before changing code.'
    case 'pre-ai':
    default:
      return 'Use this baseline to create a context pack and understand the existing system with LLM agents.'
  }
}

/** State-aware helper text for `kaddo create`. */
export function createGuidanceForState(state: ProjectState): string {
  switch (state) {
    case 'new':
      return 'Create the first work item to shape the product.'
    case 'legacy':
      return 'Prefer small, low-risk work items and capture unknowns.'
    case 'pre-ai':
    default:
      return 'Create this work item from existing context or roadmap when available.'
  }
}

/** Human-readable description, e.g. "pre-AI monorepo". */
export function describeProject(config: KaddoConfig): string {
  const state = config.project.state
  const stateLabel = state === 'pre-ai' ? 'pre-AI' : state
  const role = projectRole(config)
  const roleSuffix = role ? ` (${role})` : ''
  return `${stateLabel} ${config.project.structure}${roleSuffix}`
}

/** The multirepo role of the project: 'core', 'module', or undefined (VS-091). */
export function projectRole(config: KaddoConfig): MultirepoRole | undefined {
  return (config.project as { role?: MultirepoRole }).role ?? config.multirepo?.role
}

/** Whether this project is a multirepo module (VS-091). */
export function isModule(config: KaddoConfig): boolean {
  return projectRole(config) === 'module'
}

/** Whether this project is a multirepo core (VS-091). */
export function isCore(config: KaddoConfig): boolean {
  return projectRole(config) === 'core'
}

/** The module ID for a module repo, from config (VS-091). */
export function moduleId(config: KaddoConfig): string | undefined {
  return config.module?.id
}

/** The parent system name for a module repo (VS-091). */
export function parentSystem(config: KaddoConfig): string | undefined {
  return config.multirepo?.parent_system
}

/** The system name defined by a core repo (VS-093). */
export function systemName(config: KaddoConfig): string | undefined {
  return config.system?.name
}

/** The workspace roots for module discovery (VS-093). */
export function workspaceRoots(config: KaddoConfig): string[] {
  return config.multirepo?.workspace_roots ?? ['..']
}
