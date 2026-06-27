# Proposal: Claude Code Adapter (VS-066)

## Why

VS-065 added the Codex adapter (`AGENTS.md`) and VS-065.1-ref stabilized it as the reference, with a
reusable common core. Teams using Claude Code still have to paste the Kaddo workflow manually. Apply
the same Adapter Contract to Claude Code by generating a `CLAUDE.md` projection.

## What

Add `kaddo adapters install claude` (alias `kaddo export claude`) generating a `CLAUDE.md` at the
project root. It reuses the **shared common core** (project metadata, knowledge/derived paths, agents,
skills, package-manager detection, command fallback, adapter-contract rules) — only the target
renderer differs (`AGENTS.md` → `CLAUDE.md`).

- Same compact body as the reference adapter (knowledge map, operating rules, before roadmap /
  implementation / after implementation, pm-aware command fallback, agents, skills, MCP hint, safety
  limits). Claude-specific generated-by header and `# CLAUDE.md` title.
- `--dry-run` previews; `--force` overwrites; default skips an existing file.
- Deterministic: no LLM, no git, no knowledge/`.kaddo/` writes, no full-file inlining.

## Scope

Only `CLAUDE.md`. No native Claude Code skills (future VS-066.1), no slash commands (future
VS-066.2), no `--inject` for Claude (Codex-only).

## Impact

- `core/codex-adapter.ts`: generalize the renderer into `renderAdapterMarkdown(ctx, target)`;
  `renderAgentsMd`/`renderClaudeMd` thin wrappers; `AdapterTarget` type.
- `commands/adapters.ts`: target registry (codex/claude); generic create/skip/force/dry-run; inject
  stays Codex-only.
- `index.ts`: descriptions mention claude (the `<adapter>` arg already accepts it).
- New docs Claude Adapter page (EN/ES) + sidebar; README adapters section (root + npm). Minor bump to
  3.28.0.
