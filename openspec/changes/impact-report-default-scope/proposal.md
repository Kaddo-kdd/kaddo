# Proposal: Impact Report Default Scope (VS-061.2)

## Why

`kaddo impact` should reflect **accumulated** knowledge impact (roadmap → work items → code → graph
→ ownership → traceability → readiness). But it inherited the graph from the last `graph export`,
which defaults to `active`. A well-documented project with only completed Work Items could read
`Scope: active / Graph quality: empty / Score 77` even though `--scope all` was healthy — an
artificial penalty.

## What

- `kaddo impact` / `kaddo report impact` default to **`scope: all`**; `--scope active` is explicit.
  (`kaddo graph export` keeps defaulting to `active` — different purpose.)
- The report **builds the graph fresh in memory** at the resolved scope, so it never depends on the
  scope of a persisted `graph.json`.
- JSON adds `default_scope: "all"` and `scope_source: "default" | "explicit"`.
- Markdown shows the scope used + a short default-scope note; under `--scope active` with no active
  Work Items it tips toward `kaddo impact --scope all` (not just `graph export`).
- MCP `kaddo://impact-report` and `kaddo_generate_impact_report` default to `all` and accept
  `active`.

## Principle

> Graph active = current work. Graph all = accumulated value. Impact report = accumulated value.

## Out of scope

No change to `kaddo graph export` defaults, active/all semantics, the score formula, report
persistence, savings/ROI, Work Item edits, agents or LLM.

## Impact

- `core/impact-report.ts`: resolve scope (default all), always build graph in memory, add
  `default_scope`/`scope_source`, scope-aware suggested action + tips.
- `commands/report.ts` + index.ts: `--scope` option.
- MCP generate/resource pass `scopeSource`. Docs EN/ES. Patch 3.23.2 (both packages).
