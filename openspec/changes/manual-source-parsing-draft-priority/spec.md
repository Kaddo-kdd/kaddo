# Manual Work Item Source Parsing and Draft Priority (VS-086)

## Problem

1. `parseWorkItemSource()` expected `source` as a string but `kaddo create` (VS-085) writes it
   as a YAML object (`{ type: manual, inferred: false }`). `String()` on that object produces
   `[object Object]`, classified as `unknown` with a false warning.

2. When a draft Work Item exists but the roadmap is empty, `resolveNextStep()` recommends
   `roadmap-agent` instead of `work-item-agent`. This contradicts `projectRoute.currentStep`
   which correctly shows `refine-work-item`.

## Solution

1. Add an object-type branch at the top of `parseWorkItemSource()` that reads `type`,
   `inferred`, and all optional fields from the nested object. Falls back to the existing
   string parser for legacy format.

2. Move `buildDeliveryState()` before the roadmap check in `resolveNextStep()`. When
   `roadmap !== 'has-candidates' && st.draft_work_items > 0`, return `refine-work-item`
   instead of `roadmap`.

## Files changed

- `packages/cli/src/core/work-item-source.ts` — object-type source parsing
- `packages/cli/src/core/next-step.ts` — draft WI priority over empty roadmap
- `packages/cli/tests/source-parsing-priority.test.ts` — 18 tests
- `apps/docs/src/content/docs/commands/understand.md` — EN docs
- `apps/docs/src/content/docs/es/commands/understand.md` — ES docs
- `apps/docs/src/content/docs/commands/create.md` — EN docs
- `apps/docs/src/content/docs/es/commands/create.md` — ES docs

## Acceptance criteria

See VS-086 spec (AC1–AC30).
