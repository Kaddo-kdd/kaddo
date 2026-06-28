# Proposal: Open Questions Resolution Tracking (VS-071)

> Originally drafted as VS-069, but that number is taken by the Kiro adapter. Registered as VS-071.

## Why

Kaddo detects open questions and classifies them blocking/important/deferred, but it can't tell a
genuinely pending question from one already decided or assumed. In OpenCode/Antigravity/Kiro smoke
tests, agents stopped on `blocking` questions even when the roadmap already documented an assumption —
false blocks that erode trust in the readiness gate.

## What

Give each question a **resolution status**: `open`, `resolved`, `assumed`, `deferred`. Authors mark a
bullet with a token — `[open]`/`[resolved]`/`[assumed]`/`[deferred]` (EN) or
`[abierta]`/`[resuelta]`/`[asumida]`/`[diferida]` (ES). A bullet with no token is `open` (backward
compatible). Optional indented `- note:` metadata becomes `resolution_note`.

**Only `open` questions block readiness.** Readiness is `needs_decisions` only when there is a
blocking question still `open`; resolved/assumed/deferred are surfaced for context but never block.

- `kaddo questions` (and `kaddo readiness`) show counts by resolution status and split
  blocking-open / resolved / assumed / deferred; `--json` carries `resolution_status`,
  `resolution_note`, `summary.resolution` counts and `summary.blocking_open` / `important_open`.
- `kaddo understand` nudges on `blocking_open` (not all blocking).
- Adapter projections (all five) and agent prompts reword the gate: only
  `resolution_status = open` blocks; assumed/resolved/deferred are surfaced; bootstrap suggests
  marking questions with tokens.

## Scope

Detection, readiness, reporting and wording only. No auto-resolution, no LLM, no automatic edits to
`knowledge/`, no YAML requirement, no semantic answer detection.

## Impact

- `core/open-questions.ts`: `ResolutionStatus`, token parsing, note metadata, readiness by
  `blocking_open`, status counts, new report sections + summary fields, `roadmapReadinessSummary`.
- `commands/questions.ts`, `commands/understand.ts`: status-aware output.
- `core/codex-adapter.ts` (shared adapter wording) + `agents/prompts.ts` (4 readiness gates).
- Docs EN/ES (Open Questions: resolution tracking) + README. Minor bump 3.33.0. Backward compatible.
