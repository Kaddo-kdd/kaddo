---
title: kaddo scan
description: Detect your project stack deterministically.
---

```bash
kaddo scan
```

Detects language, framework, package manager, code dirs, migration dirs,
contract files, infra and test dirs. Suggests domains for human confirmation — never assumes.

## Generated artifacts

`kaddo scan` persists a reusable baseline of the project's technical state:

- **`.kaddo/scan.json`** — structured, machine-readable. Used by the CLI and future
  context-pack commands. Always regenerated on each scan.
- **`architecture/inventory.md`** — human-readable inventory you can paste into an LLM
  chat. Overwrite is confirmed if the file already exists.

This baseline is the first input for the Knowledge Driven Development flow: the CLI
prepares deterministic signals, and your LLM agents turn them into understanding.

> Scan does **not** interpret your system. It detects signals and asks confirmation
> questions — it never claims to know your business capabilities or architecture.

## State-aware next step

If `.kaddo/config.yml` exists, `kaddo scan` reads the project state recorded by
`kaddo init` and prints a next step tailored to it:

- **new** → define initial knowledge, create your first work item, grow the roadmap gradually.
- **pre-ai** → use this baseline to create a context pack and understand the system with LLM agents.
- **legacy** → use this baseline to identify risks, unknowns and safe modernization candidates.

```
This is a pre-AI monorepo.
Next: Use this baseline to create a context pack and understand the existing system with LLM agents.
```

Example `architecture/inventory.md`:

```markdown
# Project Inventory

## Detected Stack

- Language: typescript
- Framework: next
- Package manager: pnpm

## Possible Domains

- auth
- payments

## Open Questions

- Confirm whether the 'payments' domain reflects a real bounded context.
```
