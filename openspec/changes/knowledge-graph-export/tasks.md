# Tasks: Knowledge Graph Export (VS-055)

## Phase 1 — Core
- [x] artifact-reader: add `decisions: string[]` from front matter (`decisions`).
- [x] `core/graph.ts`: types, `buildGraph(dir, config, {scope})`, `serializeGraphJson`,
      `renderGraphMermaid`, `graphIsSparse`, `loadGraphSummary`.
- [x] Unit tests (JSON, Mermaid, active/all scope, capsules, code globs, ADR edges, no src reads).

## Phase 2 — Command & wiring
- [x] `commands/graph.ts`: `runGraphExport({scope, format})` — write files, counts, sparse tip,
      command footer.
- [x] index.ts: register `graph export` with `--scope` / `--format`.
- [x] command-help: `graph export` entry + footer order.

## Phase 3 — Integrations
- [x] context-pack: optional `graph` summary; template `## Knowledge Graph` block.
- [x] project-explain: optional `graph` summary; human `## Knowledge Graph` + agent JSON.
- [x] Tests for explain/context summaries.

## Phase 4 — Docs (EN/ES)
- [x] New page `knowledge-graph-export.md` (EN/ES) + sidebar entry.
- [x] Commands Overview, Visual Guide, Prompt Workflow, Context, Explain, Knowledge Capsules,
      Operating Moments, Agents — cross-links/mentions.
- [x] README (root + npm): supporting command + section.

## Validation
- [x] `./node_modules/.bin/vitest.CMD run` green.
- [x] `../../node_modules/.bin/tsup.CMD` green; CLI `--version` ok; smoke test `graph export`.
- [x] `astro build` green.
