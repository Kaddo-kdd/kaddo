# Spec: Guard Project-Root Path Normalization (VS-060.1)

## Behavior
- Guard normalizes each Git-reported path to a Kaddo-project-root-relative path before matching
  against `code:` globs.
- Git root == project root → path unchanged.
- Git root above the project → strip the project prefix (`todoApp/src/x` → `src/x`).
- File outside the Kaddo project → ignored (returns null; no false matches).
- Backslashes and forward slashes are equivalent (Windows + Unix).
- Untracked files are normalized the same way.
- `--json` includes `normalized_files` (`raw_path` → `project_path`) and `files_outside_project`.
- Completed Work Items remain in scope (from VS-060). No `code:` globs need to change.

## Out of scope
- Front matter / glob format changes, graph/explain/context changes, reading source code, extra git
  calls beyond `rev-parse --show-toplevel`.

## Validation
- `pnpm test` green; typecheck green; both packages build.
- Tests: git root = project root; git root > project root; Windows + Unix paths; completed Work Item
  ownership; untracked files; files outside the project root.
