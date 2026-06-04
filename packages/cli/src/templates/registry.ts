// VS-018 — Central template registry.
//
// Authoritative, typed catalog of the Kaddo artifact templates. Templates are data:
// easy to discover, document and test, and aligned with the agent prompts that
// produce them. Existing inline command/module templates remain intact; this
// registry is additive and is the source of truth for the Templates documentation.
//
// Design rule: a complete template is not a long template. It guides well, avoids
// ambiguity and keeps traceability — without becoming a bureaucratic form.

export type TemplateCategory =
  | 'core'
  | 'business'
  | 'knowledge'
  | 'module'
  | 'operations'
  | 'legacy'

export type KaddoTemplate = {
  /** Stable id, e.g. `work-item`. */
  id: string
  /** Human-readable name. */
  name: string
  category: TemplateCategory
  /** Where the artifact lives, e.g. `knowledge/work-items/`. */
  outputPath: string
  /** Purpose — one sentence. */
  description: string
  /** When a user should reach for this template. */
  whenToUse: string
  /** Related CLI command, if any. */
  relatedCommand?: string
  /** Related agent prompt, if any. */
  relatedAgent?: string
  /** The copyable artifact body (Markdown). */
  content: string
}

const QUALITY = '## Quality checklist'

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

const WORK_ITEM = `---
type: feature
id: WI-001
title: "Short, action-oriented title"
status: in-progress
knowledge_level: K2
source: manual
source_id:
source_initiative:
domains: []
capabilities: []
code: []
created_at: YYYY-MM-DD
---

# <Title>

> Type: feature · Level: K2

## Problem

_What problem or opportunity does this address?_

## Expected result

_What should be true once this is done?_

## Acceptance criteria

- [ ] ...

## Design

_Optional. Key decisions or approach. Keep it minimal at low knowledge levels._

## Risks

_Optional. What could go wrong?_

## Definition of Done

- [ ] Code merged
- [ ] Knowledge updated or intentionally unchanged

## Learning

_What did we learn? Fill in after completion (\`kaddo learn\`)._

${QUALITY}

- [ ] Title is specific and action-oriented.
- [ ] \`code:\` globs declared so Guard can relate changes.
- [ ] Knowledge level matches the real uncertainty.
`

const ROADMAP = `---
type: roadmap
updated_at: YYYY-MM-DD
---

# <Project> — Roadmap

> Candidates for human review — not commitments. Generated with the roadmap-agent.

## Initiatives

### RM-001 — <Initiative title>

**Goal:** ...
**Related capabilities:** ...
**Impact:** ...
**Risk:** ...
**Suggested Knowledge Level:** K1 / K2 / K3 / K4
**Dependencies:** ...
**Why now:** ...

#### Candidate Work Items

- **WI-CANDIDATE-001** — <title> · type: feature · level: K2 · value: ... · notes: ...

## Assumptions

- ...

**Open questions:**

- ...

## Suggested execution order

1. ...

## Not now

- ...

${QUALITY}

- [ ] Each initiative has a goal, impact and risk.
- [ ] Candidates are marked as candidates, not decisions.
- [ ] Priorities reflect the project state (new / pre-ai / legacy).
`

const CAPABILITIES = `---
type: capabilities
updated_at: YYYY-MM-DD
---

# <Project> — Capabilities

> What the system can do, from the product's point of view. Refine with capability-agent.

## CAP-001 — <Capability name>

**Description:** ...
**Status:** existing / proposed
**Related domains:** ...
**Evidence:** _where in code/docs this is observed_

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] Capabilities describe outcomes, not implementation.
- [ ] Each capability cites evidence or is flagged as an assumption.
`

const KNOWLEDGE = `---
type: current-state
updated_at: YYYY-MM-DD
---

# <Project> — Knowledge

> What is true about this product right now.

## Purpose

_What this product does and who it serves._

## Architecture overview

_High-level description of the main components._

## Key domains

_Main domains or bounded contexts._

## Active constraints

_Technical, regulatory or operational constraints that shape decisions._

${QUALITY}

- [ ] Reflects the current reality, not aspirations.
- [ ] Constraints are explicit.
`

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------

