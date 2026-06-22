# Spec: Estimated Savings Model (VS-062)

## Commands
- `kaddo savings` (alias `kaddo report savings`): deterministic Markdown report; `--json`,
  `--output`, `--scope active|all` (default `all`). Writes nothing without `--output`.
- `kaddo savings init`: write `.kaddo/savings.yml`; never overwrites without `--force`.

## Model
- Assumptions from `.kaddo/savings.yml` merged over conservative defaults (`assumptions_source`:
  default | file).
- Savings lines: context preparation, review effort, clarification reduction, onboarding
  (× readiness multiplier), architecture discovery (× graph-quality multiplier); drift prevention
  = not available (no Guard history).
- Estimated value = hours × hourly_cost. Report includes disclaimer, assumptions, evidence used,
  per-line formulas, total hours/value, confidence (Low/Medium/High, capped at Medium without
  Guard history) and suggested actions.

## Constraints
- No LLM, no exact ROI, no individual productivity. Reuses the impact report as evidence.

## MCP
- Resource `kaddo://savings-report` (saved or in-memory, read-only).
- Tool `kaddo_generate_savings_report` (`format`, `scope`, `output`) writes only under
  `.kaddo/reports/`.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: defaults (no savings.yml), custom assumptions, all sections + totals + confidence + drift
  not-available, JSON shape, file output, `savings init` (+ `--force`), MCP resource + tool.
