# Tasks: Antigravity Adapter (VS-068)

- [x] core/codex-adapter.ts: `AdapterTarget` gains `antigravity`; `TARGET_FILE.antigravity = 'AGENTS.md'`.
- [x] commands/adapters.ts: target registry entry `antigravity` (AGENTS.md, label Antigravity,
      supportsInject) — reuses shared create/skip/force/dry-run/inject/guard.
- [x] index.ts: install/export descriptions mention antigravity.
- [x] Tests: content (antigravity header/title/body/pm fallback/agents/skills/no-inline), lifecycle
      (skip/force/dry-run), inject (team-owned add+update no-dup), inject guard (generated no-op),
      half-open error, states new/pre-ai/legacy, unknown adapter lists all four.
- [x] Docs: new Antigravity Adapter page (EN/ES) + sidebar; README adapters section (root + npm).
- [x] Minor bump to 3.30.0 (both packages).

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (create/alias + inject guard).
- [x] `astro build` green.