const CURRENT_STATE = `---
type: current-state
updated_at: YYYY-MM-DD
---

# <Project> — Current State (Architecture Baseline)

> Reconstructed baseline. Refine with architecture-agent using \`.kaddo/context-pack.md\`.

## Components

_Main services / packages / modules and their responsibilities._

## Data & integrations

_Datastores, queues, external APIs._

## Cross-cutting concerns

_Auth, logging, config, error handling._

## Known gaps

_What is unclear or undocumented._

## Assumptions

- ...

${QUALITY}

- [ ] Components map to real code areas.
- [ ] Gaps and assumptions are explicit, not hidden.
`

const ARCHITECTURE_NOTES = `---
type: architecture-notes
updated_at: YYYY-MM-DD
---

# Architecture Notes

> Working notes on architecture topics that are not yet ADRs.

## Topic

_What is being explored._

## Context

_Why it matters now._

## Options

- Option A — ...
- Option B — ...

## Leaning towards

_Current inclination and why (not a decision yet)._

## Open questions

- ...

${QUALITY}

- [ ] Notes are clearly non-binding (not a decision).
- [ ] Options capture real trade-offs.
`

const DECISION_CANDIDATES = `---
type: decision-candidates
updated_at: YYYY-MM-DD
---

# Decision Candidates

> Candidate architecture decisions for human review. Refine with adr-agent.
> Promote accepted candidates into individual ADRs.

## DC-001 — <Decision title>

**Context:** ...
**Options considered:** ...
**Recommended option:** ...
**Trade-offs:** ...
**Status:** candidate

${QUALITY}

- [ ] Each candidate states context and trade-offs.
- [ ] Candidates are not presented as final decisions.
`

const ADR = `---
type: adr
id: ADR-0001
status: proposed
date: YYYY-MM-DD
domains: []
capabilities: []
code: []
---

# ADR-0001 — <Decision title>

## Status

proposed | accepted | superseded

## Context

_The forces and constraints that lead to this decision._

## Decision

_The decision, stated clearly and in the present tense._

## Consequences

_Positive and negative results of the decision._

## Alternatives considered

- ...

${QUALITY}

- [ ] The decision is unambiguous.
- [ ] Consequences include the downsides, not only benefits.
- [ ] Superseding ADRs are linked when status changes.
`

// ---------------------------------------------------------------------------
// Module (per-repo, multirepo)
// ---------------------------------------------------------------------------

const MODULE_DESIGN = `---
type: module-design
module: module-name
status: draft
owner: unknown
repoPath: ../module-repo
capabilities: []
code: []
---

# <Module> — Design

> Refine with module-design-agent using \`.kaddo/context-pack.md\`.

**Type:** frontend / backend / worker / mobile / library / infrastructure / data
**Repository:** ../module-repo
**Main technology:** ...
**Owner:** ...

## Purpose

## Boundaries

## Inputs / Outputs

## Dependencies

## Related capabilities

- ...

## Risks & open questions

${QUALITY}

- [ ] Boundaries make clear what is in and out of the module.
- [ ] Dependencies on other modules are listed.
`

const MODULE_STACK = `# <Module> — Stack

> Refine with stack-agent.

**Main technology:** ...

## Languages

## Frameworks

## Data

## Infrastructure

## Unknowns / needs confirmation

${QUALITY}

- [ ] Reflects the module's actual stack, not the whole system.
- [ ] Unknowns are listed rather than guessed.
`

const MODULE_SECURITY = `# <Module> — Security Considerations

> Refine with security-agent. Kaddo does **not** perform security scanning.

## Authentication & authorization

## Data sensitivity

## Secrets handling

## Open questions

${QUALITY}

- [ ] Documents concerns for humans — does not claim to audit code.
- [ ] Data sensitivity is classified.
`

const MODULE_STANDARDS = `# <Module> — Standards

> Refine with standards-agent. Keep it lightweight.

## Coding standards

## Testing expectations

## PR checklist

${QUALITY}

- [ ] A handful of high-value rules, not a long policy.
- [ ] Standards are specific to this module where it differs from the system.
`

