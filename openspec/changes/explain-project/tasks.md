# Tasks: Explain Project

## Implementation Tasks

- [x] Review current `kaddo explain` implementation.
- [x] Decide whether to extend or refactor existing explain logic.
- [x] Read validated `.kaddo/config.yml`.
- [x] Read `.kaddo/scan.json` if available.
- [x] Read inventory status.
- [x] Read capabilities status.
- [x] Read architecture baseline status.
- [x] Read roadmap status.
- [x] Read Work Item metadata.
- [x] Count Work Items.
- [x] Detect Work Items with `code:` ownership.
- [x] Detect Work Items missing ownership.
- [x] Generate missing knowledge list.
- [x] Generate suggested next steps.
- [x] Support `--for human`.
- [x] Support `--for agent`.
- [x] Generate `.kaddo/explain.md`.
- [x] Generate `.kaddo/explain.json`.
- [x] Ensure no LLM is called.
- [x] Keep output concise.

## Tests

- [x] Test uninitialized project.
- [x] Test project with only init.
- [x] Test project with scan baseline.
- [x] Test project with roadmap.
- [x] Test project with Work Items.
- [x] Test ownership coverage.
- [x] Test missing knowledge recommendations.
- [x] Test `--for human`.
- [x] Test `--for agent`.
- [x] Test no source code is loaded.

## Documentation

- [x] Update README with `kaddo explain`.
- [x] Update docs page for `explain` (EN/ES).
- [x] Explain difference between `context` and `explain`.
- [x] Add example output.
- [x] Explain use cases: onboarding, project review, agent preparation, knowledge status.

## Validation

- [x] Run tests.
- [x] Run build.
