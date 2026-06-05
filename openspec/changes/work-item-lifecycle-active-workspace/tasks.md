# Tasks: Work Item Lifecycle & Active Workspace

## Phase 1 — Lifecycle model
- [x] `core/lifecycle.ts`: states, active/historical sets, `lifecycleStateOf`, legacy map,
      folder resolution, counts, transitions, initiative grouping.
- [x] artifact-reader: expose `phase` and `initiative`.
- [x] Unit tests (resolution, legacy, folder, fallback, counts, recursive discovery).

## Phase 2 — Wire in
- [x] create: default to `work-items/draft/`, `status: draft`, recursive `nextWorkItemId`
      (standard + module + roadmap paths).
- [x] explain: per-state counts + initiative grouping (render + agent JSON).
- [x] context: include only active states by default (exclude completed/archived).
- [x] understand: active-work counts + recommend starting a `ready` item.
- [x] Tests for explain/context/understand.

## Phase 3 — Docs & visual guide (EN/ES)
- [x] Delivery template, Work Items, create, explain, understand docs + lifecycle diagram.

## Validation
- [x] `./node_modules/.bin/vitest.CMD run --config vitest.config.ts` (pnpm unavailable in PATH)
- [x] `../../node_modules/.bin/tsup.CMD` from `packages/cli` (pnpm unavailable in PATH)
