# Tasks: Claude Code Adapter (VS-066)

- [x] core/codex-adapter.ts: `renderAdapterMarkdown(ctx, target)` generic renderer; `AdapterTarget`;
      `renderAgentsMd`/`renderClaudeMd` thin wrappers (shared body, target-specific header/title).
- [x] commands/adapters.ts: target registry (codex/claude); generic create/skip/force/dry-run +
      messages; inject stays Codex-only; unknown-adapter error lists targets.
- [x] index.ts: install/export descriptions mention claude (arg already accepts it).
- [x] Tests: Claude content (header/title/pm fallback/agents/skills/no-inline/states) + command
      (create/skip/force/dry-run/no-knowledge-write/no-AGENTS-leak/unknown) — 32 in file.
- [x] Docs: new Claude Adapter page (EN/ES) + sidebar; README adapters section (root + npm).
- [x] Minor bump to 3.28.0 (both packages).

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (create/skip + alias + pm).
- [x] `astro build` green.
