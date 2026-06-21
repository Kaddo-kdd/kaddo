# Proposal: Impact Report Actionable Gaps (VS-061.1)

## Why

`kaddo report impact` (VS-061) shows aggregate metrics like "Work Items with initiative: 3/4" but
does not say *which* Work Item explains the gap or how to fix it, forcing manual inspection.

## What

Add an **Actionable Gaps** section (Markdown + stable `actionable_gaps` JSON) that turns each metric
into per-Work-Item, fixable items:

- Missing `source`/`source_id`, `initiative`, `code:` ownership, `knowledge_level`.
- Missing `## Acceptance Criteria`, `## Definition of Done`, validation (`## How to test it`)
  sections — EN + ES variants recognized.
- **Broad ownership globs** (e.g. `src/**`, `src/cli/**`) flagged as low-signal.
- **Ownership overlaps** shown with the glob and the Work Items that share it.

Each gap item carries `id`, `title`, `status`, `path`, `suggested_action`. **Suggested Actions** now
name specific Work Items (grouping when many), and a **Score Breakdown** shows each bucket's
contribution. When there are no gaps: "No actionable knowledge gaps detected."

## Principle

> Metrics must close with action: metric → gap → affected artifact → suggested action.

Still deterministic: no file edits, no agents, no LLM. The main score is unchanged; the breakdown
just makes it transparent.

## Impact

- `core/impact-report.ts`: collect gaps in the Work Item loop; `ActionableGaps` + `ScoreBreakdown`
  types; render the new sections; gap-driven suggested actions.
- MCP `kaddo://impact-report` / `kaddo_generate_impact_report` include the section automatically
  (they reuse the core builder/renderer).
- Docs EN/ES. Patch release 3.23.1 (both packages share version).
