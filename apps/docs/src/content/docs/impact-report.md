---
title: Impact Report
description: A deterministic, evidence-first report that makes Kaddo's impact on a project tangible — knowledge health, coverage, traceability, readiness and qualitative impact signals.
---

`kaddo report impact` consolidates the value Kaddo already produces into one readable report — for
tech leads, architects, sponsors, product teams and anyone evaluating Kaddo. It answers: how
complete is the knowledge? how connected is the roadmap to the code? how ready is the project to be
understood by humans and AI? what evidence exists for preventing knowledge drift?

## Evidence and applicability

Primary findings are labelled `observed`, `derived`, `estimated`, `projected`, `unknown`, or `not_applicable`. Artifact presence does not prove verified delivery. Initiatives are optional, and POC projects use a reduced Tech/Delivery knowledge baseline.

```bash
kaddo report impact                  # Markdown to stdout (writes nothing) — scope: all
kaddo impact                         # alias
kaddo report impact --json           # structured JSON
kaddo report impact --scope active   # measure only the active context
kaddo report impact --output .kaddo/reports/impact-report.md
kaddo report impact --json --output .kaddo/reports/impact-report.json
```

> **Evidence first, estimation later.** This report shows evidence — it does **not** compute money
> or ROI. Turning these metrics into time/effort/savings estimates is a later step
> (VS-062 — Estimated Savings Model).

## Scope: `all` by default

`kaddo graph export` defaults to `active` (current delivery context); **`kaddo impact` defaults to
`all`** (accumulated knowledge impact) — they have different purposes. The report **builds the graph
fresh in memory** at the resolved scope, so it never inherits an empty `active` graph.json from a
previous export: a well-documented project whose Work Items are all completed still scores fairly.

- `kaddo impact` / `kaddo impact --scope all` → `all` (draft/ready/in-progress/blocked/completed;
  archived excluded).
- `kaddo impact --scope active` → only the active context. If there are no active Work Items it
  reports an empty active graph and a tip: *Run `kaddo impact --scope all` to inspect accumulated
  knowledge impact.*

The JSON carries `scope`, `default_scope` (`all`) and `scope_source` (`default` | `explicit`).

## What it measures

| Section | Shows |
|---|---|
| **Knowledge Health** | maturity of Business / Product / Tech / Delivery layers + inventory, context pack, agents, skills |
| **Knowledge Coverage** | Work Items with declared ownership / provenance / optional initiative / acceptance criteria / Definition of Done / knowledge level |
| **Ownership Coverage** | coverage %, owned code paths, broad globs, ownership overlaps |
| **Traceability** | roadmap candidates → materialized → completed; Work Items connected to roadmap and code; graph nodes/edges/quality/hints |
| **Context Readiness** | Low / Medium / High / Very High, with the reasons behind it |
| **Work Item Readiness** | counts by lifecycle state (draft / ready / in-progress / blocked / completed) |
| **Graph Quality** | scope, quality, nodes, edges, hints, reason |
| **Guard Activity** | recorded Guard runs, warnings and resolution rate; unavailable when no history was recorded |
| **Impact Signals** | qualitative levels plus **drift-prevention evidence** (`Observed` only after recorded resolved warnings; otherwise `Unknown`) |
| **Suggested Actions** | concrete next steps derived from the metrics |

It is fully **deterministic**: built from existing artifacts, **no LLM**. It reads `explain`,
the Work Items, roadmap, the knowledge graph and hints, skills and agents.

## Actionable Gaps

Metrics close with action. Beyond *"Work Items with source: 3/4"*, the report adds an
**Actionable Gaps** section that names exactly which Work Item explains each gap and how to fix it:

```md
## Actionable Gaps

### Work Items missing Acceptance Criteria

- WI-001 — Initialize TypeScript CLI project
  - Path: knowledge/delivery/work-items/completed/WI-001-...md
  - Suggested action: add an `## Acceptance Criteria` section.
