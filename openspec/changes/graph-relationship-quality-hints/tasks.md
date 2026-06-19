# Tasks: Graph Relationship Quality & Metadata Hints (VS-056)

## Phase 1 — Core
- [x] artifact-reader: add `capsules: string[]`.
- [x] graph: `uses_external_knowledge` edge (WI → capsule) + relationship-edge set.
- [x] `core/graph-hints.ts`: types, `buildGraphHints`, quality, metrics, markdown/json render,
      `loadGraphHints`.
- [x] Unit tests (WI/ADR/capability/capsule hints, quality levels, no src reads, render).

## Phase 2 — Command & integrations
- [x] `graph export`: build hints, write `graph-hints.md` + `.json`, console quality + hints.
- [x] context-pack: `graphHints` summary + template `## Graph Hints`.
- [x] explain: quality + hint count in the `## Knowledge Graph` block.
- [x] understand: Active-Delivery nudge when hints affect active Work Items.
- [x] Tests for explain/context summaries.

## Phase 3 — Agent
- [x] `graph-agent` prompt + responsibility matrix + tech group + installed README.

## Phase 4 — Docs (EN/ES)
- [x] Knowledge Graph Export "Improving Graph Quality" section (EN/ES).
- [x] Agents, Context, Explain, Understand, Operating Moments, Visual Guide, Prompt Workflow.
- [x] npm README section + Roadmap table.

## Validation
- [x] `vitest run` green.
- [x] `tsup` green; CLI `--version` ok; smoke test `graph export` shows quality + hints.
- [x] `astro build` green.
