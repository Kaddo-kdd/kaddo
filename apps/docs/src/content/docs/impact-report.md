---
title: Impact Report
description: A deterministic, evidence-first report that makes Kaddo's impact on a project tangible — knowledge health, coverage, traceability, readiness and qualitative impact signals.
---

`kaddo report impact` consolidates the value Kaddo already produces into one readable report — for
tech leads, architects, sponsors, product teams and anyone evaluating Kaddo. It answers: how
complete is the knowledge? how connected is the roadmap to the code? how ready is the project to be
understood by humans and AI? how active is Guard as a drift-prevention mechanism?

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
| **Knowledge Coverage** | Work Items with ownership / source / initiative / acceptance criteria / Definition of Done / knowledge level |
| **Ownership Coverage** | coverage %, owned code paths, broad globs, ownership overlaps |
| **Traceability** | roadmap candidates → materialized → completed; Work Items connected to roadmap and code; graph nodes/edges/quality/hints |
| **Context Readiness** | Low / Medium / High / Very High, with the reasons behind it |
| **Work Item Readiness** | counts by lifecycle state (draft / ready / in-progress / blocked / completed) |
| **Graph Quality** | scope, quality, nodes, edges, hints, reason |
| **Guard Activity** | last drift signals (currently `not available` — Guard history is not persisted yet) |
| **Impact Signals** | qualitative levels: ambiguity reduction, drift prevention, onboarding, delivery traceability, AI context readiness, maintenance readiness |
| **Suggested Actions** | concrete next steps derived from the metrics |

It is fully **deterministic**: built from existing artifacts, **no LLM**. It reads `explain`,
the Work Items, roadmap, the knowledge graph and hints, skills and agents.

## Actionable Gaps

Metrics close with action. Beyond *"Work Items with source: 3/4"*, the report adds an
**Actionable Gaps** section that names exactly which Work Item explains each gap and how to fix it:

```md
## Actionable Gaps

### Work Items missing initiative

- WI-001 — Initialize TypeScript CLI project
  - Path: knowledge/delivery/work-items/completed/WI-001-...md
  - Suggested action: add `initiative` to connect this Work Item to a delivery initiative.
```

It detects, per Work Item: missing `source`/`source_id`, `initiative`, `code:` ownership,
`knowledge_level`, an `## Acceptance Criteria` section, a `## Definition of Done` section and a
validation (`## How to test it`) section — plus **broad ownership globs** (e.g. `src/**`,
`src/cli/**`) and **ownership overlaps** (a glob owned by more than one Work Item, shown with the
involved Work Items). Section variants in English and Spanish are recognized. When there are no
gaps it prints *"No actionable knowledge gaps detected."*

**Suggested Actions** then name specific Work Items (grouping when there are many), e.g.
*"Add an `initiative` to WI-001, WI-005, WI-006."* — and a **Score Breakdown** shows how each bucket
contributed to the score. In `--json`, all of this is under a stable `actionable_gaps` object (one
array per gap type) plus `score_breakdown`.

The report still **never edits Work Items, never runs agents and never calls an LLM** — it points,
you fix.

## What it does NOT measure

No money, no ROI, no individual productivity, no commits-per-person, no benchmarking against other
teams, no time-trend history, no Jira/Linear/GitHub integration, no LLM interpretation, no web
dashboard. It never sends anything anywhere.

## Scores and signals

An optional **Knowledge Impact Score** (0–100) blends six buckets — Knowledge Health (20),
Knowledge Coverage (20), Ownership (15), Traceability (20), Graph Quality (15), Context Readiness
(10) — using simple, transparent rules. When there are no Work Items yet, the score reads
`not available`.

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