const MODULE_ADR = `---
type: adr
id: ADR-0001
module: module-name
status: proposed
date: YYYY-MM-DD
code: []
---

# ADR-0001 — <Module decision title>

## Status

proposed | accepted | superseded

## Context

_Module-scoped forces and constraints._

## Decision

## Consequences

## Alternatives considered

- ...

${QUALITY}

- [ ] Scoped to this module; system-wide decisions go in the architecture repo.
- [ ] Consequences include downsides.
`

// ---------------------------------------------------------------------------
// Operations (global)
// ---------------------------------------------------------------------------

const SECURITY = `# Security Considerations

> Global. Install with \`kaddo add security\`. Refine with security-agent.
> Kaddo does **not** perform security or vulnerability scanning.

## Authentication & authorization

## Data sensitivity

## Secrets handling

## Dependency risks

## Deployment risks

## Open questions

${QUALITY}

- [ ] Documents concerns for humans and agents — it does not audit code.
- [ ] Secrets handling describes where secrets live and how they rotate.
`

const STANDARDS = `# Standards

> Global. Install with \`kaddo add standards\`. Refine with standards-agent.
> Keep it lightweight — a handful of high-value rules beats a long policy.

## Coding standards

## Documentation standards

## Testing expectations

## PR checklist

- [ ] Linked to the right Work Item.
- [ ] Knowledge updated or intentionally left unchanged.

${QUALITY}

- [ ] Rules are high-value and enforceable.
- [ ] No documentation theater.
`

const STACK = `# Stack

> Global. Install with \`kaddo add stack\`. Refine with stack-agent.

## Languages

## Frameworks

## Data

## Infrastructure

## Tooling

## Unknowns / needs confirmation

${QUALITY}

- [ ] Reflects the detected stack.
- [ ] Unknowns are listed, not invented.
`

const GIT_STRATEGY = `# Git Strategy

> Global. Install with \`kaddo add git-strategy\`. Refine with git-strategy-agent.
> Kaddo recommends a default and does **not** enforce it in CI.

## Default strategy

GitHub Flow + Conventional Commits + SemVer.

## Branch naming

\`\`\`txt
feature/<work-item-id>-<slug>
bugfix/<work-item-id>-<slug>
hotfix/<work-item-id>-<slug>
\`\`\`

## Commit convention

\`\`\`txt
feat(scope): message
fix(scope): message
docs(scope): message
\`\`\`

## Tag strategy

\`\`\`txt
vMAJOR.MINOR.PATCH
\`\`\`

## Customization

Edit \`.kaddo/git.yml\` to switch strategy: \`github-flow\`, \`gitflow\`,
\`trunk-based\` or \`custom\`.

${QUALITY}

- [ ] The chosen strategy matches how the team actually works.
- [ ] Branch and commit conventions reference Work Items.
`

const INCIDENT = `---
type: incident
id: INC-001
status: open
severity: SEV3
date: YYYY-MM-DD
code: []
---

# INC-001 — <Incident title>

## Summary

_What happened, in one or two sentences._

## Impact

_Who/what was affected and for how long._

## Timeline

- HH:MM — ...

## Root cause

_What actually caused it._

## Resolution

_How it was mitigated and fixed._

## Follow-up actions

- [ ] ...

${QUALITY}

- [ ] Root cause is the real cause, not the trigger.
- [ ] Follow-up actions are concrete and owned.
`

const RUNBOOK = `---
type: runbook
title: "<Operation> runbook"
updated_at: YYYY-MM-DD
---

# <Operation> — Runbook

> How to perform a recurring operational task safely.

## When to use

_The situation that triggers this runbook._

## Prerequisites

- ...

## Steps

1. ...

## Verification

_How to confirm success._

## Rollback

_How to undo if something goes wrong._

${QUALITY}

- [ ] Steps are reproducible by someone who is not the author.
- [ ] Rollback is defined.
`

// ---------------------------------------------------------------------------
// Legacy
// ---------------------------------------------------------------------------

const LEGACY_RISKS = `---
type: legacy-risks
updated_at: YYYY-MM-DD
---

# Legacy Risks

> High-risk areas to know before changing legacy code. Refine with legacy-agent.

## RISK-001 — <Area>

**What:** ...
**Why risky:** ...
**Blast radius:** ...
**Mitigation:** ...

${QUALITY}

- [ ] Risks are specific to code areas, not vague.
- [ ] Blast radius is estimated.
`

