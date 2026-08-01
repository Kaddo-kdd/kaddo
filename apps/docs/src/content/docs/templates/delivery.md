---
title: Delivery templates
description: How the product evolves — work items and roadmap.
---

The **Delivery** layer answers *how do we evolve it?* — the everyday units of the Kaddo
loop, under `knowledge/delivery/`.

| Template | Purpose | Output path | Command | Agent |
|---|---|---|---|---|
| Work Item | Smallest traceable unit of product evolution | `knowledge/delivery/work-items/<state>/` | `kaddo create` | `work-item-agent` |
| Roadmap | Initiatives + candidate work items | `knowledge/delivery/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |

## Work Item

The unit Guard, classify, history and learn revolve around. Carries front matter for
traceability (`id`, `type`, `knowledge_level`, `source`, `domains`, `capabilities`,
`code`). Phase and initiative stay in front matter as planning and functional traceability;
folders represent lifecycle state. Sections: Problem · Expected result · Acceptance criteria ·
Design (optional) · Risks (optional) · Out of scope · How to test it (validation) ·
Definition of Done · Learning. The work-item-agent and implementation-agent always state
**how to test it** so a finished change can be verified.

Official lifecycle states are `draft`, `ready`, `in-progress`, `blocked`, `completed` and
`archived`. Agents should treat only `draft`, `ready`, `in-progress` and `blocked` as active
work; `completed` and `archived` are historical knowledge.

Official Work Item types are `feature`, `bugfix`, `hotfix`, `spike` and `chore` (technical /
maintenance / tooling work). See [create](/commands/create/#work-item-types).

> Declare `code:` globs so Guard can relate changes to the work item.

### Completed delivery state

A project with all Work Items completed enters **Maintenance** phase. Kaddo distinguishes
the absence of active work from the absence of any work:

- `No work items found` only appears in Missing Context when **zero** Work Items exist.
- Completed or archived Work Items prevent the missing-context warning.
- The project route marks `Refine Work Item: done` for any WI that reached `ready`,
  `in-progress`, `blocked`, `completed`, or `archived`.
- Readiness reflects the delivery state: `delivery-completed`, `delivery-completed-release-ready`,
  or `delivery-completed-release-blocked` — independent of the recommended next step.
- `kaddo explain` and `kaddo understand` show a **Delivery Summary** with completed/active
  counts, implementation completions, and release gate status.
- Context JSON exposes `activeWorkItems`, `completedWorkItems`, `archivedWorkItems`, and
  `allWorkItems`. The legacy `workItems` field aliases `activeWorkItems`.
- Completed legacy Work Items (without `implementation_status` / `validation_status` /
  `release_status`) default to `not-assessed`, not `not-started`.

### End-to-end scope refinement

Kaddo supports explicit scope coverage metadata to prevent incomplete refinement.
A Work Item can declare:

- **`scope_confidence`** — `high`, `medium`, or `low` with reasons.
- **`module_coverage`** — each mapped module as `affected`, `reviewed-not-affected`,
  `unknown`, or `not-applicable`.
- **`impact_analysis`** — each surface (frontend, backend, database, etc.) with the
  same statuses.

Guard validates consistency between `affected_modules` and `module_coverage`, warns
when user-facing Work Items have unassessed frontend modules, and flags `ready` Work
Items with low confidence or unknown modules. These fields are optional for
backward compatibility.

The work-item-agent reconstructs the outcome, journey, and evaluates surfaces before
proposing files. The implementation-agent performs a pre-implementation scope review.
The work-item-refinement skill standardizes outcome framing, journey reconstruction,
surface review, module review, and completeness review.

### Independent status dimensions

Beyond the lifecycle state, Work Items can declare three independent status dimensions
in front matter:

| Dimension | Values | Purpose |
|---|---|---|
| `implementation_status` | `not-started`, `in-progress`, `completed`, `partial`, `blocked` | Tracks code implementation across repos |
| `validation_status` | `not-started`, `in-progress`, `passed`, `failed`, `partial`, `accepted-with-exceptions`, `blocked` | Tracks validation state |
| `release_status` | `not-assessed`, `ready`, `blocked`, `released`, `not-applicable` | Tracks release readiness |

A Work Item can be `completed` (lifecycle) but `release_status: blocked` — these
dimensions are independent.

### Cross-repo implementation evidence

For multirepo projects, Work Items that span multiple repositories declare
`affected_modules` in front matter. `core` is always valid; other modules must be
registered in `.kaddo/modules.yml`.

```yaml
affected_modules:
  - core
  - frontend
implementation_evidence:
  repositories:
    core:
      role: core
      status: implemented
      validations:
        - command: go test ./...
          status: passed
      migrations:
        - id: add-column
          environment: local
          status: applied
```

`kaddo guard --workspace` validates evidence coherence: unregistered modules, modified
but undeclared repos, not-run validations, blocked migrations, and lifecycle/release
gate consistency.

### Release gates and completion exceptions

Release gates are checkpoints that must pass before release:

```yaml
release_gates:
  - id: supabase-migration
    status: blocked
    reason: Project not available
```

Completion exceptions allow closing a Work Item with known deviations, requiring
human approval:

```yaml
completion_exceptions:
  - id: tests-not-executed
    status: accepted
    reason: Not executed by human instruction
    approved_by: human
```

A Work Item with `status: proposed` exceptions cannot be marked as completed.

### Agent history

Work Items track which agents participated in their lifecycle:

- `refined_by`: the agent that refined the Work Item (never overwritten)
- `implemented_by`: the agent that implemented it
- `closed_by`: the human or agent that closed it

### Mermaid graph hardening

The knowledge graph (`kaddo graph`) filters out nodes with empty id or label, edges
referencing non-existent nodes, and escapes quotes, brackets, and newlines in labels.
A project with zero ADRs produces a valid graph without empty `adr[""]` nodes.

## Roadmap

Structured initiatives (`RM-001`) and candidate work items (`WI-CANDIDATE-001`) for
human review — not commitments. `kaddo create --from roadmap` turns candidates into
real Work Items with `source` traceability.
