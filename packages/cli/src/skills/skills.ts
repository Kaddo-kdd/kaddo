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

An improved Work Item with: actor and outcome, current behavior, target behavior, entry points,
end-to-end flow, impact analysis, module coverage, scope unknowns, scope confidence, problem,
expected result, scope, out of scope, acceptance criteria (including end-to-end criteria for
user-facing changes), validation (how to test it), definition of done, open questions and
dependencies.

## Steps

1. **Outcome framing** — identify actor, current behavior, target behavior, observable completion.
2. **Journey reconstruction** — map entry point, interaction, service/API, state change, response,
   final outcome.
3. **Surface review** — evaluate: product/UI, frontend, backend, database, configuration, feature
   flags, content/copy, authentication/authorization, notifications, analytics, documentation,
   operations/release — as affected, reviewed-not-affected, unknown, or not-applicable.
4. **Module review** — for multirepo, evaluate each mapped module with the same statuses.
5. **Resource review** — ask: does this change need to observe, modify, validate or deliver against a
   known external resource of the project (a Project Resource under \`knowledge/tech/resources/\` —
   database, cloud, API, queue, storage…)? If so, declare it in the WI front matter \`resources:\` with
   a role (\`affected\`, \`implementation\`, \`validation\`, \`delivery\`). Resources are external systems,
   distinct from \`affected_modules\` (code). Not every WI needs resources (e.g. a CSS change does not).
6. **Completeness review** — confirm: outcome covered, journey covered, modules assessed, resources
   assessed, unknowns visible, acceptance criteria end-to-end, scope and out-of-scope coherent.

## Rules

- Do not implement code.
- Do not expand scope without explicit confirmation.
- Do not create mega Work Items — split when it covers multiple outcomes.
- Keep acceptance criteria testable.
- Include at least one end-to-end acceptance criterion for user-facing changes.
- Do not reduce a product intent to the first technical implementation found.
- Evaluate surfaces and modules before proposing files.
- Consider Project Resources when the scope justifies it; never invent resources not backed by
  project knowledge, and keep \`resources\` (external systems) separate from \`affected_modules\` (code).
- This skill refines scope and acceptance criteria but does not approve implementation readiness.
  Readiness requires human confirmation through \`kaddo ready\` or the MCP \`mark_work_item_ready\` action.

## Quality checklist

- Actor and outcome are identified.
- Current and target behavior are documented.
- Journey is reconstructed for user-facing changes.
- Surfaces and modules are evaluated with explicit statuses.
- Problem and expected result are unambiguous.
- Scope and out-of-scope are explicit.
- Acceptance criteria include end-to-end validation when applicable.
- Scope unknowns are visible, not hidden.
- Scope confidence is declared with reasons.
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

Standardize the plan produced before implementation starts and ensure design deliberation is
explicit before coding begins.

## When to use

Before writing code for a ready Work Item.

## Inputs

Assemble context proportionally from the Build Contract's five sources:

1. **Work Item:** outcome, acceptance criteria, constraints, out-of-scope, affected_modules, domains.
2. **Knowledge:** business, product, tech and delivery knowledge relevant to the Work Item's domains.
3. **System Context:** topology, module dependencies, system graph when available.
4. **Repository Context:** existing patterns, file structure, test conventions in affected modules.
5. **Related Work Items:** dependencies (depends_on), completed related Work Items for precedent.

## Context assembly

Assemble proportionally to scope. A single-module bugfix needs the affected module's codebase
and tests. A cross-cutting feature needs topology, multiple modules, and business context.
Do not load everything — load what the scope demands.

## Output

A plan covering the template below, ending with a confirmation gate.

### Output template

\`\`\`markdown
# Implementation Plan — <WI id>

## Context Summary
<!-- Relevant knowledge, system context, and repository observations assembled for this WI. -->

## Design Deliberation

### Technical Approach
<!-- How this will be implemented. Be specific about patterns, modules, layers involved. -->

### Rationale
<!-- Why this approach. Reference existing patterns, constraints, or WI requirements. -->

### Alternatives Considered
<!-- When the change is non-trivial. May be omitted for trivial/obvious changes with a note. -->

### Trade-offs
<!-- When alternatives exist. Explicitly state what is gained and lost. -->

### ADR Recommendation
<!-- When the decision is architecturally significant: recommend materializing as ADR
     via adr-writing skill. Remove this section if not applicable. -->

## Affected Areas
<!-- Modules, files, surfaces impacted by this change. -->

## Implementation Steps
<!-- Numbered steps with expected files per step. -->

## Validation Plan
<!-- How to verify: test commands, manual steps, AC verification. -->

## Stop Criteria
<!-- When to pause and ask: scope expansion, contradictions, missing knowledge,
     architectural uncertainty. -->

## Confirmation Gate
Do not start coding without explicit human confirmation of this plan.
\`\`\`

## Rules

- Document Technical Approach and Rationale before listing implementation steps.
- Do not start coding without confirmation.
- Do not expand scope without updating the Work Item.
- Never make commits or push — suggest only.
- Review scope coverage before planning: check that expected result, current/target behavior,
  module coverage, and acceptance criteria are consistent. Flag contradictions (e.g., user-facing
  change with unassessed frontend module).
- When you discover an architecturally significant decision during planning, recommend the
  adr-writing skill and pause.
- When alternatives exist, document them. For trivial or obvious changes, Alternatives and
  Trade-offs may be omitted with a note explaining why.
- Context assembly is proportional: do not load all project knowledge for a small fix.

## Quality checklist

- Pre-implementation scope review is documented.
- Technical Approach is documented with specific patterns and modules.
- Rationale references WI requirements or existing project patterns.
- Alternatives documented when non-trivial, or explicitly noted as not applicable.
- ADR recommendation present when the decision is architecturally significant.
- Context sources consulted are listed in Context Summary.
- Scope and expected files are explicit.
- Risks and validations are listed.
- Validation plan includes how to verify each AC.
- Stop criteria are defined.
- Module coverage aligns with planned changes.
- Confirmation gate is present.
`
)

