# Tasks: Roadmap Counting Alignment + Work Item Materialization Quality (VS-077.1 + VS-078)

- [x] roadmap.ts: RoadmapStats gains initiatives / work_item_candidates / materialized_work_items /
      remaining_work_item_candidates (back-compat aliases kept); countRoadmapInitiatives.
- [x] roadmap.ts: parse source signals; derive decision_candidates; recognize `Related domain`;
      normalizeCapabilityList (comma-split, no Spanish "y" split) + domainsFromRelated.
- [x] roadmap-quality.ts: two-level RoadmapQuality (initiatives + work_item_candidates).
- [x] project-explain.ts: `## Roadmap Status` + two-part `## Roadmap Quality`; readiness block counts.
- [x] context-pack-template.ts: `## Roadmap Status` + two-part `## Roadmap Quality`.
- [x] understand.ts: nudge reads roadmapQuality.initiatives.
- [x] create.ts: front matter fills domains from related_domain, splits capabilities, carries
      source_roadmap_initiative / source_work_item_candidate / source_initiative_title / expected_value /
      risks / dependencies / source_signals / decision_candidates / related_decisions; body improved
      Source + Context From Roadmap (+ "_Not provided in roadmap._") + ADR warning.
- [x] agents/prompts.ts: work-item-agent preserve-and-refine list updated (VS-078).
- [x] MCP: kaddo://roadmap-quality two levels; new kaddo://work-item-candidates; resources test URI.
- [x] Tests: roadmap-quality (15) two levels + normalization + create metadata/body; updated
      roadmap.test / context-pack.test / project-explain.test / resources.test for the new naming.
- [x] Docs Roadmap Quality (EN/ES) two levels + normalization; README. Minor bump 3.44.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (747); `pnpm -r build` green.
- [x] `astro build` green (125 pages).
