// Work Item refinement handoff — deterministic Core surface (VS-099.1).
//
// Kaddo Admin does NOT execute LLMs. Refinement happens where the real software context lives:
// next to the repository, driven by a Kaddo-enabled agent (work-item-agent + work-item-refinement
// skill via MCP/Skills). Core's job here is only to (a) expose the capture-question definition so
// Admin and the CLI ask the same questions, and (b) build a safe, agent-agnostic handoff a human
// can copy to that agent. No provider, no model, no prompt execution, no secrets.

import {
  getLevel,
  getLevelForType,
  WORK_ITEM_TYPES,
  type Question,
} from './knowledge-levels.js'
import { loadConfig } from './config.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { getWorkItem, type RefinementStatus } from './work-items.js'
import { getSystemMapProjection } from './system-map.js'
import { hasLegacyKnowledge } from './legacy-knowledge.js'

// --- Capture parity ----------------------------------------------------------

export type CaptureQuestion = { id: string; prompt: string; placeholder: string; field: string; required: boolean }
export type WorkItemCaptureDefinition = {
  types: { value: string; label: string }[]
  /** Capture questions per Work Item type (resolved from its knowledge level). */
  questions: Record<string, CaptureQuestion[]>
}

function toCapture(q: Question): CaptureQuestion {
  return { id: q.id, prompt: q.prompt, placeholder: q.placeholder, field: q.frontMatterField, required: q.required }
}

/** The capture questions the CLI asks — so Admin renders exactly the same, not a rival questionnaire. */
export function getWorkItemCaptureDefinition(): WorkItemCaptureDefinition {
  const questions: Record<string, CaptureQuestion[]> = {}
  for (const type of WORK_ITEM_TYPES) {
    questions[type] = getLevel(getLevelForType(type)).questions.map(toCapture)
  }
  return {
    types: WORK_ITEM_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
    questions,
  }
}

// --- Refinement handoff ------------------------------------------------------

export type RefinementHandoff = {
  workItemId: string
  title: string
  projectName: string
  refinement: RefinementStatus
  recommendedAgent: string
  recommendedSkill: string
  /** Copyable, agent-agnostic instructions. Contains no secrets, paths or source code. */
  text: string
}

const RECOMMENDED_AGENT = 'work-item-agent'
const RECOMMENDED_SKILL = 'work-item-refinement'

/**
 * Build the handoff a human copies into a Kaddo-enabled agent that has repository access. It
 * identifies the Work Item, recommends the canonical Kaddo assets, and asks the agent to inspect
 * the real implementation before defining scope. It never includes secrets, absolute paths or code.
 */
export function buildRefinementHandoff(dir: string, workItemId: string): RefinementHandoff {
  const wi = getWorkItem(dir, workItemId) // throws WorkItemNotFoundError if unknown
  const config = loadConfig(dir)
  const projectName = config?.project.name ?? 'this project'
  const mappedModules = loadMappedModules(dir).map((m) => m.id)
  const multirepo = mappedModules.length > 0

  const lines: string[] = [
    `Refine Work Item ${wi.id} — "${wi.title}" — in project "${projectName}" using Kaddo.`,
    '',
    `Use the canonical ${RECOMMENDED_AGENT} and the ${RECOMMENDED_SKILL} skill (via Kaddo MCP or skills),`,
    'with access to this repository.',
    '',
    'Inspect the actual implementation and the relevant mapped modules before defining the final scope —',
    'do not guess affected modules from the Work Item title. Read the current behavior in the code first,',
    'then classify.',
  ]
  if (multirepo) {
    lines.push(
      '',
      `This is a multirepo project. Evaluate the scope across all relevant mapped modules (${mappedModules.join(', ')})`,
      'before finalizing affected_modules and module_coverage.',
    )
  }

  // Graph-assisted impact guidance (VS-101 / VS-101.1).
  const topology = getSystemMapProjection(dir).metadata.topologyStatus
  if (topology !== 'unavailable') {
    lines.push(
      '',
      `The semantic system Graph is ${topology}. When semantic system topology is available:`,
      '1. identify the relevant system entry points;',
      '2. query the Kaddo Graph (search / neighbors / paths) for connected entities;',
      '3. treat Graph results as IMPACT CANDIDATES, not confirmed scope;',
      '4. inspect the actual implementation in the repository for each relevant candidate;',
      '5. classify each candidate as affected, reviewed-not-affected or unknown;',
      '6. preserve the evidence and reasons behind each classification.',
      '',
      'A missing Graph relationship does not mean no impact, especially when Graph coverage is partial —',
      'keep inspecting the repository beyond the Graph candidates when the task requires it.',
    )
  } else {
    lines.push(
      '',
      'The semantic system Graph is unavailable. Continue repository-driven refinement normally, using the',
      'repository, Knowledge and mapped modules — the Graph is enrichment, not a prerequisite.',
    )
  }

  if (hasLegacyKnowledge(dir)) {
    lines.push(
      '',
      'This is a legacy project with existing legacy analysis. When refining, consult:',
      '- `knowledge/legacy/risks.md` — known risks (RISK-xxx identifiers).',
      '- `knowledge/legacy/unknowns.md` — known unknowns (UNK-xxx identifiers).',
      '- `knowledge/legacy/modernization-candidates.md` — modernization candidates (MOD-xxx identifiers).',
      '',
      'Reference only the findings relevant to this Work Item\'s scope — do not copy all legacy',
      'knowledge into the Work Item. Add `legacy_risks` and `legacy_unknowns` to the front matter',
      'when applicable, using the stable identifiers (e.g. `legacy_risks: [RISK-001, RISK-003]`).',
    )
  }

  lines.push(
    '',
    `Update the canonical Work Item ${wi.id} with:`,
    '- current and target behavior;',
    '- the end-to-end flow (journey);',
    '- affected modules;',
    '- affected system entities (affected_system_entities) and reviewed_system_entities;',
    '- module coverage;',
    '- impact analysis across the relevant surfaces;',
    '- scope confidence and open unknowns;',
    '- acceptance criteria;',
    '- relevant Knowledge / ADR relationships.',
    '',
    'Do not implement the Work Item. Do not run mutating Git operations.',
  )

  return {
    workItemId: wi.id,
    title: wi.title,
    projectName,
    refinement: wi.refinement,
    recommendedAgent: RECOMMENDED_AGENT,
    recommendedSkill: RECOMMENDED_SKILL,
    text: lines.join('\n'),
  }
}
