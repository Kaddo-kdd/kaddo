# Proposal: Guard Lite End-to-End

## Problem

Kaddo now closes its first full loop: scan → context → agents → roadmap → work item. Work
Items can declare which code they own via the `code:` front matter (Guard Lite globs).

But the promise of Kaddo only completes when **knowledge stays connected to code**:

```txt
knowledge → work item → code → guard → possible drift
```

`kaddo guard` already matches git-changed files against artifact `code:` globs and reports
when an artifact was not updated alongside its code. However:

- The end-to-end flow (real artifacts created by `kaddo create` / `--from roadmap` →
  Guard detection) is not explicitly validated by tests.
- The FYI message is terse and not obviously actionable for a first-time user.
- The "declared ownership only, no inference" contract is not documented.

## Proposed Change

Validate and strengthen Guard Lite end-to-end so it reliably detects **possible knowledge
drift**: changed code that matches an artifact's declared `code:` globs while that artifact
was not itself updated in the same diff.

- Keep the deterministic, glob-based matching (no LLM, no inference).
- Make the FYI output clear and actionable: what changed, which artifact owns it, the
  declared ownership glob, and a suggested next step.
- Suppress the FYI when the artifact was also modified in the diff.
- Stay non-blocking (FYI only; never fails the command).
- Normalize Windows paths so matching works on every platform.
- Add end-to-end tests with real artifacts.
- Document how to declare ownership.

## Why Now

VS-010 made it trivial to create Work Items (including from the roadmap) that can carry
`code:` ownership globs. Guard is the mechanism that keeps those Work Items honest over time.
This VS turns an existing-but-unvalidated capability into a trustworthy, documented one.

## Scope

- Verify Guard reads `code:` globs from real artifacts (Work Items included).
- Detect changed files matching those globs.
- Suppress the warning when the artifact file was also changed.
- Improve the FYI message to be clear and actionable.
- Keep Guard non-blocking.
- Normalize paths across platforms.
- Add end-to-end tests.
- Document declaring ownership (EN/ES + README).

## Out of Scope

- Ownership inference (guessing which artifact owns a file).
- Calling an LLM.
- CI strict/blocking mode that fails the build.
- Semantic diff analysis.
- A confidence score model.

## Expected Value

Users trust that, once they declare ownership on a Work Item, Kaddo will remind them to keep
the knowledge in sync with the code — turning artifacts into living documentation.

## Risks

- Glob matching may produce false positives if ownership globs are too broad.
- Path normalization differences across platforms.

## Success Criteria

- `kaddo guard` detects drift against real artifacts created by Kaddo.
- `kaddo guard` does NOT warn when the artifact was updated in the same diff.
- Output is clear and actionable.
- Tests exist and cover the end-to-end flow.
- Build and tests pass.
