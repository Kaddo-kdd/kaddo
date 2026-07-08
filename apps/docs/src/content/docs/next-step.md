---
title: State-Aware Next Step
description: Kaddo recommends the next delivery step from the real state of the work — draft, ready, in-progress, ownership, ADRs and adapters — not just from whether the roadmap still has candidates.
---

Kaddo has a single deterministic answer to "what should I do next?" — shared by `kaddo explain`,
`kaddo context` and `kaddo understand` so they never contradict each other. Since VS-079 that answer is
**state-aware**: it looks at the most urgent state of the current delivery, not only at whether the
roadmap still has pending candidates.

Before VS-079, a project with one draft Work Item and six remaining roadmap candidates would still be
told to "materialize the first Work Item" — even though a Work Item already existed. Now Kaddo leads you
through the real flow: refine the draft, fill ownership, materialize ADRs, prepare an adapter, then
implement.

## The decision ladder

Kaddo evaluates the next step in priority order:

1. Missing foundational knowledge (business / product / tech)
2. Blocking open questions
3. **Ready** Work Item + no adapter → prepare implementation (`kaddo adapters list`)
4. **Ready** Work Item + adapter → **implementation-agent**
5. **In-progress** Work Item → `kaddo guard`
6. **Refined draft** Work Item (`refined_by` set) → `kaddo ready <WI-ID>` (human review)
7. **Draft** Work Item → **work-item-agent** (never "create the first Work Item")
8. **Blocked** Work Item → resolve the blocker with the work-item-agent
9. No roadmap and no active Work Items → **roadmap-agent**
10. Roadmap has candidates but **no Work Items** → `kaddo create --from roadmap`
11. Only completed/archived work → materialize remaining candidates or plan the next initiative

The central rule: **Kaddo recommends the next step from the real state of delivery, not just from the
existence of pending roadmap candidates.**

## Primary + secondary recommendations

The recommendation is an object with `id`, `phase`, `label`, `reason` and optional `command`, `agent`,
`skill`, `mcpAction`, `target`, `targets` and `mcpArgs`. When the recommendation targets a single Work
Item, `target` and `mcpArgs` are set so agents can invoke the MCP tool directly. When multiple
candidates exist, `targets` lists all IDs. Parallel concerns are surfaced as **secondary**
recommendations that don't replace the primary one:

- **Ownership** — when ownership coverage is below 100%, `kaddo owners suggest` appears.
- **ADRs** — when there are technical decision candidates and no accepted ADR, the `adr-writing` skill
  (`kaddo adr`) is suggested before implementing related technical Work Items. This warns; it never
  blocks Work Item creation.
- **Remaining candidates** — once at least one Work Item exists, remaining roadmap candidates become a
  *secondary* "materialize later" suggestion rather than the primary step.

`kaddo explain` renders these as a numbered **Suggested Next Steps** list, leading with the primary:

```txt
## Suggested Next Steps
1. Refine the existing draft Work Item with the work-item-agent.
2. Run `kaddo owners suggest` for Work Items without code ownership.
3. Use the adr-writing skill (`kaddo adr`) to materialize decision candidates into ADRs.
4. Later, materialize the remaining 6 Work Item candidate(s) with `kaddo create --from roadmap`.
```

## In the context pack

`kaddo context` carries a `deliveryState` snapshot and the computed `nextStepRecommendation`:

```json
{
  "deliveryState": {
    "phase": "Active Delivery",
    "draft_work_items": 1,
    "refined_draft_work_items": 1,
    "refined_draft_ids": ["WI-001"],
    "ready_work_items": 0,
    "ownership_coverage": "0/1",
    "remaining_work_item_candidates": 6
  },
  "nextStepRecommendation": {
    "id": "review-work-item",
    "command": "kaddo ready WI-001",
    "mcpAction": "kaddo_mark_work_item_ready",
    "target": "WI-001",
    "mcpArgs": { "id": "WI-001" }
  }
}
```

The markdown pack adds a **Delivery State** and **Next Step Recommendation** section with the same data.

## Over MCP

Agents can read the recommendation directly via the read-only resource `kaddo://next-step`, which
returns `{ nextStepRecommendation, deliveryState }` — the same object the CLI computes, from the shared
`resolveNextStep(dir)` source. Deterministic and read-only.

## What it never does

The recommendation is guidance only. Kaddo never creates or refines Work Items automatically, never
marks a Work Item ready, never creates ADRs, never installs adapters, never calls an LLM and never runs
git. The roadmap is never blocked.
