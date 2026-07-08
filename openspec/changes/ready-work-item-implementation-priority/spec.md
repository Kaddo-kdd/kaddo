# Ready Work Item Implementation Priority (VS-090)

## Problem

After transitioning a Work Item to `ready` via `kaddo ready`, `resolveNextStep()` recommended `roadmap-agent` when the roadmap had no candidates — even though a ready Work Item existed. This contradicted `projectRoute.currentStep = prepare-implementation` and left the user without actionable implementation guidance.

## Solution

Restructured the `resolveNextStep()` priority ladder so ready Work Items take priority over roadmap/create recommendations. The new order:

1. Ready WI + no adapter → `prepare-implementation` (with `kaddo adapters list`)
2. Ready WI + adapter → `implement-work-item` (with `implementation-agent`)
3. In-progress → `guard`
4. Refined draft → `review-work-item`
5. Draft → `refine-work-item`
6. Blocked → `resolve-blocker`
7. No active WIs + empty roadmap → `roadmap`
8. Roadmap has candidates + no WIs → `create-work-item`

When ready WIs exist and the roadmap is empty, roadmap appears as a **secondary** recommendation instead of the primary.

Added `ready_work_item_ids: string[]` to `DeliveryState` for targeted recommendations. Single ready WI gets `target` and specific label; multiple get `targets` array.

Both `prepare-implementation` and `implement-work-item` include `agent: implementation-agent` and `skill: implementation-planning`.

## Files changed

- `packages/cli/src/core/next-step.ts` — priority ladder restructure, `ready_work_item_ids`, new recommendation IDs
- `packages/cli/src/core/project-route.ts` — `prepare-implementation`/`implement-work-item` → `prepare-implementation` mapping
- `packages/cli/src/templates/understand-template.ts` — handle new IDs in expected-output section
- `packages/cli/tests/next-step.test.ts` — updated AC7/AC8 for new IDs
- `packages/cli/tests/understand.test.ts` — updated install-adapter fixture and assertion
- `packages/cli/tests/mcp-ready-action.test.ts` — 9 new VS-090 tests, updated VS-088 roadmap test
- `apps/docs/src/content/docs/next-step.md` — EN decision ladder reordered
- `apps/docs/src/content/docs/es/next-step.md` — ES decision ladder reordered
