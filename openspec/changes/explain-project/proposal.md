# Proposal: Explain Project

## Problem

Kaddo can now collect technical signals, generate context packs, guide LLM understanding,
create work items from roadmap candidates, declare ownership and detect possible knowledge
drift.

However, users still need a simple way to summarize the current state of the project. The
knowledge exists, but it is distributed across multiple artifacts:

```txt
.kaddo/config.yml
.kaddo/scan.json
.kaddo/context-pack.md
.kaddo/understand.md
architecture/inventory.md
architecture/capabilities.md
architecture/current-state.md
architecture/roadmap.md
architecture/work-items/*.md
architecture/agents/*.md
```

Kaddo needs a command that answers:

```txt
What does Kaddo currently know about this project?
```

## Proposed Change

Improve and consolidate `kaddo explain` so that — when run without filters — it produces a
clear project explanation from existing Kaddo artifacts:

```bash
kaddo explain
kaddo explain --for human
kaddo explain --for agent
```

It summarizes the project using `.kaddo/config.yml`, `.kaddo/scan.json`, the presence of
inventory/capabilities/current-state/roadmap/agents, the Work Items and their ownership, and
reports what is missing and what to do next. It also writes `.kaddo/explain.md` and
`.kaddo/explain.json`. The existing focused behavior (`--scope`, `--type`, `--since`) is kept.

## Why Now

The first complete Kaddo workflow already exists:

```txt
scan → context → agents → roadmap → work item → ownership → guard
```

Now Kaddo needs to make that accumulated knowledge explainable — for onboarding, human
handoff, agent context, project review, documentation and demos.

## Scope

- Review the existing `kaddo explain` command.
- Extend it to summarize the project from the new artifacts introduced by recent VSs.
- Produce a human-readable explanation and an agent-friendly explanation.
- Include project state, stack, roadmap, work items and ownership coverage.
- Highlight missing knowledge as actionable next steps.
- Avoid full source-code loading.
- Add tests and docs.

## Out of Scope

- Calling an LLM.
- Generating new capabilities, architecture or roadmap.
- Running agents.
- Creating work items.
- Running Guard automatically.
- Producing a full documentation website.
- Summarizing source-code files.
- Modifying existing artifacts.

## Expected Value

A user can run `kaddo explain` and quickly understand the current project knowledge without
opening every artifact manually.

## Risks

- Output may become too verbose.
- Human and agent formats may overlap too much.
- Missing artifacts may make the explanation feel incomplete.
- The command may duplicate `context`.

## Success Criteria

`kaddo explain` produces a concise, useful project explanation based on the current Kaddo
knowledge repository, without calling an LLM.
