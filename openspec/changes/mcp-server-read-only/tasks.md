# Tasks: Kaddo MCP Server (Read-Only) (VS-057)

## Phase 1 — Package scaffold
- [x] `packages/mcp` package.json (`@kaddo/mcp`, bin `kaddo-mcp`), tsconfig, tsup config.
- [x] Add `@modelcontextprotocol/sdk` + gray-matter/yaml/zod; `pnpm install`.

## Phase 2 — Server
- [x] `project.ts` (root resolution, path safety, readers).
- [x] `workitems.ts`, `catalog.ts` (capsules + agents).
- [x] `resources.ts` (10 resources, missing-file hints).
- [x] `tools.ts` (8 read-only tools).
- [x] `prompts.ts` (installed agent prompts).
- [x] `server.ts` (SDK glue) + `index.ts` (stdio entry).

## Phase 3 — Tests
- [x] project/resources/tools/prompts unit tests + InMemoryTransport integration test.

## Phase 4 — Pipeline & version
- [x] CLI + MCP share version 3.19.0.
- [x] release.yml publishes both packages + version checks; ci.yml runs `pnpm test`.

## Phase 5 — Docs & examples
- [x] `packages/mcp/README.md`; `examples/mcp/` (config + README).
- [x] New docs page MCP Server (EN/ES) + sidebar; cross-links (Overview, Visual Guide); root README.

## Validation
- [x] `pnpm test` green (CLI + MCP); typecheck green.
- [x] `pnpm -r build` green; MCP server starts over stdio.
- [x] `astro build` green.
