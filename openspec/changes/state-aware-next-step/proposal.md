# Proposal: State-Aware Delivery Next Step Recommendation (VS-079)

## Why

Kaddo's next-step recommendation prioritized the existence of roadmap candidates over the real state of
the Work Items. A project with 1 draft Work Item and 6 remaining candidates was still told to
"materialize the first Work Item" — even though a Work Item already existed. The problem is a decision
problem, not a counting one: the next step must depend on the most urgent delivery state, not just on
whether the roadmap still has candidates.

## What

Make `resolveNextStep` (the single shared resolver used by explain / context / understand / readiness)
state-aware for the delivery phase, and surface parallel concerns as secondary recommendations.

- `core/next-step.ts`: new `DeliveryState` + `buildDeliveryState(dir)` (draft/ready/in-progress/blocked
  counts, ownership coverage, remaining WI candidates, decision candidates, accepted ADRs, adapters).
  `NextStepRecommendation` gains `skill?` and `secondary?: SecondaryRecommendation[]`. The delivery
  decision ladder: no Work Items → create-from-roadmap; ready + no adapter → install adapter; ready +
  adapter → implementation-agent; in-progress → guard; draft → work-item-agent (never "first Work
  Item"); blocked → resolve; else materialize remaining / plan next. `buildSecondaryRecommendations`
  adds ownership (`kaddo owners suggest`), ADRs (`adr-writing` / `kaddo adr`) and "materialize remaining
  later".
- `project-explain.ts`: `## Suggested Next Steps` leads with the state-aware primary + secondary in a
  delivery phase.
- `commands/understand.ts`: prints the recommended skill + secondary recommendations; no longer tells
  the user to "materialize the first Work Item" once one exists.
- `context-pack.ts` + template: `deliveryState` snapshot + a `## Delivery State` / `## Next Step
  Recommendation` markdown block.
- MCP `kaddo://next-step`: read-only `{ nextStepRecommendation, deliveryState }`.

Guidance only: no auto-create/refine, no marking ready, no ADR creation, no adapter install, no LLM, no
git. Roadmap never blocked.

## Impact

- `core/next-step.ts`, `core/context-pack.ts`, `templates/context-pack-template.ts`,
  `core/project-explain.ts`, `commands/understand.ts`; MCP `resources.ts` (+ test). Docs State-Aware
  Next Step (EN/ES) + sidebar; README. Minor bump 3.45.0.