const LEGACY_UNKNOWNS = `---
type: legacy-unknowns
updated_at: YYYY-MM-DD
---

# Legacy Unknowns

> What we do not yet understand about the legacy system. Refine with legacy-agent.

## UNK-001 — <Question>

**Question:** ...
**Why it matters:** ...
**How to find out:** ...

${QUALITY}

- [ ] Each unknown has a way to resolve it.
- [ ] Unknowns are not silently turned into assumptions.
`

const MODERNIZATION_CANDIDATES = `---
type: modernization-candidates
updated_at: YYYY-MM-DD
---

# Modernization Candidates

> Candidate modernization efforts for human review. Not commitments.

## MOD-001 — <Candidate>

**Current state:** ...
**Target state:** ...
**Value:** ...
**Risk:** ...
**Suggested Knowledge Level:** K1 / K2 / K3 / K4

${QUALITY}

- [ ] Candidates state value and risk.
- [ ] Marked as candidates, not decisions.
`

// ---------------------------------------------------------------------------
// Business (project knowledge bootstrap)
// ---------------------------------------------------------------------------

const BUSINESS_PRODUCT_BRIEF = `---
type: product-brief
status: draft
---

# Product Brief

> Created by \`kaddo bootstrap\`. Refine with the business-agent. Mark unknowns as TBD.

## What is this product?

TBD

## Problem it solves

TBD

## Target users

TBD

## Value proposition

TBD

## Out of scope (for the MVP)

- TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] The product can be described in one paragraph.
- [ ] The MVP boundary is explicit.
`

const BUSINESS_PROBLEM = `---
type: problem
status: draft
---

# Problem Statement

> Refine with the business-agent. Do not invent facts.

## Problem

TBD

## Who has it

TBD

## Why it matters now

TBD

## Current alternatives

- TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] The problem is stated without assuming the solution.
- [ ] The affected users are named.
`

const BUSINESS_USERS = `---
type: users
status: draft
---

# Users & Personas

> Refine with the business-agent.

## Primary users

- TBD

## Secondary users

- TBD

## Needs & goals

- TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] Each persona has a goal, not just a label.
- [ ] Primary vs secondary users are distinguished.
`

const BUSINESS_VALUE_PROPOSITION = `---
type: value-proposition
status: draft
---

# Value Proposition

> Refine with the business-agent.

## For whom

TBD

## What we offer

TBD

## Why it is better / different

TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] The value is specific, not generic.
- [ ] It maps to a real user need.
`

const BUSINESS_RULES = `---
type: business-rules
status: draft
---

# Business Rules

> Refine with the business-agent. These are product rules, not implementation details.

## Core rules

- TBD

## Edge cases

- TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] Rules are testable statements.
- [ ] No implementation detail leaks in.
`

const BUSINESS_CONSTRAINTS = `---
type: constraints
status: draft
---

# Constraints

> Refine with the business-agent.

## Business constraints

- TBD

## Regulatory / compliance

- TBD

## Time / budget / team

- TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] Constraints are real, not aspirational.
- [ ] Hard limits are separated from preferences.
`

const BUSINESS_GLOSSARY = `---
type: glossary
status: draft
---

# Glossary

> Refine with the business-agent. One shared vocabulary avoids ambiguity.

| Term | Definition |
|---|---|
| TBD | TBD |

## Open questions

- ...

${QUALITY}

- [ ] Each term has a single agreed definition.
- [ ] Ambiguous terms are flagged.
`

const QUALITY_ATTRIBUTES = `---
type: quality-attributes
status: draft
---

# Quality Attributes

> Created by \`kaddo bootstrap\`. Refine with the bootstrap-agent. Prioritize honestly.

## What matters most

- TBD (e.g. reliability, performance, security, maintainability, cost)

## Trade-offs accepted

- TBD

## Measurable targets (if known)

- TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] Attributes are prioritized, not all "high".
- [ ] Trade-offs are explicit.
`

