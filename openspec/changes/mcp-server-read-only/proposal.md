# Proposal: Kaddo MCP Server (Read-Only) (VS-057)

## Why

Today a human runs `kaddo context`, copies the context pack, copies an agent prompt and hands them
to an agent that still re-explores the repo. Kaddo already produces curated, structured knowledge —
it should be directly queryable by MCP-compatible agents and IDEs, with no manual copy/paste and no
full-repo scanning, while keeping Kaddo's principles (no knowledge edits, no git, no LLM, no source
scan, no magic inference).

## What

A new **read-only** MCP server published as a separate npm package `@kaddo/mcp` inside the existing
monorepo (the CLI stays `@kaddo/cli`). It exposes Kaddo as a structured context source over local
**stdio**:

- **Resources**: `kaddo://context-pack`, `explain`, `understand`, `graph`, `graph-hints`,
  `work-items`, `roadmap`, `capsules`, `agents`, `skills`.
- **Tools (read-only)**: `kaddo_project_status`, `kaddo_list_work_items`, `kaddo_get_work_item`,
  `kaddo_list_capsules`, `kaddo_get_capsule`, `kaddo_list_agents`, `kaddo_get_agent_prompt`,
  `kaddo_list_graph_hints`.
- **Prompts**: every installed agent prompt under `knowledge/agents/**`.

It never generates files — when a derived file is missing it returns a clear instruction to run the
matching CLI command.

## Decisions

- Separate package (lean CLI, dedicated binary `kaddo-mcp`, clear versioning) in the same repo.
- The MCP package is **self-contained**: it reads project files directly (no heavy logic to reuse;
  the KDD logic stays in the CLI which produces the files MCP reads). Avoids a premature
  `packages/core` extraction.
- Both packages share the same version (3.19.0).

## Impact

- New `packages/mcp` (`@kaddo/mcp`, bin `kaddo-mcp`).
- Release + CI workflows publish/test both packages.
- New docs page "MCP Server" (EN/ES) + `examples/mcp/` + READMEs.
- Additive → minor version bump for both packages.
