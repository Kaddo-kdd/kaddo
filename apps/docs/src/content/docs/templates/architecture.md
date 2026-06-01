---
title: Architecture templates
description: Current state, architecture notes, decision candidates and ADRs.
---

Templates for capturing and deciding architecture.

| Template | Purpose | Output path | Agent |
|---|---|---|---|
| Current State | Reconstructed architecture baseline | `architecture/current-state.md` | `architecture-agent` |
| Architecture Notes | Working notes, not yet decided | `architecture/architecture-notes.md` | — |
| Decision Candidates | Candidate decisions for review | `architecture/decision-candidates.md` | `adr-agent` |
| ADR | A single accepted decision | `architecture/decisions/` | — |

## Current State

Components, data & integrations, cross-cutting concerns, known gaps and assumptions —
the baseline `architecture-agent` reconstructs from the context pack.

## Architecture Notes

Explicitly non-binding: topic, context, options and what you are leaning towards.
Promote into a Decision Candidate or ADR when ready.

## Decision Candidates

`DC-001` entries with context, options, recommended option and trade-offs. Promote
accepted candidates into individual ADRs.

## ADR

Front matter (`id`, `status`, `date`). Sections: Status · Context · Decision ·
Consequences (including downsides) · Alternatives considered. Install the `adr` module
with `kaddo add adr` to create them as work items.
