# Spec: Impact Report Default Scope (VS-061.2)

## Default scope
- `kaddo impact` and `kaddo report impact` default to `scope: all`.
- `--scope active` and `--scope all` are honored explicitly.
- The graph section is built fresh in memory at the resolved scope — never inherits a persisted
  `active` graph.json.

## Output
- JSON includes `scope`, `default_scope: "all"`, and `scope_source` (`default` | `explicit`).
- Markdown shows the scope used; a default-scope note for the default; under `--scope active` with
  no active Work Items, a tip to run `kaddo impact --scope all`.
- Suggested Actions: in active-empty case, suggest `kaddo impact --scope all` (not just graph
  export).

## MCP
- `kaddo://impact-report` defaults to `all`.
- `kaddo_generate_impact_report` defaults to `all` and accepts `active` / `all`.

## Out of scope
- `kaddo graph export` default unchanged; score formula, semantics, persistence unchanged.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: default all (even when graph.json is active), `--scope active`, `--scope all`, JSON
  default_scope/scope_source, MCP default all + accepts active.
