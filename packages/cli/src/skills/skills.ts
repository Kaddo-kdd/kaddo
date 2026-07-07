// Reusable Skills layer (VS-059).
//
// A skill is a reusable, versionable capability definition: it does not decide WHAT to do (that is
// the agent's job) — it defines HOW to do one thing well. Agents orchestrate; skills standardize.
// Skills never execute anything: they are instructions, not tools.

import { KADDO_VERSION } from '../core/version.js'

export type SkillGroup = 'delivery' | 'tech' | 'integration'

export type SkillDef = {
  id: string
  title: string
  group: SkillGroup
  appliesTo: string[]
  content: string
}

function skill(
  id: string,
  title: string,
  group: SkillGroup,
  appliesTo: string[],
  body: string
): SkillDef {
  const frontMatter = [
    '---',
    'type: skill',
    `id: ${id}`,
    `name: ${id}`,
    `title: ${title}`,
    `version: ${KADDO_VERSION}`,
    `group: ${group}`,
    'applies_to:',
    ...appliesTo.map((a) => `  - ${a}`),
    '---',
    '',
  ].join('\n')
  return { id, title, group, appliesTo, content: frontMatter + body.trimStart() }
}

const ADR_WRITING = skill(
  'adr-writing',
  'ADR Writing Skill',
  'tech',
  ['decision-agent', 'architecture-agent', 'implementation-agent'],
  `
# ADR Writing Skill

## Purpose

Standardize how Architecture Decision Records are written so every decision is captured the same
way and stays auditable.

## When to use

When a real, consequential technical decision is being made or recognized — and only then.

## Inputs

The context pack, the relevant Work Item or architecture note, and the decision being made.

## Output

A single ADR (saved under \`knowledge/tech/decisions/\`) with front matter and the standard sections:
context, options considered, the decision, consequences, related capabilities and related Work Items.
Status is one of \`draft\`, \`accepted\`, \`superseded\`, \`deprecated\`.

## Materializing from decision candidates (VS-075)

When \`knowledge/tech/decisions/\` is empty but \`knowledge/tech/decision-candidates.md\` holds
candidates, materialize each candidate as an ADR **draft** — copy its context and options, leave the
decision and consequences as \`[open]\` for human confirmation, and record its origin with
\`created_from: knowledge/tech/decision-candidates.md\`. Never mark a materialized draft \`accepted\`;
acceptance is a human decision.

## Rules

- One ADR = one decision. Never mix unrelated decisions.
- Never invent decisions; never write an ADR without a clear reason.
- Record alternatives honestly, including the one chosen and why (or \`[open]\` when undecided).
- Prefer narrow governed \`code:\` globs over broad ones.

## Quality checklist

- Context explains why the decision was needed.
- The decision and its alternatives are explicit (or explicitly \`[open]\`).
- Consequences (positive and negative) are stated.
- Status and governed paths are present.

## Example output

\`\`\`md
---
type: adr
status: draft | accepted | superseded | deprecated
date: YYYY-MM-DD
created_from: knowledge/tech/decision-candidates.md
---

# ADR-001 — Use INTERNAL_CRON_SECRET for internal endpoint protection

## Context
...
## Options Considered
...
## Decision
[open]
## Consequences
[open]
## Related Capabilities
- <domain / capability>
## Related Work Items
- <WI id>
\`\`\`
`
)

