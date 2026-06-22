# Proposal: Estimated Savings Model (VS-062)

## Why

The impact report (VS-061) shows evidence ("Score 94/100", "Ownership 100%") but not the business
question: *how much value might this represent?* Stakeholders need an approximate, transparent
translation of those metrics into time and money.

## What

A new command `kaddo savings` (alias `kaddo report savings`) plus `kaddo savings init`. It reuses
the impact report as evidence and applies **explicit, configurable assumptions** to estimate:

- Context preparation, review effort, clarification reduction, onboarding (× Context-Readiness
  multiplier) and architecture discovery (× graph-quality multiplier) savings.
- Drift prevention: shown as *not available* (Guard history is not persisted yet).
- Estimated value = hours × `hourly_cost`, shown as **Estimated value** (never ROI/profit).

Assumptions live in `.kaddo/savings.yml` (created by `kaddo savings init`, `--force` to overwrite);
sensible conservative defaults are used when absent. Default scope is `all` (like `kaddo impact`);
`--scope active` supported. Output: Markdown (default) / `--json` / `--output`. A **confidence**
level (Low/Medium/High) is included, capped at Medium while Guard history is unavailable.

MCP: read-only `kaddo://savings-report` resource + `kaddo_generate_savings_report` tool writing only
under `.kaddo/reports/`.

## Principle

> Metrics + assumptions = estimated savings. Evidence-based estimate, not exact ROI.

No LLM, no individual productivity, no per-person attribution, no benchmarking, no Guard history
persistence, no Jira/GitHub integration, no dashboard. Writes nothing unless `--output`.

## Impact

- New `core/savings.ts` (assumptions loader + template + builder + Markdown/JSON renderers),
  `commands/savings.ts`, `savings` + `savings init` + `report savings` in index.ts, command-help.
- MCP: `generateSavingsReport`, `kaddo://savings-report`, `kaddo_generate_savings_report`.
- Docs EN/ES (Savings Report page) + Commands Overview / MCP Server cross-links; READMEs.
- Both packages bump to 3.24.0. Additive → minor.
