// Unified next-step recommendation (VS-073.2).
//
// A single deterministic source of truth for "what should I do next?". context, understand, explain
// and readiness all consume this so a project never gets two contradictory recommendations. Pure and
// read-only: no LLM, no git, no command execution, no knowledge edits. When in doubt it stays
// conservative and never recommends `create --from roadmap` with an empty roadmap.

import { exists, readFile, join, isFile } from '../utils/fs.js'
import { loadConfig, isModule, isCore, systemName } from './config.js'
import { parse as parseYaml } from 'yaml'
import { agentInstallPath, agentGroupOf } from '../agents/groups.js'
import { analyzeKnowledgeArtifact } from './artifact-quality.js'
import { buildOpenQuestionsReport } from './open-questions.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { buildAdapterStatuses, buildCodexAdapterContext } from './codex-adapter.js'
import { buildTechDecisions } from './decisions.js'
import { roadmapStats } from './roadmap.js'
import { type LifecycleState } from './lifecycle.js'

export type RoadmapSignal = 'missing' | 'empty' | 'has-candidates'
export type WorkItemsSignal = 'none' | 'none-ready' | 'ready' | 'in-progress'

/** A parallel, non-primary recommendation (ownership, ADRs, remaining candidates). VS-079. */
export type SecondaryRecommendation = {
  id: string
  label: string
  command?: string
  agent?: string
  skill?: string
  reason: string
}

export type NextStepRecommendation = {
  id: string
  phase: string
  label: string
  command?: string
  agent?: string
  /** Resolved path to the agent prompt file (relative to project root). */
  agentPath?: string
  /** Whether the recommended agent is installed on disk. */
  agentInstalled?: boolean
  /** Command to install the missing agent. */
  installCommand?: string
  skill?: string
  target?: string
  /** Multiple targets when more than one candidate exists (VS-089). */
  targets?: string[]
  reason: string
  instructions?: string[]
  /** MCP tool name the agent can invoke instead of the CLI command (VS-088). */
  mcpAction?: string
  /** MCP tool arguments for a single-target recommendation (VS-089). */
  mcpArgs?: Record<string, string>
  /** Parallel recommendations that don't replace the primary one (VS-079). */
  secondary?: SecondaryRecommendation[]
}

/** A snapshot of the delivery state used to pick a state-aware next step (VS-079). */
export type DeliveryState = {
  phase: string
  draft_work_items: number
  refined_draft_work_items: number
  refined_draft_ids: string[]
  ready_work_items: number
  /** IDs of Work Items in ready state (VS-090). */
  ready_work_item_ids: string[]
  /** IDs of ready WIs that have affected_modules (VS-092). */
  ready_multirepo_wi_ids: string[]
  in_progress_work_items: number
  blocked_work_items: number
  total_work_items: number
  ownership_coverage: string
  remaining_work_item_candidates: number
  decision_candidates: number
  accepted_adrs: number
  adapters_installed: number
}

/** Gather the delivery-state counts once, from the real knowledge base (deterministic). */
export function buildDeliveryState(dir: string): DeliveryState {
  const wis = discoverWorkItems(dir)
  const byState = (s: LifecycleState) => wis.filter((w) => w.lifecycle === s).length
  const total = wis.length
  const withOwnership = wis.filter((w) => w.codeGlobs.length > 0).length
  const td = buildTechDecisions(dir)
  const roadmapPath = join(dir, 'knowledge/delivery/roadmap.md')
  const roadmapMd = exists(roadmapPath) ? safeRead(roadmapPath) : null
  const stats = roadmapStats(roadmapMd, total)
  const adapters = installedAdapters(dir)
  return {
    phase: '',
    draft_work_items: byState('draft'),
    refined_draft_work_items: wis.filter((w) => w.lifecycle === 'draft' && w.rawFrontmatter.refined_by).length,
    refined_draft_ids: wis.filter((w) => w.lifecycle === 'draft' && w.rawFrontmatter.refined_by).map((w) => w.id),
    ready_work_items: byState('ready'),
    ready_work_item_ids: wis.filter((w) => w.lifecycle === 'ready').map((w) => w.id),
    ready_multirepo_wi_ids: wis.filter((w) => w.lifecycle === 'ready' && Array.isArray(w.rawFrontmatter?.affected_modules) && w.rawFrontmatter.affected_modules.length > 0).map((w) => w.id),
    in_progress_work_items: byState('in-progress'),
    blocked_work_items: byState('blocked'),
    total_work_items: total,
    ownership_coverage: `${withOwnership}/${total}`,
    remaining_work_item_candidates: stats.remaining_work_item_candidates,
    decision_candidates: td.candidates,
    accepted_adrs: td.accepted_adrs,
    adapters_installed: adapters.length,
  }
}

