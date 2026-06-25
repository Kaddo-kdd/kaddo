# Proposal: Codex AGENTS.md Adapter (VS-065)

## Why

When working with Codex in a Kaddo repo, the user must manually tell it to read the context pack,
check roadmap readiness, use Work Items, respect Guard and not edit `.kaddo/`. New users may not know
these rules, creating friction and errors. If Kaddo can generate a clear `AGENTS.md`, Codex gets
native instructions from the repository.

## What

`kaddo adapters install codex` (alias `kaddo export codex`) generates a compact `AGENTS.md` at the
project root, projected from existing Kaddo structure (config, knowledge, agents, skills). Options:
`--dry-run` (preview, no writes) and `--force` (overwrite); by default it does not overwrite an
existing `AGENTS.md`.

The generated file is a **projection**, not a source of truth: it references the knowledge map,
operating rules, the open-questions readiness gate (resolve/assume/defer blocking questions before
the roadmap), before/after-implementation flows (read the active Work Item; suggest guard/impact/
savings/drift), installed agents and skills (names + role hints), an MCP section when detected, useful
commands and safety limits. It never inlines full file contents (`context-pack.md`, business/product/
codebase bodies, full agents/skills).

## Principle

> Kaddo is the source of truth. AGENTS.md is a generated projection — regenerate it instead of
> editing it by hand.

## Limits / out of scope

No LLM, no git, no application code; never modifies `knowledge/` or `.kaddo/`; only writes
`AGENTS.md`. Other adapters (Claude Code, Cursor, Copilot…), per-subdirectory AGENTS.md, intelligent
merge and auto-sync are out of scope.

## Impact

- New `core/codex-adapter.ts` (context + renderer) and `commands/adapters.ts`; `adapters install`
  + `export` commands; command-help entry.
- Docs EN/ES (Codex Adapter page) + Commands Overview + root README. Both packages bump to 3.27.0.
