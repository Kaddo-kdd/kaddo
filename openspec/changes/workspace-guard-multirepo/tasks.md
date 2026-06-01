# Tasks: Workspace Guard for Multirepo

## Implementation

- [x] Create OpenSpec change.
- [x] Add `--workspace` flag to `kaddo guard`.
- [x] Add cwd-aware `getModifiedFilesIn` to the git service.
- [x] Add workspace collector (`services/workspace-guard.ts`) reusing the mapped-module reader.
- [x] Normalize module changed paths to `<repoPath>/<changedPath>` (POSIX, Windows-safe).
- [x] Merge current-repo + workspace changed paths for matching.
- [x] Run plugins on current-repo files only (no sibling source reads).
- [x] Preserve artifact-updated suppression.
- [x] Report skipped modules (missing / non-git / diff failure).
- [x] Extend CI JSON with workspace metadata (+ findings `ownership`).
- [x] Keep default guard behavior unchanged.
- [x] No remote APIs; no LLM.

## Tests

- [x] Default guard ignores mapped module repos.
- [x] Workspace guard detects sibling repo drift.
- [x] Workspace guard suppresses warning when artifact changed.
- [x] Missing module path is skipped.
- [x] Non-git module path is skipped.
- [x] Windows path normalization (`normalizeModulePath`).
- [x] `--workspace --ci` includes workspace metadata.
- [x] No `.kaddo/modules.yml` behavior.
- [x] Existing Guard tests still pass.

## Documentation

- [x] Update guard command docs (EN/ES).
- [x] Update multirepo docs (default vs workspace; no remote APIs; non-blocking).

## Validation

- [x] Run `pnpm --filter "@trycatch.tv/kaddo" test`.
- [x] Run `pnpm -r build`.
