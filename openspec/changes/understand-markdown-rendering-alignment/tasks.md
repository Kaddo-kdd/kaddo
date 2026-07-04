# Tasks: Understand Markdown Rendering Alignment (VS-079.1)

- [x] Extend `UnderstandPlan` with state-aware fields (phase, nextStepRecommendation, deliveryState, activeWorkItems, recommendedPaths, recommendedSkillPaths, language).
- [x] Add `enrichUnderstandPlan` function to merge delivery data into the base plan.
- [x] Rewrite `renderUnderstand` to produce state-aware markdown with no empty sections.
- [x] Update `understand.ts` command to enrich the plan before rendering.
- [x] Add 16 tests covering AC1–AC16 (phase, recommendation, delivery state, secondary, agent/skill paths, active work items, no empty sections, semantic match).
- [x] All 717 CLI tests pass + 7 MCP resource tests pass.
- [x] Typecheck clean (CLI + MCP).
- [x] Build CLI + MCP.
- [x] Update docs EN.
- [x] Update docs ES.
- [x] OpenSpec proposal + tasks.
- [x] Bump to 3.46.0.
