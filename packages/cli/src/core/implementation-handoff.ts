// Implementation Handoff — deterministic Core surface (VS-110).
//
// Builds a safe, agent-agnostic handoff for a ready Work Item that includes context assembly
// guidance and design deliberation prompts. Follows the same pattern as buildRefinementHandoff()
// in work-item-refinement.ts. No LLM, no git, never writes/decides.

import { loadConfig } from './config.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { WorkItemNotFoundError } from './work-items.js'
import { lifecycleStateOf, type LifecycleState } from './lifecycle.js'
import { getSystemMapProjection } from './system-map.js'
import { buildTechDecisions, hasUnmaterializedDecisions } from './decisions.js'
import { getLegacyKnowledgeSummary } from './legacy-knowledge.js'

// --- Types -------------------------------------------------------------------

export type ImplementationHandoff = {
  workItemId: string
  title: string
  projectName: string
  lifecycle: LifecycleState
  affectedModules: string[]
  domains: string[]
  scopeConfidence: { level: string; reasons: string[] } | null
  hasUnmaterializedDecisions: boolean
  recommendedAgent: string
  recommendedSkill: string
  /** Copyable, agent-agnostic instructions. Contains no secrets, paths or source code. */
  text: string
}

export class WorkItemNotReadyError extends Error {
  constructor(
    public workItemId: string,
    public actualState: LifecycleState,
  ) {
    super(`Work Item "${workItemId}" must be in "ready" state to produce an Implementation Handoff, but is "${actualState}".`)
    this.name = 'WorkItemNotReadyError'
  }
}

// --- Constants ---------------------------------------------------------------

const RECOMMENDED_AGENT = 'implementation-agent'
const RECOMMENDED_SKILL = 'implementation-planning'

// --- Builder -----------------------------------------------------------------

/**
 * Build the handoff a human or agent uses to begin implementation of a ready Work Item. It
 * assembles context guidance, design deliberation prompts, and implementation instructions.
 * It never includes secrets, absolute paths or source code.
 */
