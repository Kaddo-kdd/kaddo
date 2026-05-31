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

  FYI: src/payments/payments.service.ts matches WI-001
  WI-001 was not modified in this diff.
  Consider reviewing whether WI-001 still reflects the implementation.
```

Guard is **silent** when no artifacts declare ownership. No noise on day one.
