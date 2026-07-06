# VS-083 — Tasks

- [x] Add `bootstrapBaseline` step to `project-route.ts` (PRE_AI_STEPS + LEGACY_STEPS)
- [x] Fix `mapNextStepId`: bootstrap → bootstrap
- [x] Add `hasBusiness`, `hasProduct`, `hasSkills` to `project-explain.ts`
- [x] Rewrite `suggestedNextSteps` for bootstrap-first ordering
- [x] Suppress agent handoff in `context-pack-template.ts` when bootstrap incomplete
- [x] Show bootstrap-specific missing-context messages in context-pack
- [x] Show "Agent handoff is not ready yet" in `understand-template.ts` (terminal)
- [x] Show "Agent handoff is not ready yet" in `understand-template.ts` (markdown)
- [x] Write VS-083 tests (25 tests in bootstrap-alignment.test.ts)
- [x] Fix existing tests affected by bootstrap-first logic
- [x] All 867 tests pass
- [x] Build CLI + MCP
- [x] Update docs EN/ES
- [x] Version bump to 3.50.0
