# Ready Command Targeted Recommendation (VS-089)

## Problem

After VS-088 added the `review-work-item` recommendation, the next-step output used a generic `kaddo ready` command without specifying which Work Item to review. Agents receiving the recommendation had no structured way to identify the target Work Item(s) for the MCP tool call.

## Solution

1. **`DeliveryState.refined_draft_ids`** — new string array listing the IDs of all draft Work Items with `refined_by` set, populated alongside the existing `refined_draft_work_items` count.

2. **Single-target recommendation** — when exactly one refined draft exists, the recommendation includes `target` (the WI ID), `mcpArgs: { id }` (ready-to-use MCP tool arguments), and `command: kaddo ready <ID>` (specific CLI command).

3. **Multi-target recommendation** — when multiple refined drafts exist, the recommendation includes `targets` (array of all IDs) and `command: kaddo ready <WI-ID>` (generic placeholder). No `target` or `mcpArgs` are set.

4. **`NextStepRecommendation` type extensions** — added `targets?: string[]` and `mcpArgs?: Record<string, string>` fields.

## Files changed

- `packages/cli/src/core/next-step.ts` — `refined_draft_ids` in `DeliveryState`, `targets`/`mcpArgs` in `NextStepRecommendation`, single/multi branch in `resolveNextStep`
- `packages/cli/tests/mcp-ready-action.test.ts` — updated existing tests, added 6 VS-089 scenarios
- `apps/docs/src/content/docs/next-step.md` — EN doc with new fields and decision ladder step
- `apps/docs/src/content/docs/es/next-step.md` — ES doc parity
