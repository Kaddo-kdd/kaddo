// Project Route Progress Map (VS-080).
//
// Builds a derived route showing where a project sits in its lifecycle — new, pre-ai, or legacy.
// Pure reads: no LLM, no git, no mutations. The route visualizes existing signals (config, scan,
// knowledge layers, roadmap, work items, ownership, decisions, adapters).

import { exists, join } from '../utils/fs.js'
import { loadConfig, type ProjectState } from './config.js'
import { analyzeKnowledgeArtifact, type ArtifactQuality } from './artifact-quality.js'
import { hasWarnings as hasScanSignalWarnings } from './scan-signals.js'
import { parseWorkItemSource } from './work-item-source.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { buildTechDecisions } from './decisions.js'
import { roadmapStats } from './roadmap.js'
import { resolveNextStep, buildDeliveryState, installedAdapters } from './next-step.js'
import { readFile } from '../utils/fs.js'

export type RouteStepStatus = 'done' | 'current' | 'next' | 'pending' | 'optional' | 'blocked' | 'warning' | 'skipped'

export type RouteStep = {
  id: string
  label: string
  status: RouteStepStatus
  evidence?: string[]
  reason?: string
  command?: string
  agent?: string
  skill?: string
}

export type ProjectRoute = {
  type: ProjectState
  currentStep: string
  completed: number
  total: number
  progressPercent: number
  steps: RouteStep[]
}

type StepDef = {
  id: string
  label: string
  evaluate: (ctx: RouteContext) => Pick<RouteStep, 'status' | 'evidence' | 'reason' | 'command' | 'agent' | 'skill'>
}

type RouteContext = {
  dir: string
  hasConfig: boolean
  hasScan: boolean
  hasInventory: boolean
  qBusiness: ArtifactQuality
  qProduct: ArtifactQuality
  qCapabilities: ArtifactQuality
  qCurrentState: ArtifactQuality
  qCodebase: ArtifactQuality
  hasRoadmap: boolean
  roadmapCandidates: number
  totalWorkItems: number
  draftWorkItems: number
  readyWorkItems: number
  inProgressWorkItems: number
  completedWorkItems: number
  ownershipCoverage: string
  ownershipComplete: boolean
  decisionCandidates: number
  acceptedAdrs: number
  draftAdrs: number
  totalAdrs: number
  adaptersInstalled: number
  hasGuardHistory: boolean
  hasScanWarnings: boolean
  hasUnknownSources: boolean
  nextStepId: string
}

function isUseful(q: ArtifactQuality): boolean {
  return q === 'useful'
}

// --- Step evaluators ---

const enableKaddo: StepDef = {
  id: 'enable-kaddo',
  label: 'Enable Kaddo',
  evaluate: (ctx) => ({
    status: ctx.hasConfig ? 'done' : 'current',
    evidence: ctx.hasConfig ? ['.kaddo/config.yml'] : undefined,
    command: ctx.hasConfig ? undefined : 'kaddo init',
  }),
}

const scanRepository: StepDef = {
  id: 'scan-repository',
  label: 'Scan repository',
  evaluate: (ctx) => {
    if (!ctx.hasScan) return { status: 'pending', command: 'kaddo scan' }
    if (ctx.hasScanWarnings) return { status: 'warning', evidence: ['.kaddo/scan.json'], reason: 'Scan has warnings (e.g. no test directory detected).', command: 'kaddo scan' }
    return { status: 'done', evidence: ['.kaddo/scan.json'] }
  },
}

const bootstrapBaseline: StepDef = {
  id: 'bootstrap',
  label: 'Bootstrap knowledge baseline',
  evaluate: (ctx) => {
    if (ctx.qBusiness !== 'missing' && ctx.qProduct !== 'missing') return { status: 'done', evidence: ['knowledge/business/business.md', 'knowledge/product/product.md'] }
    return { status: 'pending', command: 'kaddo bootstrap', reason: 'The knowledge baseline is incomplete.' }
  },
}

