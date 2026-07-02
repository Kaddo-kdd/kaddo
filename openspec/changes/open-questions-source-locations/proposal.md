# Proposal: Open Questions Source Locations and Resolution Guidance (VS-073.3)

## Why

`kaddo questions` detected open questions but didn't say where they lived, so users had to hunt
through `knowledge/` with `grep`/`rg`/`Select-String` to update them. The flow broke right before the
roadmap. A detected question must be actionable: where it is and how to update it.

## What

Enrich each parsed question with `sourcePath`, `line`, `raw` and `note`, and make `kaddo questions`
directly actionable:

- Human output lists questions grouped by severity/status, each with `Source` (`path:line`),
  `Status`, `Severity`, captured `Note`, and — for blocking open questions — a copy/paste `Example`
  with a placeholder note (never an invented business decision). A localized **How to resolve** guide
  (EN/ES) closes the output.
- `kaddo questions --json` and the Markdown report carry `sourcePath`, `line`, `raw`, `note`.
- The MCP `kaddo://open-questions` resource / report tool inherit the fields (they serialize the
  report).
- The unified next-step `questions` recommendation now points to `kaddo questions` for source
  locations and resolution guidance.

Deterministic and read-only: no file edits, no interactive mode, no invented answers, no LLM, no git.

## Scope

Visibility and guidance for questions only. Keeps VS-071 tokens (EN/ES) and VS-073.2 unified
next-step.

## Impact

- `core/open-questions.ts`: parser captures line/raw; `OpenQuestion` gains `sourcePath`, `line`,
  `raw`, `note`; Markdown report shows `path:line` + suggested action.
- `commands/questions.ts`: actionable per-question output + localized resolution guide.
- `core/next-step.ts`: questions recommendation mentions source locations/guidance.
- Docs open-questions.md (EN/ES); README. Minor bump 3.38.0.
