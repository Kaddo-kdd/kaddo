# Proposal: Work Item Lifecycle & Active Workspace (VS-041)

## Why

All Work Items currently live flat in `knowledge/delivery/work-items/`. As a project grows
to dozens or hundreds of items, the folder becomes a hard-to-navigate history: active work is
buried among closed items, and `explain`/`context` ship too much history to agents.

## What

Turn `knowledge/delivery/work-items/` into an **active workspace** organized by lifecycle
state, while keeping `phase` and `initiative` as functional traceability metadata (not folders).

- Official lifecycle: `draft → ready → in-progress → blocked → completed → archived`.
- Physical organization by state (subfolders), discovered recursively.
- `explain` shows counts per state and a virtual grouping by initiative.
- `context` ships only **active** work (draft/ready/in-progress/blocked) by default; completed
  and archived are historical and excluded unless explicitly requested.
- `understand` reasons about the lifecycle and recommends the next step.
- `create` defaults new Work Items into `work-items/draft/`.
- Back-compat: existing flat `work-items/*.md` keep working; a file with no recognizable
  lifecycle status is interpreted as `ready`.

This VS only defines the **model**. It does NOT add movement commands (`kaddo work-item move`,
`kaddo archive`), transition automation, archival automation, roadmap sync, or any git automation.

## Impact

- Agents focus on active work; historical items stop dominating the LLM context (big token win
  at scale).
- Guard, Ownership and Roadmap are unchanged (Guard already walks `work-items/**` recursively).