const defineBusiness: StepDef = {
  id: 'define-business',
  label: 'Define business context',
  evaluate: (ctx) => ({
    status: isUseful(ctx.qBusiness) ? 'done' : (ctx.qBusiness === 'missing' ? 'pending' : 'warning'),
    evidence: isUseful(ctx.qBusiness) ? ['knowledge/business/business.md'] : undefined,
    reason: ctx.qBusiness === 'placeholder' ? 'Business context is still a bootstrap placeholder.' : undefined,
    agent: isUseful(ctx.qBusiness) ? undefined : 'business-agent',
  }),
}

const defineProduct: StepDef = {
  id: 'define-product',
  label: 'Define product context',
  evaluate: (ctx) => ({
    status: isUseful(ctx.qProduct) ? 'done' : (ctx.qProduct === 'missing' ? 'pending' : 'warning'),
    evidence: isUseful(ctx.qProduct) ? ['knowledge/product/product.md'] : undefined,
    agent: isUseful(ctx.qProduct) ? undefined : 'capability-agent',
  }),
}

const discoverCapabilities: StepDef = {
  id: 'discover-capabilities',
  label: 'Discover capabilities',
  evaluate: (ctx) => ({
    status: isUseful(ctx.qCapabilities) ? 'done' : (ctx.qCapabilities === 'missing' ? 'pending' : 'warning'),
    evidence: isUseful(ctx.qCapabilities) ? ['knowledge/product/capabilities.md'] : undefined,
    agent: isUseful(ctx.qCapabilities) ? undefined : 'capability-agent',
  }),
}

const describeArchitecture: StepDef = {
  id: 'describe-architecture',
  label: 'Describe current architecture',
  evaluate: (ctx) => {
    const done = isUseful(ctx.qCurrentState) && isUseful(ctx.qCodebase)
    const evidence: string[] = []
    if (isUseful(ctx.qCurrentState)) evidence.push('knowledge/tech/current-state.md')
    if (isUseful(ctx.qCodebase)) evidence.push('knowledge/tech/codebase.md')
    return {
      status: done ? 'done' : 'pending',
      evidence: evidence.length > 0 ? evidence : undefined,
      agent: done ? undefined : 'architecture-agent',
    }
  },
}

const captureTechDecisions: StepDef = {
  id: 'capture-technical-decisions',
  label: 'Capture technical decisions',
  evaluate: (ctx) => {
    if (ctx.decisionCandidates === 0 && ctx.totalAdrs === 0) {
      return { status: 'optional', reason: 'No decision candidates found.' }
    }
    if (ctx.totalAdrs > 0) {
      return { status: 'done', evidence: ['knowledge/tech/decisions/'], reason: `${ctx.totalAdrs} ADR(s) exist.` }
    }
    return {
      status: 'warning',
      reason: `${ctx.decisionCandidates} decision candidate(s) exist but no ADRs have been materialized.`,
      command: 'kaddo adr',
      skill: 'adr-writing',
    }
  },
}

const createWorkSource: StepDef = {
  id: 'create-work-source',
  label: 'Create or connect work source',
  evaluate: (ctx) => {
    if (!ctx.hasRoadmap && ctx.totalWorkItems === 0) return { status: 'pending', command: 'kaddo roadmap', agent: 'roadmap-agent' }
    if (ctx.hasUnknownSources) return { status: 'warning', evidence: ['Work Items with unknown source'], reason: 'Some Work Items have no source metadata.' }
    const evidence = ctx.hasRoadmap ? ['knowledge/delivery/roadmap.md'] : undefined
    return { status: 'done', evidence }
  },
}

const materializeWorkItem: StepDef = {
  id: 'materialize-work-item',
  label: 'Materialize first Work Item',
  evaluate: (ctx) => {
    if (ctx.totalWorkItems > 0) {
      return { status: 'done', evidence: ['knowledge/delivery/work-items/'] }
    }
    if (ctx.roadmapCandidates > 0) {
      return { status: 'current', command: 'kaddo create --from roadmap', reason: 'Roadmap has candidates but no Work Item exists.' }
    }
    return { status: 'pending' }
  },
}

