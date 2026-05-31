---
title: kaddo guard
description: Check if modified code has related artifacts that were not updated.
---

```bash
kaddo guard           # checks staged + unstaged files
kaddo guard --staged  # checks only staged files
kaddo guard --ci      # JSON output for CI/PR, non-blocking
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
