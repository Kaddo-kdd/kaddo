# VS-083 — Bootstrap Recommendation Alignment

## Goal

When the knowledge baseline is incomplete (business.md or product.md missing),
every Kaddo surface — explain, context-pack, understand, project-route, and
MCP resources — must converge on a single dominant recommendation: run
`kaddo bootstrap` before anything else. No agent handoff, no phase-specific
suggestions, no roadmap materialization prompts until the baseline exists.

## Approach

1. Add an explicit `bootstrap` step to `project-route.ts` (in both PRE_AI_STEPS
   and LEGACY_STEPS), evaluated by checking business.md and product.md presence.
2. Fix `mapNextStepId` so `bootstrap` maps to `bootstrap` (not `define-business`).
3. Rewrite `suggestedNextSteps` in `project-explain.ts` to check baseline
   completeness first and show bootstrap-first ordering.
4. Add `hasBusiness`, `hasProduct`, `hasSkills` to the explain knowledge object.
5. Suppress agent handoff in `context-pack-template.ts` when bootstrap is
   incomplete; show bootstrap-specific missing-context messages instead.
6. Show "Agent handoff is not ready yet" in `understand-template.ts` (both
   terminal and markdown) when bootstrap is incomplete.

## Constraints

- Pure, deterministic — no LLM, no network, no git mutation.
- MCP resources (`kaddo://next-step`, `kaddo://project-route`) are already
  aligned since they call `resolveNextStep()` and `buildProjectRoute()` directly.
- EN/ES doc parity maintained.
