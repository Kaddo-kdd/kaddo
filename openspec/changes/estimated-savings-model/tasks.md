# Tasks: Estimated Savings Model (VS-062)

## Phase 1 — Core
- [x] `core/savings.ts`: assumptions type + defaults + `loadAssumptions`; `savingsTemplate`;
      `buildSavingsReport` (reuses impact report); `renderSavingsMarkdown` + `serializeSavingsJson`.

## Phase 2 — Commands
- [x] `commands/savings.ts`: `runSavings` (stdout/--json/--output/--scope), `runSavingsInit`
      (+ `--force`).
- [x] index.ts: `savings`, `savings init`, `report savings` alias; command-help entry.

## Phase 3 — MCP
- [x] `generateSavingsReport`; `kaddo://savings-report` resource; `kaddo_generate_savings_report`
      tool (writes only under `.kaddo/reports/`).

## Phase 4 — Docs & tests
- [x] New Savings Report page (EN/ES) + sidebar; Commands Overview + MCP Server cross-links; READMEs.
- [x] CLI tests (defaults, custom assumptions, sections/totals/confidence/drift, JSON, file output,
      savings init/--force); MCP tests (resource in-memory + saved, tool writes under reports).

## Validation
- [x] `pnpm test` green (560); typecheck green; `pnpm -r build` green; smoke `savings`/`savings init`.
- [x] `astro build` green.
