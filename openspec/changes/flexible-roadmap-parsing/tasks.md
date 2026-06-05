# Tasks: Flexible Roadmap Parsing
## Phase 1 — Parser
- [x] Multi-strategy parseRoadmapCandidates (table/bullet/checklist/mixed + VS-010).
- [x] roadmapStats helper.
- [x] Tests for every format + back-compat.
## Phase 2 — Wire in
- [x] explain: candidates vs materialized vs remaining.
- [x] understand: recommend materializing.
- [x] context: candidates/materialized.
- [x] Tests.
## Phase 3 — Docs & examples (EN/ES)
- [x] roadmap/create/understand/context/explain docs + visual guide (EN/ES).
## Validation
- [x] pnpm --filter "@kaddo/cli" test (369 passing)
- [x] pnpm -r build
