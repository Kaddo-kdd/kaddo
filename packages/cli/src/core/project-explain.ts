// Deterministic project explainer (VS-013).
//
// `buildProjectExplanation` gathers what Kaddo currently knows about a project from existing
// artifacts (config, scan baseline, architecture knowledge, work items, ownership) and reports
// what is missing plus actionable next steps. No LLM, no inference — pure file reads.

import { exists, readFile, readDir, join, isFile } from '../utils/fs.js'
import { loadConfig, languageLabel, projectLanguage } from './config.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { assessPhase } from './delivery-phase.js'
import { loadExternalCapsules, type ConsumedCapsule } from './capsule.js'
import { loadGraphSummary, type GraphSummary } from './graph.js'
import { loadGraphHints, type GraphHintsSummary } from './graph-hints.js'
import { discoverInstalledSkills, skillGroupCounts } from '../services/installed-skills.js'
import {
  loadMappedModules,
  presentArtifacts,
  type MappedModuleWithCoverage,
} from '../services/mapped-modules.js'
import { knowledgeLayers, renderLayersMarkdown, type LayerStatus } from './layers.js'
import { roadmapStats, type RoadmapStats } from './roadmap.js'
import { buildReadinessReport, type ReadinessReport } from './readiness.js'
import { buildTechDecisions, type TechDecisions } from './decisions.js'
import { installedAssetsSummary } from './assets.js'
import { buildRoadmapQuality, type RoadmapQuality } from './roadmap-quality.js'
import {
  LIFECYCLE_STATES,
  lifecycleStateOf,
  lifecycleCounts,
  emptyLifecycleCounts,
  type LifecycleState,
} from './lifecycle.js'
import { buildProjectRoute, renderRouteMarkdown, type ProjectRoute } from './project-route.js'
import { type ScanSignals, renderSignalsCompact, signalCount } from './scan-signals.js'

const ARCH_DIR = 'knowledge'

export type ProjectExplanation = {
  project: {
    name: string
    state: string
    teamSize: string
    structure: string
    language: string
  }
  stack: {
    language?: string
    framework?: string
    packageManager?: string
    sourceDirectories: string[]
    migrationDirectories: string[]
    contractFiles: string[]
    infrastructureFiles: string[]
  } | null
  knowledge: {
    hasScan: boolean
    hasInventory: boolean
    hasContextPack: boolean
    hasUnderstand: boolean
    hasCapabilities: boolean
    hasArchitecture: boolean
    hasRoadmap: boolean
    hasAgents: boolean
  }
  workItems: {
    total: number
    inProgress: number
    done: number
    cancelled: number
    byState: Record<LifecycleState, number>
    byType: Record<string, number>
    initiatives: { name: string; states: Record<LifecycleState, number> }[]
    items: {
      id: string
      title: string
      type: string
      status: string
      lifecycle: LifecycleState
      initiative: string
      knowledgeLevel: string
      hasOwnership: boolean
      domains: string[]
    }[]
  }
  ownership: {
    workItemsTotal: number
    workItemsWithOwnership: number
    workItemsMissingOwnership: number
  }
  domains: string[]
  /** Possible duplicate Work Items (same source_id or normalized title). VS-052. */
  duplicateWorkItems: { reason: string; items: { id: string; title: string }[] }[]
  /** External Knowledge Capsules imported as context (VS-054). */
  externalCapsules: ConsumedCapsule[]
  /** Summary of the exported knowledge graph (VS-055); null if not exported yet. */
  graph: GraphSummary | null
  /** Summary of graph relationship-quality hints (VS-056); null if not exported yet. */
  graphHints: GraphHintsSummary | null
  /** Installed reusable skills (VS-059): total + per-group counts. */
  skills: { total: number; byGroup: Record<string, number> }
  layers: LayerStatus[]
  roadmap: RoadmapStats
  mappedModules: MappedModuleWithCoverage[]
  missingKnowledge: string[]
  suggestedNextSteps: string[]
  /** Project readiness: where the project sits in the Kaddo cycle + the single next step (VS-072.1). */
  readiness: ReadinessReport
  /** The unified next-step recommendation, shared across context/understand/explain (VS-073.2). */
  nextStepRecommendation: ReadinessReport['nextStepRecommendation']
  /** Technical decisions: candidates vs materialized ADRs (VS-075). */
  techDecisions: TechDecisions
  /** Tech knowledge layout: core artifacts, decisions and discovery notes (VS-075.2). */
  techKnowledge: {
    core: { currentState: boolean; codebase: boolean }
    discovery: { architectureNotes: boolean; decisionCandidates: boolean; legacyLocation: boolean }
  }
  /** Installed agent/skill version status vs the current package (VS-074.2). */
  installedAssets: ReturnType<typeof installedAssetsSummary>
  /** How well roadmap candidates are grounded in capabilities/signals (VS-077). */
  roadmapQuality: RoadmapQuality
  /** Project route progress map (VS-080). */
  projectRoute: ProjectRoute
  /** Scan signals: auth, payments, webhooks, etc. (VS-081). */
  scanSignals: ScanSignals | null
}

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Detect possible duplicate Work Items by shared source_id or normalized title (VS-052). */
export function findDuplicateWorkItems(
  items: { id: string; title: string; sourceId?: string }[]
): { reason: string; items: { id: string; title: string }[] }[] {
  const groups: { reason: string; items: { id: string; title: string }[] }[] = []
  const seen = new Set<string>()
  const bucket = (key: string, reason: string, pred: (i: typeof items[number]) => boolean) => {
    const matched = items.filter(pred)
    if (matched.length > 1) {
      const id = `${reason}:${key}:${matched.map((m) => m.id).sort().join(',')}`
      if (!seen.has(id)) {
        seen.add(id)
        groups.push({ reason, items: matched.map((m) => ({ id: m.id, title: m.title })) })
      }
    }
  }
  // Same roadmap source candidate.
  for (const sid of new Set(items.map((i) => i.sourceId).filter(Boolean) as string[])) {
    bucket(sid, `same source candidate (${sid})`, (i) => i.sourceId === sid)
  }
  // Same normalized title (catches translations after accent/whitespace normalization).
  for (const nt of new Set(items.map((i) => normalizeTitle(i.title)).filter(Boolean))) {
    bucket(nt, 'same normalized title', (i) => normalizeTitle(i.title) === nt)
  }
  return groups
}

