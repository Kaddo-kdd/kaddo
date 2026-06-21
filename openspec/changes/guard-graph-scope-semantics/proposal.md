# Proposal: Guard and Graph Scope Semantics (VS-060)

## Why

Scope was ambiguous between `kaddo guard` and `kaddo graph export`, producing confusing results
when a project's Work Items are all completed:

- `kaddo graph export` (active default) showed `Quality: empty / Hints: 0 / "relationships look
  healthy"` even though `--scope all` had a rich graph — the active graph was empty only because
  there were no active Work Items.
- `kaddo guard` did not clearly communicate that ownership comes from active **and completed** Work
  Items (and silently considered archived ones too).

Active graph ≠ full knowledge graph. Completed Work Items are still valid knowledge. Guard needs
historical + current ownership.

## What

Clarify and correct scope semantics across guard, graph, hints, explain, context and MCP.

- **Graph**: `graph.json` / `graph-hints.json` gain `scope`, `scope_reason`, `included_statuses`,
  `excluded_statuses`. `all` scope now excludes `archived` by default. Active scope with zero active
  Work Items prints a contextual-empty message and points to `--scope all`. Hints no longer say
  "healthy" when the graph is `empty`.
- **Guard**: matches ownership from active **and completed** Work Items; **excludes archived by
  default** (`--include-archived` to include). Prints the ownership scope used; the no-match note
  explains where it looked. JSON adds `ownership_scope`.
- **explain / context**: show graph scope + reason (+ a tip when the active graph is empty).
- **MCP**: `kaddo://graph` / `kaddo://graph-hints` carry scope metadata (file passthrough);
  `kaddo_project_status` and `kaddo_list_graph_hints` expose scope; `kaddo_generate_graph` accepts
  `{ scope: "active" | "all" }` (default active).

## Scope semantics

| | Included | Excluded by default |
|---|---|---|
| Active graph | draft, ready, in-progress, blocked | completed, archived |
| All graph | draft, ready, in-progress, blocked, completed | archived |
| Guard ownership | draft, ready, in-progress, blocked, completed | archived |

## Out of scope

No Work Item model change, archived never included by default, no UI, no Mermaid layout change,
no LLM inference, no auto front-matter edits, no writes to knowledge/src, no git.