const refineWorkItem: StepDef = {
  id: 'refine-work-item',
  label: 'Refine Work Item',
  evaluate: (ctx) => {
    if (ctx.readyWorkItems > 0 || ctx.inProgressWorkItems > 0) return { status: 'done' }
    if (ctx.draftWorkItems > 0) {
      return {
        status: 'current',
        reason: `There ${ctx.draftWorkItems === 1 ? 'is' : 'are'} ${ctx.draftWorkItems} draft Work Item${ctx.draftWorkItems === 1 ? '' : 's'} and no Work Item is ready.`,
        agent: 'work-item-agent',
        skill: 'work-item-refinement',
      }
    }
    return { status: 'pending' }
  },
}

const suggestOwnership: StepDef = {
  id: 'suggest-ownership',
  label: 'Suggest ownership',
  evaluate: (ctx) => {
    if (ctx.totalWorkItems === 0) return { status: 'pending' }
    if (ctx.ownershipComplete) return { status: 'done' }
    return {
      status: 'next',
      reason: `Ownership coverage is ${ctx.ownershipCoverage}.`,
      command: 'kaddo owners suggest',
    }
  },
}

const resolveAdrs: StepDef = {
  id: 'resolve-adrs',
  label: 'Resolve ADRs if needed',
  evaluate: (ctx) => {
    if (ctx.decisionCandidates === 0 && ctx.totalAdrs === 0) return { status: 'optional' }
    if (ctx.totalAdrs > 0) return { status: 'done' }
    return {
      status: 'warning',
      reason: `${ctx.decisionCandidates} decision candidate(s) without ADRs.`,
      command: 'kaddo adr',
      skill: 'adr-writing',
    }
  },
}

const prepareImplementation: StepDef = {
  id: 'prepare-implementation',
  label: 'Prepare implementation',
  evaluate: (ctx) => {
    if (ctx.inProgressWorkItems > 0 || ctx.completedWorkItems > 0) return { status: 'done' }
    if (ctx.readyWorkItems > 0) {
      if (ctx.adaptersInstalled === 0) {
        return { status: 'current', reason: 'Ready Work Items exist but no adapter is installed.', command: 'kaddo adapters list' }
      }
      return { status: 'current', agent: 'implementation-agent' }
    }
    return { status: 'pending' }
  },
}

const runGuard: StepDef = {
  id: 'run-guard',
  label: 'Run guard',
  evaluate: (ctx) => {
    if (ctx.hasGuardHistory) return { status: 'done', evidence: ['.kaddo/history/guard-runs.jsonl'] }
    if (ctx.inProgressWorkItems > 0) return { status: 'current', command: 'kaddo guard' }
    return { status: 'pending' }
  },
}

const captureLearning: StepDef = {
  id: 'capture-learning',
  label: 'Capture learning',
  evaluate: (ctx) => {
    if (ctx.completedWorkItems > 0) return { status: 'done' }
    if (ctx.totalWorkItems === 0) return { status: 'optional', reason: 'Project is still in early discovery.' }
    return { status: 'pending' }
  },
}

// Legacy-specific steps
const identifyLegacyModules: StepDef = {
  id: 'identify-legacy-modules',
  label: 'Identify legacy modules',
  evaluate: (ctx) => {
    const hasLegacy = exists(join(ctx.dir, 'knowledge/legacy/risks.md'))
    return {
      status: hasLegacy ? 'done' : 'pending',
      evidence: hasLegacy ? ['knowledge/legacy/risks.md'] : undefined,
      agent: hasLegacy ? undefined : 'legacy-agent',
    }
  },
}

const identifyRisks: StepDef = {
  id: 'identify-risks',
  label: 'Identify operational risks',
  evaluate: (ctx) => {
    const hasLegacy = exists(join(ctx.dir, 'knowledge/legacy/risks.md'))
    return { status: hasLegacy ? 'done' : 'pending', agent: hasLegacy ? undefined : 'legacy-agent' }
  },
}