function first(values: unknown): string | undefined {
  if (Array.isArray(values)) {
    const v = values.find((x) => typeof x === 'string' && x)
    return v ? String(v) : undefined
  }
  return typeof values === 'string' && values ? values : undefined
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []
}

type ScanDetected = {
  language?: string
  framework?: string
  packageManager?: string
  sourceDirectories: string[]
  migrationDirectories: string[]
  contractFiles: string[]
  infrastructureFiles: string[]
}

function loadScan(dir: string): ScanDetected | null {
  const scanPath = join(dir, '.kaddo', 'scan.json')
  if (!exists(scanPath)) return null
  try {
    const parsed = JSON.parse(readFile(scanPath)) as { detected?: Record<string, unknown> }
    const detected = parsed.detected ?? {}
    return {
      language: first(detected.languages),
      framework: first(detected.frameworks),
      packageManager: first(detected.packageManagers),
      sourceDirectories: toStringArray(detected.sourceDirectories),
      migrationDirectories: toStringArray(detected.migrationDirectories),
      contractFiles: toStringArray(detected.contractFiles),
      infrastructureFiles: toStringArray(detected.infrastructureFiles),
    }
  } catch {
    return null
  }
}

function loadScanSignals(dir: string): ScanSignals | null {
  const scanPath = join(dir, '.kaddo', 'scan.json')
  if (!exists(scanPath)) return null
  try {
    const parsed = JSON.parse(readFile(scanPath)) as { signals?: ScanSignals }
    return parsed.signals ?? null
  } catch {
    return null
  }
}

function hasAgents(dir: string): boolean {
  const agentsDir = join(dir, ARCH_DIR, 'agents')
  if (!exists(agentsDir)) return false
  // Agents install into per-layer subfolders (business/product/tech/…); also tolerate the
  // legacy flat layout. Any *-agent .md anywhere under knowledge/agents/ counts.
  function hasAgentMd(d: string): boolean {
    for (const e of readDir(d)) {
      const full = join(d, e)
      if (isFile(full)) {
        if (e.endsWith('-agent.md')) return true
      } else if (hasAgentMd(full)) {
        return true
      }
    }
    return false
  }
  return hasAgentMd(agentsDir)
}

