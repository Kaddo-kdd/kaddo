---
title: Codex Adapter (AGENTS.md)
description: Generate an AGENTS.md so Codex understands how to work inside a Kaddo-managed repository — native instructions, no manual context pasting.
---

`kaddo adapters install codex` generates an **`AGENTS.md`** at the project root so
[Codex](https://openai.com/codex) (and other `AGENTS.md`-aware tools) get native instructions for
working in a Kaddo repo — without you pasting the context pack, prompts or rules into the chat.

```bash
kaddo adapters install codex            # write AGENTS.md
kaddo export codex                      # alias
kaddo adapters install codex --dry-run  # preview, writes nothing
kaddo adapters install codex --force    # overwrite an existing AGENTS.md
```

> Kaddo stays the source of truth. `AGENTS.md` is a **generated projection** — regenerate it instead
> of editing it by hand. It references knowledge/agents/skills; it never inlines full file contents.

## What the generated AGENTS.md contains

- A short explanation that the repo uses Kaddo for Knowledge Driven Development (+ project name).
- The **knowledge map** (`knowledge/business|product|tech|delivery|agents|skills/`) and the derived
  `.kaddo/` paths, marked as generated output (don't edit by hand).
- **Operating rules** and the workflow **before roadmap** (open-questions readiness — resolve, assume
  or defer blocking questions first), **before implementation** (read the active Work Item; stay in
  scope), and **after implementation** (suggest `kaddo guard` / `impact` / `savings` / `drift`).
- Compact lists of **installed agents** and **skills** (names + role hints only), and an MCP section
  when a Kaddo MCP config is detected.
- Useful commands, an agent-behavior checklist, and safety limits.

It is deliberately compact — references and rules, not full documents. It never inlines
`context-pack.md`, business/product/codebase bodies, or full agent/skill contents.

## Behavior

| Situation | Result |
|---|---|
| No `AGENTS.md` | created |
| `AGENTS.md` exists | skipped (use `--force` or `--dry-run`) |
| `--dry-run` | prints the content, writes nothing |
| `--force` | overwrites the existing file |

Deterministic: no LLM, no git, no application code. It never modifies `knowledge/` or `.kaddo/`,
and only writes `AGENTS.md` at the project root. Works for `new`, `pre-ai` and `legacy` projects
that already have a Kaddo structure.

## Why

A new user no longer has to remember to tell Codex "read the context pack, check roadmap readiness,
use Work Items, respect Guard, don't edit `.kaddo/`". Those instructions come from the repository,
making Kaddo more portable and easier to adopt with Codex.

## Out of scope

Other adapters (Claude Code, Cursor, Copilot…), `AGENTS.md` per subdirectory, intelligent merge with
an existing `AGENTS.md`, and auto-sync are not part of this version.
