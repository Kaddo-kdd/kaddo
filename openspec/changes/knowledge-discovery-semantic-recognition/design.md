# Design: Knowledge Discovery & Semantic Recognition

- `core/knowledge-discovery.ts`: `layerForType` (type → layer), `discoverLayers(dir)`
  (read knowledge/ artifacts, classify by front-matter type, fall back to path), per-layer
  maturity (Missing/Consolidated/Structured for B/P/T; Missing/Partial/Traceable for
  Delivery), `roadmapHasUnmaterializedCandidates`.
- `core/layers.ts`: now delegates to the engine; `knowledgeLayers` returns
  `{ layer, status, detected[] }`; `currentPhase` uses completeness; `renderLayersMarkdown`
  shows `### Layer — Status` + detected artifacts.
- `explain`: knowledge presence (Product/Tech/Delivery) derived from discovery so
  consolidated artifacts count; Knowledge Status shows per-layer maturity.
- `understand`: recommends `kaddo create --from roadmap` / work-item-agent when the roadmap
  has unmaterialized candidates.
- `context`: a "Knowledge maturity — …" summary line above the layer breakdown.

Maturity model: Level 0 None · Level 1 Consolidated · Level 2 Structured · Level 3
Traceable (roadmap + work-items + ADRs + ownership).