const MODULE_CONTEXT_REFINEMENT = skill(
  'module-context-refinement',
  'Module Context Refinement Skill',
  'tech',
  ['module-context-agent', 'architecture-agent'],
  `
# Module Context Refinement Skill

## Purpose

Standardize how a multirepo module's context is refined without duplicating global knowledge.

## When to use

When refining \`knowledge/module/module-context.md\` in a multirepo module repository.

## Inputs

The module's \`module-context.md\`, local tech knowledge (\`current-state.md\`, \`codebase.md\`),
and — optionally — the core system's context pack.

## Output

A refined \`module-context.md\` with real, project-specific content in all sections.

## Rules

- Use module responsibility, not full product strategy.
- Identify boundaries and dependencies from the local code.
- Keep business/product context in the core/system repository.
- Document local risks and exposed interfaces.
- Preserve frontmatter (\`type\`, \`module_id\`, \`parent_system\`).
- Mark unknowns as open questions.
- Do not create \`business.md\` or \`product.md\` in the module.
- Do not install agents or skills in the module.
- Do not create Work Items in the module.

## Quality checklist

- Module identity and purpose are clear.
- Responsibility and boundaries are non-overlapping with other modules.
- Exposed interfaces are real, not invented.
- Dependencies and consumers are listed.
- Local rules are documented.
- Risks are honest and specific.
- Open questions are surfaced.

## Example output

A \`module-context.md\` with all placeholder sections filled in.
`
)

