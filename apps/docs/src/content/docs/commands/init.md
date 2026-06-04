---
title: kaddo init
description: Initialize Kaddo in the current project.
---

```bash
kaddo init
```

Creates the `knowledge/` knowledge tree and `.kaddo/config.yml`.

```
knowledge/
  knowledge.md      ← current state of the product
  roadmap.md        ← intentions and priorities
  work-items/       ← one file per work item
.kaddo/
  config.yml        ← project config
```

## Project context

`kaddo init` asks three questions and records the answers in `.kaddo/config.yml`.
Other commands read this file to adapt their guidance — Kaddo becomes **state-aware**.

```yaml
version: 1
project:
  name: "my-app"
  state: pre-ai      # new | pre-ai | legacy
  structure: monorepo # monorepo | multirepo
  domains: []
team:
  size: indie        # indie | small | medium | enterprise
```

**Project state** — drives next-step guidance in `scan` and `create`:

| State | Meaning |
|---|---|
| `new` | Greenfield project; start defining knowledge from scratch. |
| `pre-ai` | Existing system without an AI/knowledge baseline yet. |
| `legacy` | Older system where risks and unknowns matter most. |

**Team size** — `indie`, `small`, `medium`, `enterprise`.

**Repository structure** — `monorepo` or `multirepo`.

Old config files keep working: missing fields fall back to safe defaults
(`state: pre-ai`, `structure: monorepo`, `team.size: indie`). Invalid enum values
produce a clear validation error listing the valid options.
