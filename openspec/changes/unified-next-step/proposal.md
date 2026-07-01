# Proposal: Unified Next-Step Recommendation (VS-073.2)

## Why

After VS-073.1, phase detection and readiness computed their next step independently and diverged:
in the `dotear-web` smoke, `explain` showed `business-agent` in the Phase section but
`architecture-agent` in Project Readiness (readiness ordered current-state first; phase ordered
Business first). A single project state must produce a single compass.

## What

Add a single deterministic source of truth, `core/next-step.ts` → `resolveNextStep(dir)` returning a
`NextStepRecommendation` (`id`, `phase`, `label`, optional `command`/`agent`/`target`, `reason`,
`instructions`). Priority ladder: init → bootstrap → add agents → add skills → scan (pre-ai/legacy) →
context → understand → refine Business → Product → Tech(current-state) → Tech(codebase) → blocking
questions → roadmap → create --from roadmap (only with candidates) → adapter → implement.

All surfaces consume it:
- `readiness.ts`: `recommended_next_step` and new `nextStepRecommendation` come from the resolver;
  `overall` stays the status label. The shared roadmap/work-item/adapter signal helpers move here.
- `context-pack.ts`: `phase.nextStep` / `phase.recommendedAgents` / `handoff.nextSteps` driven by the
  resolver; new top-level `nextStepRecommendation`.
- `project-explain.ts`: the Phase "Next step" line and Project Readiness show the same recommendation;
  new top-level `nextStepRecommendation`; fixed the duplicated `capabilities` line.
- `understand.ts`: prints the unified next step + reason.

Layer order for knowledge refinement is Business → Product → Tech, so an all-placeholder project
recommends `business-agent` everywhere. `create --from roadmap` is never recommended with 0
candidates.

## Scope

Consolidation of guidance only. No new commands, no execution, no knowledge edits, no LLM, no git.

## Impact

- New `core/next-step.ts`; `readiness.ts`, `context-pack.ts`, `project-explain.ts`, `understand.ts`
  consume it. Docs commands/explain.md (EN/ES); README. Patch bump 3.37.1.
