# Tasks: Ownership Front Matter Assistant

## Implementation Tasks

- [x] Review existing `owners` command.
- [x] Review artifact reader and front matter writer utilities.
- [x] Define command behavior for `kaddo owners suggest`.
- [x] Load validated Kaddo config.
- [x] Load `.kaddo/scan.json` if available.
- [x] Find candidate Work Item artifacts.
- [x] Detect artifacts missing `code:` ownership.
- [x] Generate candidate globs from scan data.
- [x] Generate candidate globs from artifact metadata when possible.
- [x] Let user select artifact.
- [x] Let user select suggested globs.
- [x] Let user enter custom globs.
- [x] Preview front matter update.
- [x] Confirm before writing.
- [x] Preserve existing front matter keys.
- [x] Preserve artifact body.
- [x] Print next-step guidance.
- [x] Ensure no LLM is called.

## Tests

- [x] Test finding artifacts missing ownership.
- [x] Test artifact with `code: []` is considered missing ownership.
- [x] Test artifact with existing `code:` is skipped by default.
- [x] Test candidate globs from scan data.
- [x] Test candidate globs from artifact metadata (domain-specific).
- [x] Test manual glob entry path (no scan baseline).
- [x] Test front matter update preserves existing keys.
- [x] Test artifact body is preserved.
- [x] Test invalid front matter is handled safely.
- [x] Test append vs replace on existing globs.
- [x] Test Guard detects drift after ownership is added.

## Documentation

- [x] Update README with `kaddo owners suggest`.
- [x] Update ownership/guard docs (EN/ES).
- [x] Add example front matter before/after.
- [x] Explain deterministic suggestions; Kaddo suggests, humans confirm.
- [x] Explain that no LLM is used.
- [x] Add workflow: create work item → add ownership → run guard.

## Validation

- [x] Run tests.
- [x] Run build.
