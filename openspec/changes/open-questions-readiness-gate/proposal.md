# Proposal: Agent Readiness Gate for Open Questions (VS-064)

## Why

`kaddo bootstrap` leaves `## Open Questions` in the knowledge files, but they're passive. A new user
may ask an agent to "generate the roadmap" or "implement the first Work Item" without resolving them,
so the roadmap can be built on unconfirmed assumptions (stack, MVP scope, auth, persistence).

## What

A readiness gate — not a mandatory CLI step. Agents check it before critical tasks.

- Core `open-questions.ts`: extract `## Open Questions` (EN/ES headings) from business/product/
  codebase/roadmap, classify each `blocking` / `important` / `deferred` with conservative keyword
  heuristics (ambiguous → important), and compute roadmap readiness (`ready` / `needs_decisions` /
  `unknown`) with neutral suggested assumptions for blocking questions.
- Optional `kaddo questions` (alias `kaddo readiness`): summary / `--json` / `--output`.
- `kaddo understand` nudges when blocking questions exist (non-blocking).
- Agent prompts (roadmap, work-item, implementation, bootstrap) add a Readiness Gate: pause and ask
  the user to confirm assumptions / resolve / defer blocking questions before proceeding.
- MCP read-only: `kaddo://open-questions`, `kaddo://roadmap-readiness`, and
  `kaddo_generate_questions_report` (writes only under `.kaddo/reports/`).

## Principle

> Open question ≠ decorative documentation. An open question should reach an outcome: resolved,
> assumed or deferred — and an agent should not ignore it when it affects the next step.

## Limits / out of scope

No CLI blocking, no auto-resolution, no editing of business/product/codebase, no LLM in the CLI, no
approval workflow, no decisions DB, no per-person questions.

## Impact

- New `core/open-questions.ts`, `commands/questions.ts`, `questions` + `readiness` commands,
  command-help, `understand` nudge, four agent-prompt updates.
- MCP resources + tool. Docs EN/ES (Open Questions Gate). Both packages bump to 3.26.0.
