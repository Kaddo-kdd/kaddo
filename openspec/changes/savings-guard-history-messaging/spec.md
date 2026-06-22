# Spec: Savings Guard History Messaging Fix (VS-063.1)

## States
- No guard history → `Guard history: not available`; `drift_prevention.available = false`.
- History with 0 resolved → `Guard history: available`, `Guard runs recorded: N`, `Resolved drift
  warnings: 0`; `drift_prevention.available = true`, `hours: 0`, reason "Guard history exists, but no
  resolved drift warnings have been recorded yet."
- History with resolved > 0 → `drift_prevention` hours = `resolved ×
  rework_hours_avoided_per_resolved_drift`.

## Output
- Evidence includes `guard_history_available`, `guard_runs_recorded`, `resolved_drift_warnings`.
- Markdown Evidence shows available + runs + resolved when history exists; "not available" otherwise.
- Suggested Actions: "persist Guard history" only when no history; otherwise "Continue running
  `kaddo guard --record` …" (+ review open warnings); calibrate when resolved > 0.
- Confidence reasons match the state; High still requires history + resolved + custom assumptions.

## Constraints
- Only savings messaging/logic changes. Base savings calc, drift formula, guard/drift/impact
  unchanged. No LLM, no src/knowledge writes, no git, no history recording. MCP keeps its limits.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: savings without history, with history + 0 resolved, with resolved > 0, JSON fields,
  MCP unaffected.
