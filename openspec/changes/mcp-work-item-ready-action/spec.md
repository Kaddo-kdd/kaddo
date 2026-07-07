# MCP Work Item Ready Action and Post-Refinement Suggestion (VS-088)

## Problem

After VS-087 added `kaddo ready` in the CLI, agents working through MCP had no structured way to suggest or execute the draft→ready transition. The next-step recommendation also continued suggesting refinement even after a Work Item was already refined.

## Solution

1. **MCP tool `kaddo_mark_work_item_ready`** — accepts `id` and optional `confirm`. Without confirm, returns a preview with readiness warnings. With `confirm: true`, transitions the Work Item (updates status, adds `ready_at`, moves file from `draft/` to `ready/`).

2. **Post-refinement next-step** — when draft Work Items have `refined_by` in their frontmatter, `resolveNextStep()` returns `review-work-item` (with `mcpAction: kaddo_mark_work_item_ready` and `command: kaddo ready`) instead of `refine-work-item`.

3. **`DeliveryState.refined_draft_work_items`** — new count of drafts with `refined_by`, used to decide between review vs refinement recommendations.

4. **Agent/skill guidance** — work-item-agent prompt updated to recommend human review via `kaddo ready` or MCP action after refinement. work-item-refinement skill states readiness requires human confirmation.

5. **Safety** — `writeWorkItemTransition()` and `removeWorkItemFile()` added to MCP project.ts, scoped strictly to `knowledge/delivery/work-items/`. gray-matter cache mutation bug fixed (shallow-clone data before mutating status).

## Files changed

- `packages/mcp/src/tools.ts` — `markWorkItemReady` with confirm flow
- `packages/mcp/src/server.ts` — tool registration with confirm param
- `packages/mcp/src/project.ts` — `writeWorkItemTransition`, `removeWorkItemFile`
- `packages/mcp/src/workitems.ts` — `assessReadiness`, `WorkItemReadiness`, object source parsing
- `packages/cli/src/core/next-step.ts` — `refined_draft_work_items`, `review-work-item` step, `mcpAction` field
- `packages/cli/src/core/project-route.ts` — `review-work-item` → `refine-work-item` mapping
- `packages/cli/src/agents/prompts.ts` — work-item-agent handoff guidance
- `packages/cli/src/agents/responsibility.ts` — work-item-agent can suggest `kaddo ready`
- `packages/cli/src/skills/skills.ts` — work-item-refinement human confirmation rule
- `apps/docs/src/content/docs/mcp-server.md` — EN doc
- `apps/docs/src/content/docs/es/mcp-server.md` — ES doc
