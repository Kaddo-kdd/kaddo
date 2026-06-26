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
kaddo adapters install codex --inject   # add/update only the Kaddo block, preserve the rest
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

## Command fallback

The generated `AGENTS.md` includes a **Command fallback** section so Codex can run Kaddo even when
the global `kaddo` binary isn't on `PATH` (common in sandboxes, Codex Cloud, fresh machines or
pnpm-local setups). It tells Codex to try, in order, before declaring Kaddo unavailable:

```bash
kaddo <command>                      # preferred
corepack pnpm exec kaddo <command>   # local runner
pnpm exec kaddo <command>
npx kaddo <command>                  # last resort
```

The adapter **detects the package manager** from lockfiles (`pnpm-lock.yaml` → pnpm,
`package-lock.json` → npm, `yarn.lock` → yarn, `bun.lock(b)` → bun) and tailors the suggested
runners — e.g. `corepack pnpm exec` / `pnpm exec` for pnpm, `npm exec` / `npx` for npm,
`yarn` / `yarn dlx` for yarn. With no lockfile it lists generic options. The adapter only
**documents** these for Codex — it never runs them, and the global `kaddo` is always preferred.

To test it, run `kaddo adapters install codex --force`, then ask Codex what it would do if
`kaddo questions` isn't on `PATH`: it should try the local runner for the detected package manager
before concluding Kaddo is unavailable.

## Codex as the reference adapter

The Codex adapter is the **reference implementation** for all Kaddo adapters. Every adapter projects
Kaddo knowledge into the native instruction format of a tool (Codex → `AGENTS.md`, a future Claude
Code adapter → `CLAUDE.md`, etc.), but they all honor the same **Adapter Contract**. See
[Custom Adapters](custom-adapters/) for the contract and a template for building your own.

## Smoke tests

After `kaddo adapters install codex --force`, validate Codex is actually using `AGENTS.md`:

1. **Read without modifying** — *"Read AGENTS.md and tell me the correct Kaddo workflow to implement
   the next pending Work Item. Do not modify files."* → Codex should mention reading the Work Item and
   Kaddo context, checking readiness gates, implementing only the scope, validating, suggesting
   `kaddo guard`, and asking before committing.
2. **Readiness before roadmap** — *"Generate the roadmap for this project."* → Codex should check
   open-questions readiness first and, if blocking questions exist, ask to resolve/assume/defer them.
3. **Implementation** — *"Implement the next pending Work Item. Do not commit without confirmation."*
   → Codex should read context, change only in-scope files, validate, suggest `kaddo guard`, and not
   commit without confirmation.
4. **Don't edit `.kaddo/`** — *"Update `.kaddo/context-pack.md` manually."* → Codex should refuse and
   suggest regenerating with `kaddo context`.

## Safe merge (`--inject`)

If your repo already has an `AGENTS.md` with the team's own instructions, `--inject` integrates the
Kaddo guidance **without replacing the file**. It writes a single delimited block:

```md
<!-- BEGIN KADDO CODEX ADAPTER -->
## Kaddo guidance
…
<!-- END KADDO CODEX ADAPTER -->
```

Everything outside the markers is preserved exactly. Running `--inject` again **updates that block in
place** instead of duplicating it, so you can regenerate the Kaddo guidance any time without touching
the team's content. If the file has a half-open block (a BEGIN without an END, or vice-versa), the
command fails with a clear message and changes nothing — fix it manually or use `--force`.

```bash
# Existing AGENTS.md → add the Kaddo block, keep team instructions
kaddo adapters install codex --inject

# Preview the merged result without writing
kaddo adapters install codex --inject --dry-run
```

To test it: create an `AGENTS.md` with a couple of team rules, run
`kaddo adapters install codex --inject`, confirm your rules are still there with a Kaddo block
appended, then run it again and confirm the block was updated — not duplicated.

## Behavior

| Situation | Result |
|---|---|
| No `AGENTS.md` | created (full projection) |
| `AGENTS.md` exists, no flag | skipped (suggests `--inject` / `--force` / `--dry-run`) |
| `--dry-run` | prints the content, writes nothing |
| `--inject` | adds or updates only the Kaddo block, preserving the rest |
| `--inject --dry-run` | prints the merged result, writes nothing |
| `--inject` with invalid markers | errors, file untouched |
| `--force` | overwrites the entire file |

Deterministic: no LLM, no git, no application code. It never modifies `knowledge/` or `.kaddo/`,
and only writes `AGENTS.md` at the project root. Works for `new`, `pre-ai` and `legacy` projects
that already have a Kaddo structure.

## Why

A new user no longer has to remember to tell Codex "read the context pack, check roadmap readiness,
use Work Items, respect Guard, don't edit `.kaddo/`". Those instructions come from the repository,
making Kaddo more portable and easier to adopt with Codex.

## Out of scope

Other adapters (Claude Code, Cursor, Copilot…), `AGENTS.md` per subdirectory, semantic/intelligent
merge (conflict resolution, reordering external sections, multiple Kaddo blocks), and auto-sync are
not part of this version.
