# Tasks: Placeholder-Aware Readiness and Guidance (VS-073.1)

- [x] core/artifact-quality.ts: `analyzeContent` / `analyzeKnowledgeArtifact` →
      missing/placeholder/weak/useful (deterministic, conservative; detects template prose).
- [x] knowledge-discovery.ts: add `Placeholder`/`Weak` to `LayerMaturity`.
- [x] layers.ts: downgrade Consolidated/Structured to Placeholder/Weak per baseline-file quality.
- [x] delivery-phase.ts: `Knowledge Refinement` phase (base placeholder/weak) + agent recommendation;
      never recommend `create --from roadmap` with 0 candidates.
- [x] readiness.ts: per-file quality signals; `knowledge-incomplete` recommends the right agent.
- [x] context-pack.ts: `knowledgeQuality` (JSON) + placeholder entries in Missing Context.
- [x] bootstrap-templates.ts: `generated_by`/`template_version` metadata (detection independent of it).
- [x] project-explain.ts: render business/product/capabilities quality in the readiness section.
- [x] Tests: artifact-quality (missing/placeholder/weak/useful, deterministic); layers downgrade;
      explain readiness knowledge-incomplete + agent; fix layers fixtures to real bodies.
- [x] Docs commands/explain.md (EN/ES) knowledge-quality note; README. Minor bump 3.37.0.

## Validation
- [x] typecheck green; `pnpm test` green (681); `pnpm -r build` green; smoke (placeholder readiness).
- [x] `astro build` green.
