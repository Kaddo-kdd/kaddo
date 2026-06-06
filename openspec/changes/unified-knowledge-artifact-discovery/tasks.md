# Tasks: Unified Knowledge Artifact Discovery

## Phase 1 — Service & consumers
- [x] `services/knowledge-artifacts.ts` (discoverKnowledge / discoverWorkItems / isWorkItemArtifact).
- [x] artifact-reader: parse `capabilities` and `source`.
- [x] owners suggest: use discoverWorkItems (recursive) + precise messages.
- [x] explain, context, guard, delivery: consume the service.
- [x] Tests (flat/subfolder, with/without front matter, draft/ready, owners regression).

## Phase 2 — Docs (EN/ES)
- [x] Visual Guide unified-discovery diagram.
- [x] owners + guard docs note the shared discovery model.

## Validation
- [x] vitest run (410 passing)
- [x] build (cli + docs)
