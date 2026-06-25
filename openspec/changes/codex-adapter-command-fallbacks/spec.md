# Spec: Codex Adapter Command Fallbacks (VS-065.1)

## Generated AGENTS.md
- Includes a `## Command fallback` section.
- Preferred: `kaddo <command>`.
- Fallbacks in order: `corepack pnpm exec kaddo <command>`, `pnpm exec kaddo <command>`,
  `npx kaddo <command>` (last resort).
- States Codex must not assume Kaddo is unavailable until the local fallbacks are attempted, and
  should mention which fallback it used.
- Present in `adapters install codex`, its `--dry-run` preview and `--force` output.

## Constraints
- The adapter documents the fallbacks only — it never runs them. No knowledge/`.kaddo/` writes, no
  git, no LLM. Still no full-file inlining.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: fallback section present in generated content, `--dry-run` and `--force`; includes the three
  local runners and the "do not assume unavailable" line.
