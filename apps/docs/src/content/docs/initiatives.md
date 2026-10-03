---
title: Initiatives
description: Initiatives — the optional outcome layer that connects product intent to executable delivery, with lifecycle, candidates, progress, analysis and external traceability.
---

An **Initiative** is Kaddo's optional **outcome layer**: it connects product intent to executable
delivery. Initiatives are first-class artifacts under `knowledge/delivery/initiatives/`
(`INI-xxx-*.md`), but they are never required — a Work Item can live and complete its whole
lifecycle without one.

```text
Product Intent → Initiative → Work Item Candidates → Work Items → … → Verification → Completion Review
```

## Initiatives are optional

Standalone Work Items keep working exactly as before:

```bash
kaddo create feature
```

A Work Item with no `initiative` recorded runs through `draft → ready → in-progress → completed`
with no Initiative-related errors. Initiatives add traceability when you want it; they never gate
small, emergent or independent work.

## Lifecycle

```text
candidate → planned → in-progress → completed
```

with alternative states `deferred` and `cancelled`. Materialized Initiatives usually start at
`planned`. Transitions are validated; completion is **human-gated** (see below).

## Relationship to the roadmap

The roadmap (`knowledge/delivery/roadmap.md`) stays the strategic view (Now / Next / Later). A
roadmap initiative (`RM-xxx`) can be **materialized** into a first-class Initiative, preserving
provenance:

```yaml
source: roadmap
source_id: RM-001
```

The existing `kaddo create --from roadmap` flow and all `RM-xxx` / `WI-CANDIDATE-xxx` provenance
continue to work unchanged.

## Work Item association

A Work Item is associated to an Initiative by explicit metadata:

```yaml
initiative: INI-001
```

The relationship is optional and many-to-one (many Work Items → one Initiative). Kaddo resolves the
association from the Work Item artifacts themselves — there is no second list to keep in sync.

## Candidates

An Initiative can hold **Work Item candidates** that are not yet materialized. Materializing a
candidate creates a draft Work Item associated to the Initiative and marks the candidate as
materialized, so planning coverage reflects it.

## Progress

Kaddo separates two dimensions — there is no single arbitrary percentage:

- **Planning coverage** — candidates materialized / total.
- **Delivery progress** — associated Work Items by lifecycle state.

## Analysis and completion

`kaddo initiative analyze <id>` performs a grounded gap analysis: success-criteria coverage,
pending candidates, delivery status, and findings. Suggested candidates are the Initiative's own
pending candidates (which carry their source signals) — Kaddo never invents work.

Completion is **human-gated**. `kaddo initiative complete <id>` reports completion readiness and
asks for confirmation. An Initiative is *ready* only when committed scope is covered: no pending
candidates, no uncovered success criteria, and all associated Work Items completed. Kaddo detects
committed-but-uncovered scope **even when every Work Item is completed**, and never marks an
Initiative completed on its own.

## CLI

```bash
kaddo initiative list
kaddo initiative show INI-001
kaddo initiative progress INI-001
kaddo initiative candidates INI-001
kaddo initiative create --title "Authentication Foundation"
kaddo initiative update INI-001 --status in-progress
kaddo initiative materialize INI-001 WI-CANDIDATE-001
kaddo initiative analyze INI-001
kaddo initiative complete INI-001
```

## MCP

Read tools: `kaddo_list_initiatives`, `kaddo_get_initiative`, `kaddo_get_initiative_context`,
`kaddo_get_initiative_progress`, `kaddo_analyze_initiative`,
`kaddo_suggest_initiative_for_external_item`.

Mutation tools (preview without `confirm`, apply with `confirm: true`): `kaddo_create_initiative`,
`kaddo_update_initiative`, `kaddo_add_initiative_candidate`,
`kaddo_materialize_initiative_candidate`, `kaddo_add_initiative_external_link`,
`kaddo_complete_initiative`. Agents can analyze, propose and preview, but never materialize
candidates or complete an Initiative silently.

## External traceability

An Initiative can carry provider-neutral references to external planning items (Jira epics, Azure
DevOps features, GitHub milestones, …):

```yaml
external_links:
  - integration: jira-company
    external_id: AUTH-20
    external_type: epic
    url: https://jira.example/AUTH-20
    external_status: In Progress
```

A Kaddo Initiative is **not** assumed to equal a Jira Epic — the model is provider-neutral. An
`external_status` is stored as a **signal only**: a change to the external item's status (e.g. the
epic becoming "Done") never changes the Initiative's lifecycle. Kaddo keeps its own lifecycle,
completion analysis and human gate.

When a Work Item is imported from an integration and clearly relates to an Initiative (for example
its parent epic is referenced by that Initiative), Kaddo can **suggest** the association
(`kaddo_suggest_initiative_for_external_item`). The association itself requires human confirmation.

## Knowledge Graph

The exported knowledge graph represents Initiative relationships: Initiative → capability
(`targets`), Initiative → external item (`references_external`), Work Item → Initiative
(`belongs_to`), and candidate → Initiative (`belongs_to`) / candidate → Work Item
(`materialized_as`). Existing graph consumers keep working; the Initiative nodes and edges are
additive.

## Agents

The **initiative-agent** understands an Initiative, evaluates coverage, decomposes it into grounded
candidates, and assesses completion readiness — without writing code, materializing work, or
completing an Initiative autonomously. The **backlog-agent** routes a new idea to a standalone Work
Item, a candidate under an existing Initiative, or a new Initiative candidate — without forcing
everything under an Initiative.
