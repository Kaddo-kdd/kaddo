# Tasks: Impact Report Default Scope (VS-061.2)

- [x] core/impact-report.ts: resolve scope (default `all`); always build graph in memory at that
      scope; add `default_scope` + `scope_source`; active-empty suggested action + tips.
- [x] commands/report.ts + index.ts: `--scope` option on `report impact` and `impact` alias.
- [x] MCP: generate/resource pass `scopeSource`; tool default `all`, accepts `active`.
- [x] Docs EN/ES (Impact Report scope section + graceful degradation rewrite); npm README roadmap.
- [x] Tests: CLI default-all (graph.json active), `--scope active`, JSON default_scope/scope_source;
      MCP default all + accepts active; updated the old "graph not available" test.

## Validation
- [x] `pnpm test` green (548); typecheck green; `pnpm -r build` green; smoke (default all vs active).
- [x] `astro build` green.
