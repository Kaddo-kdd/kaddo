# Proposal: Kiro Adapter (VS-069)

## Why

Kaddo has adapters for Codex, Claude Code, OpenCode and Antigravity over a shared common core
(create/dry-run/force/inject, inject guard, command fallback, safe merge, neutral markers). Teams
using Kiro still paste the Kaddo workflow manually. Extend the same pattern to Kiro.

## What

Add `kaddo adapters install kiro` (alias `kaddo export kiro`) generating a root `AGENTS.md`
projection for Kiro. Kiro reads a root `AGENTS.md` from the workspace — the same file Codex/OpenCode/
Antigravity target — so this is a new adapter **target** over the existing shared pipeline, not new
logic. It reuses everything: project/knowledge/derived/agents/skills/package-manager detection,
command fallback, `--inject` safe merge, the inject guard for fully-generated files, and the neutral
`KADDO ADAPTER` markers. Only the target label (and the generated-by header text) differ.

Full behavior from day one: create, `--dry-run`, `--force`, `--inject` (team-owned add/update, no
duplication), inject guard (no-op + suggest `--force`), half-open marker error, unknown-adapter error
now listing `codex, claude, opencode, antigravity, kiro`.

## Scope

Root `AGENTS.md` only. No native Kiro steering files (`.kiro/steering/`, future VS-069.1), specs
(VS-069.2) or hooks (`.kiro/hooks/`, VS-069.3).

## Impact

- `core/codex-adapter.ts`: `AdapterTarget` gains `kiro` → `AGENTS.md`.
- `commands/adapters.ts`: target registry entry (kiro, AGENTS.md, supportsInject).
- `index.ts`: install/export descriptions mention kiro.
- New docs Kiro Adapter page (EN/ES) + sidebar; README adapters section (root + npm). Minor bump to
  3.31.0.
