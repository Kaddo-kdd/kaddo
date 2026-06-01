# Design: Workspace Guard for Multirepo

## Approach

Workspace mode **extends the input set of changed files**, not Guard's matching logic.
The core model is unchanged:

```txt
changed files + artifact code: globs → possible knowledge drift
```

So workspace mode collects normalized cross-repo paths and feeds them into the existing
`analyzeGuard(touchedFiles, artifacts, …)`.

## Command

- `kaddo guard` — current repo only (unchanged).
- `kaddo guard --workspace` — also check local mapped module repos.
- `kaddo guard --workspace --ci` — same, JSON output with workspace metadata.

## Git service

Add `getModifiedFilesIn(dir, mode)` to `services/git.ts` (a cwd-aware variant of
`getModifiedFiles`). Only changed **paths** are read — never source contents.

## Collector — `services/workspace-guard.ts`

```ts
collectWorkspaceChanges(dir, mode, deps?): Promise<WorkspaceScan>
normalizeModulePath(repoPath, changed): string   // POSIX `<repoPath>/<changed>`
```

`deps` (`{ isGitRepo, getModifiedFilesIn }`) is injectable for testing. For each mapped
module from `.kaddo/modules.yml`:

- no repo path → skip (`no repo path`)
- path missing → skip (`path does not exist`)
- not a Git repo → skip (`not a git repository`)
- diff throws → skip (`git diff failed`)
- otherwise collect changed files, each normalized to `<repoPath>/<file>` with
  `source: 'workspace-module'`.

`WorkspaceScan` returns `changedFiles`, `modulesChecked`, `modulesSkipped`,
`skippedModules[]`.

## Path model

`repoPath: ../frontend` + changed `src/checkout.ts` → `../frontend/src/checkout.ts`,
matched against `code: ["../frontend/**"]`. Windows separators are normalized to `/`.

## Guard integration

In `runGuard`:

1. Compute `currentFiles = getModifiedFiles(mode)`.
2. If `--workspace`: `workspaceScan = collectWorkspaceChanges(dir, mode)`.
3. `touchedFiles = unique(currentFiles + workspaceScan.changedFiles.normalizedPath)`.
4. `analyzeGuard(touchedFiles, artifacts, …)` as before.
5. **Plugins run on `currentFiles` only** — workspace mode never reads sibling source.
6. Artifact-updated suppression is automatic: a module artifact lives in the architecture
   repo, so if it changed it appears in `currentFiles` and Guard suppresses the FYI.

Module artifacts have no `id`/`title` front matter, so FYIs/JSON label them by their
workspace-relative path (`artifactLabel`).

## Output

- Terminal: a "Workspace mode enabled" header with modules checked/skipped, then the
  normal FYIs (matched files show the `<repoPath>/...` paths).
- CI JSON: gains a `workspace` object (`enabled`, `modulesChecked`, `modulesSkipped`,
  `skippedModules`), and findings gain an `ownership` field. JSON mode now emits clean
  JSON (no human header).

## No behavior change without the flag

`kaddo guard` with no `--workspace` does not read `.kaddo/modules.yml` or any sibling
repo. Existing Guard tests remain valid.

## Alternatives considered

- Workspace mode default — rejected (surprising, slower).
- Read module source files — rejected (only diff paths needed).
- GitHub/GitLab APIs — rejected (Kaddo stays local/deterministic).
- Read artifacts from sibling repos — rejected (architecture repo is the knowledge source).