// --- Route definitions ---

const NEW_STEPS: StepDef[] = [
  enableKaddo,
  defineBusiness,
  defineProduct,
  { ...discoverCapabilities, label: 'Define initial capabilities' },
  { ...describeArchitecture, label: 'Define initial architecture' },
  { ...createWorkSource, label: 'Create initial work source' },
  { ...materializeWorkItem, label: 'Create first Work Item' },
  refineWorkItem,
  suggestOwnership,
  prepareImplementation,
  runGuard,
  captureLearning,
]

const PRE_AI_STEPS: StepDef[] = [
  enableKaddo,
  scanRepository,
  bootstrapBaseline,
  defineBusiness,
  defineProduct,
  discoverCapabilities,
  describeArchitecture,
  captureTechDecisions,
  createWorkSource,
  materializeWorkItem,
  refineWorkItem,
  suggestOwnership,
  resolveAdrs,
  prepareImplementation,
  runGuard,
  captureLearning,
]

const LEGACY_STEPS: StepDef[] = [
  enableKaddo,
  scanRepository,
  bootstrapBaseline,
  identifyLegacyModules,
  { ...discoverCapabilities, label: 'Discover critical capabilities' },
  describeArchitecture,
  identifyRisks,
  captureTechDecisions,
  { ...createWorkSource, label: 'Create modernization candidates' },
  { ...materializeWorkItem, label: 'Materialize safe Work Item' },
  refineWorkItem,
  suggestOwnership,
  resolveAdrs,
  { ...prepareImplementation, label: 'Prepare safe implementation' },
  runGuard,
  captureLearning,
]

function stepsForState(state: ProjectState): StepDef[] {
  switch (state) {
    case 'new': return NEW_STEPS
    case 'legacy': return LEGACY_STEPS
    case 'pre-ai':
    default: return PRE_AI_STEPS
  }
}

function buildRouteContext(dir: string): RouteContext {
  const config = loadConfig(dir)
  const hasScan = exists(join(dir, '.kaddo', 'scan.json'))
  const hasInventory = exists(join(dir, 'knowledge', 'inventory.md'))

  const qa = (rel: string) => analyzeKnowledgeArtifact(dir, rel)
  const wis = discoverWorkItems(dir)
  const td = buildTechDecisions(dir)

  const roadmapPath = join(dir, 'knowledge/delivery/roadmap.md')
  const hasRoadmap = exists(roadmapPath)
  let roadmapMd: string | null = null
  if (hasRoadmap) {
    try { roadmapMd = readFile(roadmapPath) } catch { /* empty */ }
  }
  const stats = roadmapStats(roadmapMd, wis.length)

  const byState = (s: string) => wis.filter((w) => w.lifecycle === s).length
  const total = wis.length
  const withOwnership = wis.filter((w) => w.codeGlobs.length > 0).length
  const adapters = installedAdapters(dir)

  const nextStep = resolveNextStep(dir)

  return {
    dir,
    hasConfig: config !== null,
    hasScan,
    hasInventory,
    qBusiness: qa('knowledge/business/business.md'),
    qProduct: qa('knowledge/product/product.md'),
    qCapabilities: qa('knowledge/product/capabilities.md'),
    qCurrentState: qa('knowledge/tech/current-state.md'),
    qCodebase: qa('knowledge/tech/codebase.md'),
    hasRoadmap,
    roadmapCandidates: stats.work_item_candidates,
    totalWorkItems: total,
    draftWorkItems: byState('draft'),
    readyWorkItems: byState('ready'),
    inProgressWorkItems: byState('in-progress'),
    completedWorkItems: byState('completed'),
    ownershipCoverage: `${withOwnership}/${total}`,
    ownershipComplete: total > 0 && withOwnership >= total,
    decisionCandidates: td.candidates,
    acceptedAdrs: td.accepted_adrs,
    draftAdrs: td.draft_adrs,
    totalAdrs: td.adrs,
    adaptersInstalled: adapters.length,
    hasGuardHistory: exists(join(dir, '.kaddo', 'history', 'guard-runs.jsonl')),
    hasScanWarnings: hasScan ? loadScanWarnings(dir) : false,
    hasUnknownSources: wis.some((w) => {
      const src = parseWorkItemSource(w.rawFrontmatter)
      return src.type === 'unknown' && src.inferred
    }),
    nextStepId: mapNextStepId(nextStep.id),
  }
}

