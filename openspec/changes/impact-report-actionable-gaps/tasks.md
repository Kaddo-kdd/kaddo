# Tasks: Impact Report Actionable Gaps (VS-061.1)

- [x] core/impact-report.ts: `ActionableGaps` + `GapItem` + `BroadGlobGap` + `OwnershipOverlap` +
      `ScoreBreakdown` types.
- [x] Collect gaps in the Work Item loop (source/initiative/ownership/level/acceptance/DoD/
      validation, EN+ES variants); broad-glob + overlap detection.
- [x] Gap-driven Suggested Actions (name specific Work Items, grouped when many).
- [x] Render Actionable Gaps + Score Breakdown in Markdown; include in JSON.
- [x] CLI tests (gaps, no gaps, JSON shape, overlaps, broad globs); MCP test (tool includes gaps).
- [x] Docs EN/ES (Impact Report page); npm README roadmap; both packages 3.23.1.

## Validation
- [x] `pnpm test` green (544); typecheck green; `pnpm -r build` green; smoke `report impact`.
- [x] `astro build` green.
