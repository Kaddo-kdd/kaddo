# Tasks: State-Aware Delivery Next Step Recommendation (VS-079)

- [x] next-step.ts: DeliveryState + buildDeliveryState (counts, ownership, remaining candidates,
      decision candidates, accepted ADRs, adapters).
- [x] next-step.ts: NextStepRecommendation gains skill? + secondary?; state-aware delivery ladder
      (create / install-adapter / implement / guard / refine-work-item / resolve-blocker /
      materialize-more / plan-next); buildSecondaryRecommendations (ownership / ADRs / remaining).
- [x] project-explain.ts: Suggested Next Steps leads with state-aware primary + secondary in delivery.
- [x] understand.ts: print skill + secondary; gate "first Work Item" message on materialized === 0.
- [x] context-pack.ts + template: deliveryState + ## Delivery State / ## Next Step Recommendation.
- [x] MCP kaddo://next-step (read-only) + resources test URI.
- [x] Tests: no WIs → create; draft → work-item-agent; draft + ownership missing → secondary owners;
      draft + remaining → secondary materialize-later; decision candidates → secondary adr-writing;
      ready + no adapter → install-adapter; ready + adapter → implementation-agent; in-progress → guard;
      recommendation carries id/phase/label/reason/agent/skill; context-pack deliveryState.
- [x] Docs State-Aware Next Step (EN/ES) + sidebar; README. Minor bump 3.45.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (756); `pnpm -r build` green.
- [x] `astro build` green (127 pages).
