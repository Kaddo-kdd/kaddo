# Proposal: Documentation Realignment

## Problem

Kaddo has evolved from a conceptual KDD toolkit into a working CLI flow. The product now
supports:

- project initialization
- deterministic scan
- LLM context pack generation
- agent prompt packs
- guided understand flow
- roadmap-to-work-item creation
- ownership declaration
- Guard Lite drift detection
- project explanation

However, the documentation and landing still explain Kaddo too abstractly. The README even
lists `understand`, `architecture` and `roadmap` as *upcoming*, when the understand flow,
agents, ownership assistant and `explain` already ship.

Users need to understand the practical workflow quickly:

```txt
CLI prepares context.
LLM agents create understanding.
Kaddo turns understanding into work items.
Guard detects possible knowledge drift.
Explain summarizes project knowledge.
```

## Proposed Change

Realign Kaddo documentation and public messaging around the implemented end-to-end flow.
Update the README, docs site and landing copy to clearly explain:

- what Kaddo is
- what problem it solves
- how the CLI and LLM agents work together
- how Kaddo supports new, pre-AI and legacy projects
- how to run the full workflow
- what each command does
- what Kaddo does not do

The implemented loop to communicate:

```txt
init → scan → context → add agents → understand → create --from roadmap → owners suggest → guard → explain
```

## Why Now

Kaddo now has a complete product loop. The documentation should reflect this real capability
before broader sharing or public launch — and stop describing shipped features as upcoming.

## Scope

- Update the main README messaging.
- Update the CLI README.
- Update the docs homepage (EN/ES).
- Update quickstart / getting started (EN/ES).
- Update command overview.
- Add a Workflow page (CLI vs LLM, project states, full flow, what Kaddo does not do).
- Explain CLI vs LLM responsibilities.
- Explain the three project states: new, pre-AI, legacy.
- Clarify what is deterministic and what happens in the LLM chat.
- Keep EN/ES docs aligned.

## Out of Scope

- Implementing new CLI features or changing command behavior.
- Redesigning the visual brand or building a new website.
- Adding LLM execution.
- Adding platform/SaaS features.
- Rewriting the manifesto completely.

## Expected Value

A new user can understand Kaddo in under one minute and run the first workflow without reading
the manifesto. The docs should make Kaddo feel like a practical tool, not only a framework.

## Risks

- Documentation may become too long.
- Marketing copy may overpromise.
- The CLI vs LLM distinction may remain unclear.
- Docs may drift from implemented behavior.

## Success Criteria

A user reading the README or landing can answer: What is Kaddo? What problem does it solve?
How do I use it? What does the CLI do? What happens in the LLM chat? How does it help new,
pre-AI and legacy projects?
