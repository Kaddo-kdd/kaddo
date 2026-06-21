# Spec: Guard and Graph Scope Semantics (VS-060)

## Guard
- Matches ownership from active + completed Work Items; excludes archived by default
  (`--include-archived` to include).
- Prints the ownership scope; the no-match note explains where it looked; JSON adds
  `ownership_scope`.

## Graph
- `graph.json` and `graph-hints.json` include `scope`, `scope_reason`, `included_statuses`,
  `excluded_statuses`.
- `active` includes draft/ready/in-progress/blocked; `all` adds completed; both exclude archived
  by default.
- Active scope with no active Work Items prints a contextual-empty message pointing to
  `--scope all`; hints do not say "healthy" when quality is `empty`.

## explain / context
- explain shows graph scope, reason and a tip when the active graph is empty.
- context shows a short graph scope summary.

## MCP
- `kaddo://graph` / `kaddo://graph-hints` carry scope metadata.
- `kaddo_project_status` and `kaddo_list_graph_hints` expose scope.
- `kaddo_generate_graph` accepts `{ scope: "active" | "all" }` (default active).

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests cover active scope without active Work Items, all scope with completed, Guard ownership of
  completed Work Items, archived exclusion, and MCP graph scope metadata.
