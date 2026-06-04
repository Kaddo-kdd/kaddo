import matter from 'gray-matter'
import { exists, readFile, join } from '../utils/fs.js'
import { loadConfig, type KaddoConfig, type ProjectState } from './config.js'
import { readArtifacts, type Artifact } from '../services/artifact-reader.js'
import { loadMappedModules, type MappedModuleWithCoverage } from '../services/mapped-modules.js'

export const CONTEXT_PACK_VERSION = '1'

export type ContextWorkItem = {
  id: string
  type: string
  title: string
  status: string
  knowledgeLevel: string
  domains: string[]
}

export type ContextArtifact = {
  id: string
  type: string
  title: string
  summary: string
  codeGlobs: string[]
}

export type ContextPack = {
  version: string
  generatedAt: string
  project: {
    name: string
    state: string
    teamSize: string
    structure: string
  }
  scan: {
    available: boolean
    languages: string[]
    frameworks: string[]
    packageManagers: string[]
    sourceDirectories: string[]
    migrationDirectories: string[]
    contractFiles: string[]
    infrastructureFiles: string[]
  }
  knowledge: {
    summary: string
    roadmapSummary: string
    inventoryAvailable: boolean
    workItems: ContextWorkItem[]
    artifacts: ContextArtifact[]
  }
  mappedModules: MappedModuleWithCoverage[]
  missing: string[]
  handoff: {
    recommendedAgents: string[]
    nextSteps: string[]
    instructions: string[]
  }
}

const ARCH_DIR = 'knowledge'

type ScanJson = {
  detected?: {
    languages?: string[]
    frameworks?: string[]
    packageManagers?: string[]
    sourceDirectories?: string[]
    migrationDirectories?: string[]
    contractFiles?: string[]
    infrastructureFiles?: string[]
  }
}

function readScanJson(dir: string): ScanJson | null {
  const scanPath = join(dir, '.kaddo', 'scan.json')
  if (!exists(scanPath)) return null
  try {
    return JSON.parse(readFile(scanPath)) as ScanJson
  } catch {
    return null
  }
}

/** First meaningful paragraph from a markdown body, ignoring headings. */
function firstParagraph(markdown: string): string {
  const body = matter(markdown).content.trim()
  const para = body
    .split('\n\n')
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#'))
  return para ?? ''
}

function readMarkdownSummary(dir: string, file: string): string | null {
  const p = join(dir, ARCH_DIR, file)
  if (!exists(p)) return null
  try {
    return firstParagraph(readFile(p))
  } catch {
    return null
  }
}

/** State-aware recommended agent handoff. */
export function recommendedAgentsForState(state: ProjectState): string[] {
  switch (state) {
    case 'new':
      return ['roadmap-agent', 'architecture-agent']
    case 'legacy':
      return ['legacy-agent', 'architecture-agent', 'capability-agent']
    case 'pre-ai':
    default:
      return ['capability-agent', 'architecture-agent', 'roadmap-agent']
  }
}

function nextStepsForState(state: ProjectState): string[] {
  switch (state) {
    case 'new':
      return [
        'Use roadmap-agent to shape an initial roadmap.',
        'Use architecture-agent to outline the intended architecture.',
      ]
    case 'legacy':
      return [
        'Use legacy-agent to surface risks and unknowns before changing code.',
        'Use architecture-agent to reconstruct the current architecture.',
        'Use capability-agent to map existing capabilities.',
      ]
    case 'pre-ai':
    default:
      return [
        'Use capability-agent to extract system capabilities.',
        'Use architecture-agent to reconstruct the current architecture.',
        'Use roadmap-agent to propose roadmap candidates.',
      ]
  }
}

const LLM_INSTRUCTIONS = [
  'Use this context pack as the project baseline.',
  'Do not write code yet.',
  'First extract: system capabilities, architecture notes, risks, open questions and roadmap candidates.',
  'This pack is deterministic CLI output — it does not interpret the system. That is your job.',
]

function toContextWorkItem(a: Artifact): ContextWorkItem {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    status: a.status,
    knowledgeLevel: a.knowledgeLevel,
    domains: a.domains,
  }
}

function toContextArtifact(a: Artifact): ContextArtifact {
  return { id: a.id, type: a.type, title: a.title, summary: a.summary, codeGlobs: a.codeGlobs }
}

/**
 * Assemble a deterministic context pack from existing Kaddo artifacts.
 * Requires a loaded config (caller ensures the project is initialized).
 */
export function buildContextPack(
  dir: string,
  config: KaddoConfig,
  now: Date = new Date()
): ContextPack {
  const missing: string[] = []

  const scanJson = readScanJson(dir)
  if (!scanJson) {
    missing.push('Scan baseline missing. Run `kaddo scan` for better context.')
  }
  const detected = scanJson?.detected ?? {}

  const inventoryAvailable = exists(join(dir, ARCH_DIR, 'inventory.md'))
  if (!inventoryAvailable) {
    missing.push('No technical inventory found. Run `kaddo scan` to generate it.')
  }

  const knowledgeSummary = readMarkdownSummary(dir, 'knowledge.md') ?? ''
  if (!knowledgeSummary) {
    missing.push('No project knowledge summary found yet.')
  }

  const roadmapSummary = readMarkdownSummary(dir, 'roadmap.md') ?? ''
  if (!roadmapSummary) {
    missing.push('No roadmap baseline found.')
  }

  // Artifact metadata only — never full content / source code.
  const archPath = join(dir, ARCH_DIR)
  const allArtifacts = exists(archPath) ? readArtifacts(archPath) : []
  const workItems = allArtifacts.filter(
    (a) => a.type && a.type !== 'current-state' && a.type !== 'roadmap'
  )
  if (workItems.length === 0) {
    missing.push('No work items found.')
  }

  const state = config.project.state

  // Multirepo modules from `.kaddo/modules.yml` (descriptor + artifact coverage only —
  // secondary repos are never scanned).
  const mappedModules = loadMappedModules(dir)

  return {
    version: CONTEXT_PACK_VERSION,
    generatedAt: now.toISOString(),
    project: {
      name: config.project.name,
      state,
      teamSize: config.team.size,
      structure: config.project.structure,
    },
    scan: {
      available: scanJson !== null,
      languages: detected.languages ?? [],
      frameworks: detected.frameworks ?? [],
      packageManagers: detected.packageManagers ?? [],
      sourceDirectories: detected.sourceDirectories ?? [],
      migrationDirectories: detected.migrationDirectories ?? [],
      contractFiles: detected.contractFiles ?? [],
      infrastructureFiles: detected.infrastructureFiles ?? [],
    },
    knowledge: {
      summary: knowledgeSummary,
      roadmapSummary,
      inventoryAvailable,
      workItems: workItems.map(toContextWorkItem),
      artifacts: workItems.filter((a) => a.codeGlobs.length > 0).map(toContextArtifact),
    },
    mappedModules,
    missing,
    handoff: {
      recommendedAgents: recommendedAgentsForState(state),
      nextSteps: nextStepsForState(state),
      instructions: LLM_INSTRUCTIONS,
    },
  }
}

export function serializeContextPackJson(pack: ContextPack): string {
  return JSON.stringify(pack, null, 2) + '\n'
}

/** Convenience for callers that just want to load + build in one go. */
export function loadAndBuildContextPack(dir: string, now?: Date): ContextPack | null {
  const config = loadConfig(dir)
  if (!config) return null
  return buildContextPack(dir, config, now)
}