const CODEBASE_FOUNDATION = `---
type: codebase-foundation
status: draft
---

# Codebase Foundation

> Created by \`kaddo bootstrap\`. Refine with the codebase-foundation-agent.
> This describes the intended base — it does **not** generate code.

## Suggested structure

TBD

## Initial modules / boundaries

- TBD

## Conventions

- TBD

## Git strategy

See \`knowledge/git-strategy.md\`.

## Minimum criteria to start development

- [ ] TBD

## Assumptions

- ...

## Open questions

- ...

${QUALITY}

- [ ] Structure follows the business and architecture, not a framework default.
- [ ] No production code is described here — only the foundation.
`

const BOOTSTRAP_SUMMARY = `---
type: bootstrap-summary
status: draft
---

# Bootstrap Summary

> Created by \`kaddo bootstrap\`. Index of the initial knowledge base and next steps.

## Layers

- **Business** — \`knowledge/business/\`
- **Architecture** — capabilities, quality-attributes, stack, current-state, decisions
- **Codebase** — codebase-foundation, standards, git-strategy
- **Development** — roadmap, work-items

## Status

- [ ] Business defined
- [ ] Initial architecture proposed
- [ ] Codebase foundation drafted
- [ ] Roadmap and first Work Items prepared

## Next steps

1. Run \`kaddo context\` and \`kaddo add agents\`.
2. Refine the artifacts with the business-agent, bootstrap-agent and
   codebase-foundation-agent in your LLM.
3. Run \`kaddo create --from roadmap\` to create the first Work Items.

## Open questions

- ...

${QUALITY}

- [ ] Every generated artifact is listed.
- [ ] The next step is clear.
`

