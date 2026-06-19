# Design: Knowledge Graph Export (VS-055)

## Model

```ts
type GraphNodeType =
  | 'business' | 'product' | 'tech' | 'delivery'   // knowledge-layer docs
  | 'capability'                                    // a capability referenced by a Work Item
  | 'decision'                                      // an ADR
  | 'work-item'
  | 'code-glob'
  | 'initiative'
  | 'roadmap-candidate'
  | 'knowledge-capsule'
  | 'project'                                       // anchor for external context

type GraphEdgeType =
  | 'informs'                    // layer → next layer
  | 'belongs_to'                 // work-item → initiative
  | 'materialized_as'            // roadmap-candidate → work-item
  | 'owns'                       // work-item → code-glob
  | 'implements'                 // work-item → capability
  | 'depends_on'                 // work-item → decision
  | 'governs'                    // decision → code-glob
  | 'provides_external_context'  // knowledge-capsule → project
```

Node id scheme is `type:key` so ids are stable and human-readable:
`business:business`, `wi:WI-002`, `code:src/cli/**`, `adr:ADR-001`, `capability:task-management`,
`initiative:checkout`, `candidate:WI-CANDIDATE-001`, `capsule:orders-service`, `project:todoapp`.

## Sources (deterministic — never reads `src/`)

- **Layer nodes + `informs` edges** from present layer docs: `business/business.md` →
  `product/product.md` → `tech/{current-state,codebase}.md` → `delivery/roadmap.md`.
- **Work Item nodes** from `discoverKnowledge()` (typed artifacts under `delivery/work-items/**`),
  carrying `status` (lifecycle) and `knowledge_level`.
- **code-glob / owns** from Work Item `code:` front matter.
- **capability / implements** from Work Item `capabilities:` front matter.
- **decision / depends_on** from Work Item `decisions:` front matter (new reader field).
- **decision nodes** from `tech/decisions/**`; **governs** from each ADR's own `code:` globs.
- **initiative / belongs_to** from `initiative` / `source_initiative`.
- **roadmap-candidate / materialized_as** from `source: roadmap` + `source_id`.
- **capsule / provides_external_context** from `.kaddo/external.yml` → a `project` anchor node.

## Scope

- `active` (default): only **active** Work Items (draft/ready/in-progress/blocked) and their
  directly-related nodes (code, capabilities, ADRs they depend on, initiative, candidate). Layer
  chain and capsules are always included (cheap, always useful).
- `all`: every Work Item regardless of state, **plus all ADRs** in `tech/decisions/**` even when
  unreferenced (with their `governs` edges).

## Output

- `graph.json`: `{ generated_at, project{name,state,structure}, nodes[], edges[] }`. Undefined
  optional fields omitted.
- `graph.mmd`: `flowchart LR` with sanitized node ids (`[^a-zA-Z0-9]→_`, de-duplicated on
  collision), `id["label"]` and `from -->|type| to`.

Console reports node/edge counts and the two files. When there are **no relationship edges**
(only the layer chain / isolated nodes), it prints a tip to add `code` / `capabilities` /
`decisions` / `source_id` front matter.

## Integration

- `loadGraphSummary(dir)` reads `.kaddo/graph.json` if present → `{ generatedAt, nodes, edges,
  activeWorkItemsConnectedToCode }`. `explain` renders a `## Knowledge Graph` block; `context`
  renders a short summary. Neither generates the graph.

## Security

Nodes carry only paths, ids, labels (titles), owners and relationships — never secrets, env
values, PII or source code content. The builder never opens files under `src/`.

## Out of scope

Graph database, web portal/dashboard, Graphviz auto-render, Neo4j/RDF/SPARQL, RAG, vector DB,
MCP, watch mode, GitHub UI integration, real-time sync. Guard `possible_drift` edges are deferred
(no persisted guard findings file in v1).
