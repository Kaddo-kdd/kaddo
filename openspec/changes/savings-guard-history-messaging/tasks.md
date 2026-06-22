# Tasks: Savings Guard History Messaging Fix (VS-063.1)

- [x] core/savings.ts: drift available whenever history exists (0 h when no resolved warnings, with
      reason); evidence adds `guard_runs_recorded` + `resolved_drift_warnings`; confidence reasons +
      suggested actions per state.
- [x] Markdown render: Evidence shows available/runs/resolved; Drift Prevention shows available 0 h
      + reason.
- [x] DriftSavings type allows `available: true` with optional `reason`.
- [x] Tests: no history; history + 0 resolved (available 0 h, no "persist" action); resolved > 0.
- [x] Docs EN/ES (Savings Report: three states + updated confidence). npm README roadmap.
- [x] Both packages bump to 3.25.1.

## Validation
- [x] `pnpm test` green (579); typecheck green; `pnpm -r build` green; smoke (3 states).
- [x] `astro build` green.
