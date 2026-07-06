# VS-082 — Work Item Source Metadata

## Goal

Every Work Item should carry lightweight metadata about where it came from —
manual creation, roadmap materialization, Jira import, etc. — so that Kaddo can
trace work origin across explain, understand, context-pack, project-route, and
the MCP server.

## Approach

1. Add a `WorkItemSource` model with 10 normalized source types and optional
   metadata fields (id, title, url, context, provider, imported_at, synced_at).
2. `parseWorkItemSource(frontmatter)` deterministically normalizes source
   metadata at read time, infers `roadmap` from legacy fields, and defaults to
   `unknown` for items with no source metadata. Files are never modified.
3. Manual creates set `source: manual`; roadmap creates set `source: roadmap`
   with `source_id`, `source_title`, and `source_context`.
4. Wire source into explain (summary section), understand (per-WI line),
   context-pack (per-WI field), project-route (warning for unknown sources),
   and MCP (WorkItemSourceMeta in WorkItemSummary).

## Constraints

- Pure, deterministic — no LLM, no network, no git mutation.
- Backward compatible — legacy items get `{ type: 'unknown', inferred: true }`.
- Invalid source values produce a warning, not a crash.
