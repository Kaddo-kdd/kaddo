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

An Initiative can hold **Work Item candidates** that are not yet materialized. A pending candidate
can be **edited** (its id, source signals and provenance are preserved) or **removed** — removal
always requires a justification and is logged under `removed_candidates`, and a removed candidate's
id is **retired, never reused**. A materialized candidate is read-only here; reconcile it through its
Work Item instead.

Materializing a candidate creates a draft Work Item associated to the Initiative and marks the
candidate as materialized, so planning coverage reflects it. Materialization is **idempotent**:
re-running it returns the same Work Item instead of creating a duplicate, and if a forward pointer is
lost (a partial failure) Kaddo recovers it from the Work Item's provenance rather than re-creating
work. A dangling `materialized_as` (the Work Item is gone) is surfaced as an error, never silently
re-created.

## Progress

Kaddo separates two dimensions — there is no single arbitrary percentage:

- **Planning coverage** — candidates materialized / total.
- **Delivery progress** — associated Work Items by lifecycle state.

## Analysis and completion

`kaddo initiative analyze <id>` performs a grounded gap analysis: success-criteria coverage,
pending candidates, delivery status, and findings. Suggested candidates are the Initiative's own
pending candidates (which carry their source signals) — Kaddo never invents work.

Completion is **evidence-based and human-gated**, reusing the same verification contract as Plans and
Epics — there is no parallel verifier. Readiness is one of `READY_TO_COMPLETE`,
`READY_WITH_EXCEPTIONS`, `NEEDS_WORK` or `BLOCKED`. An Initiative is *ready* only when:

- every declared **success criterion** has **recorded outcome evidence** (`passed`, or waived by an
  accepted exception) — a Markdown checkbox is **not** evidence;
- there are no pending candidates and all committed scope is delivered;
- candidate → Work Item provenance is intact (a broken relation is `BLOCKED`).

Evidence is recorded per criterion in frontmatter `outcome_verifications` (same shape as
Epics/Plans). A completed delivery whose outcome is still unverified stays `NEEDS_WORK`. Completion is
never a plain status transition: `transitionInitiative(... 'completed')` is refused, and
`completeInitiative` applies only when readiness is `READY_*`, recording an explicit
`completion_decision`. Kaddo never marks an Initiative completed on its own.

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
`kaddo_update_initiative`, `kaddo_add_initiative_candidate`, `kaddo_update_initiative_candidate`,
`kaddo_remove_initiative_candidate`, `kaddo_materialize_initiative_candidate`,
`kaddo_add_initiative_external_link`, `kaddo_record_initiative_evidence`, `kaddo_complete_initiative`.
Recording evidence rejects any criterion that is not declared in the Initiative's success criteria,
and completion is evidence-gated — it cannot be forced past an unverified outcome. Agents can analyze,
propose and preview, but never materialize candidates, record evidence, or complete an Initiative
silently.

## Admin

The Admin **Initiative** screen manages candidates (add / edit / remove-with-justification /
materialize), shows the **Completion Review** with per-criterion outcome verification, lets a human
record evidence, and offers a gated **Complete** action. Completion never appears as a plain status
button — it is an explicit, evidence-backed decision.

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
