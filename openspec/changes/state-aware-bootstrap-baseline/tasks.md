# Tasks: State-Aware Bootstrap Baseline (VS-073)

- [x] core/bootstrap-templates.ts: state-aware baseline templates (new/pre-ai/legacy) with
      `project_state:` front matter for business/product/capabilities/codebase/current-state/roadmap.
- [x] commands/bootstrap.ts: full baseline (6 files) + ensure dirs `tech/decisions/`,
      `delivery/work-items/`; state-aware messages (drop new-only warning); never overwrite;
      idempotent; keeps knowledge.md/roadmap.md/work-items; no agents/skills/scan/git/LLM.
- [x] commands/understand.ts: recommend `kaddo bootstrap` first when readiness baseline incomplete.
- [x] Tests: bootstrap new/pre-ai/legacy baseline + dirs, state templates + project_state, no
      overwrite, idempotent, keep knowledge.md/roadmap/work-items, no agents/skills; fix language test.
- [x] Docs commands/bootstrap.md (EN/ES) rewritten; README roadmap. Minor bump 3.36.0.

## Validation
- [x] typecheck green; `pnpm test` green (675); `pnpm -r build` green; smoke (pre-ai/legacy, no warning).
- [x] `astro build` green.
