---
type: skill
id: implementation-planning
name: implementation-planning
title: Implementation Planning Skill
version: 3.93.0
group: delivery
applies_to:
  - implementation-agent
  - work-item-agent
---
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

```markdown
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
```

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
