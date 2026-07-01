// State-aware phase & next-step recommendations (VS-047).
//
// Kaddo recommends the next step from the REAL state of the knowledge base (layers, roadmap, Work
// Items, ownership) — not only the configured project.state. Deterministic; no LLM.

import type { LayerName, LayerStatus, LayerMaturity } from './knowledge-discovery.js'
import { LIFECYCLE_STATES, type LifecycleState } from './lifecycle.js'

export type DeliveryPhase =
  | 'Discovery'
  | 'Knowledge Refinement'
  | 'Planning'
  | 'Delivery Preparation'
  | 'Active Delivery'
  | 'Maintenance'

/** Minimal structural input so both explain and context can reuse this without coupling. */
export type PhaseInput = {
  layers: LayerStatus[]
  roadmap: { present: boolean; candidates: number; materialized: number; remaining: number }
  workItems: {
    total: number
    byState: Record<LifecycleState, number>
    items: { id: string; title: string; lifecycle: LifecycleState }[]
  }
  ownership: { workItemsTotal: number; workItemsWithOwnership: number; workItemsMissingOwnership: number }
}

export type PhaseAssessment = {
  phase: DeliveryPhase
  reasons: string[]
  recommendedAgents: string[]
  nextStep: string
  /** Phase-specific instructions for the LLM reading the context pack (VS-052). */
  llmInstructions: string[]
}

function layer(layers: LayerStatus[], name: LayerName): LayerMaturity {
  return layers.find((l) => l.layer === name)?.status ?? 'Missing'
}

const NOT_READY_LAYER: LayerMaturity[] = ['Missing', 'Placeholder', 'Weak']

function baseComplete(layers: LayerStatus[]): boolean {
  return (
    layer(layers, 'Business') !== 'Missing' &&
    layer(layers, 'Product') !== 'Missing' &&
    layer(layers, 'Tech') !== 'Missing'
  )
}

/** Base knowledge exists AND holds real content (not still bootstrap placeholders / too thin). */
function baseUseful(layers: LayerStatus[]): boolean {
  return (['Business', 'Product', 'Tech'] as LayerName[]).every((n) => !NOT_READY_LAYER.includes(layer(layers, n)))
}

/** Roadmap has at least one candidate to materialize. */
function roadmapHasCandidates(roadmap: PhaseInput['roadmap']): boolean {
  return roadmap.candidates > 0 || roadmap.remaining > 0
}

/** Determine the real delivery phase from knowledge state. */
export function determinePhase(input: PhaseInput): DeliveryPhase {
  const { roadmap, workItems } = input
  const active =
    workItems.byState.draft +
    workItems.byState.ready +
    workItems.byState['in-progress'] +
    workItems.byState.blocked

  if (!baseComplete(input.layers)) return 'Discovery'
  // Files exist but are still placeholders/weak — refine knowledge before planning/delivery (VS-073.1).
  if (!baseUseful(input.layers)) return 'Knowledge Refinement'
  if (!roadmap.present) return 'Planning'
  // A roadmap with no candidates and no Work Items is still planning — never recommend `create`.
  if (!roadmapHasCandidates(roadmap) && workItems.total === 0) return 'Planning'
  if (workItems.total === 0) return 'Delivery Preparation'
  if (active > 0) return 'Active Delivery'
  return 'Maintenance'
}

function ownershipPct(o: PhaseInput['ownership']): number {
  if (o.workItemsTotal === 0) return 100
  return Math.round((o.workItemsWithOwnership / o.workItemsTotal) * 100)
}

function buildReasons(input: PhaseInput): string[] {
  const reasons: string[] = []
  reasons.push(input.roadmap.present ? 'Roadmap available' : 'No roadmap yet')
  if (input.roadmap.present) {
    reasons.push(`${input.roadmap.materialized} materialized work item(s)`)
    if (input.roadmap.remaining > 0) reasons.push(`${input.roadmap.remaining} roadmap candidate(s) remaining`)
  }
  const active = LIFECYCLE_STATES.filter((s) => input.workItems.byState[s] > 0 && s !== 'completed' && s !== 'archived')
  if (active.length > 0) {
    reasons.push(active.map((s) => `${s}: ${input.workItems.byState[s]}`).join(', '))
  }
  if (input.workItems.total > 0) reasons.push(`Ownership coverage ${ownershipPct(input.ownership)}%`)
  return reasons
}

function firstMissingLayerAgent(layers: LayerStatus[]): { agent: string; step: string } {
  if (layer(layers, 'Business') === 'Missing')
    return { agent: 'business-agent', step: 'Use business-agent to create knowledge/business/business.md' }
  if (layer(layers, 'Product') === 'Missing')
    return { agent: 'capability-agent', step: 'Use capability-agent to create knowledge/product/capabilities.md' }
  return { agent: 'architecture-agent', step: 'Use architecture-agent to create knowledge/tech/current-state.md' }
}

/** First base layer that exists but is still a placeholder/weak — recommend the agent to complete it. */
function firstUnrefinedLayerAgent(layers: LayerStatus[]): { agent: string; step: string } {
  const isThin = (n: LayerName) => NOT_READY_LAYER.includes(layer(layers, n))
  if (isThin('Business'))
    return { agent: 'business-agent', step: 'Use business-agent to complete knowledge/business/business.md' }
  if (isThin('Product'))
    return { agent: 'capability-agent', step: 'Use capability-agent to complete knowledge/product/capabilities.md' }
  return { agent: 'architecture-agent', step: 'Use architecture-agent to complete knowledge/tech/current-state.md' }
}

