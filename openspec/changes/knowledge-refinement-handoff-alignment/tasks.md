# Tasks: Knowledge Refinement Handoff Alignment (VS-083.2)

## Completed

- [x] Add `business-agent.md` to `RECOMMENDED_BY_STATE['pre-ai']` in `groups.ts`
- [x] Add `refine-*` → route step ID mappings to `mapNextStepId` in `project-route.ts`
- [x] Extend `NextStepRecommendation` type with `agentPath`, `agentInstalled`, `installCommand`
- [x] Add `resolveAgent` helper and update `refine()` in `next-step.ts`
- [x] Update `understand-template.ts` markdown: Missing Agent section when agent not installed
- [x] Update `understand-template.ts` terminal: missing agent warning
- [x] Update `context-pack-template.ts`: agent install status in Recommended Agent Handoff
- [x] Update `understand.ts` command: agent path/install info in console output
- [x] Write VS-083.2 tests (12 tests)
- [x] Run full test suite (890 tests passing)
- [x] Build CLI + MCP + docs
- [x] Update docs EN/ES
- [x] Create openspec
- [x] Version bump to 3.52.0
- [x] Commit, tag, push
