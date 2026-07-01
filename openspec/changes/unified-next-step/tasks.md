# Tasks: Unified Next-Step Recommendation (VS-073.2)

- [x] core/next-step.ts: `resolveNextStep` (full priority ladder) + `NextStepRecommendation`; shared
      `roadmapSignal`/`workItemsSignal`/`installedAdapters` (moved from readiness).
- [x] readiness.ts: consume resolveNextStep for `recommended_next_step` + `nextStepRecommendation`;
      keep `overall`; import shared signal helpers.
- [x] context-pack.ts: `phase.nextStep`/`recommendedAgents`/`handoff.nextSteps` from the resolver;
      top-level `nextStepRecommendation`.
- [x] project-explain.ts: Phase next step == Project Readiness (unified); top-level
      `nextStepRecommendation`; fixed duplicate `capabilities` line.
- [x] understand.ts: print unified next step + reason.
- [x] Tests: ladder (init/bootstrap/agents/skills/scan/context/understand/business/capability/
      architecture/roadmap/create); no divergence across readiness/context/resolve; Business-first
      layer order; never create with 0 candidates.
- [x] Docs commands/explain.md (EN/ES) unified next-step note; README. Patch bump 3.37.1.

## Validation
- [x] typecheck green; `pnpm test` green (691); `pnpm -r build` green; smoke (explain phase==readiness).
- [x] `astro build` green.
