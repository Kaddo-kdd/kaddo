# Proposal: Guard History and Drift Trend Report (VS-063)

## Why

`kaddo guard` detects drift in the moment but does not persist results, so impact shows "Guard
history: not available" and savings can't estimate avoided rework. Kaddo can't answer how many
drift warnings appeared, how many were resolved, which areas are hotspots, or whether the project is
improving.

## What

Deterministic, local, opt-in guard history + a drift trend report.

- `kaddo guard --record` runs guard and appends a JSON line to `.kaddo/history/guard-runs.jsonl`,
  refreshing `.kaddo/history/guard-summary.json`. Default `kaddo guard` still writes nothing.
- `kaddo drift` (alias `kaddo report drift`) reads the history and reports runs, warnings detected/
  open/resolved, resolution rate, hotspots, open/resolved threads and a trend (improving/stable/
  worsening/unknown). Markdown / `--json` / `--output`; writes nothing without `--output`.
- Resolution is detected only from deterministic signals: a later run touches the same `code_path`,
  updates a related artifact, and no longer warns about it.
- `kaddo impact` Guard Activity becomes *available* with real counts; `kaddo savings` activates
  Drift Prevention (`resolved × rework_hours_avoided_per_resolved_drift`) and may reach High
  confidence.
- MCP: read-only `kaddo://drift-report` + `kaddo://guard-history` resources and
  `kaddo_generate_drift_report` tool (writes only under `.kaddo/reports/`). Recording history is
  **not** an MCP tool — it stays an explicit CLI action.

## Principle

> Kaddo doesn't invent drift; it records observable evidence. Deterministic, local, no LLM, never
> blocks commits, never modifies code/knowledge, no per-person attribution.

## Impact

- New `core/guard-history.ts` (record + aggregate + resolution) and `core/drift-report.ts`;
  `commands/drift.ts`; `guard --record`; `drift` + `report drift`; command-help.
- impact-report + savings integrations.
- MCP resources/tool. Docs EN/ES (new Drift Report page). Both packages bump to 3.25.0.