function loadScanWarnings(dir: string): boolean {
  try {
    const parsed = JSON.parse(readFile(join(dir, '.kaddo', 'scan.json')))
    return parsed.signals ? hasScanSignalWarnings(parsed.signals) : false
  } catch {
    return false
  }
}

function mapNextStepId(id: string): string {
  const MAP: Record<string, string> = {
    init: 'enable-kaddo',
    bootstrap: 'bootstrap',
    'add-agents': 'enable-kaddo',
    'add-skills': 'enable-kaddo',
    scan: 'scan-repository',
    context: 'scan-repository',
    'refine-business': 'define-business',
    'refine-product': 'define-product',
    'refine-capabilities': 'discover-capabilities',
    'refine-current-state': 'describe-architecture',
    'refine-codebase': 'describe-architecture',
  }
  return MAP[id] ?? id
}

export function buildProjectRoute(dir: string): ProjectRoute {
  const config = loadConfig(dir)
  const state: ProjectState = config?.project.state ?? 'pre-ai'
  const defs = stepsForState(state)
  const ctx = buildRouteContext(dir)

  const steps: RouteStep[] = defs.map((d) => {
    const result = d.evaluate(ctx)
    return { id: d.id, label: d.label, ...result }
  })

  // Override status: the step matching nextStepRecommendation.id is always 'current' if not already done.
  for (const s of steps) {
    if (s.id === ctx.nextStepId && s.status !== 'done') {
      s.status = 'current'
    }
  }

  // Mark the first 'pending' step after all done/current/warning/optional as 'next'.
  let seenCurrent = false
  for (const s of steps) {
    if (s.status === 'current') seenCurrent = true
    if (seenCurrent && s.status === 'pending') {
      s.status = 'next'
      break
    }
  }

  const completed = steps.filter((s) => s.status === 'done').length
  const total = steps.length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    type: state,
    currentStep: steps.find((s) => s.status === 'current')?.id ?? steps.find((s) => s.status !== 'done')?.id ?? 'complete',
    completed,
    total,
    progressPercent,
    steps,
  }
}

// --- Rendering ---

const STATUS_MARKER: Record<RouteStepStatus, string> = {
  done: '[x]',
  current: '[>]',
  next: '[ ]',
  pending: '[ ]',
  optional: '[o]',
  blocked: '[!]',
  warning: '[~]',
  skipped: '[-]',
}

export function renderRouteMarkdown(route: ProjectRoute): string {
  const lines: string[] = []
  lines.push('## Project Route\n')
  lines.push(`Route: ${route.type}`)
  lines.push(`Progress: ${route.completed}/${route.total}\n`)

  for (const s of route.steps) {
    lines.push(`- ${STATUS_MARKER[s.status]} ${s.label}`)
  }
  lines.push('')
  return lines.join('\n')
}

export function renderRouteCompact(route: ProjectRoute): string {
  const lines: string[] = []
  lines.push(`Route: ${route.type} · Progress: ${route.completed}/${route.total}\n`)

  const current = route.steps.find((s) => s.status === 'current')
  if (current) {
    const agent = current.agent ? ` — ${current.agent}` : ''
    const skill = current.skill ? ` / ${current.skill}` : ''
    lines.push(`Current:\n- ${current.label}${agent}${skill}\n`)
  }

  const warnings = route.steps.filter((s) => s.status === 'warning')
  if (warnings.length > 0) {
    lines.push('Warnings:')
    for (const w of warnings) {
      lines.push(`- ${w.label}${w.reason ? ` — ${w.reason}` : ''}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
