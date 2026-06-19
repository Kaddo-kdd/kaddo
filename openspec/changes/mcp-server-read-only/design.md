# Design: Kaddo MCP Server (Read-Only) (VS-057)

## Package

`packages/mcp` → `@kaddo/mcp`, bin `kaddo-mcp`, ESM, bundled with tsup. Runtime deps:
`@modelcontextprotocol/sdk` (1.29.x), `gray-matter`, `yaml`, `zod` (externalized; installed at
runtime). Self-contained — does not import `@kaddo/cli`.

## Modules (SDK-free core + thin SDK glue)

- `project.ts` — `projectRoot()` (cwd or `KADDO_PROJECT_DIR`), `assertKaddoProject`, and path
  safety: `safeResolve` (allowlist `.kaddo`/`knowledge`/`external`; reject absolute, `..`,
  forbidden roots `src/.git/node_modules/dist/build/coverage`, and any escape of root),
  `readText`/`readJson`/`readYaml`/`listFiles`.
- `workitems.ts` — front-matter-only Work Item summaries (id, title, status, type, level, path,
  summary, code, capabilities, decisions, capsules); lifecycle from `status` or parent folder.
- `catalog.ts` — capsules (from `.kaddo/external.yml` + capsule files) and installed agents
  (from `knowledge/agents/**`).
- `resources.ts` — ten `ResourceDescriptor`s; missing derived files return a clear CLI instruction.
- `tools.ts` — eight read-only tool functions returning `ToolResult` (`ok`/`fail`).
- `prompts.ts` — installed agent prompts as MCP prompt descriptors (+ recommended inputs).
- `server.ts` — the only SDK-dependent module: binds the above via `registerResource` /
  `registerTool` / `registerPrompt`; wraps each handler in a Kaddo-project guard.
- `index.ts` — `StdioServerTransport`, logs readiness to **stderr** (stdout is the protocol).

This keeps everything except `server.ts`/`index.ts` unit-testable without the SDK; an
`InMemoryTransport` integration test exercises the SDK glue.

## Read-only guarantee

No fs writes anywhere. No `child_process`, no git, no network, no LLM. The only entry points are
file reads through the path-safe helpers, which are restricted to the three allowlisted dirs.

## Errors (no generation)

- No `.kaddo/config.yml` → "Kaddo project not found. Run `kaddo init` first."
- Missing derived file → command-specific hint (e.g. "Run `kaddo context` …", "Run `kaddo graph
  export` first.").
- Missing `knowledge/` → "Knowledge repository not found. Run `kaddo bootstrap` first."

## Release

`release.yml` runs `pnpm test` (all packages), verifies both package versions equal the tag, keeps
the built-CLI version check, then publishes `@kaddo/cli` and `@kaddo/mcp` with provenance. CI runs
`pnpm test` for the whole workspace.

## Out of scope

Write tools, file/Work Item creation, running any mutating CLI command, git, remote sync, GitHub
API, MCP HTTP transport, auth, portal, RAG, vector DB, Neo4j, a `packages/core` extraction.
