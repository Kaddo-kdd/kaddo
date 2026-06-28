# Proposal: OpenCode Adapter (VS-067)

## Why

Kaddo has adapters for Codex (`AGENTS.md`) and Claude Code (`CLAUDE.md`), both with create/dry-run/
force/inject, inject guard, command fallback, safe merge and neutral markers. Teams using OpenCode
still paste the Kaddo workflow manually. Extend the same pattern to OpenCode.

## What

Add `kaddo adapters install opencode` (alias `kaddo export opencode`) generating a root `AGENTS.md`
projection for OpenCode. OpenCode reads repository-level agent instructions from `AGENTS.md` — the
same file Codex targets — so this is a new adapter **target** over the existing shared pipeline, not
new logic. It reuses everything: project/knowledge/derived/agents/skills/package-manager detection,
command fallback, `--inject` safe merge, the inject guard for fully-generated files, and the neutral
`KADDO ADAPTER` markers. Only the target label (and the generated-by header text) differ.

Full behavior from day one: create, `--dry-run`, `--force`, `--inject` (team-owned add/update, no
duplication), inject guard (no-op + suggest `--force` on a fully-generated file), half-open marker
error, unknown-adapter error now listing `codex, claude, opencode`.

## Scope

Root `AGENTS.md` only. No native OpenCode commands (future VS-067.1) or agents (future VS-067.2).

## Impact

- `core/codex-adapter.ts`: `AdapterTarget` gains `opencode` → `AGENTS.md`.
- `commands/adapters.ts`: target registry entry (opencode, AGENTS.md, supportsInject).
- `index.ts`: install/export descriptions mention opencode.
- New docs OpenCode Adapter page (EN/ES) + sidebar; README adapters section (root + npm). Minor bump
  to 3.29.0.
