# Spec: kaddo start

## Acceptance Criteria
- AC1 — `kaddo start [id]` exists and requires an initialized project + Git repo.
- AC2 — It creates/switches to the work-item branch from `.kaddo/git.yml` (default
  `{type}/{workItemId}-{slug}`).
- AC3 — Branch creation is the only Git action; Kaddo never commits, pushes or merges.
- AC4 — Resolves the target: given id, or the single active Work Item; clear error otherwise.
- AC5 — Prints the delivery lifecycle for the Work Item.
- AC6 — Docs/examples reflect `kaddo start` and the revised guarantee.
- AC7 — Build and tests pass.

## Edge Cases
- Not a Git repo → error (Git required for the branch).
- Branch already exists → switch to it; already on it → report and continue.
- No/multiple active Work Items and no id → clear error.

## Validation
```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
