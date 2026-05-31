---
title: Knowledge Levels
description: How Kaddo scales context to the size of the change.
---

Every Work Item carries the minimum context for its Knowledge Level. The level
decides how many questions Kaddo asks and what the generated file contains.

| Level | When | Questions |
|---|---|---|
| K0 | Trivial change | None |
| K1 | Hotfix / simple fix | Problem + expected result |
| K2 | Feature or bugfix with functional impact | + impact + acceptance criteria |
| K3 | Capability or significant change | + design |
| K4 | Architecture change or migration | + risks |

The generated file includes front matter, a Definition of Done, and a Learning section.

## Ownership

Ownership is declared in the front matter of each artifact — no central mapping file.

```yaml
---
type: feature
id: WI-001
title: "Add payment retry logic"
knowledge_level: K2
status: in-progress
code:
  - src/payments/**
  - src/shared/payment/**
summary: "Adds retry policy for failed payment attempts."
---
```

Kaddo builds a simple Knowledge Graph from these front matters at runtime:

```
artifact → code globs → git diff intersection
```
