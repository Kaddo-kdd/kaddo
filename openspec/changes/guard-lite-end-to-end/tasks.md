# Tasks: Guard Lite End-to-End

## Implementation Tasks

- [x] Review current Guard implementation (command, analysis, artifact reader).
- [x] Confirm `code:` globs are read from real artifacts.
- [x] Confirm matching detects changed files against globs.
- [x] Confirm suppression when the artifact was also modified.
- [x] Improve the FYI message to be clear and actionable.
- [x] Keep Guard non-blocking.
- [x] Confirm path normalization across platforms.

## Tests

- [x] End-to-end: drift detected with a real artifact.
- [x] End-to-end: suppressed when artifact was updated.
- [x] End-to-end: silent when no ownership declared.
- [x] End-to-end: no matching files.
- [x] Multiple artifacts match a change.
- [x] Multiple globs in one artifact.
- [x] Windows-style path normalization.
- [x] Existing Guard tests still pass.

## Documentation

- [x] Update Guard docs (EN/ES) explaining declared-ownership-only.
- [x] Add example `code:` front matter.
- [x] Explain Guard is non-blocking and performs no inference.
- [x] Update README.

## Validation

- [x] Run tests.
- [x] Run build.
