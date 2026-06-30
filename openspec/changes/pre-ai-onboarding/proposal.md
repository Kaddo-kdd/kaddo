# Proposal: Pre-AI Onboarding Report and Guidance (VS-072)

## Why

For `pre-ai` projects (existing code, little structured knowledge) there's no single command that
synthesizes scan / understand / knowledge / questions / roadmap / Work Items / adapters and answers
"where am I, and what's the next step?". Without it users jump to roadmap or implementation too early,
producing weak Work Items and agents working on incomplete context.

## What

Add a read-only diagnosis driven by the `project.state` set at `kaddo init`:

- `kaddo onboarding` (alias `kaddo onboard`) — console diagnosis; `--json` for machine output.
- `kaddo report onboarding` — write `.kaddo/reports/onboarding-report.{md,json}`.

It reports one overall **status** and exactly one **recommended next step**:
`not-initialized`, `not-applicable` (new), `legacy-project`, `initialized`, `scanned`,
`knowledge-incomplete`, `needs-decisions`, `ready-for-roadmap`, `ready-for-work-item`,
`ready-for-implementation`. Signals: scan/understand presence, the five knowledge files
(present/weak/missing, priority order), roadmap (missing/empty/has-candidates), Work Items
(none/none-ready/ready/in-progress), installed adapters, and question counts by resolution status
(reusing VS-071 — only `blocking + open` blocks).

It is a compass, not an alternate flow: it never runs scan/understand/roadmap/create, never installs
adapters, never edits knowledge or code, no git, no LLM. `onboarding` writes nothing; `report
onboarding` writes only under `.kaddo/reports/`.

## Scope

Diagnosis + guidance for pre-ai (limited output for new/legacy/not-initialized). The bootstrap-agent
prompt gains a pre-AI section. No changes to `kaddo init` templates.

## Impact

- New `core/onboarding.ts` (buildOnboardingReport, renderOnboardingMarkdown, serializeOnboardingJson)
  reusing config, scan/understand presence, knowledge files, open-questions, Work Items, adapter
  status.
- New `commands/onboarding.ts`; `index.ts` registers `onboarding`/`onboard` + `report onboarding`;
  command-help entry.
- `agents/prompts.ts`: bootstrap-agent pre-AI guidance.
- Docs EN/ES (new Onboarding page) + sidebar + README. Minor bump 3.34.0.
