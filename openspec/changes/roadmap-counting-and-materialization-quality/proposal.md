# Proposal: Roadmap Candidate Counting Alignment + Work Item Materialization Quality (VS-077.1 + VS-078)

## Why

After VS-077, output conflated two different things under the word "candidates": roadmap **initiatives**
(RM-xxx) and **Work Item candidates** (WI-CANDIDATE-xxx). `explain` could show "Roadmap candidates: 7"
while "Roadmap Quality" showed "Candidates: 3" — the same word for two levels. Separately, Work Items
materialized from the roadmap kept metadata only partially: `domains` was left empty even when
`related_domain` existed, and several capabilities were stored as one comma-joined string. The bridge
from roadmap to execution was ambiguous and lossy.

## What

**VS-077.1 — counting alignment.**
- `roadmap.ts`: `RoadmapStats` gains explicit `initiatives`, `work_item_candidates`,
  `materialized_work_items`, `remaining_work_item_candidates` (keeping `candidates`/`materialized`/
  `remaining` as back-compat aliases); new `countRoadmapInitiatives`.
- `roadmap-quality.ts`: `RoadmapQuality` becomes two-level — `initiatives` (grounding) and
  `work_item_candidates` (metadata quality: with_source_initiative / with_related_domain /
  with_related_capability).
- `explain` / context-pack template: `## Roadmap Status` (Initiatives / Work Item candidates /
  Materialized / Remaining) + a two-part `## Roadmap Quality`.
- MCP `kaddo://roadmap-quality` now returns both levels.

**VS-078 — materialization quality.**
- `roadmap.ts`: parse initiative-level `source signals`; derive `decision_candidates` from signals;
  recognize `Related domain`; add `normalizeCapabilityList` (comma-split) and `domainsFromRelated`.
- `create.ts`: `buildRoadmapFrontMatter` fills `domains` from `related_domain`, splits capabilities into
  a real list, and carries `source_roadmap_initiative`, `source_work_item_candidate`,
  `source_initiative_title`, `expected_value`, `risks`, `dependencies`, `source_signals`,
  `decision_candidates` + `related_decisions`. Body gets an improved `## Source` and
  `## Context From Roadmap` (expected value / risks / dependencies / source signals, or
  "_Not provided in roadmap._") plus an ADR warning when decision candidates lack an ADR.
- `work-item-agent` prompt: preserve-and-refine list updated to the new fields.
- MCP `kaddo://work-item-candidates`: read-only list of materializable candidates.

No LLM, no git, no invented values, roadmap never blocked.

## Impact

- `core/roadmap.ts`, `core/roadmap-quality.ts`, `core/project-explain.ts`,
  `templates/context-pack-template.ts`, `commands/understand.ts`, `commands/create.ts`,
  `agents/prompts.ts`; MCP `resources.ts` (+ test). Docs Roadmap Quality (EN/ES); README. Minor bump
  3.44.0.
