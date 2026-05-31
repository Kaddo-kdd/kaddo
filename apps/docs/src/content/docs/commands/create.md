---
title: kaddo create
description: Create a Work Item with the minimum context for its Knowledge Level.
---

```bash
kaddo create feature   # K2: 4 questions
kaddo create bugfix    # K2: 4 questions
kaddo create hotfix    # K1: 2 questions
kaddo create spike     # K3: 4 questions
```

Optional modules add more types (`adr`, `rfc`, `incident`, `migration`, `legacy`,
`contract`, `capability`, `guard-rule`, `agent`, `skill`). See
[Modules](/modules/overview/).

## Activate Guard Lite

Add code globs to the `code:` field of the generated front matter:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```
