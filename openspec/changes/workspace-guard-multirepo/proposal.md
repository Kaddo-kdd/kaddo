# Proposal: Workspace Guard for Multirepo

## Problem

Kaddo supports mapped modules (`.kaddo/modules.yml`), module-level artifacts with `code:`
globs, and module-aware context/explain. But Guard reads only the current repository's
`git diff`. In a multirepo workspace, code usually changes in sibling repos
(`../frontend`, `../backend`, …) that module artifacts own via `code: ["../frontend/**"]`.
Default Guard cannot see those changes, so cross-repo drift goes undetected.

## Proposed Change

Add an **opt-in** workspace mode: `kaddo guard --workspace`. It reads
`.kaddo/modules.yml`, runs local `git diff` inside each mapped module's repo path,
normalizes changed paths back to workspace-relative paths (e.g.
`../frontend/src/checkout.ts`), and matches them against artifact `code:` globs. Output
stays a **non-blocking FYI**. `kaddo guard` (no flag) is unchanged.

## Why Now

Module artifacts now use registry templates with `code:` globs, and context/explain are
module-aware. The remaining gap is drift visibility across local sibling repos.

## Scope

- Add `--workspace` to `kaddo guard` (and `--workspace --ci`).
- Read mapped modules; run local Git diffs in each valid module repo path.
- Normalize changed paths to match `code:` globs.
- Match cross-repo changes against `architecture/` artifacts.
- Preserve current-repo Guard behavior and artifact-updated suppression.
- Add tests and docs.

## Out of Scope

- Remote GitHub/GitLab API calls; cloning; scanning non-local repos.
- Blocking; enabling workspace mode by default; CI strict mode.
- Semantic diff; security scanning; ownership inference; Confidence Score; LLM calls.
- Reading source file contents or artifacts from sibling repos.

## Expected Value

Teams using Kaddo in a multirepo workspace can detect possible knowledge drift when code
changes in mapped module repos — making module artifacts operational, not only
descriptive.

## Risks

- Wrong paths confuse workspace diffing → normalize to POSIX; report skipped modules.
- Some mapped repos may not exist locally or not be Git → skip with a warning, never fail.
- Windows path normalization → normalize separators.
- Large workspaces may be noisy → opt-in, non-blocking.

## Success Criteria

`kaddo guard --workspace` from the architecture repo detects changes in local mapped
repos and reports a non-blocking drift FYI when those changes match artifact `code:`
globs and the related artifact was not updated; `kaddo guard` still checks only the
current repo.