export function buildImplementationHandoff(dir: string, workItemId: string): ImplementationHandoff {
  const artifacts = discoverWorkItems(dir)
  const match = artifacts.find((a) => (a.id || a.title) === workItemId)
  if (!match) throw new WorkItemNotFoundError(workItemId)

  const lifecycle = lifecycleStateOf({ status: match.status, filePath: match.filePath })
  if (lifecycle !== 'ready') throw new WorkItemNotReadyError(workItemId, lifecycle)

  const config = loadConfig(dir)
  const projectName = config?.project.name ?? 'this project'
  const mappedModules = loadMappedModules(dir).map((m) => m.id)
  const multirepo = mappedModules.length > 0
  const techDecisions = buildTechDecisions(dir)
  const unmaterialized = hasUnmaterializedDecisions(techDecisions)

  const wiId = match.id || match.title
  const wiTitle = match.title || match.id
  const affectedModules = match.affectedModules
  const domains = match.domains
  const scopeConfidence = match.scopeConfidence

  const lines: string[] = [
    `Implement Work Item ${wiId} — "${wiTitle}" — in project "${projectName}" using Kaddo.`,
    '',
    `Use the canonical ${RECOMMENDED_AGENT} and the ${RECOMMENDED_SKILL} skill (via Kaddo MCP or skills),`,
    'with access to this repository.',
    '',
    '--- Context Assembly ---',
    '',
    'Before planning, assemble context proportionally from these sources:',
    '',
    '1. Work Item: outcome, acceptance criteria, constraints, out-of-scope, affected modules, domains.',
    '2. Knowledge: business, product, tech and delivery knowledge relevant to the Work Item domains.',
    '3. System Context: topology, module dependencies, system graph when available.',
    '4. Repository Context: existing patterns, file structure, test conventions in affected modules.',
    '5. Related Work Items: dependencies (depends_on), completed related Work Items for precedent.',
    '',
    'Assemble proportionally: a single-module bugfix needs the affected module and its tests.',
    'A cross-cutting feature needs topology, multiple modules, and business context.',
    '',
    '--- Design Deliberation ---',
    '',
    'Before writing code, document:',
    '',
    '- Technical Approach: how this will be implemented — patterns, modules, layers involved.',
    '- Rationale: why this approach — reference existing patterns, constraints, or WI requirements.',
    '- Alternatives Considered: when the change is non-trivial, document alternative approaches.',
    '- Trade-offs: when alternatives exist, state what is gained and lost with the chosen approach.',
    '',
    'For trivial or obvious changes, Alternatives and Trade-offs may be omitted with a note explaining why.',
  ]

  if (unmaterialized) {
    lines.push(
      '',
      '--- ADR Recommendation ---',
      '',
      'This project has unmaterialized decision candidates. When the implementation involves an',
      'architecturally significant decision, use the adr-writing skill to formalize it as an ADR',
      'before implementing. Check knowledge/tech/discovery/decision-candidates.md for candidates.',
    )
  }

  if (multirepo) {
    lines.push(
      '',
      `This is a multirepo project. Evaluate the scope across all relevant mapped modules (${mappedModules.join(', ')})`,
      'before finalizing the implementation plan.',
    )
  }

  const topology = getSystemMapProjection(dir).metadata.topologyStatus
  if (topology !== 'unavailable') {
    lines.push(
      '',
      `The semantic system Graph is ${topology}. When semantic system topology is available:`,
      '1. identify the relevant system entry points;',
      '2. query the Kaddo Graph (search / neighbors / paths) for connected entities;',
      '3. treat Graph results as impact candidates, not confirmed scope;',
      '4. inspect the actual implementation in the repository for each candidate.',
    )
  }

  const legacy = getLegacyKnowledgeSummary(dir)
  if (legacy.available) {
    lines.push(
      '',
      '--- Legacy Context ---',
      '',
      'This project has legacy analysis knowledge. Before implementing, consult the relevant',
      'legacy findings for the areas this Work Item will modify:',
    )
    if (legacy.risks.exists) {
      lines.push(
        `- Risks (${legacy.risks.identifiers.length} findings): \`${legacy.risks.path}\``,
      )
    }
    if (legacy.unknowns.exists) {
      lines.push(
        `- Unknowns (${legacy.unknowns.identifiers.length} findings): \`${legacy.unknowns.path}\``,
      )
    }
    if (legacy.candidates.exists) {
      lines.push(
        `- Modernization candidates (${legacy.candidates.identifiers.length} findings): \`${legacy.candidates.path}\``,
      )
    }
    lines.push(
      '',
      'Reference relevant findings by their stable identifiers (RISK-xxx, UNK-xxx, MOD-xxx).',
      'Highlight risks that intersect with the areas to be modified in the Design Deliberation.',
      'Do not copy all legacy knowledge — assemble proportionally to scope.',
    )
  }

  lines.push(
    '',
    '--- Implementation Plan ---',
    '',
    'Produce a plan with:',
    '- Context Summary: what you assembled and consulted.',
    '- Design Deliberation: Technical Approach, Rationale, and when relevant, Alternatives and Trade-offs.',
    '- Affected Areas: modules, files, surfaces impacted.',
    '- Implementation Steps: numbered steps with expected files per step.',
    '- Validation Plan: how to verify — test commands, manual steps, AC verification.',
    '- Stop Criteria: when to pause and ask — scope expansion, contradictions, missing knowledge.',
    '',
    'Do not start coding without explicit human confirmation of this plan.',
  )

  return {
    workItemId: wiId,
    title: wiTitle,
    projectName,
    lifecycle,
    affectedModules,
    domains,
    scopeConfidence,
    hasUnmaterializedDecisions: unmaterialized,
    recommendedAgent: RECOMMENDED_AGENT,
    recommendedSkill: RECOMMENDED_SKILL,
    text: lines.join('\n'),
  }
}
