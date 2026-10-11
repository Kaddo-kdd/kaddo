---
id: WI-060
title: Evolve Impact, Drift and Savings Reports for the current Kaddo lifecycle
type: feature
status: completed
knowledge_level: K3
affected_modules: [cli, mcp, docs]
domains: [Product, Tech, Delivery]
code:
  - packages/cli/src/core/impact-report.ts
  - packages/cli/src/core/drift-report.ts
  - packages/cli/src/core/savings.ts
  - packages/mcp/src/generate.ts
  - packages/mcp/src/resources.ts
  - apps/docs/src/content/docs/impact-report.md
  - apps/docs/src/content/docs/drift-report.md
  - apps/docs/src/content/docs/savings-report.md
  - apps/docs/src/content/docs/es/impact-report.md
  - apps/docs/src/content/docs/es/drift-report.md
  - apps/docs/src/content/docs/es/savings-report.md
source:
  type: chat
  imported_at: '2026-10-11'
---

# Evolve Impact, Drift and Savings Reports for the current Kaddo lifecycle

## Intent

Make the three reports represent what Kaddo can prove about the project lifecycle.
Every reported item must state whether it is **observed**, **derived**, **estimated**,
**projected**, **unknown**, or **not applicable**. Optional capabilities and a POC
baseline must not be treated as missing delivery evidence.

## Refined scope

1. Build a shared reporting-evidence context from project state/mode, repository
   structure, Work Item lifecycle and Guard history.
2. Change Impact from a fixed compliance score into an evidence inventory: applicable
   knowledge, verified delivery outcomes and explicit gaps. Preserve the legacy score
   only as a deprecated compatibility field; do not use it for confidence or savings.
3. Change Drift from Guard-only wording into a current consistency report whose current
   evidence is Guard history today and which labels unavailable lifecycle checks as
   unknown rather than clean.
4. Make Savings period-aware. Separate observed, one-time derived estimates from
   monthly projections; never combine them into a single total. Defaults remain
   estimates and confidence cannot be high without calibrated assumptions.
5. Expose identical schemas through CLI and MCP; document the evidence taxonomy and
   limitations in English and Spanish.

## Out of scope

- Inventing lifecycle events or operational metrics not persisted by the repository.
- Claiming verified acceptance criteria solely because the section exists.
- Introducing individual-productivity metrics, accounting ROI, or API-contract changes.
- Making Initiatives, Resources or Deprecations mandatory.

## Acceptance Criteria

- [x] AC-01: Each report exposes project context and an evidence classification for its principal findings.
- [x] AC-02: Impact distinguishes artifact presence from verified lifecycle evidence and does not penalize optional capabilities.
- [x] AC-03: POC mode uses an applicable baseline and marks inapplicable layers/capabilities as not applicable.
- [x] AC-04: Drift reports current Guard-backed consistency separately from unavailable lifecycle consistency checks.
- [x] AC-05: Savings separates one-time estimates from monthly projections and exposes the reporting period and assumptions source.
- [x] AC-06: Default assumptions cannot produce High confidence.
- [x] AC-07: CLI, MCP resources/generators, JSON and Markdown output remain functional and documented bilingually.
- [x] AC-08: Targeted unit tests cover project-aware applicability and period separation.

## Validation

Run targeted CLI and MCP report tests, type-check/build the affected packages, and inspect
Markdown/JSON output from a fixture in standard and POC modes.

## Definition of Done

The evidence model is shared by all reports, 30 targeted tests and both package builds pass,
documentation describes the limits of evidence and estimates, and implementation evidence is
recorded before review.

## Implementation Evidence

- `pnpm exec vitest run packages/cli/tests/impact-report.test.ts packages/cli/tests/savings.test.ts packages/cli/tests/guard-history.test.ts` — passed (30 tests).
- `pnpm --filter @kaddo/cli build` — passed.
- `pnpm --filter @kaddo/mcp build` — passed.
- `git diff --check` — passed.
