# Spec: MCP Derived Tools (VS-058)

## Tools
- `kaddo_generate_context` → `.kaddo/context-pack.md` + `.json`.
- `kaddo_generate_explain` → `.kaddo/explain.md` + `.json`.
- `kaddo_generate_understand` → `.kaddo/understand.md`.
- `kaddo_generate_graph` → `.kaddo/graph.json` + `.mmd` + `graph-hints.md` + `.json`.
- `kaddo_generate_capsule_draft` → `.kaddo/exports/<project>.capsule.md` + `.json` (draft only).
- Use the same core logic as the CLI; deterministic (no LLM).

## Result shape
- Every derived tool returns `status`, `files_written`, `summary`, `warnings`,
  `next_suggested_resources`.

## Safety
- Central `assertMcpDerivedWritePath` allows writes only to the derived `.kaddo/` set + exports
  capsules; blocks `knowledge/`, `src/`, `external/`, `.kaddo/external.yml` and traversal with
  `Blocked unsafe MCP derived write path.`
- No git, no LLM. Read restrictions from VS-057 unchanged (`.kaddo/`/`knowledge/`/`external/`).
- `kaddo_generate_capsule_draft` never registers/imports a capsule.
- Errors: no project → "Run `kaddo init` first."; no `knowledge/` → "Run `kaddo bootstrap` first."

## Integration
- After a derived tool runs, the matching resource (`kaddo://context-pack`, `kaddo://graph`,
  `kaddo://graph-hints`, …) reads the regenerated file.
- Tool descriptions state what they write and what they never modify.

## Validation
- `pnpm test` green (CLI + MCP); typecheck green; both packages build; docs build.
- Tests cover context/explain/understand/graph/capsule-draft generation, the structured result,
  path-safety allowlist, no writes to knowledge/src/external, no git, and resources reading the
  regenerated files.
