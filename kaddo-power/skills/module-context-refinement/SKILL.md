---
name: module-context-refinement
description: "Standardize how a multirepo module's context is refined without duplicating global knowledge. Use when: When refining `knowledge/module/module-context.md` in a multirepo module repository."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# Module Context Refinement Skill

## Purpose

Standardize how a multirepo module's context is refined without duplicating global knowledge.

## When to use

When refining `knowledge/module/module-context.md` in a multirepo module repository.

## Inputs

The module's `module-context.md`, local tech knowledge (`current-state.md`, `codebase.md`),
and — optionally — the core system's context pack.

## Output

A refined `module-context.md` with real, project-specific content in all sections.

## Rules

- Use module responsibility, not full product strategy.
- Identify boundaries and dependencies from the local code.
- Keep business/product context in the core/system repository.
- Document local risks and exposed interfaces.
- Preserve frontmatter (`type`, `module_id`, `parent_system`).
- Mark unknowns as open questions.
- Do not create `business.md` or `product.md` in the module.
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

A `module-context.md` with all placeholder sections filled in.
