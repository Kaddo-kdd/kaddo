# Tasks: Codex AGENTS.md Adapter (VS-065)

## Phase 1 — Core
- [x] `core/codex-adapter.ts`: `buildCodexAdapterContext` (config/agents/skills/MCP hint/paths) +
      `renderAgentsMd` (compact projection, no full-file inlining).

## Phase 2 — Command
- [x] `commands/adapters.ts` (`runAdaptersInstall`): create / skip / `--dry-run` / `--force`.
- [x] index.ts: `adapters install <adapter>` + `export <adapter>` alias; command-help entry.

## Phase 3 — Docs & tests
- [x] New Codex Adapter page (EN/ES) + sidebar; Commands Overview cross-links; root README section.
- [x] CLI tests: content (guidance/knowledge map/readiness/guard/validations), agents+skills listing,
      no-agents/no-skills valid, no full-file inlining, new/pre-ai/legacy, create/skip/force/dry-run.

## Validation
- [x] `pnpm test` green (598); typecheck green; `pnpm -r build` green; smoke (create/skip/dry-run/force).
- [x] `astro build` green.
