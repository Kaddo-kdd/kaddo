# Proposal: State-Aware Bootstrap Baseline (VS-073)

## Why

`kaddo bootstrap` was coupled to `new` projects — on `pre-ai`/`legacy` it warned "Bootstrap is
designed for new projects." But a pre-ai/legacy project also needs the structural knowledge baseline;
it just needs discovery/risk-oriented templates instead of intent-oriented ones. Bootstrap's real
responsibility is "create the knowledge baseline", which applies to every project type.

## What

Make bootstrap state-aware (reads `project.state`):

- Remove the new-only warning; print a state-aware message (`Creating <state> knowledge baseline.`).
- Create the full common baseline with **state-specific templates** (new / pre-ai / legacy), each
  carrying `project_state:` in front matter:
  `business.md`, `product.md`, `capabilities.md`, `tech/codebase.md`, `tech/current-state.md`,
  `delivery/roadmap.md`, plus the directories `tech/decisions/` and `delivery/work-items/`.
- Never overwrite existing files (skipped), keep `knowledge/knowledge.md` / `roadmap.md` /
  `work-items/`, idempotent. Never installs agents/skills, never runs scan/context/git, no LLM, no
  code generation.
- `kaddo understand` recommends `kaddo bootstrap` first when the readiness baseline is incomplete
  (agents have no target files until then). `kaddo explain` already recommends bootstrap via
  readiness (VS-072.1) and advances to agents-missing/skills-missing afterwards.

## Scope

Bootstrap behavior + templates + the understand nudge. `kaddo init` stays minimal.

## Impact

- New `core/bootstrap-templates.ts` (state-aware baseline templates).
- Rewritten `commands/bootstrap.ts` (full baseline, dirs, state-aware messages, idempotent).
- `commands/understand.ts`: readiness-driven bootstrap nudge.
- Docs `commands/bootstrap.md` (EN/ES) + README. Tests rewritten. Minor bump 3.36.0.
