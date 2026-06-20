# Tasks: MCP Derived Tools (VS-058)

## Phase 1 — Write safety
- [x] `project.ts`: `assertMcpDerivedWritePath` + `writeDerived` (derived `.kaddo/` allowlist).

## Phase 2 — Generators
- [x] `generate.ts`: generateContext/Explain/Understand/Graph/CapsuleDraft reusing CLI core
      builders; structured `GenerateResult`; require config + knowledge.

## Phase 3 — Server
- [x] Register five derived tools with explicit "writes only under .kaddo/" descriptions.
- [x] `SERVER_VERSION` read from package.json (no drift).

## Phase 4 — Tests
- [x] generate.test.ts (each tool, result shape, path safety, no writes outside .kaddo/, missing
      knowledge error) + server integration AC18 (tool regenerates → resource reads).

## Phase 5 — Docs & version
- [x] MCP Server page (EN/ES) "Derived Tools" section; package README; What-it-does-not-do fixups.
- [x] Both packages bump to 3.20.0.

## Validation
- [x] `pnpm test` green (502); typecheck green; `pnpm -r build` green; server starts.
- [x] `astro build` green (97 pages).
