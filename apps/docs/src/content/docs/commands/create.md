---
title: kaddo create
description: Create a Work Item with the minimum context for its Knowledge Level.
---

```bash
kaddo create feature   # K2: delivers a user-facing capability
kaddo create bugfix    # K2: fixes a known defect
kaddo create hotfix    # K1: urgent fix on a released version
kaddo create spike     # K3: exploratory / reduce uncertainty
kaddo create chore     # K1: maintenance, tooling, config, infra
```

## Work Item types

| Type | Use it for | Examples |
|---|---|---|
| `feature` | A user-facing capability | Create task · List tasks |
| `bugfix` | A known defect | Filter returns wrong results |
| `hotfix` | Urgent fix on a released version | Production crash · auth outage |
| `spike` | Exploration to reduce uncertainty | Evaluate SQLite vs PostgreSQL |
| `chore` | Technical/maintenance work that enables the project but adds no direct user capability | Initialize TypeScript · Configure Vitest · Setup CI · Update dependencies |

A Work Item is a **`chore`** when it does not add a capability, fix a defect, handle an emergency
or perform research — but is needed for maintenance, configuration, tooling, infrastructure or
developer experience. Classifying such work as `feature` distorts the meaning of Feature.

**Aliases** (resolve to `chore` automatically, from the CLI or a roadmap candidate):
`setup`, `maintenance`, `tooling`, `infrastructure`, `infra`, `refactor`, `config`.

New Work Items are created in `knowledge/delivery/work-items/draft/` with `status: draft`.
Move them to `ready` when dependencies, scope and acceptance criteria are clear.

Optional modules add more types (`adr`, `rfc`, `incident`, `migration`, `legacy`,
`contract`, `capability`, `guard-rule`, `agent`, `skill`). See
[Modules](/modules/overview/).

## Create from a roadmap candidate

Once the roadmap-agent has produced `knowledge/delivery/roadmap.md`, you can turn a candidate work
item into a real Work Item without retyping its context:

```bash
kaddo create --from roadmap
# or pre-pick a type as default:
kaddo create feature --from roadmap
```

Kaddo reads `knowledge/delivery/roadmap.md`, lets you select a candidate (`WI-CANDIDATE-001`, …),
and prefills the Work Item from the roadmap: title, type, suggested Knowledge Level, expected
value, notes, related capabilities/impact/risk/dependencies, and the parent initiative. It
asks only for the required fields the candidate does not already provide.

The generated Work Item keeps **source traceability** in its front matter:

```yaml
---
type: spike
id: WI-001
knowledge_level: K2
status: draft
phase: now
initiative: RM-001
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
---
```

This completes the Kaddo loop: `scan → context → agents → roadmap → work item`. The roadmap
is generated in your LLM chat (never by the CLI), and its candidates are not Work Items until
you create them here.

### Supported roadmap formats

`kaddo create --from roadmap` does not require a single rigid layout. The deterministic parser
recognizes Work Item candidates across the most common roadmap shapes — it tries the strict Kaddo
Roadmap Agent format first (full back-compat) and, if that yields nothing, falls back to flexible
recognition:

- **Table** — a Markdown table with an `ID`/`WI` column and a title/description column (a
  `Depends on` column is read as dependencies):

  ```markdown
  | ID     | Work Item | Depends on |
  |--------|-----------|------------|
  | WI-001 | Cart      |            |
  | WI-002 | Payment   | WI-001     |
  ```

- **Bullet list** — `- WI-001: Cart`, `- WI-001 — Cart`, or `- WI-001 Cart`.

- **Checklist** — `- [ ] WI-001 Cart` / `- [x] WI-002 Payment`.

- **Mixed initiatives** — `## RM-001: Checkout` headings group the candidates below them; the
  initiative is recorded as `source_initiative`.

Any `WI-*` id ending in a digit is treated as a candidate. Duplicate ids are de-duplicated.

> If `knowledge/delivery/roadmap.md` is missing, or it contains no recognizable Work Item
> candidates in any supported format, Kaddo shows a helpful message instead of creating an empty
> Work Item.

### Roadmap candidates vs materialized Work Items

A roadmap lists **candidates** — they are *not* Work Items until you create them. `kaddo explain`
and `kaddo understand` make this distinction explicit:

```text
Roadmap candidates: 21
Materialized work items: 5
Remaining candidates: 16
```

`kaddo understand` then recommends materializing the remaining candidates with
`kaddo create --from roadmap`.

## Work Item lifecycle

Work Items are organized by operational state:

```text
knowledge/delivery/work-items/
  draft/
  ready/
  in-progress/
  blocked/
  completed/
  archived/
```

Official states are `draft`, `ready`, `in-progress`, `blocked`, `completed` and `archived`.
Flat legacy files under `knowledge/delivery/work-items/*.md` are still read as `ready` until
you migrate them into state folders.

## Activate Guard Lite

Add code globs to the `code:` field of the generated front matter:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```
