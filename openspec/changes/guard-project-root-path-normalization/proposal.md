# Proposal: Guard Project-Root Path Normalization (VS-060.1)

## Why

`git diff --name-only` returns paths relative to the **Git root**, but Kaddo `code:` globs are
relative to the **Kaddo project root**. When the project is a subfolder of the repo (e.g.
`<repo>/todoApp`), Git reports `todoApp/src/cli/program.ts` while the Work Item declares
`src/cli/program.ts`, so `kaddo guard` finds no ownership matches even though they exist.

## What

Normalize every Git-reported path to a project-root-relative path before matching:

- New `getGitRoot(dir)` in the git service (`git rev-parse --show-toplevel`).
- New pure `normalizeTouchedPathForProject(touchedPath, gitRoot, projectRoot)` in `diff-analysis`:
  strips the project prefix when the project is a subfolder, returns the path unchanged when Git
  root == project root, and returns `null` for files outside the project (no false matches).
- Guard normalizes tracked **and** untracked files; matching uses the project path while the header
  still shows the raw Git path. `--json` adds `normalized_files` (`raw_path` → `project_path`) and
  `files_outside_project`. Backslashes/forward slashes handled on Windows and Unix.

## Principle

> Knowledge paths are project-root relative. Git paths may be git-root relative. Guard must
> normalize before matching.

## Impact

- `services/git.ts` (`getGitRoot`), `core/diff-analysis.ts` (`normalizeTouchedPathForProject`),
  `commands/guard.ts` wiring. No change to front matter, globs, graph/explain/context.
- Patch release 3.22.1 (both packages share version).
