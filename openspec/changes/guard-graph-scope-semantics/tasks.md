# Tasks: Guard and Graph Scope Semantics (VS-060)

## Phase 1 — Graph scope metadata
- [x] graph.ts: scope/scope_reason/included/excluded; `scopeStatuses`; `all` excludes archived;
      GraphSummary + loadGraphSummary expose scope.
- [x] graph-hints.ts: scope in report + summary; empty-not-healthy messaging; Scope line.
- [x] commands/graph.ts: "exported with <scope> scope" + contextual-empty block.

## Phase 2 — Guard scope
- [x] guard: exclude archived by default; `--include-archived`; print ownership scope; no-match
      note; JSON `ownership_scope`.

## Phase 3 — explain / context
- [x] explain: scope + reason + tip in the Knowledge Graph block.
- [x] context: scope + quality + reason in the Knowledge Graph block.

## Phase 4 — MCP
- [x] generate_graph accepts `{ scope }`; project_status + list_graph_hints expose scope.

## Phase 5 — Docs & tests
- [x] knowledge-graph-export "Graph scopes" (EN/ES); Guard ownership scope (EN/ES); Visual Guide.
- [x] npm README roadmap.
- [x] CLI tests (graph scope, guard completed/archived) + MCP tests (generate scope, status shape).

## Validation
- [x] `pnpm test` green (521); typecheck green; `pnpm -r build` green; smoke active-empty scenario.
- [x] `astro build` green.
