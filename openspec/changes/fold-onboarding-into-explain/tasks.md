# Tasks: Fold Onboarding into Explain (VS-072.1)

- [x] Remove `kaddo onboarding`/`onboard`/`report onboarding`: delete commands/onboarding.ts,
      core/onboarding.ts, onboarding tests, onboarding docs (EN/ES) + sidebar entry; drop index
      registrations, report subcommand and command-help entry.
- [x] Add `core/readiness.ts`: extended state machine (init/scan/bootstrap/agents/skills/understand/
      knowledge/questions/roadmap/work-item/implementation + not-applicable/legacy); reuses config,
      scan/understand, adapter context (agents/skills), knowledge presence, open-questions (VS-071),
      Work Items, adapter status. Single recommended next step.
- [x] project-explain.ts: `readiness` on `ProjectExplanation`; render `## Project Readiness` in human
      output and `readiness` object in agent JSON.
- [x] Tests: explain human has Project Readiness + single next step; agent JSON has readiness
      object (overall/signals/next-step); bootstrap-incomplete detection.
- [x] Docs: `commands/explain.md` (EN/ES) Project Readiness section; README roadmap. Minor bump 3.35.0.

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (onboarding removed, explain readiness).
- [x] `astro build` green.
