---
title: Tech Decisions (ADRs)
description: kaddo adr detects technical decision candidates and hands off the ADRs to create from them, so decisions become traceable instead of staying as notes.
---

A relevant technical decision shouldn't stay as a note. When the `architecture-agent` produces
`knowledge/tech/decision-candidates.md`, Kaddo detects those candidates and guides you to materialize
them as **ADRs** under `knowledge/tech/decisions/` before implementing affected Work Items.

```bash
kaddo adr          # list decision candidates + the ADR files to create (alias: kaddo decisions)
kaddo adr --json
```

`kaddo adr` is a **read-only handoff**: it never writes ADRs, never marks anything `accepted`, never
decides for you, no LLM, no git. The CLI prepares the context; the adr-writing skill (an LLM/human)
drafts the ADR.

## Tech decisions status

Kaddo computes a `tech_decisions` status from the candidates file and the ADRs folder:

| Status | Meaning |
|---|---|
| `none` | no decision candidates and no ADRs |
| `candidates` | `decision-candidates.md` has candidates, but no ADRs yet |
| `draft-adrs` | ADRs exist but none is `accepted` yet |
| `accepted-adrs` | at least one ADR is `accepted` |

`kaddo explain` shows a `## Tech Decisions` section, and `kaddo context` surfaces the same summary and
adds a Missing Context note when candidates aren't materialized. Both `explain` and `understand`
recommend the **adr-writing** skill when there are candidates without ADRs.

## Over MCP

Agents can query tech decisions directly — without parsing the whole context pack — via the read-only
resource `kaddo://tech-decisions`. It returns the same object as `kaddo adr --json`
(`status`, counts, and `candidate_list` with `title`, `source` and `suggestedAdrFile`), because the
CLI and MCP share the same `buildTechDecisions(dir)` source. The resource is deterministic and
read-only: it never writes ADRs, never calls an LLM and never runs git.

## Tech knowledge structure

Not every technical document has the same maturity. `knowledge/tech/` separates three areas
(VS-075.2):

```txt
knowledge/tech/
  current-state.md          ← core: current technical state
  codebase.md               ← core: repository map
  decisions/                ← formal ADRs (draft/accepted/superseded/deprecated)
  discovery/                ← discovery notes + inputs
    architecture-notes.md
    decision-candidates.md
```

**Backward compatible.** Kaddo reads `knowledge/tech/discovery/decision-candidates.md` first and falls
back to the legacy `knowledge/tech/decision-candidates.md` (same for `architecture-notes.md`). When
both exist, discovery/ wins and `kaddo adr` shows a soft note. `kaddo explain` shows a `## Tech
Knowledge` section (Core / Decisions / Discovery) and warns when discovery files are still in the
legacy root. The Tech layer's maturity depends on `current-state.md` + `codebase.md` — discovery files
are **not** required to mark Tech as Structured.

### `kaddo tech organize`

A deterministic migration that moves discovery artifacts into `knowledge/tech/discovery/`:

```bash
kaddo tech organize
```

It moves `architecture-notes.md` and `decision-candidates.md` from the `knowledge/tech/` root into
`discovery/` **without changing content**, never touches `current-state.md`, `codebase.md` or
`decisions/`, and **never overwrites** — if a target already exists it warns and leaves both files for
manual review. No LLM, no git.

## Clean ADR filenames

Suggested ADR filenames are cleaned before the slug is built (VS-075.1): list/heading prefixes are
stripped (`1.`, `2)`, `(3)`, `001.`, `-`, `##`) so numbering isn't duplicated, and acronyms are
normalized (`INTERNAL_CRON_SECRET` → `internal-cron-secret`). So a candidate
`## 1. Shared secret (INTERNAL_CRON_SECRET)` yields
`ADR-001-shared-secret-internal-cron-secret.md`, not `ADR-001-1-...`.

## The three levels

```txt
decision candidate  →  ADR draft  →  accepted ADR
```

- **decision candidate** — identified but not formalized (a `##` section in
  `knowledge/tech/decision-candidates.md`).
- **ADR draft** — an ADR created from a candidate, `status: draft`, with `created_from:` recording its
  origin; the decision and consequences stay `[open]` until a human confirms.
- **accepted ADR** — reviewed and `status: accepted`. **Never** set automatically.

## Handoff example

```txt
ADR candidates found:

1. Shared secret for internal endpoints
   Source: knowledge/tech/decision-candidates.md
   Suggested ADR: knowledge/tech/decisions/ADR-001-shared-secret-for-internal-endpoints.md

Next:
  Use the adr-writing skill to create ADR drafts from these candidates
```

## Blocking behavior

Decision candidates **do not block the roadmap** — you can plan while decisions are still candidates.
But before **implementing** a technical Work Item affected by an unformalized decision, the
work-item-agent and implementation-agent **warn** and recommend materializing the ADR first. Work
Items can reference `related_decisions: [ADR-001-...]` (or `decision_candidates: [<title>]` when no ADR
exists yet) for traceability.

## The adr-writing skill

The `adr-writing` skill documents the standard ADR format: front matter with
`status: draft | accepted | superseded | deprecated`, and the sections **Context**, **Options
Considered**, **Decision**, **Consequences**, **Related Capabilities** and **Related Work Items**. To
materialize a candidate, it copies the candidate's context and options and leaves the decision and
consequences as `[open]` — it never invents decisions, options or consequences.
