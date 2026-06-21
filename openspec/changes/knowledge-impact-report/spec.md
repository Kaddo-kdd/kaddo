# Spec: Knowledge Impact Report (VS-061)

## Command
- `kaddo report impact` (alias `kaddo impact`) prints a deterministic Markdown report; no LLM.
- `--json` prints structured JSON; `--output <path>` writes a file. Without `--output` nothing is
  written.

## Sections
- Executive Summary, Knowledge Health, Knowledge Coverage, Ownership Coverage, Traceability,
  Context Readiness, Work Item Readiness, Graph Quality, Guard Activity (`not available`), Impact
  Signals, Suggested Actions. Optional Knowledge Impact Score (or `not available`).

## Degradation
- Missing graph / hints / context-pack / explain artifacts → "not available" + a regenerate
  suggestion. Active scope with no active Work Items → empty graph quality is explained.

## Constraints
- No LLM, no money/ROI, no individual productivity. Reads only knowledge + `.kaddo/`.

## MCP
- Resource `kaddo://impact-report` (saved or in-memory, read-only).
- Tool `kaddo_generate_impact_report` (`format` markdown|json, `scope` active|all, `output`) writes
  only under `.kaddo/reports/`.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: healthy-graph project, active-empty graph, missing derived artifacts, JSON output, file
  output (md + json), MCP resource + tool + reports allowlist.