export function buildProjectExplanation(dir: string): ProjectExplanation {
  const config = loadConfig(dir)
  const project = {
    name: config?.project.name ?? 'unknown',
    state: config?.project.state ?? 'unknown',
    teamSize: config?.team.size ?? 'unknown',
    structure: config?.project.structure ?? 'unknown',
    language: config ? languageLabel(projectLanguage(config)) : 'English',
  }

  const scan = loadScan(dir)
  const stack = scan
    ? {
        language: scan.language,
        framework: scan.framework,
        packageManager: scan.packageManager,
        sourceDirectories: scan.sourceDirectories,
        migrationDirectories: scan.migrationDirectories,
        contractFiles: scan.contractFiles,
        infrastructureFiles: scan.infrastructureFiles,
      }
    : null

  // Layer presence is discovered by meaning (front-matter type), not exact file names, so
  // consolidated artifacts (business.md / product.md / codebase.md) count as real knowledge.
  const layers = knowledgeLayers(dir)
  const layerStatus = (name: string) => layers.find((l) => l.layer === name)?.status ?? 'Missing'

  const knowledge = {
    hasScan: scan !== null,
    hasInventory: exists(join(dir, ARCH_DIR, 'inventory.md')),
    hasContextPack: exists(join(dir, '.kaddo', 'context-pack.md')),
    hasUnderstand: exists(join(dir, '.kaddo', 'understand.md')),
    hasCapabilities: layerStatus('Product') !== 'Missing',
    hasArchitecture: layerStatus('Tech') !== 'Missing',
    hasRoadmap: layerStatus('Delivery') !== 'Missing',
    hasAgents: hasAgents(dir),
  }

  // Work Items come from the unified discovery service (VS-046): typed artifacts under
  // knowledge/delivery/work-items/** (recursive). This excludes ADRs, current-state, roadmap and
  // layer docs, and guarantees explain sees exactly what owners/guard/context see.
  const workItemArtifacts = discoverWorkItems(dir)

  const items = workItemArtifacts.map((a) => ({
    id: a.id || a.title,
    title: a.title,
    type: a.type,
    status: a.status,
    lifecycle: lifecycleStateOf({ status: a.status, filePath: a.filePath }),
    initiative: a.initiative,
    knowledgeLevel: a.knowledgeLevel,
    hasOwnership: a.codeGlobs.length > 0,
    domains: a.domains,
  }))

  const byState = lifecycleCounts(items.map((i) => i.lifecycle))

  // Distribution by Work Item type (feature/bugfix/hotfix/spike/chore/…).
  const byType: Record<string, number> = {}
  for (const i of items) {
    const t = i.type || 'unknown'
    byType[t] = (byType[t] ?? 0) + 1
  }

  // Virtual grouping by initiative (functional traceability) — never folder-based.
  const initiativeMap = new Map<string, Record<LifecycleState, number>>()
  for (const i of items) {
    const name = i.initiative || 'Unassigned'
    if (!initiativeMap.has(name)) initiativeMap.set(name, emptyLifecycleCounts())
    initiativeMap.get(name)![i.lifecycle]++
  }
  const initiatives = [...initiativeMap.entries()]
    .map(([name, states]) => ({ name, states }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const workItems = {
    total: items.length,
    inProgress: items.filter((i) => i.lifecycle === 'in-progress').length,
    done: items.filter((i) => i.status === 'done').length,
    cancelled: items.filter((i) => i.status === 'cancelled').length,
    byState,
    byType,
    initiatives,
    items,
  }

  const withOwnership = items.filter((i) => i.hasOwnership).length
  const ownership = {
    workItemsTotal: items.length,
    workItemsWithOwnership: withOwnership,
    workItemsMissingOwnership: items.length - withOwnership,
  }

  const domains = [...new Set(workItemArtifacts.flatMap((a) => a.domains))].filter(Boolean)

  // Possible duplicate Work Items (VS-052) — non-blocking warning.
  const duplicateWorkItems = findDuplicateWorkItems(
    workItemArtifacts.map((a) => ({ id: a.id || a.title, title: a.title, sourceId: a.sourceId }))
  )

  // Roadmap candidates vs materialized Work Items (any roadmap format).
  const roadmapPath = join(dir, ARCH_DIR, 'delivery', 'roadmap.md')
  const roadmapMd = exists(roadmapPath) ? readFile(roadmapPath) : null
  const roadmap = roadmapStats(roadmapMd, items.length)

  // Multirepo modules registered with `kaddo modules map` (distinct from add-on modules
  // installed with `kaddo add`). Secondary repos are never scanned.
  const mappedModules = loadMappedModules(dir)

  const missingKnowledge: string[] = []
  if (!knowledge.hasScan) missingKnowledge.push('Scan baseline (.kaddo/scan.json)')
  if (!knowledge.hasContextPack) missingKnowledge.push('Context pack (.kaddo/context-pack.md)')
  if (!knowledge.hasInventory) missingKnowledge.push('Inventory (knowledge/inventory.md)')
  if (!knowledge.hasCapabilities) missingKnowledge.push('Product knowledge (knowledge/product/)')
  if (!knowledge.hasArchitecture) missingKnowledge.push('Tech knowledge (knowledge/tech/)')
  if (!knowledge.hasRoadmap) missingKnowledge.push('Roadmap (knowledge/delivery/roadmap.md)')
  if (!knowledge.hasAgents) missingKnowledge.push('Agents (knowledge/agents/)')
  if (items.length === 0) missingKnowledge.push('Work items (knowledge/delivery/work-items/)')

  const suggestedNextSteps: string[] = []
  if (!knowledge.hasScan) {
    suggestedNextSteps.push('Run `kaddo scan` to detect the technical stack.')
  } else if (!knowledge.hasContextPack) {
    suggestedNextSteps.push('Run `kaddo context` to prepare an LLM context pack.')
  }
  if (!knowledge.hasAgents) {
    suggestedNextSteps.push('Run `kaddo add agents` to install knowledge agents.')
  }
  if (!knowledge.hasCapabilities) {
    suggestedNextSteps.push('Use capability-agent to generate knowledge/product/capabilities.md.')
  }
  if (!knowledge.hasArchitecture) {
    suggestedNextSteps.push('Use architecture-agent to generate knowledge/tech/current-state.md.')
  }
  if (!knowledge.hasRoadmap) {
    suggestedNextSteps.push('Use roadmap-agent to generate knowledge/delivery/roadmap.md.')
  } else if (roadmap.remaining > 0) {
    suggestedNextSteps.push(
      `Materialize ${roadmap.remaining} roadmap candidate(s) with \`kaddo create --from roadmap\`.`
    )
  }
  if (items.length === 0 && !roadmap.present) {
    suggestedNextSteps.push('Create your first Work Item with `kaddo create`.')
  } else if (ownership.workItemsMissingOwnership > 0) {
    suggestedNextSteps.push(
      'Run `kaddo owners suggest` for Work Items without code ownership.'
    )
  }

  const readiness = buildReadinessReport(dir)

  return {
    project,
    stack,
    knowledge,
    workItems,
    ownership,
    domains,
    duplicateWorkItems,
    externalCapsules: loadExternalCapsules(dir),
    graph: loadGraphSummary(dir),
    graphHints: loadGraphHints(dir),
    skills: (() => {
      const installed = discoverInstalledSkills(dir)
      return { total: installed.length, byGroup: skillGroupCounts(installed) }
    })(),
    layers,
    roadmap,
    mappedModules,
    missingKnowledge,
    suggestedNextSteps,
    readiness,
    nextStepRecommendation: readiness.nextStepRecommendation,
    techDecisions: buildTechDecisions(dir),
    techKnowledge: {
      core: {
        currentState: exists(join(dir, 'knowledge/tech/current-state.md')),
        codebase: exists(join(dir, 'knowledge/tech/codebase.md')),
      },
      discovery: {
        architectureNotes:
          exists(join(dir, 'knowledge/tech/discovery/architecture-notes.md')) ||
          exists(join(dir, 'knowledge/tech/architecture-notes.md')),
        decisionCandidates:
          exists(join(dir, 'knowledge/tech/discovery/decision-candidates.md')) ||
          exists(join(dir, 'knowledge/tech/decision-candidates.md')),
        legacyLocation:
          exists(join(dir, 'knowledge/tech/architecture-notes.md')) ||
          exists(join(dir, 'knowledge/tech/decision-candidates.md')),
      },
    },
    installedAssets: installedAssetsSummary(dir),
    roadmapQuality: buildRoadmapQuality(dir),
    projectRoute: buildProjectRoute(dir),
    scanSignals: loadScanSignals(dir),
  }
}

function stateLabel(state: string): string {
  return state === 'pre-ai' ? 'pre-ai' : state
}

/** Pluralized, capitalized label for a Work Item type (e.g. feature → Features). */
function typeLabel(type: string): string {
  const cap = type.charAt(0).toUpperCase() + type.slice(1)
  return cap.endsWith('s') ? cap : `${cap}s`
}

const LIFECYCLE_LABEL: Record<LifecycleState, string> = {
  draft: 'Draft',
  ready: 'Ready',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  archived: 'Archived',
}

export function renderExplanationHuman(exp: ProjectExplanation): string {
  const lines: string[] = []
  lines.push('# Project Explanation')
  lines.push('')

  lines.push('## Project')
  lines.push(`- Name: ${exp.project.name}`)
  lines.push(`- State: ${stateLabel(exp.project.state)}`)
  lines.push(`- Team: ${exp.project.teamSize}`)
  lines.push(`- Structure: ${exp.project.structure}`)
  lines.push(`- Project language: ${exp.project.language}`)
  lines.push('')

  lines.push('## Knowledge Layers')
  lines.push(renderLayersMarkdown(exp.layers))
  lines.push('')

  if (exp.stack) {
    lines.push('## Detected Stack')
    if (exp.stack.language) lines.push(`- Language: ${exp.stack.language}`)
    if (exp.stack.framework) lines.push(`- Framework: ${exp.stack.framework}`)
    if (exp.stack.packageManager) lines.push(`- Package manager: ${exp.stack.packageManager}`)
    if (exp.stack.sourceDirectories.length > 0)
      lines.push(`- Source: ${exp.stack.sourceDirectories.join(', ')}`)
    if (exp.stack.migrationDirectories.length > 0)
      lines.push(`- Migrations: ${exp.stack.migrationDirectories.join(', ')}`)
    if (exp.stack.infrastructureFiles.length > 0)
      lines.push(`- Infrastructure: ${exp.stack.infrastructureFiles.join(', ')}`)
    lines.push('')
  }

  // Scan Signals (VS-081)
  if (exp.scanSignals && signalCount(exp.scanSignals) > 0) {
    lines.push('## Scan Signals')
    lines.push(renderSignalsCompact(exp.scanSignals))
  }

  const ls = (name: string) => exp.layers.find((l) => l.layer === name)?.status ?? 'Missing'
  lines.push('## Knowledge Status')
  lines.push(`- Inventory: ${exp.knowledge.hasInventory ? 'available' : 'missing'}`)
  lines.push(`- Context pack: ${exp.knowledge.hasContextPack ? 'available' : 'missing'}`)
  lines.push(`- Business: ${ls('Business')}`)
  lines.push(`- Product: ${ls('Product')}`)
  lines.push(`- Tech: ${ls('Tech')}`)
  lines.push(`- Delivery: ${ls('Delivery')}`)
  lines.push(`- Agents: ${exp.knowledge.hasAgents ? 'available' : 'missing'}`)
  if (exp.roadmap.present) {
    lines.push(`- Roadmap initiatives: ${exp.roadmap.initiatives}`)
    lines.push(`- Work Item candidates: ${exp.roadmap.work_item_candidates}`)
    lines.push(`- Materialized Work Items: ${exp.roadmap.materialized_work_items}`)
    if (exp.roadmap.remaining_work_item_candidates > 0)
      lines.push(`- Remaining Work Item candidates: ${exp.roadmap.remaining_work_item_candidates}`)
  } else {
    lines.push(`- Work items: ${exp.workItems.total}`)
  }
  lines.push(
    `- Ownership coverage: ${exp.ownership.workItemsWithOwnership}/${exp.ownership.workItemsTotal} work items`
  )
  lines.push('')

  if (exp.workItems.total > 0) {
    lines.push('## Work Items')
    for (const s of LIFECYCLE_STATES) {
      lines.push(`- ${LIFECYCLE_LABEL[s]}: ${exp.workItems.byState[s]}`)
    }
    lines.push('')

    // Distribution by type (VS-045) — keeps chores/tooling distinct from features.
    const typeEntries = Object.entries(exp.workItems.byType).sort((a, b) => b[1] - a[1])
    if (typeEntries.length > 0) {
      lines.push('## Work Items by Type')
      for (const [t, n] of typeEntries) lines.push(`- ${typeLabel(t)}: ${n}`)
      lines.push('')
    }

    // Virtual grouping by initiative (functional traceability, not folders).
    const grouped = exp.workItems.initiatives.filter((g) =>
      LIFECYCLE_STATES.some((s) => g.states[s] > 0)
    )
    if (grouped.length > 0) {
      lines.push('## Work Items by Initiative')
      for (const g of grouped) {
        const parts = LIFECYCLE_STATES.filter((s) => g.states[s] > 0).map(
          (s) => `${LIFECYCLE_LABEL[s]}: ${g.states[s]}`
        )
        lines.push(`- ${g.name} — ${parts.join(' · ')}`)
      }
      lines.push('')
    }
  }

  const active = exp.workItems.items.filter((i) => i.lifecycle === 'in-progress')
  if (active.length > 0) {
    lines.push('## In Progress')
    for (const wi of active) {
      const level = wi.knowledgeLevel ? ` [${wi.knowledgeLevel}]` : ''
      const owned = wi.hasOwnership ? ' ●' : ' ○'
      lines.push(`-${owned} ${wi.id}${level} — ${wi.title}`)
    }
    lines.push('')
  }

  if (exp.domains.length > 0) {
    lines.push('## Domains')
    lines.push(`- ${exp.domains.join(', ')}`)
    lines.push('')
  }

  lines.push('## Mapped Modules')
  if (exp.mappedModules.length > 0) {
    for (const m of exp.mappedModules) {
      const owner = m.owner ? ` — owner: ${m.owner}` : ''
      lines.push(`- ${m.id} — ${m.type ?? 'unknown'} — ${m.repoPath || '—'}${owner}`)
    }
    lines.push('')
    lines.push('## Module Artifact Coverage')
    for (const m of exp.mappedModules) {
      const present = presentArtifacts(m.artifacts)
      lines.push(`- ${m.id}: ${present.length > 0 ? present.join(', ') : 'none'}`)
    }
    lines.push('')
  } else {
    lines.push('- Mapped modules: 0')
    lines.push('')
  }

  // External Knowledge Capsules (VS-054) + staleness warning.
  if (exp.externalCapsules.length > 0) {
    lines.push(`## External Knowledge Capsules: ${exp.externalCapsules.length}`)
    for (const cap of exp.externalCapsules) {
      const owner = cap.owner ? ` — owner: ${cap.owner}` : ''
      lines.push(`- ${cap.system}${owner}`)
      if (cap.ageDays !== null && cap.ageDays >= 90) {
        lines.push(`  ⚠ capsule last updated ${cap.ageDays} days ago — it may be stale.`)
      }
    }
    lines.push('')
  }

  // Knowledge Graph summary (VS-055) — shown only if `kaddo graph export` has been run.
  if (exp.graph) {
    lines.push('## Knowledge Graph')
    lines.push(`- Scope: ${exp.graph.scope}`)
    lines.push(`- Nodes: ${exp.graph.nodes}`)
    lines.push(`- Edges: ${exp.graph.edges}`)
    if (exp.graphHints) {
      lines.push(`- Quality: ${exp.graphHints.quality}`)
      lines.push(`- Hints: ${exp.graphHints.totalHints}`)
    }
    if (exp.graph.scopeReason) lines.push(`- Reason: ${exp.graph.scopeReason}`)
    if (exp.graph.generatedAt) lines.push(`- Last exported: ${exp.graph.generatedAt}`)
    // Tip when the active graph is empty because there are no active Work Items (VS-060).
    if (exp.graph.scope === 'active' && exp.graphHints?.quality === 'empty') {
      lines.push('- Tip: Run `kaddo graph export --scope all` to include completed Work Items')
    }
    lines.push('')
  }

  // Installed reusable skills (VS-059).
  if (exp.skills.total > 0) {
    lines.push(`## Skills installed: ${exp.skills.total}`)
    const groups = Object.entries(exp.skills.byGroup).sort((a, b) => a[0].localeCompare(b[0]))
    if (groups.length > 0) {
      lines.push('Groups:')
      for (const [g, n] of groups) lines.push(`- ${g}: ${n}`)
    }
    lines.push('')
  }

  if (exp.missingKnowledge.length > 0) {
    lines.push('## Missing Knowledge')
    for (const m of exp.missingKnowledge) lines.push(`- ${m}`)
    lines.push('')
  }

  if (exp.duplicateWorkItems.length > 0) {
    lines.push('## Possible Duplicate Work Items')
    for (const g of exp.duplicateWorkItems) {
      lines.push(`- ${g.reason}:`)
      for (const i of g.items) lines.push(`  - ${i.id} — ${i.title}`)
    }
    lines.push('Review before continuing (non-blocking).')
    lines.push('')
  }

  // Project Route (VS-080): visual progress within the lifecycle.
  lines.push(renderRouteMarkdown(exp.projectRoute))

  // Phase + reason (VS-047): explain why the project is where it is, from real knowledge state.
  const assessment = assessPhase(exp)
  lines.push('## Phase')
  lines.push(`- Phase: ${assessment.phase}`)
  if (assessment.reasons.length > 0) {
    lines.push('- Reason:')
    for (const r of assessment.reasons) lines.push(`  - ${r}`)
  }
  // Unified next step (VS-073.2): the Phase section and Project Readiness show the SAME step.
  lines.push(`- Next step: ${exp.readiness.recommended_next_step.label}`)
  lines.push('')

  // Suggested Next Steps (VS-079): in a delivery phase, lead with the state-aware primary step and its
  // parallel (secondary) recommendations; otherwise fall back to the early-phase guidance list.
  const rec = exp.nextStepRecommendation
  const secondary = rec.secondary ?? []
  const steps =
    secondary.length > 0 || /Delivery|Active|Maintenance/.test(rec.phase)
      ? [rec.label, ...secondary.map((s) => s.label)]
      : exp.suggestedNextSteps
  if (steps.length > 0) {
    lines.push('## Suggested Next Steps')
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
    lines.push('')
  }

  // Project Readiness (VS-072.1): where the project sits in the Kaddo cycle + the single next step.
  const r = exp.readiness
  const s = r.signals
  lines.push('## Project Readiness')
  lines.push(`- overall: ${r.overall}`)
  if (r.overall !== 'not-initialized' && r.overall !== 'not-applicable' && r.overall !== 'legacy-project') {
    lines.push(`- bootstrap baseline: ${s.bootstrap_baseline}`)
    lines.push(`- scan: ${s.scan}`)
    lines.push(`- understand: ${s.understand}`)
    lines.push(`- agents: ${s.agents}`)
    lines.push(`- skills: ${s.skills}`)
    lines.push(`- business: ${s.business}`)
    lines.push(`- product: ${s.product}`)
    lines.push(`- capabilities: ${s.capabilities}`)
    lines.push(`- current-state: ${s.current_state}`)
    lines.push(`- codebase: ${s.codebase}`)
    lines.push(`- roadmap: ${s.roadmap}`)
    lines.push(`- work-items: ${s.work_items}`)
    lines.push(`- adapters: ${s.adapters.length > 0 ? s.adapters.join(', ') + ' installed' : 'none installed'}`)
    lines.push(`- blocking open questions: ${s.blocking_open_questions}`)
    lines.push(`- assumptions: ${s.assumed_questions}`)
    lines.push(`- deferred: ${s.deferred_questions}`)
  }
  lines.push('')
  lines.push('### Recommended next step')
  lines.push(r.recommended_next_step.label)
  lines.push('')

  // Tech Knowledge (VS-075.2): core artifacts vs decisions vs discovery notes.
  const td = exp.techDecisions
  const tk = exp.techKnowledge
  const mark = (b: boolean) => (b ? '✓' : '✗')
  lines.push('## Tech Knowledge')
  lines.push('Core:')
  lines.push(`- ${mark(tk.core.currentState)} current-state.md`)
  lines.push(`- ${mark(tk.core.codebase)} codebase.md`)
  lines.push('Decisions:')
  lines.push(`- ADRs: ${td.adrs} (draft: ${td.draft_adrs}, accepted: ${td.accepted_adrs}) · status: ${td.status}`)
  lines.push('Discovery:')
  lines.push(`- ${mark(tk.discovery.architectureNotes)} architecture-notes.md`)
  lines.push(`- ${mark(tk.discovery.decisionCandidates)} decision-candidates.md`)
  lines.push('')
  if (td.candidates > 0 && td.adrs === 0) {
    lines.push('Use the adr-writing skill to materialize decision candidates into ADRs (`kaddo adr`) before implementing related technical Work Items.')
    lines.push('')
  }
  if (tk.discovery.legacyLocation) {
    lines.push('Tech discovery files are in the legacy `knowledge/tech/` root. Suggested cleanup: run `kaddo tech organize`.')
    lines.push('')
  }

  // Roadmap Status (VS-077.1): separate initiatives from Work Item candidates and materialization.
  if (exp.roadmap.present) {
    lines.push('## Roadmap Status')
    lines.push(`- Initiatives: ${exp.roadmap.initiatives}`)
    lines.push(`- Work Item candidates: ${exp.roadmap.work_item_candidates}`)
    lines.push(`- Materialized Work Items: ${exp.roadmap.materialized_work_items}`)
    lines.push(`- Remaining Work Item candidates: ${exp.roadmap.remaining_work_item_candidates}`)
    lines.push('')
  }

  // Roadmap Quality (VS-077 / VS-077.1): grade initiatives and Work Item candidates separately.
  const rq = exp.roadmapQuality
  const rqi = rq.initiatives
  const rqw = rq.work_item_candidates
  if (rqi.total > 0 || rqw.total > 0) {
    lines.push('## Roadmap Quality')
    if (rqi.total > 0) {
      lines.push('Initiatives:')
      lines.push(`- Candidates evaluated: ${rqi.total}`)
      lines.push(`- Grounded: ${rqi.grounded}/${rqi.total}`)
      lines.push(`- With related domain: ${rqi.with_related_domain}/${rqi.total}`)
      lines.push(`- With related capability: ${rqi.with_related_capability}/${rqi.total}`)
      lines.push(`- With source signals: ${rqi.with_source_signals}/${rqi.total}`)
    }
    if (rqw.total > 0) {
      lines.push('')
      lines.push('Work Item Candidates:')
      lines.push(`- Candidates: ${rqw.total}`)
      lines.push(`- With source initiative: ${rqw.with_source_initiative}/${rqw.total}`)
      lines.push(`- With related domain: ${rqw.with_related_domain}/${rqw.total}`)
      lines.push(`- With related capability: ${rqw.with_related_capability}/${rqw.total}`)
    }
    if (rqi.needs_refinement) {
      lines.push('')
      lines.push('Roadmap quality: needs refinement.')
      lines.push('Suggested: use roadmap-agent to add domain / capability / source signals.')
    } else if (rqw.total > 0) {
      lines.push('')
      lines.push('Work Item candidate quality: good.')
    }
    lines.push('')
  }

  // Installed Assets (VS-074.2): agent/skill version alignment with the current package.
  const ia = exp.installedAssets
  const agentsInstalled = ia.agents.total - ia.agents.missing
  const skillsInstalled = ia.skills.total - ia.skills.missing
  if (agentsInstalled > 0 || skillsInstalled > 0) {
    const issues = (s: typeof ia.agents) =>
      [s.outdated ? `${s.outdated} outdated` : '', s.unknown_version ? `${s.unknown_version} unknown-version` : '', s.modified ? `${s.modified} modified` : '']
        .filter(Boolean)
        .join(', ')
    lines.push('## Installed Assets')
    lines.push(`- CLI version: ${ia.version}`)
    lines.push(`- Agents: ${agentsInstalled} installed${issues(ia.agents) ? ` (${issues(ia.agents)})` : ''}`)
    lines.push(`- Skills: ${skillsInstalled} installed${issues(ia.skills) ? ` (${issues(ia.skills)})` : ''}`)
    if (ia.agents.outdated + ia.agents.unknown_version + ia.skills.outdated + ia.skills.unknown_version > 0) {
      lines.push('')
      lines.push('Suggested: run `kaddo agents status` and `kaddo skills status`.')
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

export function renderExplanationAgent(exp: ProjectExplanation): string {
  // Expose mapped modules under a stable snake_case key for agents, distinct from add-on
  // `installed_modules`. The rest of the explanation is emitted as-is. `readiness` is emitted as-is.
  const { mappedModules, ...rest } = exp
  return JSON.stringify({ ...rest, mapped_modules: mappedModules }, null, 2) + '\n'
}
