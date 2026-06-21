# Tasks: Reusable Skills Layer (VS-059)

## Phase 1 — Definitions & install
- [x] `skills/skills.ts`: 7 skills + groups + `selectSkills` + `skillInstallPath`.
- [x] skills module ships generated skill files + README; remove legacy `skill` work item type.
- [x] `add.ts`: progressive skills install (`--all` / `--group`); tailored handoff; index.ts help.

## Phase 2 — CLI integrations
- [x] `services/installed-skills.ts` (discover, group counts, skillsForAgents).
- [x] context-pack `skills` summary + template `## Skills`.
- [x] explain `skills {total,byGroup}` + human render.
- [x] understand recommends skills for recommended agents.
- [x] `withResponsibilityTrace` appends a Reusable Skills section per agent.

## Phase 3 — MCP
- [x] `skills.ts` catalog; `kaddo://skills` structured + per-skill resources; `kaddo_list_skills`/
      `kaddo_get_skill` tools; skills as prompts.

## Phase 4 — Docs & tests
- [x] New Skills page (EN/ES) + sidebar; Commands Overview, MCP Server, Visual Guide cross-links.
- [x] Root README + MCP README.
- [x] CLI skills tests + MCP skills tests; fix modules tests for removed work-item type.

## Validation
- [x] `pnpm test` green (516); typecheck green; `pnpm -r build` green; server starts.
- [x] `astro build` green.
