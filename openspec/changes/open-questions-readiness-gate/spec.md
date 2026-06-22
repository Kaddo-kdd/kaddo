# Spec: Agent Readiness Gate for Open Questions (VS-064)

## Extraction & classification
- Read `## Open Questions` / `## Preguntas abiertas` from business.md, product.md, codebase.md,
  roadmap.md (when present).
- Classify each `blocking` / `important` / `deferred` with conservative keyword heuristics; ambiguous
  → important. Blocking questions get a neutral suggested assumption.
- Roadmap readiness: `needs_decisions` (any blocking), `ready` (questions but none blocking),
  `unknown` (no questions).

## CLI (optional)
- `kaddo questions` (alias `kaddo readiness`): summary / `--json` / `--output`. Not part of the main
  flow. `kaddo understand` nudges when blocking questions exist.

## Agents
- roadmap-agent checks readiness and asks for confirmation before generating the roadmap when
  blocking; proposes assumptions.
- work-item-agent / implementation-agent check blocking questions relevant to scope / stack before
  refining / implementing.
- bootstrap-agent recommends reviewing open questions before the roadmap.

## MCP
- Resources `kaddo://open-questions` (classified questions) and `kaddo://roadmap-readiness`
  (decision summary). Tool `kaddo_generate_questions_report` (markdown/json) writes only under
  `.kaddo/reports/`.

## Reports
- Markdown: summary, blocking, important, deferred, suggested assumptions, recommended next step.
- JSON: summary, classified questions, suggested_assumptions, recommended_next_step.

## Constraints
- No LLM, no knowledge/src writes, no git, no auto-resolution, no CLI blocking.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: extraction, classification, readiness with/without blocking, markdown+JSON, MCP
  resources/tool + no-escape writes.
