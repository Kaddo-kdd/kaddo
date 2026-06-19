# Design: Graph Relationship Quality & Metadata Hints (VS-056)

## Model

```ts
type GraphQuality = 'good' | 'partial' | 'sparse' | 'empty'

type GraphHint = {
  artifact_id: string
  artifact_type: 'work-item' | 'decision' | 'capability' | 'knowledge-capsule'
  path?: string
  severity: 'info'
  missing: string[]
  reason: string
  message: string                              // one-liner for context/explain/understand
  suggested_front_matter?: Record<string,string[]>  // array-valued keys only (valid YAML)
}

type GraphHintsReport = {
  generated_at, quality, summary{nodes,edges,hints}, metrics, hints[]
}
```

## Detection (deterministic; never reads `src/`)

One aggregated hint per **active** Work Item missing any of `code`, `capabilities`, `decisions`,
or roadmap `source` (`source_id`/`initiative`). `suggested_front_matter` carries placeholder
values for the array keys (`code: ['src/<area>/**']`, …) — never invented real values; the scalar
`source` is named in `missing` but omitted from the YAML block.

Other hints: ADR without `code` (governs); capability heading in `capabilities.md` not referenced
by any Work Item (slug match); registered capsule not referenced by any Work Item `capsules:`.

## Quality

```
relationshipEdges = edges where type != 'informs'
empty  : nodes == 0 || relationshipEdges == 0
sparse : relationshipEdges / nodes < 0.25
partial: hints > 0
good   : otherwise
```

Metrics: nodes/edges/connected/isolated counts + active WIs without code, without capabilities,
WIs without source, ADRs without code, capsules without related Work Items.

## Capsule linking

artifact-reader reads `capsules: [<id>]`; `buildGraph` adds `wi → capsule` edges
(`uses_external_knowledge`) so the "capsule without Work Item" hint is meaningful.

## Integration

- `loadGraphHints(dir)` reads `.kaddo/graph-hints.json` → `{ quality, totalHints,
  activeWorkItemHints, messages[] }`.
- context: `## Graph Hints` block (quality + active hints + graph-agent + ≤3 messages).
- explain: quality + hint count appended to the `## Knowledge Graph` block.
- understand: nudge only when phase is `Active Delivery` and `activeWorkItemHints > 0`.

## Security / out of scope

Hints carry only ids, paths, metadata field names and relationship suggestions — never secrets,
source content or PII. No auto-fix, no LLM inference, no full `src/` read, no portal, RAG, vector
DB, Neo4j, GraphQL, MCP, watch mode or sync. A separate `kaddo graph hints` command is out of
scope (hints ship inside `graph export`).
