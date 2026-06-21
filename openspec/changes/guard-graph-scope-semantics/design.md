# Design: Guard and Graph Scope Semantics (VS-060)

## Graph core (core/graph.ts)

- `KnowledgeGraph` gains `scope`, `scope_reason`, `included_statuses`, `excluded_statuses`.
- `scopeStatuses(scope)`: active → included [draft,ready,in-progress,blocked], excluded
  [completed,archived]; all → included [...,completed], excluded [archived].
- `buildGraph` selects Work Items by `includedSet` (so `all` excludes archived too), counts active
  WIs, and sets `scope_reason` (active+0 active → "No active Work Items found…").
- `GraphSummary` / `loadGraphSummary` expose `scope`, `scopeReason`, `included/excludedStatuses`.

## Hints (core/graph-hints.ts)

- `GraphHintsReport` + `GraphHintsSummary` carry `scope` / `scope_reason`, read from the graph.
- `renderGraphHintsMarkdown`: when there are no hints **and** quality is `empty`, emit "No active
  relationship hints were generated. … Run `kaddo graph export --scope all` …" instead of "look
  healthy". Summary block shows a `Scope:` line.

## Command (commands/graph.ts)

- Output: "exported with <scope> scope"; when active scope produced no Work Item nodes, print the
  contextual-empty block pointing to `--scope all`.

## Guard (commands/guard.ts)

- Filter discovered artifacts: drop Work Items whose lifecycle is `archived` unless
  `--include-archived`. Non-Work-Item artifacts always kept.
- `printOwnershipScope(includeArchived)` shown in human output (matches + no-match paths); no-match
  note explains the scope and suggests `kaddo explain`.
- JSON output adds `ownership_scope { included, excluded }`.
- `--include-archived` flag in index.ts.

## explain / context

- explain `## Knowledge Graph` block adds Scope, Reason and a Tip (active + empty quality).
- context `## Knowledge Graph` block adds Scope, Quality and Reason.

## MCP

- `generate.ts` `generateGraph(root, scope)`; server tool `inputSchema { scope: enum }`.
- `projectStatus` returns `graph { scope, scope_reason, quality, hints }`; `listGraphHints` returns
  `scope` / `scope_reason`. Resources pass file contents through (scope already in the JSON).

## Tests

CLI: graph scope metadata (active-empty + all incl completed / excl archived), hints empty
messaging; guard completed-ownership match + scope output + archived exclusion/inclusion.
MCP: `generate_graph` scope metadata; `project_status` graph scope shape.
