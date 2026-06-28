# Tasks: Adapter Inject Generated File Guard (VS-066.1)

- [x] commands/adapters.ts: in the inject path, when `detectAgentsState` is `generated_by_kaddo`,
      do nothing and print a clear message (file already fully generated; use `--force`; `--inject`
      is for team-owned files). Shared across Codex + Claude.
- [x] Tests: codex + claude — `--inject` on a fully generated file leaves it unchanged with no
      injected block; team-owned inject, update-no-dup and legacy migration still work.
- [x] Docs EN/ES: `--force` vs `--inject` rule + behavior-table row (Codex + Claude pages).
- [x] Patch bump to 3.28.2 (both packages) + npm README roadmap.

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (guard on generated file).
- [x] `astro build` green.
