# Spec: Reusable Skills Layer (VS-059)

## Structure
- `knowledge/skills/<id>/skill.md` with standard front matter (`type: skill`, `id`, `title`,
  `version`, `group`, `applies_to`) and standard sections.
- Seven initial skills: adr-writing, work-item-refinement, ownership-suggestion,
  graph-metadata-review, capsule-writing, learning-capture, implementation-planning.

## Install
- `kaddo add skills` (recommended), `--all`, `--group <delivery|tech|integration>`.

## CLI integrations
- `kaddo context` summarizes available skill ids (not full content).
- `kaddo explain` reports installed skill count + per-group counts.
- `kaddo understand` recommends skills for its recommended agents.
- Relevant agent prompts list the skills they should apply.

## MCP
- Resources `kaddo://skills` and `kaddo://skills/<id>`.
- Tools `kaddo_list_skills`, `kaddo_get_skill`.
- Skills exposed as reusable prompts.

## Constraints
- Skills never execute, modify files, run git or call an LLM.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests cover install + groups, context/explain/understand summaries, agent skill references, and
  MCP resources/tools/prompts.