const WORK_ITEM_REFINEMENT = skill(
  'work-item-refinement',
  'Work Item Refinement Skill',
  'delivery',
  ['work-item-agent', 'backlog-agent', 'roadmap-agent'],
  `
# Work Item Refinement Skill

## Purpose

Standardize how a Work Item is sharpened from a rough idea into a ready, implementable item.

## When to use

When improving a draft Work Item, or turning a backlog idea / roadmap candidate into a ready item.

## Inputs

The context pack and the Work Item (draft or candidate).

## Output

An improved Work Item with: problem, expected result, scope, out of scope, acceptance criteria,
validation (how to test it), definition of done, open questions and dependencies.

## Rules

- Do not implement code.
- Do not expand scope without explicit confirmation.
- Do not create mega Work Items — split when it covers multiple outcomes.
- Keep acceptance criteria testable.
- This skill refines scope and acceptance criteria but does not approve implementation readiness.
  Readiness requires human confirmation through \`kaddo ready\` or the MCP \`mark_work_item_ready\` action.

## Quality checklist

- Problem and expected result are unambiguous.
- Scope and out-of-scope are explicit.
- Acceptance criteria and validation are present and testable.
- Open questions and dependencies are surfaced, not hidden.

## Example output

A Work Item markdown with the sections above filled in, ready for the implementation-agent.
`
)

const OWNERSHIP_SUGGESTION = skill(
  'ownership-suggestion',
  'Ownership Suggestion Skill',
  'tech',
  ['ownership-agent', 'work-item-agent', 'graph-agent', 'implementation-agent'],
  `
# Ownership Suggestion Skill

## Purpose

Standardize how precise \`code:\` ownership globs are proposed so Guard can relate code changes to
the right knowledge.

## When to use

When a Work Item or artifact is missing ownership, or its ownership is too broad/inaccurate.

## Inputs

The context pack, the Work Item, and the technical inventory / codebase notes.

## Output

A \`code:\` glob proposal, e.g.

\`\`\`yaml
code:
  - src/database/**
  - src/cli/**
\`\`\`

## Rules

- Prefer small, specific globs; avoid \`src/**\`.
- Use only real paths; validate intent against the Work Item.
- Explain uncertainty instead of guessing.
- Propose only — the human applies with \`kaddo owners suggest\`.

## Quality checklist

- Every glob maps to a real path relevant to the item.
- No catch-all globs.
- Uncertainty is marked.

## Example output

The YAML \`code:\` block above plus a one-line rationale per glob.
`
)

const GRAPH_METADATA_REVIEW = skill(
  'graph-metadata-review',
  'Graph Metadata Review Skill',
  'tech',
  ['graph-agent', 'ownership-agent', 'work-item-agent'],
  `
# Graph Metadata Review Skill

## Purpose

Standardize how \`kaddo graph export\` hints become precise relationship front matter.

## When to use

When relationship quality is partial/sparse/empty, or when reviewing \`.kaddo/graph-hints.md\`.

## Inputs

The context pack, \`.kaddo/graph.json\` and \`.kaddo/graph-hints.md\`, plus the affected artifacts.

## Output

Front matter proposals, e.g.

\`\`\`yaml
capabilities:
  - local-persistence
decisions:
  - ADR-0001
code:
  - src/database/**
capsules:
  - orders-service
\`\`\`

## Rules

- Never invent relationships, paths or IDs.
- Do not try to resolve every hint at once — propose what is justified.
- Do not modify artifacts; the human applies and re-runs \`kaddo graph export\`.

## Quality checklist

- Each proposal maps to a real artifact/path/capability/ADR/capsule.
- Globs are narrow; uncertainty is marked.

## Example output

The YAML proposal above, grouped per artifact, with a short reason each.
`
)

const CAPSULE_WRITING = skill(
  'capsule-writing',
  'Capsule Writing Skill',
  'integration',
  ['capsule-agent', 'architecture-agent', 'product-agent'],
  `
# Capsule Writing Skill

## Purpose

Standardize how a Knowledge Capsule is written/reviewed so external consumers get safe, useful
context.

## When to use

When creating or refining a Knowledge Capsule for sharing with another project.

## Inputs

The context pack, capabilities, current-state, decisions and any public contracts.

## Output

A capsule with: purpose, responsibilities, capabilities, contracts, dependencies, risks, owners,
out of scope and usage notes.

## Rules

- Never include secrets, tokens, credentials, source code, PII or unnecessary internal detail.
- Never invent contracts; mark unknowns.
- Summarize boundaries; prefer "unknown" over guessing.

## Quality checklist

- Purpose and boundaries are clear.
- Contracts are real, not invented.
- No secrets/source/PII included.

## Example output

A \`*.capsule.md\` with the sections above.
`
)

