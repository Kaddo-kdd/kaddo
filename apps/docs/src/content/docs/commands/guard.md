---
title: kaddo guard
description: Check if modified code has related artifacts that were not updated.
---

```bash
kaddo guard              # checks staged + unstaged files in the current repo
kaddo guard --staged     # checks only staged files
kaddo guard --ci         # JSON output for CI/PR, non-blocking
kaddo guard --workspace  # also check local mapped module repos (multirepo, opt-in)
```

Guard Lite reads `git diff`, finds artifacts with matching `code:` globs, and shows
a **non-blocking FYI** if the artifact was not updated in the same diff.

```
Touched files:
  - src/payments/payments.service.ts

  ⚠ Possible knowledge drift: WI-001 (feature, K2)
    Changed code matching this artifact:
      - src/payments/payments.service.ts
    Declared ownership:
      - src/payments/**
    WI-001 was not updated in this diff.
    Evidence: 1/1 globs matched · artifact K2 · domain: payments
    Suggested action: review WI-001 and update it if the behavior changed,
    or ignore this artifact below if the change does not affect the knowledge.
```

## Untracked files

Guard reads the Git diff (modified/staged files), so brand-new files Git does not track yet are
invisible to it. When untracked files exist, Guard prints a **non-blocking FYI** so you are not
misled by a "no modified files detected" message:

```text
Untracked files detected (3):
  - package.json
  - src/index.ts
  - tsconfig.json
Guard may not fully evaluate these files until they are tracked. (FYI — non-blocking)
```

Track the files (`git add`) for Guard to relate them to artifact ownership.

## Unified discovery

Guard discovers knowledge artifacts through the same shared service as `explain`, `context`,
`understand` and `owners suggest`, so every command sees exactly the same artifacts. Work Items
are found recursively across lifecycle subfolders (`draft/`, `ready/`, `in-progress/`, …) and are
recognized by their front matter, not their path or file name.

## Recording history (`--record`)

By default Guard writes nothing. `kaddo guard --record` persists the run to
`.kaddo/history/guard-runs.jsonl` (+ a summary) so [`kaddo drift`](/drift-report/) can report drift
trends over time and feed `kaddo impact` / `kaddo savings`. It records only paths, artifact ids and
warnings — never git authors or personal data — and never blocks, edits source/knowledge or runs git.

## Guard ownership scope

Guard matches ownership from **active and completed** Work Items — completed work still owns its
code, so touching it should still surface the related knowledge. **Archived** Work Items are
**excluded by default** (add `--include-archived` to include them). Other artifacts (ADRs, etc.) are
always considered. Guard prints the scope it used:

```text
Ownership scope:
- Active and completed Work Items
- Archived Work Items excluded
```

When nothing matches, Guard explains where it looked:

```text
No artifact ownership matches found.

Note:
Guard checks ownership from active and completed Work Items.
Run `kaddo explain` to inspect ownership coverage.
```

In `--ci` / `--json` mode the scope is emitted as `ownership_scope { included, excluded }`.

### Project-root path normalization

`code:` globs are always relative to the **Kaddo project root**, but Git reports paths relative to
the **Git root**. When the project is a subfolder of the repo, Guard normalizes each touched file
before matching — so `todoApp/src/cli/program.ts` (Git) matches `src/cli/program.ts` (ownership).
Files outside the project are ignored (no false matches). Backslashes and forward slashes are
treated equally, on Windows and Unix. The `--json` output includes a `normalized_files`
(`raw_path` → `project_path`) mapping and `files_outside_project`.

## Declaring ownership

Guard only acts on **declared ownership** — it never guesses which artifact owns a file.
Add `code:` globs to an artifact's front matter (Work Items included):

```yaml
---
type: feature
id: WI-001
knowledge_level: K2
code:
  - src/payments/**
  - src/shared/payment/**
---
```

- If a changed file matches a glob **and** the artifact was not updated → drift FYI.
- If the artifact was also changed in the same diff → no FYI (knowledge stayed in sync).
- If no artifact declares ownership → Guard is **silent** by default. No noise on day one.

Guard is **advisory and non-blocking**: it never fails your command or CI, and it performs
**no inference** — only deterministic glob matching.

## Workspace mode (multirepo)

By default Guard checks **only the current repository**. In a multirepo workspace, module
artifacts may own code in sibling repos via globs like `code: ["../frontend/**"]`. Opt in
with `--workspace`:

```bash
kaddo guard --workspace
kaddo guard --workspace --ci
```

In workspace mode Guard reads `.kaddo/modules.yml`, runs `git diff` **inside each local
mapped module repo**, normalizes the changed paths (e.g. `../frontend/src/checkout.ts`)
and matches them against artifact `code:` globs — emitting the same non-blocking FYI when
a module artifact was not updated.

```
Workspace mode enabled.
Checking mapped modules from .kaddo/modules.yml.
  Modules checked: 3 · skipped: 1
  ↷ skipped worker (../worker) — not a git repository

  ⚠ Possible knowledge drift: knowledge/tech/modules/storefront-web/module-design.md
    Changed code matching this artifact:
      - ../frontend/src/checkout/checkout.ts
    Declared ownership:
      - ../frontend/**
```

Modules whose repo path is missing, is not a Git repository, or whose diff fails are
**skipped with a warning** — never fatal. The `--workspace --ci` JSON adds a `workspace`
object (`modulesChecked`, `modulesSkipped`, `skippedModules`).

> Workspace Guard only reads **changed file paths** from local repos. It never reads
> source contents, never clones, and never calls a Git/GitHub API. `kaddo guard` without
> `--workspace` behaves exactly as before.
