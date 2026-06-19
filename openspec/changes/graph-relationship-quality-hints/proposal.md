# Proposal: Graph Relationship Quality & Metadata Hints (VS-056)

## Why

VS-055 exports the knowledge graph, but a first run showed it can stay centered on layers, roadmap
candidates, Work Items and initiatives while having few connections to capabilities, ADRs, code
globs, owners, capsules and dependencies. That is usually not a bug — it means artifacts lack
relational metadata. Kaddo should help the user see and fix that, without forcing heavy
documentation or inferring semantic relationships.

## What

`kaddo graph export` now also evaluates **relationship quality** and emits non-blocking
**metadata hints**:

- Two new files: `.kaddo/graph-hints.md` (human) and `.kaddo/graph-hints.json` (tooling/tests).
- A quality level: `good | partial | sparse | empty`, plus deterministic metrics.
- Hints detect: active Work Items without `code`/`capabilities`/`decisions`/roadmap `source`; ADRs
  without governed `code`; capabilities with no Work Item; registered capsules with no Work Item
  (`capsules:`).
- Console output adds quality + the first few hints.
- `kaddo explain` shows quality + hint count; `kaddo context` shows a short hints summary + the
  suggested `graph-agent`; `kaddo understand` recommends reviewing hints **only** during Active
  Delivery and **only** when hints affect active Work Items.
- New `graph-agent` proposes precise front matter from the hints (never edits files, never invents
  relationships, asks for confirmation).

## Principle

> The graph is only as useful as the relationships declared in knowledge.

Suggestions, not auto-fixes. Kaddo never edits artifacts, never reads `src/`, never calls an LLM.

## Impact

- New core module `core/graph-hints.ts`; `graph export` writes the two hint files.
- artifact-reader gains a `capsules` field; graph gains a `uses_external_knowledge` (WI → capsule)
  edge so capsule links are real.
- `explain` / `context` / `understand` integrations; new `graph-agent`.
- Docs EN/ES + an "Improving Graph Quality" section.
- Additive, backward compatible → minor version bump.
