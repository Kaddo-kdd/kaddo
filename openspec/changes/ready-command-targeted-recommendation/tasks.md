# Tasks — Ready Command Targeted Recommendation (VS-089)

- [x] Add `refined_draft_ids` to `DeliveryState` type
- [x] Populate `refined_draft_ids` in `buildDeliveryState()`
- [x] Add `targets` and `mcpArgs` to `NextStepRecommendation` type
- [x] Update `resolveNextStep` single-target branch (target, mcpArgs, specific command)
- [x] Update `resolveNextStep` multi-target branch (targets array, generic command)
- [x] Update existing tests for new command/reason format
- [x] Add VS-089 tests (6 scenarios: target, mcpArgs, targets, refined_draft_ids, label, JSON)
- [x] Update EN docs (next-step.md: decision ladder, field descriptions, JSON example)
- [x] Update ES docs (es/next-step.md: parity)
- [x] Typecheck CLI + MCP
- [x] Build CLI + MCP + docs
- [x] All tests pass (1004)
- [x] Create openspec