/**
 * Recommend the next agent(s) and a concrete next step from the real knowledge state.
 */
export function assessPhase(input: PhaseInput): PhaseAssessment {
  const phase = determinePhase(input)
  const reasons = buildReasons(input)
  const bs = input.workItems.byState
  const items = input.workItems.items
  const firstOf = (s: LifecycleState) => items.find((i) => i.lifecycle === s)

  let recommendedAgents: string[] = []
  let nextStep = ''
  let llmInstructions: string[] = []

  switch (phase) {
    case 'Discovery': {
      const m = firstMissingLayerAgent(input.layers)
      recommendedAgents = [m.agent]
      nextStep = m.step
      llmInstructions = [`Use the ${m.agent} to fill the missing base knowledge.`, 'Do not write code.']
      break
    }
    case 'Knowledge Refinement': {
      const m = firstUnrefinedLayerAgent(input.layers)
      recommendedAgents = [m.agent]
      nextStep = m.step
      llmInstructions = [
        'The baseline files exist but still look like bootstrap placeholders.',
        `Use the ${m.agent} to replace the placeholders with real, project-specific knowledge.`,
        'Do not write code.',
      ]
      break
    }
    case 'Planning': {
      recommendedAgents = ['roadmap-agent']
      nextStep = 'Use roadmap-agent to create knowledge/delivery/roadmap.md'
      llmInstructions = ['Use the roadmap-agent.', 'Do not write code.', 'Generate roadmap candidates.']
      break
    }
    case 'Delivery Preparation': {
      recommendedAgents = ['kaddo create --from roadmap', 'work-item-agent']
      const n = input.roadmap.remaining || input.roadmap.candidates
      nextStep = `Run \`kaddo create --from roadmap\`${n ? ` (${n} candidate(s))` : ''}, then refine with work-item-agent`
      llmInstructions = [
        'Materialize roadmap candidates with `kaddo create --from roadmap`.',
        'Use the work-item-agent to refine them.',
        'Do not implement yet.',
      ]
      break
    }
    case 'Active Delivery': {
      if (bs.ready > 0) {
        const wi = firstOf('ready')
        recommendedAgents = ['implementation-agent']
        nextStep = wi ? `Start ${wi.id} — ${wi.title} (ready → in-progress)` : 'Start a ready Work Item'
        llmInstructions = [
          'Use the implementation-agent.',
          'Suggest a branch name only.',
          'Do not run git commands.',
        ]
      } else if (bs['in-progress'] > 0) {
        const wi = firstOf('in-progress')
        recommendedAgents = ['implementation-agent', 'kaddo scan', 'kaddo owners suggest', 'kaddo guard']
        nextStep = wi
          ? `Continue ${wi.id} — ${wi.title}; then run kaddo scan, owners suggest, guard`
          : 'Continue the in-progress Work Item; then scan, owners suggest, guard'
        llmInstructions = [
          'Continue the in-progress Work Item with the implementation-agent.',
          'After changes, run `kaddo scan`, `kaddo owners suggest` and `kaddo guard`.',
          'Do not commit, push or merge without explicit human confirmation.',
        ]
      } else if (bs.draft > 0) {
        const wi = firstOf('draft')
        recommendedAgents = ['work-item-agent']
        nextStep = wi ? `Refine ${wi.id} from draft to ready` : 'Refine a draft Work Item to ready'
        llmInstructions = [
          'Refine draft Work Items to ready.',
          'Use the work-item-agent.',
          'Do not implement unless the user explicitly asks.',
        ]
      } else if (bs.blocked > 0) {
        const wi = firstOf('blocked')
        recommendedAgents = ['work-item-agent']
        nextStep = wi ? `Resolve the blocker on ${wi.id} — ${wi.title}` : 'Resolve the blockers on active work'
        llmInstructions = [
          'Resolve the blockers with the work-item-agent.',
          'Do not implement blocked work.',
        ]
      }
      // Ownership gap is a parallel recommendation.
      if (input.ownership.workItemsMissingOwnership > 0) {
        recommendedAgents.push('kaddo owners suggest')
        llmInstructions.push('Ownership is incomplete — propose `code:` globs (run `kaddo owners suggest`).')
      }
      break
    }
    case 'Maintenance': {
      if (input.roadmap.remaining > 0) {
        recommendedAgents = ['kaddo create --from roadmap', 'work-item-agent']
        nextStep = `Materialize ${input.roadmap.remaining} remaining roadmap candidate(s)`
        llmInstructions = ['Materialize the remaining roadmap candidates.', 'Do not implement yet.']
      } else {
        recommendedAgents = ['roadmap-agent']
        nextStep = 'No active work — use roadmap-agent to plan the next initiative'
        llmInstructions = ['No active work.', 'Use the roadmap-agent to plan the next initiative.']
      }
      break
    }
  }

  return { phase, reasons, recommendedAgents, nextStep, llmInstructions }
}
