# Tasks: Kiro Adapter (VS-069)

- [x] core/codex-adapter.ts: `AdapterTarget` gains `kiro`; `TARGET_FILE.kiro = 'AGENTS.md'`.
- [x] commands/adapters.ts: target registry entry `kiro` (AGENTS.md, label Kiro, supportsInject) —
      reuses shared create/skip/force/dry-run/inject/guard.
- [x] index.ts: install/export descriptions mention kiro.
- [x] Tests: content (kiro header/title/body/pm fallback/agents/skills/no-inline), lifecycle
      (skip/force/dry-run), inject (team-owned add+update no-dup), inject guard (generated no-op, no
      `.kiro/` assets), half-open error, states new/pre-ai/legacy, unknown adapter lists all five.
- [x] Docs: new Kiro Adapter page (EN/ES) + sidebar; README adapters section (root + npm).
- [x] Minor bump to 3.31.0 (both packages).

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (create/alias + inject guard).
- [x] `astro build` green.
