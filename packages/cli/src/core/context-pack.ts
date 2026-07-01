import matter from 'gray-matter'
import { exists, readFile, join } from '../utils/fs.js'
import { loadConfig, languageLabel, projectLanguage, type KaddoConfig, type ProjectState } from './config.js'
import { type Artifact } from '../services/artifact-reader.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'
import { loadMappedModules, type MappedModuleWithCoverage } from '../services/mapped-modules.js'
import { knowledgeLayers, type LayerStatus } from './layers.js'
import { analyzeKnowledgeArtifact, type ArtifactQuality } from './artifact-quality.js'
import { roadmapStats, type RoadmapStats } from './roadmap.js'
import { lifecycleStateOf, isActiveState, lifecycleCounts, type LifecycleState } from './lifecycle.js'
import { assessPhase, type PhaseAssessment } from './delivery-phase.js'
import { loadExternalCapsules, type ConsumedCapsule } from './capsule.js'
import { loadGraphSummary, type GraphSummary } from './graph.js'
import { loadGraphHints, type GraphHintsSummary } from './graph-hints.js'
import { discoverInstalledSkills } from '../services/installed-skills.js'

export const CONTEXT_PACK_VERSION = '1'

export type ContextWorkItem = {
  id: string
  type: string
  title: string
  status: string
  lifecycle: LifecycleState
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
    /** Knowledge language label, e.g. "English" / "Spanish" (VS-051). */
    language: string
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
  layers: LayerStatus[]
  /** Per-layer knowledge quality (VS-073.1): file existence ≠ ready knowledge. */
  knowledgeQuality: Record<'business' | 'product' | 'tech' | 'delivery', { status: string; artifacts: Record<string, ArtifactQuality> }>
  roadmap: RoadmapStats
  /** State-aware phase + next-step recommendation (VS-047). */
  phase: PhaseAssessment
  /** Active Work Items distribution by type (feature/bugfix/hotfix/spike/chore/…). */
  deliveryMix: Record<string, number>
  /** External Knowledge Capsules imported as context (VS-054). */
  external: ConsumedCapsule[]
  /** Summary of the exported knowledge graph (VS-055); null if not exported yet. */
  graph: GraphSummary | null
  /** Summary of graph relationship-quality hints (VS-056); null if not exported yet. */
  graphHints: GraphHintsSummary | null
  /** Installed reusable skill ids (VS-059) — summary only, content lives in knowledge/skills/. */
  skills: string[]
  mappedModules: MappedModuleWithCoverage[]
  missing: string[]
  handoff: {
    recommendedAgents: string[]
    nextSteps: string[]
    instructions: string[]
    operatingRules: string[]
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

/**
 * Operating rules the implementing agent MUST follow. Emitted prominently so a coding
 * assistant pasted this pack does not commit on its own.
 */
const OPERATING_RULES = [
  '**Never run `git commit`, `git push` or `git merge` without explicit human confirmation.**',
  'Never push or merge automatically — ever. Suggest a Conventional Commit message and wait.',
  'When implementing a Work Item, create a branch FIRST (per the project Git strategy, ' +
    '`.kaddo/git.yml`, default `feature/<id>-<slug>`). Never work directly on `main`.',
  'After significant changes run `kaddo scan`, `kaddo owners suggest` and `kaddo guard`, and ' +
    'update the affected knowledge (ADR / capabilities / current-state).',
  'Kaddo itself never calls an LLM and never runs git — every git action is the human’s.',
]

function toContextWorkItem(a: Artifact): ContextWorkItem {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    status: a.status,
    lifecycle: lifecycleStateOf({ status: a.status, filePath: a.filePath }),
    knowledgeLevel: a.knowledgeLevel,
    domains: a.domains,
  }
}

function toContextArtifact(a: Artifact): ContextArtifact {
  return { id: a.id, type: a.type, title: a.title, summary: a.summary, codeGlobs: a.codeGlobs }
}

function isDeliveryWorkItem(a: Artifact): boolean {
  return a.filePath.replace(/\\/g, '/').includes('/delivery/work-items/') && Boolean(a.type)
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

  const roadmapSummary = readMarkdownSummary(dir, 'delivery/roadmap.md') ?? ''
  if (!roadmapSummary) {
    missing.push('No roadmap baseline found.')
  }

  // Artifact metadata only — never full content / source code. Unified discovery (VS-046) so the
  // pack reflects exactly the same artifacts as explain/owners/guard.
  const allArtifacts = discoverKnowledge(dir)
  // Active workspace (VS-041): the pack ships only ACTIVE Work Items
  // (draft/ready/in-progress/blocked). Completed and archived items are historical and would
  // only add noise/tokens to the agent handoff, so they are excluded by default. Other typed
  // knowledge artifacts (ADRs, etc.) are kept as-is.
  const workItems = allArtifacts.filter(
    (a) =>
      isDeliveryWorkItem(a) &&
      isActiveState(lifecycleStateOf({ status: a.status, filePath: a.filePath }))
  )
  if (workItems.length === 0) {
    missing.push('No work items found.')
  }

  const state = config.project.state

  // Roadmap candidates vs materialized work items (any roadmap format).
  const roadmapPath = join(dir, ARCH_DIR, 'delivery', 'roadmap.md')
  const materialized = allArtifacts.filter((a) =>
    a.filePath.replace(/\\/g, '/').includes('/delivery/work-items/') && Boolean(a.type)
  ).length
  const roadmap = roadmapStats(exists(roadmapPath) ? readFile(roadmapPath) : null, materialized)

  // Delivery mix: active Work Items by type (VS-045). Distinguishes chores/tooling from features.
  const deliveryMix: Record<string, number> = {}
  for (const a of allArtifacts) {
    const p = a.filePath.replace(/\\/g, '/')
    if (!a.type || !p.includes('/delivery/work-items/')) continue
    if (!isActiveState(lifecycleStateOf({ status: a.status, filePath: a.filePath }))) continue
    deliveryMix[a.type] = (deliveryMix[a.type] ?? 0) + 1
  }

  // Multirepo modules from `.kaddo/modules.yml` (descriptor + artifact coverage only —
  // secondary repos are never scanned).
  const mappedModules = loadMappedModules(dir)
  const layers = knowledgeLayers(dir)

  // Knowledge quality (VS-073.1): a bootstrap-created file is not ready knowledge. Classify each
  // baseline file and surface placeholders in Missing Context so nothing advances prematurely.
  const qa = (rel: string) => analyzeKnowledgeArtifact(dir, rel)
  const qBusiness = qa('knowledge/business/business.md')
  const qProduct = qa('knowledge/product/product.md')
  const qCapabilities = qa('knowledge/product/capabilities.md')
  const qCodebase = qa('knowledge/tech/codebase.md')
  const qCurrentState = qa('knowledge/tech/current-state.md')
  const qRoadmap = qa('knowledge/delivery/roadmap.md')
  const layerStatusOf = (name: string) => layers.find((l) => l.layer === name)?.status ?? 'Missing'
  const knowledgeQuality = {
    business: { status: layerStatusOf('Business'), artifacts: { 'knowledge/business/business.md': qBusiness } },
    product: { status: layerStatusOf('Product'), artifacts: { 'knowledge/product/product.md': qProduct, 'knowledge/product/capabilities.md': qCapabilities } },
    tech: { status: layerStatusOf('Tech'), artifacts: { 'knowledge/tech/codebase.md': qCodebase, 'knowledge/tech/current-state.md': qCurrentState } },
    delivery: { status: layerStatusOf('Delivery'), artifacts: { 'knowledge/delivery/roadmap.md': qRoadmap } },
  }
  if (qBusiness === 'placeholder') missing.push('Business context exists but still looks like a bootstrap placeholder.')
  if (qProduct === 'placeholder' || qCapabilities === 'placeholder') missing.push('Product capabilities exist but still look like a bootstrap placeholder.')
  if (qCurrentState === 'placeholder') missing.push('Current state exists but still looks like a bootstrap placeholder.')
  if (qCodebase === 'placeholder') missing.push('Codebase map exists but still looks like a bootstrap placeholder.')

  // State-aware phase + next-step recommendation (VS-047) from the real knowledge state.
  const allWorkItems = allArtifacts.filter((a) => a.isWorkItem)
  const wiWithOwnership = allWorkItems.filter((a) => a.codeGlobs.length > 0).length
  const phase = assessPhase({
    layers,
    roadmap,
    workItems: {
      total: allWorkItems.length,
      byState: lifecycleCounts(
        allWorkItems.map((a) => lifecycleStateOf({ status: a.status, filePath: a.filePath }))
      ),
      items: allWorkItems.map((a) => ({
        id: a.id || a.title,
        title: a.title,
        lifecycle: lifecycleStateOf({ status: a.status, filePath: a.filePath }),
      })),
    },
    ownership: {
      workItemsTotal: allWorkItems.length,
      workItemsWithOwnership: wiWithOwnership,
      workItemsMissingOwnership: allWorkItems.length - wiWithOwnership,
    },
  })

  return {
    version: CONTEXT_PACK_VERSION,
    generatedAt: now.toISOString(),
    project: {
      name: config.project.name,
      state,
      teamSize: config.team.size,
      structure: config.project.structure,
      language: languageLabel(projectLanguage(config)),
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
      artifacts: allArtifacts.filter((a) => a.codeGlobs.length > 0).map(toContextArtifact),
    },
    layers,
    knowledgeQuality,
    roadmap,
    phase,
    deliveryMix,
    external: loadExternalCapsules(dir),
    graph: loadGraphSummary(dir),
    graphHints: loadGraphHints(dir),
    skills: discoverInstalledSkills(dir).map((s) => s.id),
    mappedModules,
    missing,
    // VS-052: the handoff is driven by the REAL phase, not project.state, so the pack never
    // contradicts the Current Phase block above it.
    handoff: {
      recommendedAgents: phase.recommendedAgents.length > 0
        ? phase.recommendedAgents
        : recommendedAgentsForState(state),
      nextSteps: phase.nextStep ? [phase.nextStep] : nextStepsForState(state),
      instructions: phase.llmInstructions.length > 0 ? phase.llmInstructions : LLM_INSTRUCTIONS,
      operatingRules: OPERATING_RULES,
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
