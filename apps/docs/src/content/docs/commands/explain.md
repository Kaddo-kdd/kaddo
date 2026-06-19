---
title: kaddo explain
description: Explain the current project — what Kaddo knows, what is missing, what to do next.
---

```bash
kaddo explain                      # project explanation (human-readable)
kaddo explain --for human          # same, explicit
kaddo explain --for agent          # compact structured JSON
kaddo explain --scope payments     # focused: limit to a domain or keyword
kaddo explain --type adr           # focused: limit to one artifact type
kaddo explain --since 2026-01-01   # focused: limit by creation date
```

## Project explanation (no filters)

Run without filters, `kaddo explain` summarizes the **current state of the
project** from existing Kaddo artifacts:

- Project metadata (name, state, team, structure)
- Detected stack (from `.kaddo/scan.json`)
- Knowledge status (inventory, context pack, capabilities, architecture
  baseline, roadmap, agents)
- Work Items counted by lifecycle state (`draft`, `ready`, `in-progress`, `blocked`,
  `completed`, `archived`)
- Ownership coverage (how many work items declare `code:` globs)
- Missing knowledge and **suggested next steps**

It also writes `.kaddo/explain.md` and `.kaddo/explain.json` so the explanation
can be reused for onboarding, handoff or by agents. No LLM is called — the
output is fully deterministic.

```txt
# Project Explanation

## Project
- Name: dotear-web
- State: pre-ai
- Team: indie
- Structure: monorepo

## Detected Stack
- Language: TypeScript
- Framework: Next.js

## Knowledge Status
- Capabilities: missing
- Roadmap: available
- Roadmap candidates: 21
- Materialized work items: 5
- Remaining candidates: 16
- Ownership coverage: 1/2 work items

## Suggested Next Steps
1. Use capability-agent to create knowledge/product/capabilities.md.
2. Materialize 16 roadmap candidate(s) with `kaddo create --from roadmap`.
3. Run `kaddo owners suggest` for Work Items without code ownership.
```

`explain` also reports the **Work Items by Type** distribution (Features / Bugfixes / Hotfixes /
Spikes / Chores), so technical and maintenance work (`chore`) stays visible and distinct from
delivered features:

```text
## Work Items by Type
- Features: 12
- Chores: 4
- Spikes: 2
- Bugfixes: 1
```

`explain` also flags **possible duplicate Work Items** (non-blocking) — items sharing the same
roadmap source candidate or the same normalized title (which catches translated duplicates like
`Initialize TypeScript CLI project` / `Inicializar proyecto TypeScript CLI`). Review them before
continuing.

When a roadmap is present, `explain` distinguishes **roadmap candidates** (entries the
roadmap-agent proposed) from **materialized Work Items** (created under
`knowledge/delivery/work-items/`). The *remaining candidates* count is the gap between them, and
`explain` suggests materializing them with `kaddo create --from roadmap`. Candidates are read from
any [supported roadmap format](/commands/create/#supported-roadmap-formats) (table, bullet,
checklist, mixed initiatives, or the strict Kaddo Roadmap Agent format).

`explain` also groups Work Items virtually by `initiative` front matter. Phase and initiative
remain metadata for planning and functional traceability; folders represent lifecycle state only.

## Knowledge graph summary

If you have run [`kaddo graph export`](/knowledge-graph-export/), `explain` adds a
`## Knowledge Graph` block with node/edge counts, **relationship quality**, the **hint count** and
the last export time (also in the agent JSON under `graph`). `explain` reports the graph — it never
generates it.

## `context` vs `explain`

- `kaddo context` **prepares input for an LLM agent** (external interpretation).
- `kaddo explain` **summarizes what Kaddo currently knows** — for humans,
  maintainers, onboarding, project review, or agents needing quick state.

## Focused mode

With `--scope`, `--type` or `--since`, `explain` keeps its focused behavior:
it explains a subset of artifacts (a domain, an artifact type, or recent
changes) instead of the whole project. The `--for agent` output of focused mode
is structured JSON including artifacts, domains, `domain_owners`,
`installed_modules`, `mapped_modules` and `enabled_plugins`.

## Mapped modules (multirepo)

When the project has modules registered with `kaddo modules map`, `explain` reports
them — separately from add-on modules installed with `kaddo add`:

```
## Mapped Modules

- storefront-web — frontend — ../frontend — owner: web-team
- orders-api — backend — ../backend — owner: api-team

## Module Artifact Coverage

- storefront-web: module-design, stack, security, standards
- orders-api: module-design, stack
```

The `--for agent` output exposes a structured `mapped_modules` array (with per-module
`artifacts` coverage), distinct from `installed_modules`.

> `explain` reads mapped modules from `.kaddo/modules.yml` and the
> `knowledge/tech/modules/<id>/` artifacts only. It never scans the secondary repos.

## Knowledge maturity (semantic recognition)

`explain` recognizes knowledge by **front-matter `type`**, not by file name or path — so a
consolidated `business.md` (`type: business`) is recognized even though it is not a folder
of separate files, and `capabilities` are detected wherever a `type: capabilities` artifact
lives. Each layer gets a maturity status:

| Status | Meaning |
|---|---|
| **Missing** | No knowledge for this layer yet. |
| **Consolidated** | One consolidated layer file exists (e.g. `business.md`, `product.md`, `codebase.md`). |
| **Structured** | Specialized artifacts exist (e.g. `capabilities`, `current-state`, ADRs). |
| **Partial** (Delivery) | A roadmap exists, but no Work Items are materialized yet. |
| **Traceable** (Delivery) | Roadmap + Work Items (and ADRs / ownership) exist. |

Discovery priority: **front-matter type → Kaddo conventions → path → file name** — never the
other way around. Work Items are recognized by their work-item type under
`knowledge/delivery/work-items/` (ADRs and untyped files are never Work Items).
