# Design: Reusable Skills Layer (VS-059)

## Definitions

`packages/cli/src/skills/skills.ts` holds the seven `SkillDef`s (id, title, group, appliesTo,
content with standard front matter + sections), the `SKILL_GROUPS` map (delivery / tech /
integration), `skillInstallPath(id)` → `knowledge/skills/<id>/skill.md`, and `selectSkills({all,
group})` (recommended = delivery + tech; `--all` = 7; `--group` = that group).

## Install

The `skills` module's files are generated from `SKILLS` (README + one file per skill). `add.ts`
handles `skills` like `agents`: progressive selection via `selectSkillModuleFiles`, never
overwriting existing files, with a tailored "skills are reusable" handoff. The legacy `skill` Work
Item type is removed.

## Discovery & integrations

`services/installed-skills.ts` reads `knowledge/skills/**/skill.md` front matter:
`discoverInstalledSkills`, `skillGroupCounts`, `skillsForAgents(skills, agents)`.

- context-pack: `skills: string[]` (ids); template `## Skills` summary (ids only, content not inlined).
- explain: `skills {total, byGroup}`; human `## Skills installed: N` + per-group counts (agent JSON
  carries the object).
- understand: after recommended agents, prints `Recommended skills:` = skills whose `applies_to`
  intersects the recommended agents (only if installed).
- responsibility: `withResponsibilityTrace` appends a **Reusable Skills** section computed from each
  skill's `appliesTo`, so every relevant agent prompt references its skills (AC9) with no per-prompt
  edits.

## MCP (read-only)

`packages/mcp/src/skills.ts` (`listSkills`, `getSkill`) reads `knowledge/skills/**/skill.md`.
`kaddo://skills` returns the structured list; per-skill `kaddo://skills/<id>` resources and
`skill-<id>` prompts are registered dynamically at `createServer` from the installed skills;
`kaddo_list_skills` / `kaddo_get_skill` tools added. All read-only.

## Safety / out of scope

Skills never execute, never modify files, never run git or call an LLM. No skill run/auto-apply, no
workflow engine, no multi-agent orchestration, no new write tools.
