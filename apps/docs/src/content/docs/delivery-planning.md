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
  complete. `meetsCompletionPreconditions` is a *structural* signal only; the canonical readiness is
  the evidence-based evaluation below. **Closing a Plan or Epic always requires human approval** — an
  Epic is never "done" just because its Work Items are; the outcome's criteria must also be verified.

## Lifecycle & evidence-based completion

Plans and Epics have a real, human-gated lifecycle. Kaddo separates **work finished** (all Work Items
done) from **outcome achieved** (the declared success criteria verified with evidence).

**Transitions.** `draft`/`planned` → `in-progress` → `completed` / `cancelled`. Starting and cancelling
are ordinary transitions; **completing is a dedicated, gated operation** — the general transition
refuses `→ completed` and points to the completion command. Transitions preserve the id, relations,
unknown frontmatter and Markdown body, and use the same revision fingerprint for optimistic concurrency.

**Outcome verification.** Each declared success criterion (and each milestone exit criterion) can carry
a verification record — `status` (passed / failed / not-verified / manual-review-required), `evidence`
(what it shows, not just a checkbox), `reference` (file, test, ADR, report), `method` and `verified_by`
— stored canonically in `outcome_verifications` on the Plan/Epic and in each milestone's
`exit_verifications`. Evidence is matched to a criterion **by its text**: reordering is safe, and
**editing a criterion leaves the old evidence stale** (surfaced, never silently reattributed or
auto-passed). Criteria that collide in text must be disambiguated before evidence can be attributed.

**Completion readiness** is one of `READY_TO_COMPLETE`, `READY_WITH_EXCEPTIONS`, `NEEDS_WORK` or
`BLOCKED`, with reasons and findings. It is conservative: no outcome, no criteria, unverified or failed
criteria, incomplete committed work, invalid references or a blocking dependency all keep it from being
ready. A `READY_*` status **never completes anything** — completion is an explicit human action that
records a `completion_decision` (readiness, who decided, when, and why). An accepted completion
exception can waive a specific criterion (with a reason), but never a blocking dependency, incomplete
work, missing deliverables or a data-integrity error.

```bash
kaddo epic start EP-001
kaddo epic evidence EP-001 --criterion "SSO works end to end" --status passed \
  --evidence "Verified against Okta/Azure AD" --reference reports/sso.md --method manual --by dev-a
kaddo epic verify EP-001 --json   # read-only readiness
kaddo epic complete EP-001 --by lead   # human-gated; refuses unless READY

kaddo plan start PLAN-001
kaddo plan evidence PLAN-001 --milestone RM-01 --criterion "Go-live checklist signed" --status passed
kaddo plan verify PLAN-001
kaddo plan complete PLAN-001
```

MCP exposes the same via `kaddo_verify_plan` / `kaddo_verify_epic` (read-only), `kaddo_record_plan_evidence`
/ `kaddo_record_epic_evidence`, `kaddo_transition_plan` / `kaddo_transition_epic`, and
`kaddo_complete_plan` / `kaddo_complete_epic` (preview → confirm). A `confirm: true` flag is a
confirmation step, **not by itself proof of human approval**.

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

## Admin — Planning Explorer and Management

Kaddo Admin includes a **Planning** section (`/planning`) to explore a plan end to end: Plan →
milestones → Epics → Initiatives → Work Items, with derived progress, dependency blocks and declared
responsibilities, and links into Work Item and Initiative detail.

From the same space you can also **build and maintain** the planning structure without the CLI:

- **Create a Delivery Plan** (Overview, the Delivery Plans tab, or the empty state) — Kaddo generates
  the id and sets status `draft`.
- **Edit a Plan** (title, objective, success criteria, risks, dependencies, references) and **manage
  its milestones** (add, edit, remove) from the plan detail.
- **Create an Epic** (independent or under a Plan and one of its milestones) and **edit it** (outcome,
  plan, milestone, success criteria, dependencies, related capabilities, decisions).
- **Associate, reassign or remove an Initiative** on an Epic, and manage the same association from the
  Initiative's **Planning Context**.

Every change goes through Core (the same contracts used by the CLI and MCP), so artifacts stay
canonical and interoperable. Edits are **metadata only**: they never change a lifecycle state, and
completion of a Plan or Epic always stays human-gated. References are validated (invalid or circular
Epic dependencies and milestones not defined in the selected Plan are rejected), a milestone still
referenced by an Epic cannot be removed or renamed, and a concurrent edit to the same artifact is
detected via a revision fingerprint so a stale form is never saved silently.

