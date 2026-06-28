# Tasks: OpenCode Adapter (VS-067)

- [x] core/codex-adapter.ts: `AdapterTarget` gains `opencode`; `TARGET_FILE.opencode = 'AGENTS.md'`.
- [x] commands/adapters.ts: target registry entry `opencode` (AGENTS.md, label OpenCode,
      supportsInject) — reuses shared create/skip/force/dry-run/inject/guard.
- [x] index.ts: install/export descriptions mention opencode.
- [x] Tests: content (opencode header/title/body/pm fallback/agents/skills/no-inline), lifecycle
      (skip/force/dry-run), inject (team-owned add+update no-dup), inject guard (generated no-op),
      half-open error, states new/pre-ai/legacy, unknown adapter lists codex/claude/opencode.
- [x] Docs: new OpenCode Adapter page (EN/ES) + sidebar; README adapters section (root + npm).
- [x] Minor bump to 3.29.0 (both packages).

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (create/alias + inject guard).
- [x] `astro build` green.
