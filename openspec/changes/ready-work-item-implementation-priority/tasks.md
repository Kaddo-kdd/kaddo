# Tasks — Ready Work Item Implementation Priority (VS-090)

- [x] Add `ready_work_item_ids` to `DeliveryState` type and populate in `buildDeliveryState()`
- [x] Restructure `resolveNextStep()` priority ladder: ready > in-progress > refined draft > draft > blocked > roadmap
- [x] Add `prepare-implementation` recommendation (ready WI, no adapter)
- [x] Add `implement-work-item` recommendation (ready WI, adapter installed)
- [x] Include `target`/`targets`, `agent`, `skill` in ready WI recommendations
- [x] Add roadmap-empty as secondary when ready WIs exist
- [x] Map new IDs in `project-route.ts` `mapNextStepId()`
- [x] Handle new IDs in `understand-template.ts` expected-output section
- [x] Update existing tests (next-step AC7/AC8, understand install-adapter)
- [x] Update VS-088 roadmap-candidates test for new priority
- [x] Add 9 VS-090 tests (ready beats roadmap, target, targets, secondary, adapter, alignment)
- [x] Update EN docs (next-step.md decision ladder)
- [x] Update ES docs (es/next-step.md decision ladder)
- [x] Typecheck CLI + MCP
- [x] Build CLI + MCP + docs
- [x] All tests pass (1013)
- [x] Create openspec
