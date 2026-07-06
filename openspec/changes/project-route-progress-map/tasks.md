# Tasks: Project Route Progress Map (VS-080)

## Completed

- [x] Create `packages/cli/src/core/project-route.ts` with types, evaluators, route definitions, builder, renderers
- [x] Integrate into `project-explain.ts` (full checklist via `renderRouteMarkdown`)
- [x] Integrate into `context-pack.ts` and `context-pack-template.ts` (compact via `renderRouteCompact`)
- [x] Integrate into `understand.ts` and `understand-template.ts` (compact via `renderRouteCompact`)
- [x] Add `kaddo://project-route` MCP resource in `packages/mcp/src/resources.ts`
- [x] Update MCP resource test to expect 22 URIs
- [x] Create `packages/cli/tests/project-route.test.ts` (18 tests)
- [x] All 735 CLI tests pass, all 55 MCP tests pass
- [x] TypeScript compiles clean
- [x] Both packages build
- [x] EN doc: `apps/docs/src/content/docs/project-route.md`
- [x] ES doc: `apps/docs/src/content/docs/es/project-route.md`
- [x] Sidebar entry in `astro.config.mjs`
- [x] Docs site builds
- [x] OpenSpec proposal and tasks
- [x] Version bump to 3.47.0
