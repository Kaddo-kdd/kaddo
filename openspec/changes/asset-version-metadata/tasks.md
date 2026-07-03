# Tasks: Agent and Skill Version Metadata (VS-074.2)

- [x] core/version.ts: `KADDO_VERSION` resolved for source + bundled dist.
- [x] modules/agents.ts: `withAgentFrontMatter` — versioned front matter on installed agents.
- [x] skills/skills.ts: skill front matter `version` = package version (+ `name`).
- [x] core/assets.ts: canonicalAgents/canonicalSkills; classify up-to-date/outdated/unknown-version/
      modified/missing; `assetStatus`, `installedAssetsSummary`.
- [x] commands/assets.ts + index.ts + command-help: `agents status`/`skills status` (`--json`),
      `agents update`/`skills update` (`--force`, safe by default).
- [x] project-explain.ts (`## Installed Assets`), context-pack.ts (`installedAssets`), understand.ts
      (warn on outdated recommended agent).
- [x] MCP resources.ts: `kaddo://installed-assets` (read-only).
- [x] Tests: states (up-to-date/outdated/unknown/modified/missing), update refresh + no-overwrite,
      summary; MCP resource URI list.
- [x] Docs Installed Assets (EN/ES) + sidebar; README. Minor bump 3.42.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (732); `pnpm -r build` green; smoke (status/update).
- [x] `astro build` green.