```

It detects, per Work Item: a missing `source_id` only for an explicitly roadmap-originated item,
applicable missing `code:` ownership for corrective code work, `knowledge_level`, an
`## Acceptance Criteria` section, a `## Definition of Done` section and a validation
(`## How to test it`) section — plus **broad ownership globs** (e.g. `src/**`, `src/cli/**`) and
shared code-path history. An initiative is optional: its coverage is reported but its absence is
never a gap. Chat, CLI, Admin and external items can have valid provenance without a roadmap ID.
Section variants in English and Spanish are recognized. When there are no gaps it prints
*"No actionable knowledge gaps detected."*

**Suggested Actions** then name specific Work Items (grouping when there are many), e.g.
*"Add Acceptance Criteria to WI-001, WI-005, WI-006."* — and a **Score Breakdown** shows how each bucket
contributed to the score. In `--json`, all of this is under a stable `actionable_gaps` object (one
array per gap type) plus `score_breakdown`.

The report still **never edits Work Items, never runs agents and never calls an LLM** — it points,
you fix.

## Prioritized findings and delivery evidence

`findings` is an additive JSON contract shared by the reports. Each deterministic finding identifies
its source, affected artifacts, evidence, explanation, priority and a suggested review action.
`high` is reserved for an explicit condition (for example a missing applicable knowledge layer);
Graph Hints are review findings, not errors. The Markdown presents **Key Findings** before detailed
inventory and shows each underlying Graph Hint instead of only a count.

**Delivery Evidence** separates completed Work Items from persisted validation states: passed,
failed, pending and not recorded. “Not recorded” means the report has no persisted evidence; it
does not prove a test was never run. Historical missing DoD, validation-section and knowledge-level
metadata is grouped under **Historical Documentation Completeness**, without bulk remediation
recommendations.

## What it does NOT measure

No money, no ROI, no individual productivity, no commits-per-person, no benchmarking against other
teams, no time-trend history, no Jira/Linear/GitHub integration, no LLM interpretation, no web
dashboard. It never sends anything anywhere.

## Scores and signals

The optional **legacy Knowledge Impact Score** (0–100) is deprecated and must not drive delivery,
savings or productivity decisions. It blends six bounded buckets — Knowledge Health (20),
Knowledge Coverage (20), Ownership (15), Traceability (20), Graph Quality (15), Context Readiness
(10) — using simple, transparent rules. Each rounded component stays within its maximum and the
score is their sum. Traceability compares only explicitly connected roadmap candidates with roadmap
candidates; it never divides all Work Items by roadmap candidates. Knowledge Health uses layer
maturity (so `Weak` is not treated as perfect presence). When there are no Work Items yet, the
score reads `not available`.

Ownership coverage counts declared `code:` paths; a shared historical path is review information,
not a conflict without evidence of incompatible ownership. Guard capability, recorded history,
resolved findings and prevention effectiveness are distinct: without recorded resolved findings,
drift-prevention evidence is `Unknown`.

**Impact Signals** are rule-based, e.g. *AI context readiness = High* when the context pack exists,
graph quality is not `empty`, skills are installed and delivery is traceable.

## Graceful degradation

The report never fails on missing derived files — it builds the graph in memory, so it works even
if `kaddo graph export` was never run. Under the default `all` scope a project whose Work Items are
all completed still shows a full, healthy graph. Only `--scope active` shows an empty active graph
when there is no active work — and then it tips you toward `kaddo impact --scope all`
(see [Graph scopes](/knowledge-graph-export/#graph-scopes)).

## Persistence

By default the command writes nothing — it prints to stdout. It only writes when you pass
`--output`. Reports live under `.kaddo/reports/`.

## Over MCP

The [MCP server](/mcp-server/) exposes the report read-only via the `kaddo://impact-report`
resource (returns a saved report, or builds one in memory), and the
`kaddo_generate_impact_report` derived tool (`format` · `scope` · `output`) which writes **only**
under `.kaddo/reports/`.

## Relation to VS-062

This report is the evidence base for **VS-062 — Estimated Savings Model**, where these metrics will
become estimates of time, effort and savings. Until then, Kaddo shows evidence, not money.
