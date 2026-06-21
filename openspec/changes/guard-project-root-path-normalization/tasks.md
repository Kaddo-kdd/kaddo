# Tasks: Guard Project-Root Path Normalization (VS-060.1)

- [x] git.ts: `getGitRoot(dir)`.
- [x] diff-analysis.ts: `normalizeTouchedPathForProject(touchedPath, gitRoot, projectRoot)`.
- [x] guard.ts: normalize tracked + untracked files; match on project path, display raw path; JSON
      `normalized_files` + `files_outside_project`.
- [x] guard test mocks add `getGitRoot`.
- [x] Tests: unit (path-normalization) + e2e (git-root-above, outside project, Windows paths).
- [x] Docs (EN/ES) Guard page note; npm README roadmap; both packages 3.22.1.

## Validation
- [x] `pnpm test` green (529); typecheck green; `pnpm -r build` green; smoke (project as subfolder).
- [x] `astro build` green.
