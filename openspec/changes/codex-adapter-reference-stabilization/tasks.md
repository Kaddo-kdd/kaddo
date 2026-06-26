# Tasks: Codex Adapter Reference Stabilization (VS-065.1-ref)

- [x] core/codex-adapter.ts: `packageManager` context field + `detectPackageManager` (lockfiles).
- [x] `commandFallbacks(pm)` + shared `commandFallbackSection(pm, heading)`; used by both the full
      projection (`## `) and the injected block (`### `). "Don't fail immediately" wording.
- [x] Tests: pm detection pnpm/npm/yarn/none → tailored fallbacks; don't-give-up line (24 in file).
- [x] Docs: Codex page reference framing + pm note + manual smoke tests (EN/ES).
- [x] New Custom Adapters page (EN/ES) — Adapter Contract, common-core/target split, include/exclude,
      base template, smoke tests; sidebar entry.
- [x] npm README roadmap. Both packages bump to 3.27.3.

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (pnpm vs npm fallback).
- [x] `astro build` green.
