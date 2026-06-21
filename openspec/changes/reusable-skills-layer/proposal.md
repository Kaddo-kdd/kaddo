# Proposal: Reusable Skills Layer (VS-059)

## Why

Several agents repeat similar instructions (writing ADRs, refining Work Items, proposing
ownership, reviewing graph hints, writing capsules, capturing learning, planning implementation).
That duplication causes inconsistent output, over-long prompts and harder maintenance. Kaddo needs
a reusable layer that standardizes *how* to do these things, separate from the agent that decides
*what* to do.

## What

A **Skills** layer: reusable, versionable capability definitions under `knowledge/skills/<id>/skill.md`.

- Seven initial skills: `adr-writing`, `work-item-refinement`, `ownership-suggestion`,
  `graph-metadata-review`, `capsule-writing`, `learning-capture`, `implementation-planning`.
- Standard front matter (`type: skill`, `id`, `title`, `version`, `group`, `applies_to`) + standard
  sections (Purpose, When to use, Inputs, Output, Rules, Quality checklist, Example output).
- `kaddo add skills` with `--all` and `--group <delivery|tech|integration>` (progressive install).
- Agent prompts gain a **Reusable Skills** section listing the skills they should apply.
- `kaddo context` summarizes available skill ids; `kaddo explain` reports count + groups;
  `kaddo understand` recommends skills for its recommended agents.
- `@kaddo/mcp` exposes skills: `kaddo://skills` + `kaddo://skills/<id>` resources,
  `kaddo_list_skills` / `kaddo_get_skill` tools, and each skill as a reusable prompt.

## Principle

> Agents orchestrate. Skills standardize. Knowledge grounds. MCP exposes.

A skill does not decide what to do — it defines how to do one thing well. Skills never execute
anything: no git, no LLM, no file changes.

## Impact

- New `packages/cli/src/skills/skills.ts` (definitions + groups + selection); skills module ships
  the seven skill files; `add` handles skills progressively.
- New `services/installed-skills.ts`; context/explain/understand integrations; `withResponsibilityTrace`
  appends a skills section.
- `@kaddo/mcp` skills catalog + resources/tools/prompts.
- The legacy `skill` Work Item type is removed (skills are reusable instructions now).
- Docs EN/ES (new Skills page) + READMEs; both packages bump to 3.21.0. Additive → minor.
