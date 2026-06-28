# Proposal: Antigravity Adapter (VS-068)

## Why

Kaddo has adapters for Codex (`AGENTS.md`), Claude Code (`CLAUDE.md`) and OpenCode (`AGENTS.md`),
all over a shared common core (create/dry-run/force/inject, inject guard, command fallback, safe
merge, neutral markers). Teams using Google Antigravity still paste the Kaddo workflow manually.
Extend the same pattern to Antigravity.

## What

Add `kaddo adapters install antigravity` (alias `kaddo export antigravity`) generating a root
`AGENTS.md` projection for Antigravity. Antigravity reads repository-level agent instructions from
`AGENTS.md` — the same file Codex/OpenCode target — so this is a new adapter **target** over the
existing shared pipeline, not new logic. It reuses everything: project/knowledge/derived/agents/
skills/package-manager detection, command fallback, `--inject` safe merge, the inject guard for
fully-generated files, and the neutral `KADDO ADAPTER` markers. Only the target label (and the
generated-by header text) differ.

Full behavior from day one: create, `--dry-run`, `--force`, `--inject` (team-owned add/update, no
duplication), inject guard (no-op + suggest `--force`), half-open marker error, unknown-adapter error
now listing `codex, claude, opencode, antigravity`.

## Scope

Root `AGENTS.md` only. No native Antigravity Rules (future VS-068.1), Workflows (VS-068.2) or Skills
(VS-068.3).

## Impact

- `core/codex-adapter.ts`: `AdapterTarget` gains `antigravity` → `AGENTS.md`.
- `commands/adapters.ts`: target registry entry (antigravity, AGENTS.md, supportsInject).
- `index.ts`: install/export descriptions mention antigravity.
- New docs Antigravity Adapter page (EN/ES) + sidebar; README adapters section (root + npm). Minor
  bump to 3.30.0.
