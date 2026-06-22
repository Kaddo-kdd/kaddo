---
title: Drift Report
description: Persist a deterministic history of guard runs and report whether code and knowledge are drifting apart or staying in sync over time.
---

`kaddo guard` detects possible drift between code and knowledge in the moment. With **`--record`**,
each run is persisted so Kaddo can answer questions over time: how many drift warnings appeared, how
many were resolved, which areas are hotspots, and whether the project is improving.

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
(`improving` / `stable` / `worsening` / `unknown`). Without history it prints a clear "no guard
history recorded yet" message. It writes nothing unless `--output` is given (reports live in
`.kaddo/reports/`).

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
