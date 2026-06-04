---
title: Templates overview
description: Consistent, lightweight templates for every Kaddo artifact.
---

Kaddo ships **templates** for its main knowledge artifacts so you never invent
structure from scratch. They live in a central registry
(`packages/cli/src/templates/registry.ts`) and back the documentation below.

> **Complete is not the same as long.** A good template guides well, avoids
> ambiguity and keeps traceability — without becoming a bureaucratic form. Templates
> are **guides, not mandatory forms**: fill the *minimum sufficient knowledge* for the
> change at hand.

## What every template carries

- **Purpose** — what the artifact is for.
- **When to use** — the situation that calls for it.
- **Output path** — where the artifact lives.
- **Related command / agent** — how it is produced.
- **Front matter** — for artifacts that participate in traceability.
- **Sections** — required and optional.
- **Quality checklist** — how to know it is good enough.

## CLI vs LLM vs human

| Layer | Role |
|---|---|
| **CLI** | Creates the skeleton deterministically (`init`, `create`, `modules map`, `add`). |
| **LLM agent** | Fills interpretation (capabilities, architecture, roadmap, design). |
| **Human** | Reviews, decides and edits. Templates make review fast. |

## Categories

- [Business templates](/templates/business/) — problem, users, value proposition, rules, constraints, glossary.
- [Product templates](/templates/product/) — product brief, capabilities.
- [Tech templates](/templates/tech/) — codebase, current state, notes, decision candidates, quality attributes, ADR.
- [Delivery templates](/templates/delivery/) — work item, roadmap.
- [Module templates](/templates/module/) — per-repo design, stack, security, standards, ADR.
- [Operations templates](/templates/operations/) — security, standards, stack, git strategy, incident, runbook.
- [Legacy templates](/templates/legacy/) — risks, unknowns, modernization candidates.
