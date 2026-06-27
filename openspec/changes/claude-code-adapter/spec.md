# Spec: Claude Code Adapter (VS-066)

## Command
- `kaddo adapters install claude` + alias `kaddo export claude` → write `CLAUDE.md` at project root.
- `--dry-run` previews (no write); `--force` overwrites; default skips if the file exists.
- Unknown adapter → clear error listing available targets (codex, claude).
- Requires a Kaddo project (requireConfig).

## Generated CLAUDE.md
- Generated-by header naming `kaddo adapters install claude`; `# CLAUDE.md` title; note it is a
  generated projection, not the primary source.
- Shared body: project name/guidance, knowledge map, derived `.kaddo/` paths (marked generated),
  operating rules, before roadmap (open-questions readiness; resolve/assume/defer blocking),
  before implementation (read active Work Item; stay in scope), after implementation (suggest guard/
  impact/savings/drift), package-manager-aware command fallback, installed agents, installed skills,
  MCP hint when detected, behavior checklist, safety limits.
- Valid with no agents and/or no skills; works for new/pre-ai/legacy.
- Never inlines context-pack / business / product / codebase / Work Item / agent / skill bodies.

## Reuse
- Shares the common core with the Codex adapter; only the renderer header/title differ.

## Constraints
- No LLM, no git, no application code; never modifies `knowledge/` or `.kaddo/`; only writes
  `CLAUDE.md`. No native skills/slash commands/inject in this VS.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: content (header/title/body/pm fallback/agents/skills/no-inline), states; command
  create/skip/force/dry-run, no knowledge write, no AGENTS.md leak, unknown adapter error.
