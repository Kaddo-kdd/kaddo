// WI-089 — deterministic, read-only recommendation of the next planning step for ONE Epic. Shared by CLI,
// MCP and Admin so the three surfaces never disagree (AC-01, AC-10). It encodes Kaddo's progressive
// decomposition — Epic → Initiative → Work Item Candidates → Work Items — WITHOUT making that structure
// mandatory: a project that puts Work Items directly under an Epic is a valid model, not an error (AC-08,
// AC-13). Pure: no LLM, no I/O beyond reading the planning projection, and it never mutates anything
// (AC-11). It is deliberately SEPARATE from completion-readiness evaluation (which answers "can this be
// completed?"); this answers "what should I organize next?".

import { type Epic, type EpicProgress, computeEpicProgress, initiativesInEpic } from './delivery-planning.js'
import type { SecondaryRecommendation } from './next-step.js'

export type EpicScenario =
  | 'completed'              // G — terminal
  | 'active-work'            // E — work in progress or blocked
  | 'new-no-work'            // A — planned, no Initiatives and no Work Items
  | 'direct-work-items'      // F — Work Items directly under the Epic, no Initiative (valid)
  | 'initiative-no-candidates' // B — Initiative(s) but no candidates yet
  | 'candidates-pending'     // C/D — pending Work Item Candidates to review and materialize

export type EpicRecommendation = {
  epicId: string
  scenario: EpicScenario
  recommendationId: string
  /** The single recommended next step, justified by the real state. */
  primary: {
    action: string
    reason: string
    /** The entity the action targets (the Epic, or an Initiative under it). */
    target: string
    /** Canonical surfaces an agent/user can use — never invented operations. */
    command?: string
    mcpAction?: string
    agent?: string
  }
  /** Valid alternative steps that do not replace the primary one (e.g. create a Work Item directly). */
  alternatives: SecondaryRecommendation[]
  /** The canonical state the recommendation is derived from, so a surface can explain WHY. */
  state: {
    status: string
    successCriteria: number
    initiatives: number
    candidates: number
    materializedCandidates: number
    pendingCandidates: number
    workItems: number
    inProgress: number
    blocked: number
    completed: number
  }
}

const TERMINAL = new Set(['completed', 'cancelled'])

