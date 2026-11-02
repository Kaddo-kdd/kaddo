---
title: Delivery Planning
description: Organize complex delivery with Delivery Plans and Epics — optional canonical artifacts layered over Initiatives and Work Items, with milestones, declared responsibilities, dependencies and verifiable progress. Core is the single source of logic; completion stays human-gated.
---

Roadmap, Initiatives and Work Items cover strategy, grouping and execution. **Delivery Planning** adds
two optional canonical artifacts for coordinating complex delivery without burying milestones and
responsibilities in ad-hoc Markdown:

- a **Delivery Plan** (`PLAN-xxx`) — how a strategic intent becomes phases, with milestones, exit
  criteria, dependencies, success criteria and risks;
- an **Epic** (`EP-xxx`) — a significant outcome spanning several Work Items or fronts of work.

:::note[Optional and backward-compatible]
Plans and Epics are entirely optional. An Initiative can exist without an Epic, a Work Item without an
Initiative, and a project with no plans/epics keeps working exactly as before. Nothing is migrated
automatically.
:::

## Model

```text
Roadmap
   └── Delivery Plan (PLAN-xxx)
         └── Milestone (RM-xx)
               └── Epic (EP-xxx)
                     └── Initiative (INI-xxx)
                           └── Work Items
```

Associations are declared **one way** and never duplicated: `initiative.epic → EP`, `epic.plan` +
`epic.milestone → PLAN/RM`, `work_item.epic` optional. An Epic or Plan **derives** its Initiatives and
Work Items — it never stores a list of them (no second source of truth). Milestones are checkpoints
defined inside the Plan (id, title, exit criteria); they carry no independent lifecycle state.

## Progress — kept separate

Progress is computed from the real state of related elements, never a single arbitrary percentage:

- **Planning coverage** — Initiatives and candidates (materialized vs pending).
- **Delivery progress** — Work Items by lifecycle state, and how many are blocked.
- **Completion readiness** — success criteria, blocking dependencies and whether committed work is
  complete. `meetsCompletionPreconditions` is never positive without real deliverables and declared
  criteria. **Closing a Plan or Epic always requires human approval** — an Epic is never "done" just
  because its Work Items are; the outcome's criteria must also be verified.

## Ownership

An Initiative can declare `owners` and `contributors` — planning metadata only, never authorization and
never inferred from Git. Kaddo distinguishes **Declared Responsibility** (these fields) from **Observed
Git Activity** (a future, read-only capability; not implemented here).

## Dependencies

`depends_on` relates Epics to Epics (and reuses Work Item `depends_on`). Core validates the planning
graph deterministically: invalid references, dependency cycles, duplicate milestones and pending
(blocking) dependencies. A dependency never changes another element's lifecycle.

## CLI

```bash
kaddo plan list
kaddo plan show PLAN-001
kaddo plan progress PLAN-001
kaddo plan create

kaddo epic list
kaddo epic show EP-001
kaddo epic progress EP-001
kaddo epic create
kaddo epic associate EP-001 INI-010
```

## MCP

Read: `kaddo_list_plans`, `kaddo_get_plan`, `kaddo_get_plan_progress`, `kaddo_list_epics`,
`kaddo_get_epic`, `kaddo_get_epic_progress`, `kaddo_validate_planning`. Mutations
(`kaddo_create_plan`, `kaddo_create_epic`, `kaddo_associate_initiative_epic`) follow the
preview/confirm pattern and write only under `knowledge/delivery/`.

## Admin — Planning Explorer

Kaddo Admin includes a **Planning** section (`/planning`) to explore a plan end to end: Plan →
milestones → Epics → Initiatives → Work Items, with derived progress, dependency blocks and declared
responsibilities, and links into Work Item and Initiative detail. It is a read/explore surface — it
never applies changes and never closes a Plan or Epic automatically.

## Knowledge Graph

Plans, milestones and Epics appear as graph nodes; declared relations become `belongs_to` edges
(epic→plan, milestone→plan, initiative→epic) and `depends_on` edges between Epics — declared relations
only, never inferred.
