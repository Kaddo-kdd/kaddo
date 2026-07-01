# Proposal: Fold Onboarding into Explain (VS-072.1)

## Why

VS-072 added `kaddo onboarding` as a compass for pre-ai projects. A real smoke test showed it risks a
parallel flow and a confused mental model (onboarding vs explain vs understand). The useful value —
project readiness and the single recommended next step — belongs inside `kaddo explain`, the
canonical command for understanding project state.

## What

Remove `kaddo onboarding`, `kaddo onboard` and `kaddo report onboarding`. Move the readiness logic
into a shared `core/readiness.ts` and surface it inside `kaddo explain`:

- Human output gains a `## Project Readiness` section (overall + signals + a single recommended next
  step). `kaddo explain --for agent` (JSON) gains a `readiness` object.
- The state machine is extended to reflect the full cycle: `not-initialized`, `initialized`,
  `bootstrap-incomplete`, `agents-missing`, `skills-missing`, `scanned`, `knowledge-incomplete`,
  `needs-decisions`, `ready-for-roadmap`, `ready-for-work-item`, `ready-for-implementation`, plus
  `not-applicable` (new) / `legacy-project`.
- The recommended next step is always exactly one. Only `blocking + open` questions block
  (assumed/resolved/deferred surfaced only); reuses VS-071.

## Scope

Removal + integration only. No new commands, no alias/deprecation kept, no writes beyond explain's
existing `.kaddo/explain.{md,json}`, no git, no LLM, never edits knowledge/code.

## Impact

- Removed: `commands/onboarding.ts`, `core/onboarding.ts`, onboarding docs (EN/ES) + sidebar entry,
  index registrations, `report onboarding`, command-help entry, onboarding tests.
- Added: `core/readiness.ts` (extended state machine); `project-explain.ts` gains `readiness` on
  `ProjectExplanation`, rendered in human + agent output.
- Docs: `commands/explain.md` (EN/ES) gain a Project Readiness section; README roadmap. Minor bump
  3.35.0.
