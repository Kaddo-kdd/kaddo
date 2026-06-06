# Spec: Command Workflow Clarity

## Matrix & help
- `core/command-help.ts` is the single source of truth (question + next per command).
- Footer printed by scan, context, explain (human), understand.
- Guard/JSON outputs stay machine-clean (matrix in docs only).

## Docs
- README, Getting Started, Commands Overview, Visual Guide (EN/ES): matrix, recommended
  workflows (new project / active development), recovery path (`understand`).

## Out of scope
- New commands, Guard changes, MCP, agent automation/orchestration.

## Acceptance criteria
- **AC1** Official command responsibility matrix exists.
- **AC2** Each command documents purpose / reads / writes / question / next (matrix + docs).
- **AC3** Recommended new-project flow documented.
- **AC4** Recommended active-development flow documented.
- **AC5** Recovery flow (`understand`) documented.
- **AC6** README updated.
- **AC7** Getting Started updated.
- **AC8** Visual Guide updated.
- **AC9** Examples reflect when-to-use / output / next.
- **AC10** A new user can understand the full operating flow from the docs alone.
