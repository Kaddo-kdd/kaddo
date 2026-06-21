# Tasks: Knowledge Impact Report (VS-061)

## Phase 1 — Core
- [x] `core/impact-report.ts`: `buildImpactReport` + `renderImpactMarkdown` + `serializeImpactJson`
      (deterministic; reuses explanation/work-items/skills/graph builders).

## Phase 2 — Command
- [x] `commands/report.ts` (`runReportImpact`): stdout by default, `--json`, `--output` writes file.
- [x] index.ts: `report impact` subcommand + `impact` alias; command-help entry.

## Phase 3 — MCP
- [x] derived-write allowlist adds `.kaddo/reports/`.
- [x] `generateImpactReport`; `kaddo://impact-report` resource; `kaddo_generate_impact_report` tool.

## Phase 4 — Docs & tests
- [x] New Impact Report page (EN/ES) + sidebar; Commands Overview + MCP Server cross-links; READMEs.
- [x] CLI tests (sections, degradation, active-empty, JSON shape, command stdout/json/file output);
      MCP tests (resource in-memory + saved, tool writes under reports, allowlist).

## Validation
- [x] `pnpm test` green (542); typecheck green; `pnpm -r build` green; smoke `report impact`.
- [x] `astro build` green.
