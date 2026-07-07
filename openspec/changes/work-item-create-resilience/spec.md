# Spec: Work Item Create Resilience and Acceptance Criteria UX (VS-085)

## User Story

As a Kaddo user creating Work Items manually, I expect the CLI to create missing standard
directories instead of failing with misleading errors, and to collect acceptance criteria
reliably across all shells.

## Problem

1. `kaddo create bugfix` fails with "Run `kaddo init` first" when `knowledge/delivery/work-items/`
   is missing — even when the project is fully initialized.
2. The "press Enter twice to finish" acceptance criteria input is unreliable in PowerShell/Windows.
3. Manually created Work Items lack structured `source` metadata and `generated_by`/`template_version`
   fields for metadata health alignment.

## Solution

1. **Directory resilience**: `ensureWorkItemsDir` checks for `.kaddo/config.yml` (project
   initialized?) and creates `knowledge/delivery/work-items/` if missing. Only suggests
   `kaddo init` when config truly doesn't exist.
2. **Acceptance criteria UX**: Iterative one-at-a-time input with "Add another?" confirmation.
   Semicolon-separated input is also supported. All criteria are normalized to Markdown
   checkbox format (`- [ ] Criterion.`).
3. **Source metadata**: Manual Work Items include `source: { type: manual, inferred: false }`,
   `generated_by: kaddo-create`, `template_version: 1`, and `work_type` in frontmatter.

## Files Changed

- `packages/cli/src/commands/create.ts` — ensureWorkItemsDir, collectAcceptanceCriteria,
  renderAcceptanceCriteria, updated frontmatter, wired across manual/module/roadmap flows
- `packages/cli/tests/create-resilience.test.ts` — 16 new tests
- `packages/cli/tests/roadmap.test.ts` — updated acceptance criteria expectation
- `apps/docs/src/content/docs/commands/create.md` — EN docs
- `apps/docs/src/content/docs/es/commands/create.md` — ES docs
