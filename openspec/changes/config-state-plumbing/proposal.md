# Proposal: Config & State Plumbing

> Status: Ready

## Problem

`kaddo init` captures important project context — `project.state`, `team.size` and
`project.structure`. But the other CLI commands do not read or use that information, so
it stays decorative. This breaks Kaddo's promise: *infer first, ask later*. A project
marked `pre-ai`, `legacy` or `new` should receive different guidance and defaults.

## Proposed Change

Introduce a centralized configuration reader and validator that exposes typed config to
commands (project name, state, structure, team size, knowledge/guard/scan sections).
Then update `scan` and `create` to adapt their next-step messaging and helper text based
on `project.state`.

## Why Now

This is required before building `context`, `understand` and agent-based flows — those
must know whether the project is new, pre-AI or legacy to generate the right guidance.

## Scope

- Centralized config loader + Zod schema validation for `.kaddo/config.yml`.
- Typed config exposed to commands, with safe defaults for missing fields.
- `scan`: state-aware next-step message.
- `create`: state-aware helper text.
- Clear message when the project is not initialized.
- Tests for loading, missing, invalid and state-aware behavior.

## Out of Scope

- `kaddo context`, `kaddo understand`, `kaddo roadmap`, `kaddo architecture`.
- Agent prompt packs.
- Legacy analysis / multirepo orchestration.
- Changing Guard Lite behavior beyond reading config if needed.

## Expected Value

Kaddo becomes **state-aware**: the CLI starts acting differently for new, pre-AI and
legacy projects, making the workflow feel intentional instead of generic.

## Risks

- Overcomplicating config too early → keep the schema minimal.
- Breaking users with old config files → safe defaults for missing fields.
- Too many state branches / noisy CLI → state only drives defaults and next-step guidance.

## Success Criteria

Commands read validated config and adapt basic behavior without heavy process or breaking
existing flows.
