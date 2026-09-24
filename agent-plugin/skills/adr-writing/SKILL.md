---
name: adr-writing
description: "Standardize how Architecture Decision Records are written so every decision is captured the same way and stays auditable. Use when: When a real, consequential technical decision is being made or recognized — and only then."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# ADR Writing Skill

## Purpose

Standardize how Architecture Decision Records are written so every decision is captured the same
way and stays auditable.

## When to use

When a real, consequential technical decision is being made or recognized — and only then.

## Inputs

The context pack, the relevant Work Item or architecture note, and the decision being made.

## Output

A single ADR (saved under `knowledge/tech/decisions/`) with front matter and the standard sections:
context, options considered, the decision, consequences, related capabilities and related Work Items.
Status is one of `draft`, `accepted`, `superseded`, `deprecated`.

## Materializing from decision candidates (VS-075)

When `knowledge/tech/decisions/` is empty but `knowledge/tech/decision-candidates.md` holds
candidates, materialize each candidate as an ADR **draft** — copy its context and options, leave the
decision and consequences as `[open]` for human confirmation, and record its origin with
`created_from: knowledge/tech/decision-candidates.md`. Never mark a materialized draft `accepted`;
acceptance is a human decision.

## Rules

- One ADR = one decision. Never mix unrelated decisions.
- Never invent decisions; never write an ADR without a clear reason.
- Record alternatives honestly, including the one chosen and why (or `[open]` when undecided).
- Prefer narrow governed `code:` globs over broad ones.

## Quality checklist

- Context explains why the decision was needed.
- The decision and its alternatives are explicit (or explicitly `[open]`).
- Consequences (positive and negative) are stated.
- Status and governed paths are present.

## Example output

```md
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
```
