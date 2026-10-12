---
title: Drift Report
description: Persist a deterministic history of guard runs and report whether code and knowledge are drifting apart or staying in sync over time.
---

`kaddo guard` detects possible drift between code and knowledge in the moment. With **`--record`**,
each run is persisted so Kaddo can answer questions over time: how many drift warnings appeared, how
many were resolved, which areas are hotspots, and whether the project is improving.

## Evidence boundaries

The report always shows the deterministic consistency evidence it can evaluate: recorded Guard
history, persisted Work-Item lifecycle validation, deprecation-plan checks and knowledge topology.
Each is classified independently as `observed`, `derived`, `unknown` or `not_applicable`.
`unknown` means insufficient evidence, never a clean result.

```bash
kaddo guard --record           # run guard AND record it to .kaddo/history/
kaddo drift                    # Markdown trend report (writes nothing)
kaddo report drift             # alias
kaddo drift --json
kaddo drift --output .kaddo/reports/drift-report.md
```

> Deterministic, local and read-only by intent: no LLM, no git, no commit blocking, no automatic
> drift resolution, no per-person attribution.

## Recording guard history

By default `kaddo guard` writes nothing. `kaddo guard --record`:

1. Runs Guard normally.
2. Appends one JSON line to `.kaddo/history/guard-runs.jsonl`.
3. Refreshes `.kaddo/history/guard-summary.json`.
4. Prints a short "Guard run recorded" note.

Each line records `run_id`, `generated_at`, `project`, `touched_files`, `matched_artifacts`,
`updated_artifacts`, `warnings` and a `summary` — **never git authors or personal data**. It never
modifies `src/`, `knowledge/` or Work Items, never resolves warnings automatically and never runs
git.

## What a drift warning means

A warning is a *possible knowledge drift*: a touched code path matched one or more artifacts (by
their `code:` globs) that were **not** updated in the same change. It's an FYI, never a blocker.

## How resolution is detected

Purely from deterministic signals — no content comparison, no LLM. A code path's warning is marked
**resolved** when a later recorded run:

1. touches the same `code_path`,
2. updates one of the related artifacts, and
3. no longer warns about that path.

Otherwise it stays **open**.

## The report

`kaddo drift` reads the history and reports: guard runs recorded, warnings detected / open /
resolved, **resolution rate**, **hotspots** by path, open/resolved warning threads, and a **trend**
(`improving` / `stable` / `worsening` / `unknown`). Without history it still prints the current
Consistency Evidence, then a **Historical Drift Trend** section marked unavailable — it does not
mean zero drift or a clean project. It writes nothing unless `--output` is given (reports live in
`.kaddo/reports/`).

## Current consistency findings

The additive `current_consistency_findings` contract reuses executed deterministic checks, including
the concrete Graph Hints and deprecation-target findings when present. Each entry keeps source,
affected artifacts, evidence, priority, resolution status and a review action. Findings are grouped
as `consistency_violation`, `coverage_gap`, `review_hint` and `historical_drift`: optional capability
links are coverage gaps, unreferenced capsules are review hints, and historical drift is unavailable
until comparable Guard history exists. No entries means only that the executed checks produced no
findings; it does **not** declare the project drift-free.

**Structural Consistency Boundaries** makes deprecation evidence explicit: target checks validate
declared structural state, not operational removal from production, infrastructure or external
consumers. With no Guard history, the report recommends `kaddo guard --record`: one recorded run
creates an observation, while multiple comparable runs are needed to assess a historical trend.
Plans with `targets: []` are reported as **not evaluated**, never as passed; the report separately
counts discovered plans, plans without targets, evaluated plans, structural findings and plans with
no structural findings.

## Feeds impact and savings

- [`kaddo impact`](/impact-report/) — the **Guard Activity** section becomes *available* with run
  counts and resolution rate (instead of "not available").
- [`kaddo savings`](/savings-report/) — **Drift Prevention** turns on:
  `resolved drift warnings × rework_hours_avoided_per_resolved_drift` (from `.kaddo/savings.yml` or
  default), adding to estimated hours/value. With recorded resolution + custom assumptions,
  confidence can reach **High**.

## Over MCP

Read-only: the `kaddo://drift-report` and `kaddo://guard-history` resources, and the
`kaddo_generate_drift_report` tool (writes only under `.kaddo/reports/`). **Recording history is not
an MCP tool** — `guard --record` stays an explicit CLI action so an agent never records runs without
human intent.

## Out of scope

No visual dashboard, CI/GitHub Actions integration, Jira/Linear, AI severity, per-author drift,
Slack/email, remote history or external telemetry.