const EVIDENCE_VERIFICATION = skill(
  'evidence-verification',
  'Evidence Verification Skill',
  'delivery',
  ['implementation-agent', 'guard-agent'],
  `
# Evidence Verification Skill

## Purpose

Estandarizar la recolección de evidencia de implementación y la verificación de Criterios de
Aceptación antes de completar un Work Item.

## When to use

Después de que la implementación y las pruebas de un Work Item terminan, antes de llamar
\`kaddo learn\`.

## Inputs

- El Work Item (id, ACs, affected_modules, release_gates, completion_exceptions).
- El diff o lista de archivos modificados.
- Resultados de pruebas y validaciones.
- Excepciones propuestas con categoría e impacto.

## Output

Un reporte de verificación: estado por AC, release gates, excepciones, desviaciones planned vs
actual, y decisión de completitud (READY_TO_COMPLETE | NEEDS_WORK | BLOCKED | READY_WITH_EXCEPTIONS).

## Rules

- Nunca marcar un AC como passed sin evidencia concreta.
- Nunca omitir un release gate fallido sin registrar una excepción aceptada.
- No incluir rutas de secretos en changed_paths.
- Usar \`kaddo verify\` o MCP tools \`kaddo_collect_evidence\`/\`kaddo_verify_work_item\`.

## Quality checklist

- Cada AC tiene un status explícito.
- Los release gates fallidos tienen blocker documentado.
- Las excepciones aceptadas tienen approved_by y razón.
- No hay rutas de secretos en la evidencia.
- La decisión de completitud es coherente con ACs y gates.

## Example output

Un reporte de verificación con ACs, gates, excepciones y decisión de completitud.
`
)

const LEGACY_RISK_ASSESSMENT = skill(
  'legacy-risk-assessment',
  'Legacy Risk Assessment Skill',
  'delivery',
  ['legacy-agent', 'implementation-agent', 'work-item-agent'],
  `
# Legacy Risk Assessment Skill

## Purpose

Evaluate a planned change against known legacy risks, unknowns and modernization candidates
to identify which findings require additional consideration before or after implementation.

## When to use

Before or during implementation of a Work Item in a legacy project — especially when the
Work Item touches areas flagged in \`knowledge/legacy/risks.md\`.

## Inputs

- The Work Item (id, ACs, affected_modules, affected areas).
- \`knowledge/legacy/risks.md\` — known risks with RISK-xxx identifiers.
- \`knowledge/legacy/unknowns.md\` — known unknowns with UNK-xxx identifiers.
- \`knowledge/legacy/modernization-candidates.md\` — MOD-xxx candidates.
- System Graph (\`.kaddo/graph.json\`) when available.
- Implementation Handoff or Implementation Evidence when available.

## Output

A risk assessment report listing which legacy findings are relevant to the planned change,
their intersection with the affected areas, and recommended actions.

### Output template

\`\`\`markdown
# Legacy Risk Assessment — <WI id>

## Relevant Risks

### RISK-xxx: <title>
- **Intersection:** <how this risk relates to the planned change>
- **Action:** mitigate before | monitor during | verify after | not applicable
- **Notes:** <additional context>

## Relevant Unknowns

### UNK-xxx: <question>
- **Impact on this WI:** <how this unknown affects implementation>
- **Recommended:** investigate before | accept as assumption | defer

## Relevant Modernization Candidates

### MOD-xxx: <title>
- **Alignment:** <how this WI relates to the modernization target>
- **Recommendation:** advance | defer | not relevant

## Summary

- Risks requiring pre-implementation mitigation: <count>
- Unknowns requiring investigation: <count>
- Modernization candidates advanced by this WI: <count>
- Overall risk posture: low | medium | high
\`\`\`

## Rules

- Reference findings by their stable identifiers — do not copy full content.
- Assess intersection based on affected areas (file paths, modules, system entities).
- Not every legacy finding is relevant — filter to those that intersect the change.
- Do not block implementation solely because legacy risks exist — provide context for
  informed decision-making.
- When the System Graph is available, use entity relationships to discover indirect risk
  intersections.

## Quality checklist

- Every referenced finding uses its stable identifier (RISK-xxx, UNK-xxx, MOD-xxx).
- Each relevant finding has an explicit action recommendation.
- Findings not relevant to the change are excluded, not listed as "not applicable".
- Overall risk posture is stated.
- The assessment is proportional — a small change gets a brief assessment.
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
  MODULE_CONTEXT_REFINEMENT,
  EVIDENCE_VERIFICATION,
  LEGACY_RISK_ASSESSMENT,
]

export const SKILL_GROUPS: Record<SkillGroup, string[]> = {
  delivery: ['work-item-refinement', 'implementation-planning', 'learning-capture', 'evidence-verification', 'legacy-risk-assessment'],
  tech: ['adr-writing', 'ownership-suggestion', 'graph-metadata-review', 'module-context-refinement'],
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
