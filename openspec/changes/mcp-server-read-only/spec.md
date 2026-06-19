# Spec: Kaddo MCP Server (Read-Only) (VS-057)

## Package
- `packages/mcp` published as `@kaddo/mcp` with bin `kaddo-mcp`; shares version with `@kaddo/cli`.
- Local **stdio** transport. Validates it runs inside a Kaddo project.

## Resources
- `kaddo://context-pack`, `explain`, `understand`, `graph`, `graph-hints`, `work-items`, `roadmap`,
  `capsules`, `agents`, `skills`.

## Tools (read-only)
- `kaddo_project_status`, `kaddo_list_work_items` (status/type/knowledge_level),
  `kaddo_get_work_item` (id), `kaddo_list_capsules`, `kaddo_get_capsule` (id), `kaddo_list_agents`,
  `kaddo_get_agent_prompt` (name), `kaddo_list_graph_hints` (artifact_type/severity/active_only).

## Prompts
- Every installed agent prompt under `knowledge/agents/**`, with name/description/content/
  recommended_inputs.

## Constraints
- Never modifies files, runs git, calls an LLM, or scans source.
- Reads only `.kaddo/`, `knowledge/`, `external/`; never `src/`, `.git/`, `node_modules/`, `dist/`,
  `build/`, `coverage/`; blocks path traversal.
- Never generates files — missing derived files yield a clear CLI instruction.

## Pipeline
- GitHub Actions publishes `@kaddo/cli` and `@kaddo/mcp`; both versions must equal the tag.

## Validation
- `pnpm test` green (CLI + MCP); typecheck green; both packages build; docs build.
- Tests cover resources, tools, prompts, invalid project, missing resources, path safety and
  refusal to read forbidden directories.
