# Proposal: Savings Guard History Messaging Fix (VS-063.1)

## Why

After VS-063, when guard history exists but has no resolved drift warnings, `kaddo savings`
contradicted itself: `Evidence Used` said "Guard history: not available" while `Confidence` said
"Guard history available (0 resolved drift warning(s))". The report didn't distinguish "no history
at all" from "history exists with zero resolved warnings".

## What

Make `kaddo savings` (CLI + MCP) report three distinct states:

1. **No history** → `Guard history: not available`; drift prevention *not available*.
2. **History, 0 resolved** → `Guard history: available` + runs recorded + `Resolved drift warnings:
   0`; drift prevention **available at 0 h** with reason "Guard history exists, but no resolved
   drift warnings have been recorded yet."
3. **History, resolved > 0** → drift prevention = `resolved × rework_hours_avoided_per_resolved_drift`.

Evidence now includes `guard_runs_recorded` and `resolved_drift_warnings`. Suggested Actions drop
"persist Guard history" once history exists and instead recommend continuing `kaddo guard --record`
(and reviewing open warnings). Confidence reasons match the state.

## Scope

Only `kaddo savings` output/logic (CLI + `kaddo://savings-report` + `kaddo_generate_savings_report`).
No change to the base savings calculation, the drift-prevention formula, guard, drift, impact, or
confidence thresholds beyond related messaging. No LLM, no src/knowledge writes, no git, no history
recording.

## Impact

- `core/savings.ts`: drift available whenever history exists (0 h when no resolved); evidence +
  reasons + suggested actions per state; Markdown evidence + Drift Prevention render.
- Docs EN/ES (Savings Report). Patch 3.25.1 (both packages).
