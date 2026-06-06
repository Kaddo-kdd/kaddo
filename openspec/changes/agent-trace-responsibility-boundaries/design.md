# Design: Agent Trace & Responsibility Boundaries

## Single source of truth: `agents/responsibility.ts`

`RESPONSIBILITY_MATRIX` maps each agent → `{ responsibleFor, produces, canSuggest,
cannotSuggest, next }`. From it we render:

- `renderAgentBoundaries(agent)` → a `## Responsibility & Boundaries` section.
- `renderAgentTrace(agent)` → the `## Agent Trace` footer (the `Agent / Produced / Next` block).
- `withResponsibilityTrace(fileName, content)` → appends both to a prompt (no-op without entry).
- `renderResponsibilityMatrixMarkdown()` → the official matrix table for docs.

`AGENT_PROMPTS` is post-processed so **every** official prompt carries its boundaries + trace.
This keeps the contract DRY and guarantees AC1 without editing 15 prompts by hand.

## Agent Trace format

```
────────────────────────
Agent: roadmap-agent

Produced:
knowledge/delivery/roadmap.md

Next:
kaddo create --from roadmap
work-item-agent
────────────────────────
```

## Git responsibility model

`BRANCH_SUGGESTING_AGENT = 'implementation-agent'` and `canSuggestBranches(agent)` enforce that
only the implementation-agent may suggest a branch. The delivery protocol (branch-first per Git
strategy → implement → scan → owners suggest → guard → commit only with human confirmation) moves
out of the work-item-agent into a new **implementation-agent** prompt. The work-item-agent now
just hands off to it.

This is an evolution of VS-036 (which put branch-first inside the work-item-agent): branch
suggestion is now a distinct responsibility, and the roadmap-agent is explicitly barred from it.

## Handoff rules (used by `understand`)

```
roadmap-agent → kaddo create --from roadmap → work-item-agent → implementation-agent
implementation-agent → scan → owners suggest → guard → explain
```

## Compatibility

implementation-agent is added to the `delivery` group and the recommended sets for every state.
Existing prompts keep their content; the boundaries + trace are appended. No CLI behavior around
Git changes — Kaddo still never runs git.
