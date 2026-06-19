# Spec: Graph Relationship Quality & Metadata Hints (VS-056)

## Output
- `kaddo graph export` generates `.kaddo/graph-hints.md` and `.kaddo/graph-hints.json`.
- Each export computes a quality level (`good|partial|sparse|empty`) + deterministic metrics.

## Hints (non-blocking)
- Active Work Item without `code`.
- Active Work Item without `capabilities`.
- Work Item without `source_id`/`source_initiative` when applicable.
- ADR without governed `code`.
- Capability declared but not referenced by any Work Item.
- Knowledge Capsule registered but not referenced by any Work Item (`capsules:`).

## Behavior
- Suggestions only — never edits artifacts, never reads `src/`, never calls an LLM.
- `kaddo explain` shows quality + hint count when hints exist.
- `kaddo context` shows a short hints summary + suggested `graph-agent` (not the whole file).
- `kaddo understand` recommends reviewing hints only in Active Delivery and only when they affect
  active Work Items.
- A `graph-agent` proposes precise front matter; it never modifies files without confirmation.

## Security
- Hints contain only artifact ids, paths, metadata field names and relationship suggestions —
  never source code, secrets, tokens, env values, private keys or PII.

## Out of scope
- Auto-fix of front matter, LLM semantic inference, full `src/` read, visual portal, RAG, vector
  DB, Neo4j, GraphQL, MCP, watch mode, automatic sync, a separate `kaddo graph hints` command.

## Validation
- `vitest run` green; `tsup` green; smoke test `graph export` shows quality + hints.
- Tests: hints for Work Items, ADRs, capabilities, capsules; explain/context summaries; no
  source-code reads; quality levels.
