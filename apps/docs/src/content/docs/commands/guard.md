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

  ⚠ Possible knowledge drift: architecture/modules/storefront-web/module-design.md
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