export const KADDO_TEMPLATES: KaddoTemplate[] = [
  // core
  {
    id: 'work-item',
    name: 'Work Item',
    category: 'core',
    outputPath: 'knowledge/work-items/',
    description: 'Smallest traceable unit of product evolution.',
    whenToUse: 'When you start any change (feature, bugfix, hotfix, spike).',
    relatedCommand: 'kaddo create',
    relatedAgent: 'work-item-agent',
    content: WORK_ITEM,
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    category: 'core',
    outputPath: 'knowledge/roadmap.md',
    description: 'Initiatives and candidate work items for human review.',
    whenToUse: 'When planning what to build next and why.',
    relatedCommand: 'kaddo create --from roadmap',
    relatedAgent: 'roadmap-agent',
    content: ROADMAP,
  },
  {
    id: 'capabilities',
    name: 'Capabilities',
    category: 'core',
    outputPath: 'knowledge/capabilities.md',
    description: 'What the system can do from the product point of view.',
    whenToUse: 'When mapping product capabilities to the system.',
    relatedAgent: 'capability-agent',
    content: CAPABILITIES,
  },
  {
    id: 'knowledge',
    name: 'Knowledge (Current State)',
    category: 'core',
    outputPath: 'knowledge/knowledge.md',
    description: 'What is true about the product right now.',
    whenToUse: 'Created by `kaddo init`; keep it current as the product evolves.',
    relatedCommand: 'kaddo init',
    content: KNOWLEDGE,
  },
  // business (bootstrap)
  {
    id: 'business-product-brief',
    name: 'Product Brief',
    category: 'business',
    outputPath: 'knowledge/business/product-brief.md',
    description: 'The product in one page: problem, users, value, MVP boundary.',
    whenToUse: 'At the start of a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_PRODUCT_BRIEF,
  },
  {
    id: 'business-problem',
    name: 'Problem Statement',
    category: 'business',
    outputPath: 'knowledge/business/problem.md',
    description: 'The problem the product solves, without assuming the solution.',
    whenToUse: 'When defining a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_PROBLEM,
  },
  {
    id: 'business-users',
    name: 'Users & Personas',
    category: 'business',
    outputPath: 'knowledge/business/users.md',
    description: 'Primary and secondary users with goals.',
    whenToUse: 'When defining a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_USERS,
  },
  {
    id: 'business-value-proposition',
    name: 'Value Proposition',
    category: 'business',
    outputPath: 'knowledge/business/value-proposition.md',
    description: 'For whom, what we offer and why it is better.',
    whenToUse: 'When defining a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_VALUE_PROPOSITION,
  },
  {
    id: 'business-rules',
    name: 'Business Rules',
    category: 'business',
    outputPath: 'knowledge/business/business-rules.md',
    description: 'Product rules as testable statements.',
    whenToUse: 'When defining a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_RULES,
  },
  {
    id: 'business-constraints',
    name: 'Business Constraints',
    category: 'business',
    outputPath: 'knowledge/business/constraints.md',
    description: 'Business, regulatory and resource constraints.',
    whenToUse: 'When defining a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_CONSTRAINTS,
  },
  {
    id: 'business-glossary',
    name: 'Glossary',
    category: 'business',
    outputPath: 'knowledge/business/glossary.md',
    description: 'Shared vocabulary for the project.',
    whenToUse: 'When defining a new project (kaddo bootstrap).',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'business-agent',
    content: BUSINESS_GLOSSARY,
  },
  // architecture
  {
    id: 'current-state',
    name: 'Current State',
    category: 'knowledge',
    outputPath: 'knowledge/current-state.md',
    description: 'Reconstructed architecture baseline.',
    whenToUse: 'When establishing the architecture baseline of an existing system.',
    relatedAgent: 'architecture-agent',
    content: CURRENT_STATE,
  },
  {
    id: 'architecture-notes',
    name: 'Architecture Notes',
    category: 'knowledge',
    outputPath: 'knowledge/architecture-notes.md',
    description: 'Working notes on architecture topics not yet decided.',
    whenToUse: 'When exploring an architecture topic before it becomes an ADR.',
    content: ARCHITECTURE_NOTES,
  },
  {
    id: 'decision-candidates',
    name: 'Decision Candidates',
    category: 'knowledge',
    outputPath: 'knowledge/decision-candidates.md',
    description: 'Candidate architecture decisions for human review.',
    whenToUse: 'When surfacing decisions that may become ADRs.',
    relatedAgent: 'adr-agent',
    content: DECISION_CANDIDATES,
  },
  {
    id: 'quality-attributes',
    name: 'Quality Attributes',
    category: 'knowledge',
    outputPath: 'knowledge/quality-attributes.md',
    description: 'Prioritized quality attributes and accepted trade-offs.',
    whenToUse: 'During bootstrap, to record what matters most technically.',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'bootstrap-agent',
    content: QUALITY_ATTRIBUTES,
  },
  {
    id: 'codebase-foundation',
    name: 'Codebase Foundation',
    category: 'knowledge',
    outputPath: 'knowledge/codebase-foundation.md',
    description: 'Intended codebase structure and conventions (no source code).',
    whenToUse: 'During bootstrap, before writing code.',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'codebase-foundation-agent',
    content: CODEBASE_FOUNDATION,
  },
  {
    id: 'bootstrap-summary',
    name: 'Bootstrap Summary',
    category: 'knowledge',
    outputPath: 'knowledge/bootstrap-summary.md',
    description: 'Index of the initial knowledge base and next steps.',
    whenToUse: 'Generated by kaddo bootstrap.',
    relatedCommand: 'kaddo bootstrap',
    relatedAgent: 'bootstrap-agent',
    content: BOOTSTRAP_SUMMARY,
  },
  {
    id: 'adr',
    name: 'ADR',
    category: 'knowledge',
    outputPath: 'knowledge/decisions/',
    description: 'A single architecture decision record.',
    whenToUse: 'When recording a significant, accepted architecture decision.',
    relatedCommand: 'kaddo create adr',
    content: ADR,
  },
  // module
  {
    id: 'module-design',
    name: 'Module Design',
    category: 'module',
    outputPath: 'knowledge/modules/<id>/module-design.md',
    description: "A module's purpose, boundaries and dependencies.",
    whenToUse: 'After mapping a secondary repo as a module.',
    relatedCommand: 'kaddo modules map',
    relatedAgent: 'module-design-agent',
    content: MODULE_DESIGN,
  },
  {
    id: 'module-stack',
    name: 'Module Stack',
    category: 'module',
    outputPath: 'knowledge/modules/<id>/stack.md',
    description: "A module's technology stack.",
    whenToUse: 'To document the stack of a specific module.',
    relatedAgent: 'stack-agent',
    content: MODULE_STACK,
  },
  {
    id: 'module-security',
    name: 'Module Security',
    category: 'module',
    outputPath: 'knowledge/modules/<id>/security.md',
    description: "A module's security considerations.",
    whenToUse: 'To document security concerns specific to a module.',
    relatedAgent: 'security-agent',
    content: MODULE_SECURITY,
  },
  {
    id: 'module-standards',
    name: 'Module Standards',
    category: 'module',
    outputPath: 'knowledge/modules/<id>/standards.md',
    description: "A module's coding and testing standards.",
    whenToUse: 'When a module needs standards beyond the system defaults.',
    relatedAgent: 'standards-agent',
    content: MODULE_STANDARDS,
  },
  {
    id: 'module-adr',
    name: 'Module ADR',
    category: 'module',
    outputPath: 'knowledge/modules/<id>/adrs/',
    description: 'A module-scoped architecture decision record.',
    whenToUse: 'When a decision affects only one module.',
    content: MODULE_ADR,
  },
  // operations
  {
    id: 'security',
    name: 'Security',
    category: 'operations',
    outputPath: 'knowledge/security.md',
    description: 'Global security considerations (no scanning).',
    whenToUse: 'To document system-wide security concerns.',
    relatedCommand: 'kaddo add security',
    relatedAgent: 'security-agent',
    content: SECURITY,
  },
  {
    id: 'standards',
    name: 'Standards',
    category: 'operations',
    outputPath: 'knowledge/standards.md',
    description: 'Global lightweight coding/docs/testing standards.',
    whenToUse: 'To document system-wide standards.',
    relatedCommand: 'kaddo add standards',
    relatedAgent: 'standards-agent',
    content: STANDARDS,
  },
  {
    id: 'stack',
    name: 'Stack',
    category: 'operations',
    outputPath: 'knowledge/stack.md',
    description: 'Global technology stack documentation.',
    whenToUse: 'To document the system-wide stack.',
    relatedCommand: 'kaddo add stack',
    relatedAgent: 'stack-agent',
    content: STACK,
  },
  {
    id: 'git-strategy',
    name: 'Git Strategy',
    category: 'operations',
    outputPath: 'knowledge/git-strategy.md',
    description: 'Recommended, customizable Git workflow.',
    whenToUse: 'To agree on branching, commits and tagging.',
    relatedCommand: 'kaddo add git-strategy',
    relatedAgent: 'git-strategy-agent',
    content: GIT_STRATEGY,
  },
  {
    id: 'incident',
    name: 'Incident',
    category: 'operations',
    outputPath: 'knowledge/incidents/',
    description: 'A post-incident record.',
    whenToUse: 'After a production incident.',
    relatedCommand: 'kaddo create incident',
    content: INCIDENT,
  },
  {
    id: 'runbook',
    name: 'Runbook',
    category: 'operations',
    outputPath: 'knowledge/runbooks/',
    description: 'How to perform a recurring operational task safely.',
    whenToUse: 'For repeatable operational procedures.',
    content: RUNBOOK,
  },
  // legacy
  {
    id: 'legacy-risks',
    name: 'Legacy Risks',
    category: 'legacy',
    outputPath: 'knowledge/legacy/risks.md',
    description: 'High-risk areas before changing legacy code.',
    whenToUse: 'Before modifying legacy code.',
    relatedAgent: 'legacy-agent',
    content: LEGACY_RISKS,
  },
  {
    id: 'legacy-unknowns',
    name: 'Legacy Unknowns',
    category: 'legacy',
    outputPath: 'knowledge/legacy/unknowns.md',
    description: 'What is not yet understood about the legacy system.',
    whenToUse: 'When surfacing gaps in legacy knowledge.',
    relatedAgent: 'legacy-agent',
    content: LEGACY_UNKNOWNS,
  },
  {
    id: 'modernization-candidates',
    name: 'Modernization Candidates',
    category: 'legacy',
    outputPath: 'knowledge/legacy/modernization-candidates.md',
    description: 'Candidate modernization efforts for human review.',
    whenToUse: 'When planning legacy modernization.',
    content: MODERNIZATION_CANDIDATES,
  },
]

export function listTemplates(): KaddoTemplate[] {
  return KADDO_TEMPLATES
}

export function getTemplate(id: string): KaddoTemplate | undefined {
  return KADDO_TEMPLATES.find((t) => t.id === id)
}

export function templatesByCategory(category: TemplateCategory): KaddoTemplate[] {
  return KADDO_TEMPLATES.filter((t) => t.category === category)
}
