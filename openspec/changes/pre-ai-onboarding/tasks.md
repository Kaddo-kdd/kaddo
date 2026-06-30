# Tasks: Pre-AI Onboarding Report and Guidance (VS-072)

- [x] core/onboarding.ts: `buildOnboardingReport` (status machine + signals), knowledge presence
      (present/weak/missing, priority order), roadmap signal, work-items signal, installed adapters,
      questions via VS-071 (only blocking-open blocks); markdown + JSON renderers.
- [x] commands/onboarding.ts: `runOnboarding` (console/`--json`, no writes) + `runOnboardingReport`
      (writes only `.kaddo/reports/`; no-op message when not initialized).
- [x] index.ts: register `onboarding`/`onboard` (`--json`) + `report onboarding`; command-help entry.
- [x] agents/prompts.ts: bootstrap-agent pre-AI section (scan/understand as input, mark unknowns
      `[open]`/`[assumed]`, build current-state/codebase first, onboarding as compass).
- [x] Tests: states (not-initialized/not-applicable/legacy/initialized/scanned/knowledge-incomplete/
      needs-decisions/ready-for-roadmap/ready-for-work-item/ready-for-implementation), assumed not
      blocking, JSON shape, onboarding writes nothing, report writes only `.kaddo/reports/`, no
      knowledge edits, markdown sections (16 cases).
- [x] Docs EN/ES (new Pre-AI Onboarding page) + sidebar + README roadmap. Minor bump 3.34.0.

## Validation
- [x] typecheck green; `pnpm test` green (686); `pnpm -r build` green; smoke (state lifecycle).
- [x] `astro build` green.
