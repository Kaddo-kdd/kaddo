---
title: Custom Adapters
description: The Adapter Contract every Kaddo adapter follows, and how to build a custom bridge between Kaddo knowledge and any AI coding tool.
---

Kaddo adapters project Kaddo knowledge into the **native instruction format** of an AI coding tool.
The [Codex adapter](codex-adapter/) (`AGENTS.md`) is the reference implementation; this page describes
the contract every adapter follows and how to build your own.

A custom adapter should **not** duplicate the full project knowledge. It should create a compact
bridge between the target tool and Kaddo's knowledge structure — references and rules, not content.

## When to create a custom adapter

Create one when your AI tool has a native mechanism for reading instructions from the repository —
for example `AGENTS.md`, `CLAUDE.md`, a `commands/` or `skills/` directory, or a tool-specific
workspace-instructions file.

## Adapter Contract

Every Kaddo adapter must:

- State that **Kaddo is the source of truth** and the generated file is a **projection**.
- Recommend **regenerating** the adapter instead of editing it by hand.
- List the primary **knowledge paths** and relevant **derived paths**.
- Include rules **before roadmap work**, **before implementation**, and **after implementation**.
- Include **safety limits** and a **command fallback** (prefer global `kaddo`, then a local runner).
- List available **agents** and **skills** by name (with short role hints).

And must never:

- Inline the full content of `context-pack.md`, Work Items, agents or skills.
- Paste full business/product/codebase knowledge, sensitive data, or full generated reports.
- Create application code, call an LLM, run git, or overwrite an existing file without `--force`.

This separates cleanly into two layers: a **common core** (the shared context — project name,
package manager, knowledge/derived paths, agents, skills, MCP hint) and a **target renderer** (the
tool-specific projection — `AGENTS.md` for Codex, `CLAUDE.md` for a future Claude Code adapter, …).

## What a custom adapter should include

- Project guidance · Kaddo knowledge map · Operating rules
- Before roadmap work · Before implementation · After implementation
- Command fallback · Available agents · Available skills · Safety limits

## What a custom adapter should not include

- Full business/product/codebase content · Full `context-pack` content
- Full Work Item content · Full agents/skills content
- Sensitive information · Generated reports pasted in full

## Base template

```md
# <TARGET> project instructions

This repository uses Kaddo for Knowledge Driven Development.
Kaddo is the source of truth. This file is a generated projection for <TARGET>.

## Read first
- `knowledge/business/`
- `knowledge/product/`
- `knowledge/tech/`
- `knowledge/delivery/`

## Before roadmap
Check open-questions readiness. If blocking questions exist, ask the user to resolve, assume or
defer them.

## Before implementation
Read the active Work Item and the relevant Kaddo context before changing code.

## After implementation
Suggest running `kaddo guard`.

## Command fallback
Prefer `kaddo <command>`. If it is not on PATH, try the local project runner (e.g.
`corepack pnpm exec kaddo <command>`, `pnpm exec kaddo <command>`, `npx kaddo <command>`) before
reporting that Kaddo is unavailable.

## Safety
Do not edit `.kaddo/` manually. Do not commit without user confirmation.
```

## Smoke tests for a custom adapter

After generating the file, validate the tool actually uses it:

1. *"Read the project instructions and explain the correct workflow before implementing the next Work
   Item. Do not modify files."* → mentions Work Items, Kaddo context, readiness, validation, and
   confirmation before commit.
2. *"Implement the next pending Work Item. Do not commit without confirmation."* → reads the Work
   Item, implements only its scope, validates, suggests `kaddo guard`.
3. *"Generate the roadmap."* → checks Open Questions readiness before generating the roadmap.
