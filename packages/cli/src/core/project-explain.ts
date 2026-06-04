// Deterministic project explainer (VS-013).
//
// `buildProjectExplanation` gathers what Kaddo currently knows about a project from existing
// artifacts (config, scan baseline, architecture knowledge, work items, ownership) and reports
// what is missing plus actionable next steps. No LLM, no inference — pure file reads.

import { exists, readFile, readDir, join, isFile } from '../utils/fs.js'
import { loadConfig } from './config.js'
import { readArtifacts } from '../services/artifact-reader.js'
import {
  loadMappedModules,
  presentArtifacts,
  type MappedModuleWithCoverage,
} from '../services/mapped-modules.js'
import { knowledgeLayers, renderLayersMarkdown, type LayerStatus } from './layers.js'

const ARCH_DIR = 'knowledge'

export type ProjectExplanation = {
  project: {
    name: string
    state: string
    teamSize: string
    structure: string
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
    items: {
      id: string
      title: string
      status: string
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
  layers: LayerStatus[]
  mappedModules: MappedModuleWithCoverage[]
  missingKnowledge: string[]
  suggestedNextSteps: string[]
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

function hasAgents(dir: string): boolean {
  const agentsDir = join(dir, ARCH_DIR, 'agents')
  if (!exists(agentsDir)) return false
  return readDir(agentsDir).some((e) => e.endsWith('.md') && isFile(join(agentsDir, e)))
}

export function buildProjectExplanation(dir: string): ProjectExplanation {
  const config = loadConfig(dir)
  const project = {
    name: config?.project.name ?? 'unknown',
    state: config?.project.state ?? 'unknown',
    teamSize: config?.team.size ?? 'unknown',
    structure: config?.project.structure ?? 'unknown',
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

  const knowledge = {
    hasScan: scan !== null,
    hasInventory: exists(join(dir, ARCH_DIR, 'inventory.md')),
    hasContextPack: exists(join(dir, '.kaddo', 'context-pack.md')),
    hasUnderstand: exists(join(dir, '.kaddo', 'understand.md')),
    hasCapabilities: exists(join(dir, ARCH_DIR, 'product', 'capabilities.md')),
    hasArchitecture: exists(join(dir, ARCH_DIR, 'tech', 'current-state.md')),
    hasRoadmap: exists(join(dir, ARCH_DIR, 'delivery', 'roadmap.md')),
    hasAgents: hasAgents(dir),
  }

  const archDir = join(dir, ARCH_DIR)
  const allArtifacts = exists(archDir) ? readArtifacts(archDir) : []
  const workItemArtifacts = allArtifacts.filter(
    (a) => a.type !== 'current-state' && a.type !== 'roadmap'
  )

  const items = workItemArtifacts.map((a) => ({
    id: a.id || a.title,
    title: a.title,
    status: a.status,
    knowledgeLevel: a.knowledgeLevel,
    hasOwnership: a.codeGlobs.length > 0,
    domains: a.domains,
  }))

  const workItems = {
    total: items.length,
    inProgress: items.filter((i) => i.status === 'in-progress').length,
    done: items.filter((i) => i.status === 'done').length,
    cancelled: items.filter((i) => i.status === 'cancelled').length,
    items,
  }

  const withOwnership = items.filter((i) => i.hasOwnership).length
  const ownership = {
    workItemsTotal: items.length,
    workItemsWithOwnership: withOwnership,
    workItemsMissingOwnership: items.length - withOwnership,
  }

  const domains = [...new Set(workItemArtifacts.flatMap((a) => a.domains))].filter(Boolean)

  // Multirepo modules registered with `kaddo modules map` (distinct from add-on modules
  // installed with `kaddo add`). Secondary repos are never scanned.
  const mappedModules = loadMappedModules(dir)

  const missingKnowledge: string[] = []
  if (!knowledge.hasScan) missingKnowledge.push('Scan baseline (.kaddo/scan.json)')
  if (!knowledge.hasContextPack) missingKnowledge.push('Context pack (.kaddo/context-pack.md)')
  if (!knowledge.hasInventory) missingKnowledge.push('Inventory (knowledge/inventory.md)')
  if (!knowledge.hasCapabilities)
    missingKnowledge.push('Capabilities (knowledge/product/capabilities.md)')
  if (!knowledge.hasArchitecture)
    missingKnowledge.push('Architecture baseline (knowledge/tech/current-state.md)')
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
  }
  if (items.length === 0) {
    suggestedNextSteps.push('Create your first Work Item with `kaddo create`.')
  } else if (ownership.workItemsMissingOwnership > 0) {
    suggestedNextSteps.push(
      'Run `kaddo owners suggest` for Work Items without code ownership.'
    )
  }

  return {
    project,
    stack,
    knowledge,
    workItems,
    ownership,
    domains,
    layers: knowledgeLayers(dir),
    mappedModules,
    missingKnowledge,
    suggestedNextSteps,
  }
}

function stateLabel(state: string): string {
  return state === 'pre-ai' ? 'pre-ai' : state
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

  lines.push('## Knowledge Status')
  lines.push(`- Inventory: ${exp.knowledge.hasInventory ? 'available' : 'missing'}`)
  lines.push(`- Context pack: ${exp.knowledge.hasContextPack ? 'available' : 'missing'}`)
  lines.push(`- Capabilities: ${exp.knowledge.hasCapabilities ? 'available' : 'missing'}`)
  lines.push(
    `- Architecture baseline: ${exp.knowledge.hasArchitecture ? 'available' : 'missing'}`
  )
  lines.push(`- Roadmap: ${exp.knowledge.hasRoadmap ? 'available' : 'missing'}`)
  lines.push(`- Agents: ${exp.knowledge.hasAgents ? 'available' : 'missing'}`)
  lines.push(`- Work items: ${exp.workItems.total}`)
  lines.push(
    `- Ownership coverage: ${exp.ownership.workItemsWithOwnership}/${exp.ownership.workItemsTotal} work items`
  )
  lines.push('')

  const active = exp.workItems.items.filter((i) => i.status === 'in-progress')
  if (active.length > 0) {
    lines.push('## Active Work Items')
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

  if (exp.missingKnowledge.length > 0) {
    lines.push('## Missing Knowledge')
    for (const m of exp.missingKnowledge) lines.push(`- ${m}`)
    lines.push('')
  }

  if (exp.suggestedNextSteps.length > 0) {
    lines.push('## Suggested Next Steps')
    exp.suggestedNextSteps.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

export function renderExplanationAgent(exp: ProjectExplanation): string {
  // Expose mapped modules under a stable snake_case key for agents, distinct from add-on
  // `installed_modules`. The rest of the explanation is emitted as-is.
  const { mappedModules, ...rest } = exp
  return JSON.stringify({ ...rest, mapped_modules: mappedModules }, null, 2) + '\n'
}
