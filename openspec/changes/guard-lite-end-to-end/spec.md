# Spec: Guard Lite End-to-End

## User Story

As a Kaddo user, I want `kaddo guard` to tell me when I change code that an artifact owns
without updating that artifact, so my knowledge stays in sync with my code.

## Expected Behavior

Given artifacts that declare `code:` ownership globs, when I change matching files without
touching the artifact, `kaddo guard` shows a clear, non-blocking FYI about possible drift.

## Acceptance Criteria

### AC1 — Drift is detected against real artifacts
Guard reads `code:` globs from artifacts under `architecture/` (Work Items included) and
flags changed files that match.

### AC2 — No warning when the artifact was updated
If the artifact file was also changed in the diff, no FYI is shown for it.

### AC3 — Declared ownership only
Artifacts without `code:` globs do not participate. No inference is performed.

### AC4 — Silent without ownership
If no artifact declares ownership, Guard is silent by default.

### AC5 — Output is clear and actionable
The FYI states the artifact (id, type, level), the matching changed files, the declared
ownership glob, that the artifact was not updated, and a suggested action.

### AC6 — Non-blocking
Guard never changes its exit code based on drift; it is advisory only.

### AC7 — Cross-platform paths
Windows-style paths (backslashes) match POSIX-style globs.

### AC8 — No LLM
Guard does not call an LLM.

### AC9 — Tests exist
End-to-end tests cover: drift detected, suppressed when artifact changed, no ownership,
no matching files, multiple artifacts, multiple globs, and Windows path normalization.

## Edge Cases

- Multiple artifacts match the same change → each reported independently.
- Multiple globs in one artifact → matched count reflected in evidence.
- No modified files → "no modified files detected".
- No `architecture/` directory → prompt to run `kaddo init`.

## Validation

Run `pnpm test` and `pnpm build`. Confirm Guard detects drift with real artifacts and stays
silent when the artifact was updated.
