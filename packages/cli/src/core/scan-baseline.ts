import type { ScanResult } from '../services/scanner.js'
import type { ScanSignals } from './scan-signals.js'
import { exists, readFile, join } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'

export const SCAN_BASELINE_VERSION = '1'

export type ProjectContext = {
  state: string // new | pre-ai | legacy | unknown
  structure: string // monorepo | multirepo | unknown
  teamSize: string // indie | small | medium | enterprise | unknown
}

export type ScanBaseline = {
  version: string
  generatedAt: string
  project: ProjectContext
  detected: {
    languages: string[]
    frameworks: string[]
    packageManagers: string[]
    sourceDirectories: string[]
    migrationDirectories: string[]
    contractFiles: string[]
    infrastructureFiles: string[]
    testDirectories: string[]
  }
  signals: ScanSignals
  suggestions: {
    possibleDomains: string[]
    openQuestions: string[]
  }
}

const UNKNOWN = 'unknown'

/** Drop noise values so arrays only contain meaningful signals. */
function meaningful(...values: string[]): string[] {
  return values.filter((v) => v && v !== UNKNOWN && v !== 'none')
}

/** Read project context written by `kaddo init`. Best-effort; defaults to unknown. */
export function readProjectContext(dir: string): ProjectContext {
  const context: ProjectContext = {
    state: UNKNOWN,
    structure: UNKNOWN,
    teamSize: UNKNOWN,
  }

  const configPath = join(dir, '.kaddo', 'config.yml')
  if (!exists(configPath)) return context

  try {
    const config = parseYaml(readFile(configPath)) as Record<string, unknown>
    const project = (config.project ?? {}) as Record<string, unknown>
    const team = (config.team ?? {}) as Record<string, unknown>

    if (typeof project.state === 'string') context.state = project.state
    if (typeof project.structure === 'string') context.structure = project.structure
    if (typeof team.size === 'string') context.teamSize = team.size
  } catch {
    // Non-fatal: keep unknown defaults.
  }

  return context
}

/**
 * Build deterministic open questions for human confirmation.
 * These are prompts, never asserted truth — Kaddo does not infer business meaning.
 */
function buildOpenQuestions(result: ScanResult, context: ProjectContext): string[] {
  const questions: string[] = []

  for (const domain of result.suggestedDomains) {
    const clean = domain.replace(/^#\s*/, '').trim()
    if (clean) {
      questions.push(`Confirm whether the '${clean}' domain reflects a real bounded context.`)
    }
  }

  if (result.testDirs.length === 0) {
    questions.push('No test directory detected — confirm how this project is tested.')
  }

  if (context.state === 'legacy') {
    questions.push('Legacy project: identify the highest-risk areas before changing them.')
  }

  return questions
}

/** Transform a deterministic ScanResult + project context into a stable baseline. */
export function buildBaseline(
  result: ScanResult,
  context: ProjectContext,
  now: Date = new Date()
): ScanBaseline {
  return {
    version: SCAN_BASELINE_VERSION,
    generatedAt: now.toISOString(),
    project: context,
    detected: {
      languages: meaningful(result.language),
      frameworks: meaningful(result.framework),
      packageManagers: meaningful(result.packageManager),
      sourceDirectories: result.codeDirs,
      migrationDirectories: result.migrationDirs,
      contractFiles: result.contractFiles,
      infrastructureFiles: result.infraFiles,
      testDirectories: result.testDirs,
    },
    signals: result.signals,
    suggestions: {
      possibleDomains: result.suggestedDomains.map((d) => d.replace(/^#\s*/, '').trim()).filter(Boolean),
      openQuestions: buildOpenQuestions(result, context),
    },
  }
}

export function serializeBaseline(baseline: ScanBaseline): string {
  return JSON.stringify(baseline, null, 2) + '\n'
}
