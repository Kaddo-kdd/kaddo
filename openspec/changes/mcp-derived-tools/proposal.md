# Proposal: MCP Derived Tools (VS-058)

## Why

VS-057 made `@kaddo/mcp` expose read-only resources, tools and prompts. But when a derived artifact
is missing or stale, the server can only answer "Run `kaddo context` first" — which breaks the
agent flow and forces the human to drop to a terminal. Agents should be able to regenerate derived
outputs in a controlled, safe way without leaving the MCP flow.

## What

Add five **derived (write) tools** to `@kaddo/mcp` that regenerate Kaddo's derived artifacts using
the exact same core logic as the CLI:

- `kaddo_generate_context` → `.kaddo/context-pack.md` + `.json`
- `kaddo_generate_explain` → `.kaddo/explain.md` + `.json`
- `kaddo_generate_understand` → `.kaddo/understand.md`
- `kaddo_generate_graph` → `.kaddo/graph.json` + `.mmd` + `graph-hints.md` + `.json`
- `kaddo_generate_capsule_draft` → `.kaddo/exports/<project>.capsule.md` + `.json` (draft only)

Each returns `{ status, files_written, summary, warnings, next_suggested_resources }`.

## Principle

> Derived outputs are allowed. Source knowledge is not modified. Source code is not modified. Git is
> never executed.

Writes are restricted to `.kaddo/` (the derived set + `exports/*.capsule.{md,json}`) through a
central allowlist `assertMcpDerivedWritePath`. The tools never touch `knowledge/`, `src/`,
`external/`, `.kaddo/external.yml`, never run git and never call an LLM. `kaddo_generate_capsule_draft`
writes a draft only — it never registers/imports a capsule.

## Impact

- `packages/mcp` imports the CLI core builders (bundled by tsup) for `generate.ts`; new derived
  write allowlist in `project.ts`; five tools registered in `server.ts`.
- Both packages bump to 3.20.0.
- Docs (EN/ES) "Derived Tools" section + package README.
- Additive → minor version bump.
