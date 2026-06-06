# Proposal: Command Workflow Clarity (VS-048)

## Why

During `todoApp` validation the commands worked but the operating flow relied on implicit
knowledge: when to use `scan` vs `context` vs `understand` vs `explain`, what each produces, and
what to do next. New users could not answer "I'm here → I need X → run this → expect this → then
do that" quickly.

## What

Make each command's purpose, question and next step explicit — in the CLI and the docs.

- **Command Responsibility Matrix**: one official table (command → question answered → suggested
  next) as a single source of truth (`core/command-help.ts`).
- **Contextual footer**: `scan`, `context`, `explain` and `understand` print a
  *Question answered / Suggested next* footer at the end of their output.
- **Docs**: README, Getting Started, Commands Overview, Visual Guide updated (EN/ES) with the
  matrix, the recommended workflows (new project / active development) and a recovery path
  (`kaddo understand` when unsure).

## Impact

- A new user can understand the operating flow without reading everything.
- Out of scope: new commands, Guard changes, MCP, agent automation/orchestration.