function hasRegisteredModules(modulesYmlPath: string): boolean {
  try {
    const parsed = parseYaml(readFile(modulesYmlPath)) as { modules?: unknown[] }
    return Array.isArray(parsed?.modules) && parsed.modules.length > 0
  } catch {
    return false
  }
}

function safeRead(p: string): string | null {
  try {
    return readFile(p)
  } catch {
    return null
  }
}

/** Roadmap candidate signal (bullets/table rows outside an Open Questions section). */
export function roadmapSignal(dir: string): RoadmapSignal {
  const p = join(dir, 'knowledge/delivery/roadmap.md')
  if (!exists(p)) return 'missing'
  let md: string
  try {
    md = readFile(p)
  } catch {
    return 'missing'
  }
  const lines = md.replace(/^---[\s\S]*?---/m, '').split(/\r?\n/)
  let inOpenQuestions = false
  let candidates = 0
  for (const l of lines) {
    if (/^#{1,6}\s/.test(l)) inOpenQuestions = /open questions|preguntas abiertas/i.test(l)
    else if (!inOpenQuestions && /^\s*(?:[-*]\s+|\|)/.test(l)) candidates += 1
  }
  return candidates > 0 ? 'has-candidates' : 'empty'
}

export function workItemsSignal(dir: string): WorkItemsSignal {
  const wis = discoverWorkItems(dir)
  if (wis.length === 0) return 'none'
  if (wis.some((w) => w.lifecycle === 'in-progress')) return 'in-progress'
  if (wis.some((w) => w.lifecycle === 'ready')) return 'ready'
  return 'none-ready'
}

/** Adapters considered installed: injected files, or fully generated by that specific adapter. */
export function installedAdapters(dir: string): string[] {
  return buildAdapterStatuses(dir)
    .filter((s) =>
      s.state === 'injected' ||
      s.state === 'legacy-injected' ||
      (s.state === 'full-generated' && (s.originAdapter === s.id || s.originAdapter === null)),
    )
    .map((s) => s.id)
}

const B = 'knowledge/business/business.md'
const P = 'knowledge/product/product.md'
const CAP = 'knowledge/product/capabilities.md'
const CS = 'knowledge/tech/current-state.md'
const CB = 'knowledge/tech/codebase.md'

/**
 * Resolve the single next step for a project from its real state. The priority ladder is:
 * init → bootstrap → agents → skills → scan → context → understand → refine Business → Product →
 * Tech(current-state) → Tech(codebase) → blocking questions → roadmap → create → adapter → implement.
 */
export function resolveNextStep(dir: string, now: Date = new Date()): NextStepRecommendation {
  const config = loadConfig(dir)
  if (!config) {
    return { id: 'init', phase: 'Setup', label: 'Run `kaddo init` to initialize Kaddo.', command: 'kaddo init', reason: 'Kaddo is not initialized in this project.' }
  }
  const state = config.project.state

  const q = (rel: string) => analyzeKnowledgeArtifact(dir, rel)
  const moduleRepo = isModule(config)
  const coreRepo = isCore(config)
  // VS-093: module-context.md moved to knowledge/tech/module/; support legacy path.
  const MC = exists(join(dir, 'knowledge/tech/module/module-context.md'))
    ? 'knowledge/tech/module/module-context.md'
    : 'knowledge/module/module-context.md'

  // VS-091: module repos skip business/product and agents/skills checks.
  if (moduleRepo) {
    const qMC = q(MC)
    if (qMC === 'missing') {
      return { id: 'init-module-context', phase: 'Setup', label: 'Create `knowledge/tech/module/module-context.md` for this module.', command: 'kaddo init', reason: 'Module context file is missing. Re-run `kaddo init` as a multirepo module.' }
    }

    if ((state === 'pre-ai' || state === 'legacy') && !exists(join(dir, '.kaddo', 'scan.json'))) {
      return { id: 'scan', phase: 'Discovery', label: 'Run `kaddo scan` to capture deterministic signals from the existing code.', command: 'kaddo scan', reason: 'No scan baseline exists for this existing project yet.' }
    }
    if (!exists(join(dir, '.kaddo', 'context-pack.md'))) {
      return { id: 'context', phase: 'Discovery', label: 'Run `kaddo context` to prepare the LLM context pack.', command: 'kaddo context', reason: 'No context pack has been generated yet.' }
    }

    if (qMC !== 'useful') {
      return {
        id: 'refine-module-context', phase: 'Knowledge Refinement',
        label: 'Use module-context-agent to refine `knowledge/module/module-context.md`.',
        agent: 'module-context-agent', skill: 'module-context-refinement', target: MC,
        reason: 'Module context is still a placeholder.',
        instructions: ['Refine the module context with real knowledge about this module.', 'Do not create business.md or product.md.', 'Do not write code.'],
      }
    }

    const qCurrentState = q(CS), qCodebase = q(CB)
    if (qCurrentState !== 'useful') {
      return {
        id: 'refine-current-state', phase: 'Knowledge Refinement',
        label: 'Use architecture-agent to complete `knowledge/tech/current-state.md`.',
        agent: 'architecture-agent', target: CS,
        reason: `${CS} is still a bootstrap placeholder or too thin.`,
        instructions: ['Describe the module\'s local architecture.', 'Do not write code.'],
      }
    }
    if (qCodebase !== 'useful') {
      return {
        id: 'refine-codebase', phase: 'Knowledge Refinement',
        label: 'Use architecture-agent to complete `knowledge/tech/codebase.md`.',
        agent: 'architecture-agent', target: CB,
        reason: `${CB} is still a bootstrap placeholder or too thin.`,
        instructions: ['Map the module\'s local codebase structure.', 'Do not write code.'],
      }
    }

    if (!exists(join(dir, '.kaddo', 'understand.md'))) {
      return { id: 'understand', phase: 'Discovery', label: 'Run `kaddo understand` to summarize the project context.', command: 'kaddo understand', reason: 'No understand handoff has been generated yet.' }
    }

    return { id: 'module-ready', phase: 'Active Delivery', label: 'Module context is complete. Create and manage Work Items from the core repository.', reason: 'This module\'s knowledge is ready. Work Items are created and tracked in the core.' }
  }

  // Non-module (core or single repo) flow.
  const qBusiness = q(B), qProduct = q(P), qCap = q(CAP), qCurrentState = q(CS), qCodebase = q(CB)

  // VS-093: core multirepo repos skip Business/Product baseline requirement.
  if (!coreRepo && (qBusiness === 'missing' || qProduct === 'missing')) {
    return { id: 'bootstrap', phase: 'Setup', label: 'Run `kaddo bootstrap` to create the project knowledge baseline.', command: 'kaddo bootstrap', reason: 'The knowledge baseline is incomplete.' }
  }

  // VS-093: core repos recommend modules discover before agents/skills.
  if (coreRepo) {
    const modulesYmlPath = join(dir, '.kaddo', 'modules.yml')
    if (!exists(modulesYmlPath) || !hasRegisteredModules(modulesYmlPath)) {
      return { id: 'modules-discover', phase: 'Setup', label: 'Run `kaddo modules discover` to find sibling module repositories.', command: 'kaddo modules discover', reason: 'No modules are mapped for this core repository.' }
    }
  }

  const ctx = buildCodexAdapterContext(dir)
  if (!ctx.hasAgents) {
    return { id: 'add-agents', phase: 'Setup', label: 'Run `kaddo add agents` to install the Kaddo agent prompt packs.', command: 'kaddo add agents', reason: 'No Kaddo agents are installed yet.' }
  }
  if (!ctx.hasSkills) {
    return { id: 'add-skills', phase: 'Setup', label: 'Run `kaddo add skills` to install reusable Kaddo skills.', command: 'kaddo add skills', reason: 'No Kaddo skills are installed yet.' }
  }

  if ((state === 'pre-ai' || state === 'legacy') && !exists(join(dir, '.kaddo', 'scan.json'))) {
    return { id: 'scan', phase: 'Discovery', label: 'Run `kaddo scan` to capture deterministic signals from the existing code.', command: 'kaddo scan', reason: 'No scan baseline exists for this existing project yet.' }
  }
  if (!exists(join(dir, '.kaddo', 'context-pack.md'))) {
    return { id: 'context', phase: 'Discovery', label: 'Run `kaddo context` to prepare the LLM context pack.', command: 'kaddo context', reason: 'No context pack has been generated yet.' }
  }

  // Knowledge refinement — keep the layer order Business → Product → Tech.
  // VS-083.3: refinement checks run BEFORE the understand fallback so that actionable
  // recommendations are never masked by "run kaddo understand" — a command that is
  // already being executed when the user is inside `kaddo understand`.
  const discovery = state === 'pre-ai' || state === 'legacy'
  const resolveAgent = (agent: string) => {
    const file = agent.endsWith('.md') ? agent : `${agent}.md`
    const path = agentInstallPath(file)
    const installed = isFile(join(dir, path))
    const group = agentGroupOf(file)
    return { agentPath: path, agentInstalled: installed, installCommand: installed ? undefined : `kaddo add agents --group ${group}` }
  }
  const refine = (id: string, agent: string, target: string, quality: string, verb = 'complete'): NextStepRecommendation => {
    const ar = resolveAgent(agent)
    return {
      id, phase: 'Knowledge Refinement', label: `Use ${agent} to ${verb} \`${target}\`.`, agent, target,
      agentPath: ar.agentPath, agentInstalled: ar.agentInstalled, installCommand: ar.installCommand,
      reason: `${target} is ${quality === 'missing' ? 'missing' : 'still a bootstrap placeholder or too thin'}.`,
      instructions: [
        'The baseline file exists but does not yet hold real, project-specific knowledge.',
        `Use the ${agent} to replace the placeholders with real knowledge.`,
        'Do not write code.',
      ],
    }
  }
  if (qBusiness !== 'useful') return refine('refine-business', 'business-agent', B, qBusiness)
  if (qProduct !== 'useful' || qCap !== 'useful') {
    // For existing projects, capabilities is a *discovery* of what the system already does (VS-074).
    if (qCap !== 'useful') {
      return refine('refine-product', 'capability-agent', CAP, qCap, discovery ? 'discover and document existing system capabilities grouped by functional domains in' : 'complete')
    }
    return refine('refine-product', 'capability-agent', P, qProduct)
  }
  if (qCurrentState !== 'useful') return refine('refine-current-state', 'architecture-agent', CS, qCurrentState)
  if (qCodebase !== 'useful') {
    const agent = ctx.agents.includes('codebase-agent') ? 'codebase-agent' : 'architecture-agent'
    return refine('refine-codebase', agent, CB, qCodebase)
  }

  // VS-083.3: understand fallback — only when all knowledge layers are useful and no refinement needed.
  if (!exists(join(dir, '.kaddo', 'understand.md'))) {
    return { id: 'understand', phase: 'Discovery', label: 'Run `kaddo understand` to summarize the project context.', command: 'kaddo understand', reason: 'No understand handoff has been generated yet.' }
  }

  // Foundational knowledge is useful — now decisions, roadmap and delivery.
  const oq = buildOpenQuestionsReport(dir, now)
  if (oq.summary.blocking_open > 0) {
    return { id: 'questions', phase: 'Knowledge Refinement', label: 'Run `kaddo questions` to see source locations and resolution guidance, then resolve, assume or defer the blocking open questions.', command: 'kaddo questions', reason: `${oq.summary.blocking_open} blocking open question(s) remain.` }
  }

  // VS-086: build delivery state early so draft Work Items can take priority over empty roadmap.
  const st = buildDeliveryState(dir)
  const secondary = buildSecondaryRecommendations(st)

  const roadmap = roadmapSignal(dir)

  // VS-090: ready Work Items beat everything except blocked/in-progress. Check early.
  const adapters = st.adapters_installed
  if (st.ready_work_items > 0) {
    const ids = st.ready_work_item_ids
    const single = ids.length === 1
    const sec = [...secondary]
    if (roadmap !== 'has-candidates' && st.remaining_work_item_candidates === 0) {
      sec.push({
        id: 'roadmap',
        label: 'Roadmap has no candidates. Consider running `kaddo roadmap` after handling ready Work Items.',
        command: 'kaddo roadmap',
        agent: 'roadmap-agent',
        reason: 'The roadmap has no candidates yet, but ready Work Items exist.',
      })
    }
    if (st.ready_multirepo_wi_ids.length > 0) {
      sec.push({
        id: 'validate-work-item-modules',
        label: 'Validate affected modules for multirepo Work Items before implementation.',
        reason: `${st.ready_multirepo_wi_ids.length} ready Work Item(s) reference affected_modules.`,
      })
    }
    if (adapters === 0) {
      return {
        id: 'prepare-implementation',
        phase: 'Active Delivery',
        label: single
          ? `Prepare implementation for ${ids[0]}.`
          : 'Prepare implementation for ready Work Items.',
        command: 'kaddo adapters list',
        agent: 'implementation-agent',
        skill: 'implementation-planning',
        ...(single ? { target: ids[0] } : { targets: ids }),
        reason: single
          ? `${ids[0]} is ready for implementation but no adapter is installed.`
          : `There are ${ids.length} ready Work Items awaiting implementation but no adapter is installed.`,
        ...(sec.length ? { secondary: sec } : {}),
      }
    }
    return {
      id: 'implement-work-item',
      phase: 'Active Delivery',
      label: single
        ? `Use implementation-agent to implement ${ids[0]}.`
        : 'Use implementation-agent to implement ready Work Items.',
      agent: 'implementation-agent',
      skill: 'implementation-planning',
      ...(single ? { target: ids[0] } : { targets: ids }),
      reason: single
        ? `${ids[0]} is ready for implementation.`
        : `There are ${ids.length} ready Work Items awaiting implementation.`,
      ...(sec.length ? { secondary: sec } : {}),
    }
  }

  // In-progress Work Items — keep knowledge in sync.
  if (st.in_progress_work_items > 0) {
    return {
      id: 'guard',
      phase: 'Active Delivery',
      label: 'Run `kaddo guard` and update affected knowledge after significant changes.',
      command: 'kaddo guard',
      reason: `${st.in_progress_work_items} Work Item(s) are in progress.`,
      ...(secondary.length ? { secondary } : {}),
    }
  }

  // Refined draft Work Items — review before refining unrefined ones.
  if (st.refined_draft_work_items > 0) {
    const ids = st.refined_draft_ids
    const single = ids.length === 1
    return {
      id: 'review-work-item',
      phase: 'Active Delivery',
      label: single
        ? `Review ${ids[0]} and mark it ready for implementation.`
        : 'Review refined draft Work Items and mark one ready for implementation.',
      command: single ? `kaddo ready ${ids[0]}` : 'kaddo ready <WI-ID>',
      mcpAction: 'kaddo_mark_work_item_ready',
      ...(single ? { target: ids[0], mcpArgs: { id: ids[0] } } : { targets: ids }),
      reason: single
        ? `${ids[0]} is a refined draft Work Item awaiting human review.`
        : `There are ${ids.length} refined draft Work Items awaiting human review.`,
      ...(secondary.length ? { secondary } : {}),
    }
  }

  // Draft Work Items — refine before creating more.
  if (st.draft_work_items > 0) {
    return {
      id: 'refine-work-item',
      phase: 'Active Delivery',
      label: 'Refine the existing draft Work Item with the work-item-agent.',
      agent: 'work-item-agent',
      skill: 'work-item-refinement',
      reason: `There ${st.draft_work_items === 1 ? 'is' : 'are'} ${st.draft_work_items} draft Work Item${st.draft_work_items === 1 ? '' : 's'}. Refine before defining roadmap candidates.`,
      ...(secondary.length ? { secondary } : {}),
    }
  }

  // Blocked Work Items — resolve the blocker.
  if (st.blocked_work_items > 0) {
    return {
      id: 'resolve-blocker',
      phase: 'Active Delivery',
      label: 'Resolve the blocker on the blocked Work Item with the work-item-agent.',
      agent: 'work-item-agent',
      reason: `${st.blocked_work_items} Work Item(s) are blocked.`,
      ...(secondary.length ? { secondary } : {}),
    }
  }

  // No active Work Items — roadmap and creation.
  if (roadmap !== 'has-candidates') {
    return { id: 'roadmap', phase: 'Planning', label: 'Use roadmap-agent to define roadmap candidates (`kaddo roadmap`).', command: 'kaddo roadmap', agent: 'roadmap-agent', target: 'knowledge/delivery/roadmap.md', reason: 'The roadmap has no candidates yet.' }
  }

  if (st.total_work_items === 0) {
    return {
      id: 'create-work-item',
      phase: 'Delivery Preparation',
      label: 'Run `kaddo create --from roadmap` to materialize the first Work Item.',
      command: 'kaddo create --from roadmap',
      reason: 'The roadmap has candidates but no Work Item exists yet.',
      ...(secondary.length ? { secondary } : {}),
    }
  }

  // Only completed/archived work remains — materialize remaining candidates or plan the next initiative.
  if (st.remaining_work_item_candidates > 0) {
    return {
      id: 'materialize-more-work-items',
      phase: 'Maintenance',
      label: `Materialize the remaining ${st.remaining_work_item_candidates} Work Item candidate(s) with \`kaddo create --from roadmap\`.`,
      command: 'kaddo create --from roadmap',
      reason: 'No active Work Items remain; roadmap candidates are still pending.',
      ...(secondary.length ? { secondary } : {}),
    }
  }
  return {
    id: 'plan-next',
    phase: 'Maintenance',
    label: 'Use the roadmap-agent to plan the next initiative.',
    agent: 'roadmap-agent',
    reason: 'No active Work Items and no remaining roadmap candidates.',
  }
}

/** Ownership, ADR and remaining-candidate recommendations that run parallel to the primary (VS-079). */
export function buildSecondaryRecommendations(st: DeliveryState): SecondaryRecommendation[] {
  const out: SecondaryRecommendation[] = []
  const [withOwnership] = st.ownership_coverage.split('/').map(Number)
  if (st.total_work_items > 0 && withOwnership < st.total_work_items) {
    out.push({
      id: 'suggest-ownership',
      label: 'Run `kaddo owners suggest` for Work Items without code ownership.',
      command: 'kaddo owners suggest',
      reason: `Ownership coverage is ${st.ownership_coverage}.`,
    })
  }
  if (st.total_work_items > 0 && st.decision_candidates > 0 && st.accepted_adrs === 0) {
    out.push({
      id: 'materialize-adrs',
      label: 'Use the adr-writing skill (`kaddo adr`) to materialize decision candidates into ADRs before implementing related technical Work Items.',
      command: 'kaddo adr',
      skill: 'adr-writing',
      reason: `There are ${st.decision_candidates} technical decision candidate(s) and ${st.accepted_adrs} accepted ADR(s).`,
    })
  }
  // Remaining candidates are only a *secondary* suggestion once at least one Work Item exists (Rule 2).
  if (st.total_work_items > 0 && st.remaining_work_item_candidates > 0) {
    out.push({
      id: 'materialize-more-work-items',
      label: `Later, materialize the remaining ${st.remaining_work_item_candidates} Work Item candidate(s) with \`kaddo create --from roadmap\`.`,
      command: 'kaddo create --from roadmap',
      reason: `There are ${st.remaining_work_item_candidates} remaining Work Item candidate(s).`,
    })
  }
  return out
}
