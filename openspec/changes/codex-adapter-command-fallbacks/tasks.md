# Tasks: Codex Adapter Command Fallbacks (VS-065.1)

- [x] core/codex-adapter.ts: render a `## Command fallback` section (kaddo → corepack pnpm exec →
      pnpm exec → npx) with the "don't assume unavailable" guidance; documents only, never runs.
- [x] Tests: fallback section in generated content; included in `--dry-run` and `--force`.
- [x] Docs EN/ES (Codex Adapter page) + npm README roadmap. Both packages bump to 3.27.1.

## Validation
- [x] `pnpm test` green (600); typecheck green; `pnpm -r build` green; smoke (fallback section).
- [x] `astro build` green.