const LEARNING_CAPTURE = skill(
  'learning-capture',
  'Learning Capture Skill',
  'delivery',
  ['implementation-agent', 'guard-agent', 'architecture-agent', 'work-item-agent'],
  `
# Learning Capture Skill

## Purpose

Standardize how a Work Item's learning is captured when it closes.

## When to use

When finishing a Work Item, after implementation and verification.

## Inputs

The Work Item, the diff/result, and any decisions or surprises that came up.

## Output

A learning record: what was implemented, what changed, what was learned, what decision emerged,
which knowledge must be updated, and what remains pending.

## Rules

- Do not close a Work Item without validation.
- Do not hide failures; record them honestly.
- Do not assume everything is done if errors remain.

## Quality checklist

- Implemented vs changed vs learned are distinct.
- Knowledge to update is named (ADR / capabilities / current-state).
- Pending items are listed.

## Example output

A short learning section appended to the Work Item or a learning note.
`
)

const IMPLEMENTATION_PLANNING = skill(
  'implementation-planning',
  'Implementation Planning Skill',
  'delivery',
  ['implementation-agent', 'work-item-agent'],
  `
# Implementation Planning Skill

## Purpose

Standardize the plan produced before implementation starts.

## When to use

Before writing code for a ready Work Item.

## Inputs

The context pack and the ready Work Item.

## Output

A plan with: technical scope, expected files, risks, validations, out of scope, implementation
steps, and stop criteria (when to pause and ask).

## Rules

- Do not start coding without confirmation.
- Do not expand scope.
- Never make commits or push — suggest only.

## Quality checklist

- Scope and expected files are explicit.
- Risks and validations are listed.
- Stop criteria are defined.

## Example output

A numbered plan covering the sections above, ending with a request to confirm before coding.
`
)

export const SKILLS: SkillDef[] = [
  ADR_WRITING,
  WORK_ITEM_REFINEMENT,
  OWNERSHIP_SUGGESTION,
  GRAPH_METADATA_REVIEW,
  CAPSULE_WRITING,
  LEARNING_CAPTURE,
  IMPLEMENTATION_PLANNING,
]

export const SKILL_GROUPS: Record<SkillGroup, string[]> = {
  delivery: ['work-item-refinement', 'implementation-planning', 'learning-capture'],
  tech: ['adr-writing', 'ownership-suggestion', 'graph-metadata-review'],
  integration: ['capsule-writing'],
}

export const SKILL_GROUP_NAMES = Object.keys(SKILL_GROUPS) as SkillGroup[]

/** Skills recommended by default for `kaddo add skills` (delivery + tech everyday capabilities). */
const RECOMMENDED_SKILLS = [...SKILL_GROUPS.delivery, ...SKILL_GROUPS.tech]

export function skillInstallPath(id: string): string {
  return `knowledge/skills/${id}/skill.md`
}

export function skillById(id: string): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id)
}

/** Resolve which skill ids to install given the requested selection. */
export function selectSkills(opts: { all?: boolean; group?: string }): { ids: string[]; label: string } {
  if (opts.all) {
    return { ids: SKILLS.map((s) => s.id), label: 'all skills' }
  }
  if (opts.group) {
    const group = opts.group as SkillGroup
    const ids = SKILL_GROUPS[group]
    if (!ids) {
      throw new Error(
        `Unknown skill group "${opts.group}". Valid groups: ${SKILL_GROUP_NAMES.join(', ')}.`
      )
    }
    return { ids, label: `group: ${group}` }
  }
  return { ids: RECOMMENDED_SKILLS, label: 'recommended skills' }
}
