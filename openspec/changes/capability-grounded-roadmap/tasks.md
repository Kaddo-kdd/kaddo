# Tasks: Capability-Grounded Roadmap Generation (VS-077)

- [x] core/roadmap-quality.ts: `parseRoadmapCandidateQuality` (format-tolerant `RM-xxx` parser) +
      `buildRoadmapQuality(dir)` (counts + grounded + needs_refinement).
- [x] project-explain.ts: `roadmapQuality` on ProjectExplanation; `## Roadmap Quality` render.
- [x] context-pack.ts + context-pack-template.ts: carry + render `## Roadmap Quality`.
- [x] understand.ts: nudge (refine via roadmap-agent when needs_refinement, else create --from roadmap).
- [x] create.ts: buildRoadmapFrontMatter preserves source_roadmap_candidate + related domain/capability/
      capabilities + expected_value/risks/dependencies (conditional; never invents).
- [x] agents/prompts.ts: roadmap-agent grounded output + grounding rules + never materialize Work Items;
      work-item-agent preserves roadmap metadata.
- [x] MCP `kaddo://roadmap-quality` (read-only, shares buildRoadmapQuality) + resources test URI.
- [x] Tests: parser domain/capability/source signals; buildRoadmapQuality grounded vs weak +
      needs_refinement; explain + context-pack render; create front matter metadata; agents.test updated.
- [x] Docs Roadmap Quality (EN/ES) + sidebar entry; README roadmap row. Minor bump 3.43.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (738); `pnpm -r build` green.
- [x] `astro build` green (125 pages).
