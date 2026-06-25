# Spec: Codex AGENTS.md Adapter (VS-065)

## Command
- `kaddo adapters install codex` (alias `kaddo export codex`) writes `AGENTS.md` at the project root.
- `--dry-run` prints content without writing; `--force` overwrites; default does not overwrite an
  existing `AGENTS.md`.
- Unknown adapter → clear error. Requires a Kaddo project (`.kaddo/config.yml`).

## Generated AGENTS.md
- Explains the repo uses Kaddo (KDD) + project name.
- Lists the knowledge map and derived `.kaddo/` paths (marked generated, do-not-edit).
- Operating rules; before-roadmap (open-questions readiness: resolve/assume/defer blocking first);
  before-implementation (read active Work Item; stay in scope); after-implementation (suggest
  guard/impact/savings/drift).
- Lists installed agents and skills when present (names + hints only); MCP section when detected.
- Useful commands, agent-behavior checklist, safety limits.
- Never inlines full file contents (context-pack, business/product/codebase, full agents/skills).

## Constraints
- No LLM, no git, no app code; never modifies `knowledge/` or `.kaddo/`; only writes `AGENTS.md`.
- Works for new / pre-ai / legacy projects with a Kaddo structure; valid with or without agents/skills.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: generation, no-overwrite default, `--force`, `--dry-run`, project name, knowledge paths,
  open-questions + guard rules, agents/skills listing, no full-file inlining, absent agents/skills.
