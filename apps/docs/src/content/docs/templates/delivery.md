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

### Complete example

A Work Item lives in a single `.md` file under `knowledge/delivery/work-items/<state>/`.
The file name follows the pattern `WI-NNN-<slugified-title>.md`. Here is a full example
showing the YAML frontmatter and all standard body sections:

```markdown
---
type: feature
id: WI-042
title: Add CloudWatch alarm for API p99 latency
status: draft
work_type: feature
created_at: "2026-09-25"
affected_modules:
  - core
  - backend
source:
  type: chat
  imported_at: "2026-09-25"
  source_format: markdown
  source_hash: "e3b0c44298fc1c149..."
  inferred: false
generated_by: kaddo-admin
knowledge_level: none
scope_confidence:
  level: medium
  reasons:
    - CloudWatch configuration not yet reviewed
summary: >
  Add a CloudWatch alarm that monitors API Gateway p99 latency
  and alerts the ops team when it exceeds 500ms for 5 consecutive minutes.
original_snapshot:
  title: Add CloudWatch alarm for API p99 latency
  description: Monitor API Gateway p99 latency and alert when > 500ms.
---

# Add CloudWatch alarm for API p99 latency

> Type: feature

## Actor

The operations team that monitors API health.

## Outcome

Receive a notification when p99 latency exceeds 500ms, so the team can
investigate before users are affected.

## Current behavior

No latency alerting exists. The team discovers latency spikes only after
user complaints.

## Target behavior

A CloudWatch alarm fires when API Gateway p99 latency stays above 500ms
for 5 consecutive minutes, sending a message to the #ops-alerts Slack channel.

## Entry points

- AWS CloudWatch → Alarms
- API Gateway → Metrics

## End-to-end flow

1. API Gateway emits latency metrics to CloudWatch.
2. CloudWatch evaluates the p99 statistic every minute.
3. If 5 consecutive datapoints exceed 500ms, the alarm enters ALARM state.
4. An SNS topic triggers a Lambda that posts to Slack #ops-alerts.

## Scope unknowns

- Confirm whether the existing SNS topic supports Slack integration.

## Acceptance criteria

- [ ] CloudWatch alarm configured for API Gateway `p99` metric
- [ ] Threshold: 500ms over 5 consecutive 1-minute periods
- [ ] Notification delivered to Slack #ops-alerts
- [ ] Runbook linked in the alarm description
- [ ] Alarm visible in the ops CloudWatch dashboard
```

**Frontmatter fields at a glance:**

| Field | Purpose |
|---|---|
| `type` / `work_type` | Work Item type (`feature`, `bugfix`, `hotfix`, `spike`, `chore`) |
| `id` | Kaddo-generated unique identifier (`WI-NNN`) |
| `title` | Short descriptive title (max 120 chars) |
| `status` | Lifecycle state (`draft`, `ready`, `in-progress`, `blocked`, `completed`, `archived`) |
| `created_at` | Creation date |
| `affected_modules` | Modules this Work Item touches |
| `source` | Provenance — where the Work Item originated |
| `knowledge_level` | Refinement depth (`none`, `partial`, `complete`) |
| `scope_confidence` | Confidence in scope coverage |
| `summary` | Full intent text |
| `original_snapshot` | External state at import time (only for imported Work Items) |

**Body sections:**

| Section | Purpose |
|---|---|
| Actor | Who benefits from this change |
| Outcome | What success looks like |
| Current behavior | What happens today |
| Target behavior | What should happen after the change |
| Entry points | Where in the system the change starts |
| End-to-end flow | Step-by-step execution path |
| Scope unknowns | Open questions that need answers |
| Acceptance criteria | Checkable conditions for completion |

Not all sections are required. A freshly imported Work Item may only have a title and
summary; refinement fills in the rest.

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
