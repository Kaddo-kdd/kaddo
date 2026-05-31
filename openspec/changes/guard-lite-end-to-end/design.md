# Design: Guard Lite End-to-End

## Technical Approach

Guard Lite is already implemented across three layers:

- `services/artifact-reader.ts` — reads artifacts under `architecture/`, parsing the `code:`
  front matter array into `codeGlobs`.
- `core/diff-analysis.ts` — `analyzeGuard(touchedFiles, artifacts, silentWithoutOwnership)`
  matches changed files against `codeGlobs` via `minimatch`, normalizes paths
  (`path.sep → '/'`), and flags whether the artifact file itself was modified.
- `commands/guard.ts` — `runGuard()` wires git diff + artifacts + analysis + output, offers
  interactive ignore, and supports `--ci`/`--json`.

This VS does not redesign that pipeline. It validates it end-to-end, improves the FYI
message, and documents the contract.

## Drift Definition

A **possible knowledge drift** exists for an artifact when, in a single diff:

1. At least one changed file matches one of the artifact's declared `code:` globs, AND
2. The artifact file itself was NOT changed.

If the artifact was also changed, the match is suppressed (the knowledge was kept in sync).

## Declared Ownership Only

Guard never guesses ownership. An artifact participates only if it declares `code:` globs:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```

Artifacts without `code:` are ignored. When no artifact declares ownership at all, Guard is
silent by default (`guard.silent_without_ownership: true`).

## Message Improvement

The previous FYI was terse:

```txt
  FYI: src/payments/pay.ts matches WI-001
  WI-001 was not modified in this diff.
  Evidence: 1/2 globs matched · artifact K2 · domain: payments
  Consider reviewing whether WI-001 still reflects the implementation.
```

The improved FYI is structured and actionable:

```txt
  ⚠ Possible knowledge drift: WI-001 (feature, K2)
    Changed code matching this artifact:
      - src/payments/pay.ts (+1 more)
    Declared ownership:
      - src/payments/**
    WI-001 was not updated in this diff.
    Evidence: 1/2 globs matched · artifact K2 · domain: payments
    Suggested action: review WI-001 and update it if the behavior changed,
    or run `kaddo guard` ignore if this change does not affect the knowledge.
```

It stays non-blocking (printed to stdout, exit code unchanged).

## Platform Normalization

`normalizePath` converts `path.sep` to `/` before `minimatch`, so Windows backslash paths
match POSIX-style globs. End-to-end tests cover a Windows-style touched path.

## Alternatives Considered

- **Infer ownership from file paths** — rejected (out of scope, error-prone).
- **Block CI on drift** — rejected (Guard Lite is advisory).
- **Confidence score** — rejected (keep evidence simple and explainable).

## Risks and Mitigation

- Broad globs → false positives. Mitigation: document narrow, intentional ownership globs.
- Path differences → handled by `normalizePath` + a Windows-path test.
