# Tasks: Claude Adapter Safe Merge + Neutral Markers (VS-066 follow-up)

- [x] Neutral markers `<!-- BEGIN/END KADDO ADAPTER -->`; recognize + auto-migrate legacy
      `KADDO CODEX ADAPTER` (findMarker/markerLength); detectAgentsState/injectKaddoBlock accept both.
- [x] generated-by detection by prefix so both codex/claude generated files classify correctly.
- [x] commands/adapters.ts: `supportsInject: true` for claude; inject create-branch renders the
      target (was hardcoded codex).
- [x] Tests: neutral marker, legacy migration on update, Claude --inject create + update-no-dup.
- [x] Docs EN/ES (Codex marker note + Claude safe-merge section) + npm README. Patch bump 3.28.1.

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (claude inject + legacy migrate).
- [x] `astro build` green.
