# Spec: Understand Self-Recommendation Guard (VS-083.3)

## User Story

As a Kaddo user running `kaddo understand`, I expect actionable agent recommendations
instead of being told to re-run the command I'm already running.

## Problem

The priority ladder in `resolveNextStep` checked for `understand.md` existence **before**
knowledge quality checks. On first `kaddo understand` run, `understand.md` doesn't exist
yet (the command creates it), so it always returned `{ id: 'understand' }` — a circular
self-recommendation that masked actionable refinement steps.

Additionally, `mapNextStepId` mapped `understand` → `scan-repository`, causing
`projectRoute.currentStep` to incorrectly show `scan-repository` instead of the actual
next knowledge step.

## Solution

Move the `understand.md` existence check **after** the knowledge refinement checks in
`resolveNextStep`. The `understand` fallback now only fires when all five knowledge
layers are useful and no `understand.md` exists — a scenario that occurs exactly once
(the very first run after all knowledge is complete).

Remove the `understand` → `scan-repository` mapping from `mapNextStepId` so the route
doesn't override scan status when understand is the recommendation.

## Acceptance Criteria

- **AC1** — `kaddo understand` does not recommend itself when placeholders exist.
- **AC2** — `refine-business` is the recommendation when `business.md` is placeholder.
- **AC3–AC6** — `refine-business` includes `agent`, `agentPath`, `agentInstalled`, `target`.
- **AC7–AC8** — `understand.md` and `context-pack.md` render business-agent handoff.
- **AC9** — `context-pack.json` uses `nextStepRecommendation.id = refine-business`.
- **AC11** — `projectRoute.currentStep = define-business`.
- **AC12** — `scan-repository` stays as warning, not current.
- **AC13** — After business is useful, recommendation advances to product.
- **AC14** — `understand` fallback works when all knowledge is useful.
- **AC19–AC20** — CLI does not call LLM or execute git.
- **AC21–AC22** — Docs EN/ES updated.
- **AC24–AC28** — Tests (902), typecheck, build CLI/MCP/docs pass.

## Files Changed

- `packages/cli/src/core/next-step.ts` — reordered priority ladder
- `packages/cli/src/core/project-route.ts` — removed understand→scan-repository mapping
- `packages/cli/tests/next-step.test.ts` — updated existing test for new ordering
- `packages/cli/tests/knowledge-refinement-alignment.test.ts` — added 12 VS-083.3 tests
- `apps/docs/src/content/docs/commands/understand.md` — EN docs
- `apps/docs/src/content/docs/es/commands/understand.md` — ES docs
