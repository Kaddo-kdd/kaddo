# Design: Flexible Roadmap Parsing

- `core/roadmap.ts`: `parseRoadmapCandidates(markdown)` tries the strict VS-010 parser first
  (back-compat); if it finds nothing, runs a flexible line scanner that:
  - tracks the current initiative from any `##`/`###` heading (RM-id or "Initiative N — …");
  - recognizes Work Item ids (`WI-…`) in **table rows** (header maps ID/Work Item/Depends on
    columns), **bullets** (`- WI-001 Title`), **checklists** (`- [ ] WI-001 Title`) and
    `- WI-001: Title`;
  - dedupes by id, captures optional dependencies, attaches the initiative.
- `roadmapStats(markdown, materializedCount)` → { present, candidates, materialized,
  remaining } for explain/context.
- explain: Delivery shows Roadmap present + Candidates / Materialized / Remaining.
- understand: recommend `kaddo create --from roadmap` when candidates > materialized.
- context: a Roadmap Candidates / Materialized line.

Concept modeled explicitly: **Roadmap Candidate → Materialized Work Item** (basis for VS-033).
