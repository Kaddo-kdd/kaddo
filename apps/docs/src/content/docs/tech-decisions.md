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
