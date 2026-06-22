# Tasks: Guard History and Drift Trend Report (VS-063)

## Phase 1 — Core
- [x] `core/guard-history.ts`: types, `recordGuardRun` (JSONL + summary), `loadGuardRuns`,
      `resolveDriftThreads`, `buildGuardHistory` (open/resolved/hotspots/trend).
- [x] `core/drift-report.ts`: `buildDriftReport` + Markdown/JSON renderers.

## Phase 2 — Commands
- [x] guard `--record` (record run; never blocks, no git, no src/knowledge writes).
- [x] `commands/drift.ts`; `drift` + `report drift` in index.ts; command-help entry.

## Phase 3 — Integrations
- [x] impact-report: Guard Activity from history (available/not available).
- [x] savings: Drift Prevention from resolved warnings; confidence may reach High.

## Phase 4 — MCP
- [x] `generateDriftReport`; `kaddo://drift-report` + `kaddo://guard-history` resources;
      `kaddo_generate_drift_report` tool (only `.kaddo/reports/`). No record tool.

## Phase 5 — Docs & tests
- [x] New Drift Report page (EN/ES) + sidebar; Guard, Commands Overview, MCP Server cross-links;
      READMEs.
- [x] CLI tests (guard-history, drift command, guard --record, impact + savings integration);
      MCP tests (drift resource/tool, guard-history, no history-write).

## Validation
- [x] `pnpm test` green (577); typecheck green; `pnpm -r build` green; smoke guard --record + drift.
- [x] `astro build` green.
