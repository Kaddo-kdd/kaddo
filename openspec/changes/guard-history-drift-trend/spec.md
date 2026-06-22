# Spec: Guard History and Drift Trend Report (VS-063)

## Recording
- `kaddo guard` writes no history by default.
- `kaddo guard --record` appends a JSON line to `.kaddo/history/guard-runs.jsonl` (creating the dir)
  and refreshes `.kaddo/history/guard-summary.json`. Each run has `run_id`, `generated_at`,
  `project`, `touched_files`, `matched_artifacts`, `updated_artifacts`, `warnings`, `summary`.
- No personal data / git authors. Never blocks, edits src/ or knowledge/, resolves automatically,
  runs git or calls an LLM.

## Resolution
- A code path warning is resolved when a later run touches the same path, updates a related artifact
  and no longer warns about it; otherwise open. Deterministic only.

## Drift report
- `kaddo drift` (alias `kaddo report drift`): Markdown / `--json` / `--output`; writes nothing
  without `--output`. Includes runs, detected/open/resolved, resolution rate, hotspots, trend
  (improving/stable/worsening/unknown). Clear message when no history.

## Integrations
- `kaddo impact` Guard Activity available with counts when history exists; "not available" otherwise.
- `kaddo savings` Drift Prevention = `resolved × rework_hours_avoided_per_resolved_drift` when
  history has resolved warnings; confidence may reach High (history + custom assumptions).

## MCP
- Resources `kaddo://drift-report`, `kaddo://guard-history`; tool `kaddo_generate_drift_report`
  (writes only under `.kaddo/reports/`). No record tool.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests cover guard with/without `--record`, JSONL append + summary, drift with/without history,
  JSON output, file output, impact + savings integration, MCP resource/tool + no-escape writes.
