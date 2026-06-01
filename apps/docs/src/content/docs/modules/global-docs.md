---
title: Standards, security & stack
description: Optional global knowledge artifacts for the whole system.
---

These are **global** knowledge artifacts — they describe the whole system, not a
single module. They are not created during `kaddo init`; install them on demand so
knowledge stays progressive.

```bash
kaddo add standards   # → architecture/standards.md
kaddo add security    # → architecture/security.md
kaddo add stack       # → architecture/stack.md
```

Each ships a thin starter template you refine with the matching operational agent
in your LLM, using `.kaddo/context-pack.md` as input.

| Module | Artifact | Refine with |
|---|---|---|
| `standards` | `architecture/standards.md` | `standards-agent` |
| `security` | `architecture/security.md` | `security-agent` |
| `stack` | `architecture/stack.md` | `stack-agent` |

## Standards

Lightweight coding, documentation and testing conventions plus a PR checklist —
a handful of high-value rules beats a long policy.

## Security

Documents **security considerations** (auth, data sensitivity, secrets,
dependency and deployment risks, open questions).

> Kaddo does **not** perform security scanning or vulnerability scanning. The
> artifact documents concerns for humans and agents — it does not audit code.

## Stack

Languages, frameworks, data, infrastructure, tooling and unknowns to confirm.

> Existing files are never overwritten. Re-running `kaddo add` only installs
> missing files.
