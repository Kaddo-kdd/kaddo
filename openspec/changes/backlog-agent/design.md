# Design: Backlog Agent

## Prompt
`BACKLOG_AGENT` in `agents/prompts.ts`, following the canonical 9 sections and referencing
`.kaddo/context-pack.md`. The responsibility boundaries + Agent Trace footer are appended
automatically via `withResponsibilityTrace` (matrix entry added).

## Matrix / groups
- `responsibility.ts`: backlog-agent → produces draft / roadmap candidate; canSuggest
  work-item-agent, roadmap-agent; cannotSuggest code/git/editing roadmap/auto-executing agents;
  next = human decision. Added to the markdown matrix order.
- `groups.ts`: added to the `delivery` group and to the recommended set for new/pre-ai/legacy.

## Positioning
`idea → backlog-agent → draft / roadmap candidate → (human decides) → work-item-agent →
implementation-agent`. The backlog-agent sits before the work-item-agent and never auto-runs it.

## Compatibility
Additive: a new prompt + matrix/group entries. `kaddo add agents` installs it under
`knowledge/agents/delivery/backlog-agent.md`. No CLI command changes.