export function recommendEpicNextStep(dir: string, epic: Epic): EpicRecommendation {
  const prog: EpicProgress = computeEpicProgress(dir, epic)
  const inis = initiativesInEpic(dir, epic.id)
  const candidates = prog.planning.candidates
  const materialized = prog.planning.materialized
  const pending = Math.max(0, candidates - materialized)
  const inProgress = prog.delivery.byState['in-progress'] ?? 0
  const blocked = prog.delivery.blocked
  const wiTotal = prog.delivery.total

  const state = {
    status: epic.status,
    successCriteria: epic.successCriteria.length,
    initiatives: inis.length,
    candidates,
    materializedCandidates: materialized,
    pendingCandidates: pending,
    workItems: wiTotal,
    inProgress,
    blocked,
    completed: prog.delivery.completed,
  }
  const base = { epicId: epic.id, state }

  // G — terminal: never recommend new work by default; point at evidence/plan.
  if (TERMINAL.has(epic.status.toLowerCase())) {
    return {
      ...base, scenario: 'completed', recommendationId: 'epic-terminal',
      primary: {
        action: `This Epic is ${epic.status}`,
        reason: `The Epic is in a terminal state (${epic.status}). Review its outcome evidence and associated Plan rather than starting new work.`,
        target: epic.id, mcpAction: 'kaddo_get_epic', command: `kaddo epic show ${epic.id}`,
      },
      alternatives: [],
    }
  }

  // E — active work takes priority: keep execution moving and resolve real blockers before reorganizing.
  if (inProgress > 0 || blocked > 0) {
    return {
      ...base, scenario: 'active-work', recommendationId: 'continue-active-work',
      primary: {
        action: 'Continue the Work Items in progress and resolve any blockers',
        reason: `${inProgress} Work Item(s) in progress${blocked > 0 ? ` and ${blocked} blocked by an unfinished dependency` : ''}. Finish active work and unblock dependencies before adding new scope.`,
        target: epic.id, agent: 'work-item-agent', mcpAction: 'kaddo_get_epic_progress',
      },
      alternatives: inis.length === 0 && candidates === 0
        ? [{ id: 'organize-initiative', label: 'Optionally group this work under an Initiative when it adds value', agent: 'initiative-agent', reason: 'Organizing by Initiative is optional and never required.' }]
        : [],
    }
  }

  // Pending candidates — review and materialize the selected ones (C/D). Never auto-materialize.
  if (candidates > 0 && pending > 0) {
    return {
      ...base, scenario: 'candidates-pending', recommendationId: 'review-and-materialize-candidates',
      primary: {
        action: 'Review the pending Work Item Candidates and materialize the selected ones',
        reason: `${pending} of ${candidates} Work Item Candidate(s) are not yet materialized. Review and refine them, then materialize the ones that are ready — with explicit authorization. Do not propose equivalent candidates again.`,
        target: epic.id, agent: 'work-item-agent', mcpAction: 'kaddo_get_epic',
      },
      alternatives: [{ id: 'define-more-candidates', label: 'Define additional candidates if scope is still missing', agent: 'initiative-agent', reason: 'New candidates are proposals only and stay unmaterialized until authorized.' }],
    }
  }

  // A — new, no organized scope: recommend organizing via an Initiative FIRST (initiative-first default).
  if (inis.length === 0 && wiTotal === 0) {
    return {
      ...base, scenario: 'new-no-work', recommendationId: 'create-or-associate-initiative',
      primary: {
        action: 'Create or associate an Initiative',
        reason: 'This Epic has a defined outcome but no organized delivery scope. The recommended next step is to create or associate an Initiative, then define Work Item candidates before materializing implementation work.',
        target: epic.id, agent: 'initiative-agent', command: 'kaddo initiative create', mcpAction: 'kaddo_create_initiative',
      },
      alternatives: [
        { id: 'associate-initiative', label: 'Associate an existing Initiative with this Epic', command: `kaddo epic associate ${epic.id} <initiativeId>`, mcpAction: 'kaddo_associate_initiative', reason: 'Reuse an Initiative that already organizes related work.' },
        { id: 'create-work-item-directly', label: 'Create a Work Item directly under the Epic (valid alternative)', command: 'kaddo create', agent: 'work-item-agent', reason: 'Direct Work Items under an Epic are a valid model; Initiatives are optional.' },
      ],
    }
  }

  // F — direct Work Items under the Epic, no Initiative: a valid model. Continue; Initiative is optional.
  if (inis.length === 0 && wiTotal > 0) {
    return {
      ...base, scenario: 'direct-work-items', recommendationId: 'direct-work-items',
      primary: {
        action: 'Continue delivering the Epic’s Work Items',
        reason: `This Epic organizes work with ${wiTotal} directly associated Work Item(s) and no Initiative — a valid model. Keep delivering them; grouping under an Initiative is an optional improvement, not a requirement.`,
        target: epic.id, agent: 'work-item-agent', mcpAction: 'kaddo_get_epic_progress',
      },
      alternatives: [
        { id: 'organize-initiative', label: 'Optionally organize the work under an Initiative when it adds value', agent: 'initiative-agent', reason: 'Never required; the absence of an Initiative is not an integrity error.' },
      ],
    }
  }

  // B — Initiative(s) exist but no candidates yet: define Work Item Candidates from the Initiative context.
  if (inis.length > 0 && candidates === 0) {
    return {
      ...base, scenario: 'initiative-no-candidates', recommendationId: 'define-candidates',
      primary: {
        action: 'Define Work Item Candidates',
        reason: `${inis.length} Initiative(s) organize this Epic but have no Work Item Candidates yet. Use the Initiative’s outcome, criteria and relations to propose a grounded decomposition — candidates stay unmaterialized until authorized.`,
        target: inis[0].id, agent: 'initiative-agent', mcpAction: 'kaddo_get_initiative',
      },
      alternatives: [
        { id: 'create-work-item-directly', label: 'Create a Work Item directly (valid alternative)', command: 'kaddo create', agent: 'work-item-agent', reason: 'Direct Work Items remain valid even with Initiatives present.' },
      ],
    }
  }

  // Fallback — Initiatives with all candidates materialized but no active delivery: organize more scope.
  return {
    ...base, scenario: 'initiative-no-candidates', recommendationId: 'define-candidates',
    primary: {
      action: 'Define the next Work Item Candidates',
      reason: 'The Epic has Initiatives and no pending candidates or active work. Define the next candidates for the remaining outcome, or continue delivery as appropriate.',
      target: inis[0]?.id ?? epic.id, agent: 'initiative-agent', mcpAction: 'kaddo_get_initiative',
    },
    alternatives: [{ id: 'create-work-item-directly', label: 'Create a Work Item directly (valid alternative)', command: 'kaddo create', agent: 'work-item-agent', reason: 'Direct Work Items remain valid.' }],
  }
}
