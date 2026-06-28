# Tasks: Open Questions Resolution Tracking (VS-071)

- [x] core/open-questions.ts: `ResolutionStatus`; `parseResolution` (EN+ES tokens, default open);
      indented `- note:` → `resolution_note`; readiness via `blocking_open`; status counts; new
      summary fields (blocking_open/important_open/resolution); report sections resolved/assumed/
      deferred; `roadmapReadinessSummary` extended.
- [x] commands/questions.ts: show resolution counts + blocking-open / resolved / assumed / deferred.
- [x] commands/understand.ts: nudge on `blocking_open`.
- [x] Adapter wording (shared renderer, all 5 adapters) + agent prompts (roadmap/work-item/
      implementation/bootstrap): only `resolution_status = open` blocks; surface others; bootstrap
      suggests tokens.
- [x] Tests: EN+ES token mapping, no-token=open, readiness by classification×resolution, JSON
      resolution_status/note + counts, markdown sections, roadmapReadinessSummary (10 new).
- [x] Docs EN/ES (Open Questions: resolution tracking + table) + README roadmap. Minor bump 3.33.0.

## Validation
- [x] typecheck (cli+mcp) green; `pnpm test` green (670); `pnpm -r build` green; smoke (questions).
- [x] `astro build` green.
