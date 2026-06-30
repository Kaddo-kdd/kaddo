---
title: Pre-AI Onboarding
description: kaddo onboarding diagnoses how ready an existing (pre-AI) project is to work with agents and recommends the single most important next step.
---

`kaddo onboarding` (alias `kaddo onboard`) is a **read-only compass** for existing projects
initialized as `pre-ai`. It reads the signals Kaddo already has — config, scan, understand, knowledge
files, open-questions readiness, roadmap, Work Items and adapter status — and answers one question:

> Where am I in the pre-AI cycle, and what's the single next step?

```bash
kaddo onboarding          # console diagnosis (alias: onboard)
kaddo onboarding --json   # same, as JSON
kaddo report onboarding   # write .kaddo/reports/onboarding-report.{md,json}
```

It does **not** replace `init`, `scan`, `understand`, `questions`, `roadmap`, `create` or `guard` —
it diagnoses where you are and points to the next command. It never runs those commands, never
installs adapters, never edits `knowledge/` or code, no git, no LLM. `kaddo onboarding` writes
nothing; `kaddo report onboarding` writes only under `.kaddo/reports/`.

## The pre-AI cycle

```txt
kaddo init  (state: pre-ai)
→ kaddo scan
→ kaddo understand
→ kaddo onboarding        ← diagnosis & compass
→ kaddo questions
→ kaddo roadmap
→ kaddo create --from roadmap
→ kaddo adapters install <adapter>
→ implementation
→ kaddo guard
```

## Status

`onboarding` reports one overall status and recommends exactly one next step:

| Status | Meaning | Next |
|---|---|---|
| `not-initialized` | no Kaddo config | `kaddo init` |
| `not-applicable` | project is `new` | use the standard new-project flow |
| `legacy-project` | project is `legacy` | use the legacy flow |
| `initialized` | no `.kaddo/scan.json` | `kaddo scan` |
| `scanned` | no `.kaddo/understand.md` | `kaddo understand` |
| `knowledge-incomplete` | a key knowledge file is missing/weak | complete the prioritized file |
| `needs-decisions` | a blocking question is still `open` | resolve / assume / defer it |
| `ready-for-roadmap` | knowledge ready, no roadmap candidates | `kaddo roadmap` |
| `ready-for-work-item` | roadmap has candidates, no ready Work Item | `kaddo create --from roadmap` |
| `ready-for-implementation` | a ready/in-progress Work Item exists | install an adapter and implement |

Knowledge completeness is checked in priority order: `current-state.md` → `codebase.md` →
`capabilities.md` → `product.md` → `business.md`. A file with only a heading/front matter counts as
**weak** and still needs completing.

Questions use [resolution tracking](open-questions/): only `blocking + open` questions move the status
to `needs-decisions`. Assumed, resolved and deferred questions are surfaced (as assumption counts) but
never block.

## JSON

`kaddo onboarding --json` emits `project_name`, `project_type`, `status`, a `signals` object (scan,
understand, the five knowledge files, roadmap, work_items, installed adapters, and question counts by
resolution status) and a single `recommended_next_step` (`label` + optional `command`).
