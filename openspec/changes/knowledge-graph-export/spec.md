# Spec: Knowledge Graph Export (VS-055)

## Command
- `kaddo graph export` generates `.kaddo/graph.json` and `.kaddo/graph.mmd`.
- `--scope active|all` (default `active`); `--format json|mermaid` (default both).
- Deterministic: never reads `src/`, never reads source content, never calls an LLM.

## Nodes
- Knowledge-layer docs (business/product/tech/delivery) when present.
- Work Items (with lifecycle status + knowledge level).
- Code globs declared in front matter (`code:`).
- Knowledge Capsules registered in `.kaddo/external.yml`.
- Capabilities, ADRs/decisions, initiatives and roadmap candidates referenced by front matter.

## Edges
- `informs` (layer → layer).
- `owns` (work-item → code-glob), `implements` (→ capability), `depends_on` (→ decision).
- `governs` (decision → code-glob).
- `belongs_to` (work-item → initiative), `materialized_as` (candidate → work-item).
- `provides_external_context` (capsule → project).

## Scope
- `active`: active Work Items + nearby relations; layer chain + capsules always.
- `all`: every supported artifact, including unreferenced ADRs.

## Integration
- `kaddo explain` shows a Knowledge Graph summary if `.kaddo/graph.json` exists.
- `kaddo context` shows a Knowledge Graph summary if it exists (never the full graph).
- Neither command generates the graph automatically.

## Security
- Nodes contain only paths, IDs, labels, owners, summaries and relationships — never secrets,
  tokens, env values, PII or source code.

## Out of scope
- Graph database, web portal, Graphviz render, Neo4j/RDF/SPARQL, RAG, embeddings, vector DB, MCP,
  watch mode, real-time sync, Guard `possible_drift` edges.

## Validation
- `./node_modules/.bin/vitest.CMD run` green; `../../node_modules/.bin/tsup.CMD` green.
- Tests: JSON export, Mermaid export, active scope, all scope, capsules, Work Items, code globs,
  ADR edges, and no source-code reads.
