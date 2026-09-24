---
name: implementation-planning
description: "Standardize the plan produced before implementation starts. Use when: Before writing code for a ready Work Item."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

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
- Do not expand scope without updating the Work Item.
- Never make commits or push — suggest only.
- Review scope coverage before planning: check that expected result, current/target behavior,
  module coverage, and acceptance criteria are consistent. Flag contradictions (e.g., user-facing
  change with unassessed frontend module).

## Quality checklist

- Pre-implementation scope review is documented.
- Scope and expected files are explicit.
- Risks and validations are listed.
- Stop criteria are defined.
- Module coverage aligns with planned changes.

## Example output

A numbered plan covering the sections above, ending with a request to confirm before coding.
