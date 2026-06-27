---
title: Claude Code Adapter (CLAUDE.md)
description: Generate a CLAUDE.md so Claude Code understands how to work inside a Kaddo-managed repository — native instructions, no manual context pasting.
---

`kaddo adapters install claude` generates a **`CLAUDE.md`** at the project root so
[Claude Code](https://claude.com/claude-code) gets native instructions for working in a Kaddo repo —
without you pasting the context pack, prompts or rules into the chat.

```bash
kaddo adapters install claude            # write CLAUDE.md
kaddo export claude                      # alias
kaddo adapters install claude --dry-run  # preview, writes nothing
kaddo adapters install claude --force    # overwrite an existing CLAUDE.md
```

> Kaddo stays the source of truth. `CLAUDE.md` is a **generated projection** — regenerate it instead
> of editing it by hand. It references knowledge/agents/skills; it never inlines full file contents.

It follows the same [Adapter Contract](custom-adapters/) as the reference
[Codex adapter](codex-adapter/) and reuses the same common core (project metadata, knowledge/derived
paths, agents, skills, package-manager detection, command fallback). Only the target renderer differs
(`AGENTS.md` for Codex → `CLAUDE.md` for Claude Code).

## What the generated CLAUDE.md contains

- A short explanation that the repo uses Kaddo for Knowledge Driven Development (+ project name).
- The **knowledge map** (`knowledge/business|product|tech|delivery|agents|skills/`) and the derived
  `.kaddo/` paths, marked as generated output (don't edit by hand).
- **Operating rules** and the workflow **before roadmap** (open-questions readiness — resolve, assume
  or defer blocking questions first), **before implementation** (read the active Work Item; stay in
  scope), and **after implementation** (suggest `kaddo guard` / `impact` / `savings` / `drift`).
- A **command fallback** tailored to the detected package manager (pnpm/npm/yarn/bun), with the
  global `kaddo` always preferred.
- Compact lists of **installed agents** and **skills** (names + role hints only), and an MCP section
  when a Kaddo MCP config is detected.
- A behavior checklist and safety limits.

It never inlines `context-pack.md`, business/product/codebase bodies, full Work Items, or full
agent/skill contents.

## Behavior

| Situation | Result |
|---|---|
| No `CLAUDE.md` | created |
| `CLAUDE.md` exists | skipped (use `--force` or `--dry-run`) |
| `--dry-run` | prints the content, writes nothing |
| `--force` | overwrites the existing file |

Deterministic: no LLM, no git, no application code. It never modifies `knowledge/` or `.kaddo/`,
and only writes `CLAUDE.md` at the project root. Works for `new`, `pre-ai` and `legacy` projects
that already have a Kaddo structure.

## Smoke tests

After `kaddo adapters install claude --force`, validate Claude Code is actually using `CLAUDE.md`:

1. **Read without modifying** — *"Read CLAUDE.md and tell me the correct Kaddo workflow to implement
   the next pending Work Item. Do not modify files."* → mentions reading the Work Item and Kaddo
   context, checking readiness gates, implementing only the scope, validating, suggesting
   `kaddo guard`, and asking before committing.
2. **Readiness before roadmap** — *"Generate the roadmap for this project."* → checks open-questions
   readiness first and, if blocking questions exist, asks to resolve/assume/defer them.
3. **Implementation** — *"Implement the next pending Work Item. Do not commit without confirmation."*
   → reads context, changes only in-scope files, validates, suggests `kaddo guard`, doesn't commit
   without confirmation.
4. **Don't edit `.kaddo/`** — *"Update `.kaddo/context-pack.md` manually."* → refuses and suggests
   regenerating with `kaddo context`.

## Out of scope

This version generates only `CLAUDE.md`. It does **not** generate native Claude Code skills
(potential future `VS-066.1 — Claude Code Skills Projection`) or slash commands (potential future
`VS-066.2 — Claude Code Commands Projection`). Kaddo skills stay under `knowledge/skills/`; the
projection just points Claude to read the relevant ones.
