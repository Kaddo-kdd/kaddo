# Spec: Impact Report Actionable Gaps (VS-061.1)

## Actionable Gaps
- The report includes an `Actionable Gaps` section when gaps exist; otherwise "No actionable
  knowledge gaps detected."
- Detects, per Work Item: missing source, initiative, code ownership, knowledge level, acceptance
  criteria, Definition of Done, validation/how-to-test (EN + ES section variants).
- Detects broad ownership globs (ends with `/**`, ≤ 2 segments) and ownership overlaps (a glob
  owned by > 1 Work Item, shown with the involved Work Items).
- Each gap item has `id`, `title`, `status`, `path`, `suggested_action`.

## Suggested Actions & Score Breakdown
- Suggested Actions name specific Work Items (grouped when many).
- A Score Breakdown shows each bucket's points/max.

## JSON
- `--json` includes a stable `actionable_gaps` object (one array per gap type) and
  `score_breakdown`.

## Constraints
- No file edits, no agent execution, no LLM. Main score unchanged.

## MCP
- `kaddo://impact-report` and `kaddo_generate_impact_report` include the actionable gaps.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: report with gaps, report without gaps, JSON actionable_gaps, ownership overlaps, broad
  globs, MCP tool includes gaps.