> Associating an Initiative with an Epic is also available from the CLI (`kaddo epic associate`) and
> MCP (`kaddo_associate_initiative_epic`).

## Execution Insights

The Planning **Overview** also presents a **read-only** execution view that turns the signals Core
already computes into decisions, without inventing metrics or duplicating domain rules. It answers
*how are we doing?, what needs attention?, what outcomes have we demonstrated?* — and never writes
anything.

It keeps the three dimensions **separate** (there is no single project percentage or health score):

- **Planning Coverage** — Initiative candidates materialized vs total.
- **Delivery Progress** — **distinct** Work Items by lifecycle state (deduplicated by id across
  Initiative/Epic/Plan associations; independent Work Items are counted separately, never forced into a
  hierarchy).
- **Outcome Verification** — declared success criteria vs recorded evidence (reusing the WI-078/WI-079
  verification engine — no parallel verifier), with `passed` / `failed` / `not-verified` /
  `manual-review` / `ambiguous` / `stale` kept distinct. A completed delivery whose outcome is
  unverified is **not** done.

Three attention **indicators** summarize distinct families (never summed together): **blocking issues**
(blocked dependencies, broken relations and provenance), **outcome needs verification**, and
**milestones needing review** (exit criteria pending, failed or ambiguous — never inferred from the
Epic's status).

A **Needs attention** queue lists deterministic, explained signals — `dependency`,
`incomplete-delivery`, `pending-candidates` (a coverage signal, not an execution blocker),
`unverified-outcome`, `provenance` and declared `risk` (declared risks are a separate category from
detected blockers; there is no invented risk score). Each entry carries its artifact, a concrete
reason and a link to the canonical detail, and is filterable by signal type and artifact type.
**Completion readiness** (`READY_TO_COMPLETE` / `READY_WITH_EXCEPTIONS` / `NEEDS_WORK` / `BLOCKED`) is
shown **distinct** from lifecycle `completed` — "ready" means human approval can be requested, not that
the entity is closed. When a denominator is zero, the view shows "no data" instead of a fabricated 0%.

On the Overview the queue is a **compact summary** — at most five findings or groups up front, with the
honest total of findings and affected artifacts — so Delivery Plans, Epics and Initiatives stay visible.
**View all findings** opens a read-only **attention explorer** (an in-place drawer, no new route) that
filters by signal type, artifact type and severity, groups by artifact without losing individual
findings, and keeps the counts honest when filtered. Each finding shows its artifact, a diagnostic, an
`impact` and a concrete **next step** (`Review Initiative`, `Inspect reference`, `Review outcome
evidence`…) — a review action, never an auto-fix. There is no dismiss, resolve or state change.

### Provenance diagnostics

A candidate's `materialized_as` is a **1:1** reference — exactly one canonical Work Item id. Core
classifies each one (reusing the WI-078/WI-079 engine, no parallel verifier) rather than string-matching
the whole value:

- **valid** — resolves to one existing, consistently-associated Work Item;
- **missing** — a single canonical id that does not exist → **blocking** integrity defect;
- **mismatch** — the Work Item exists but belongs to another Initiative → **blocking**;
- **ambiguous (legacy)** — a value that is not a single canonical id (e.g. a historical composite like
  `AN-005, AN-006, AN-007`) → a **warning**, never claimed as a missing Work Item.

An ambiguous reference is **never rewritten, split or migrated**, and recognizing its shape never marks
it validated: it is not counted as validated coverage and keeps the Initiative out of `READY`
(`NEEDS_WORK`) until inspected. Genuine missing/mismatch defects stay blocking. `materialized_as` stays
1:1 — this is a diagnosis, not a contract change.

**Honest coverage.** Planning Coverage distinguishes **declared** materialization (`materialized`, the
field is set) from **validated** references (`validated`, the reference resolves). When they differ the
Overview shows both ("41 declared · 38 validated") with `unresolved = materialized − validated`; a
declared reference is never presented as verified integrity.

The projection is served read-only at `GET /api/v1/admin/planning/insights`.

## Knowledge Graph

Plans, milestones and Epics appear as graph nodes; declared relations become `belongs_to` edges
(epic→plan, milestone→plan, initiative→epic) and `depends_on` edges between Epics — declared relations
only, never inferred.
