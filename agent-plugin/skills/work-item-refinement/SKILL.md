---
name: work-item-refinement
description: "Standardize how a Work Item is sharpened from a rough idea into a ready, implementable item. Use when: When improving a draft Work Item, or turning a backlog idea / roadmap candidate into a ready item."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

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
5. **Completeness review** — confirm: outcome covered, journey covered, modules assessed, unknowns
   visible, acceptance criteria end-to-end, scope and out-of-scope coherent.

## Rules

- Do not implement code.
- Do not expand scope without explicit confirmation.
- Do not create mega Work Items — split when it covers multiple outcomes.
- Keep acceptance criteria testable.
- Include at least one end-to-end acceptance criterion for user-facing changes.
- Do not reduce a product intent to the first technical implementation found.
- Evaluate surfaces and modules before proposing files.
- This skill refines scope and acceptance criteria but does not approve implementation readiness.
  Readiness requires human confirmation through `kaddo ready` or the MCP `mark_work_item_ready` action.

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
