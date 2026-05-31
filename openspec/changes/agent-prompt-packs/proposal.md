# Proposal: Agent Prompt Packs

> Status: Ready

## Problem

Kaddo can now generate a context pack for LLM usage, but it does not provide concrete agent
prompts that guide users on how to transform that context into product understanding.
Without standardized agents, users write ad-hoc prompts, creating inconsistent outputs and
weakening the KDD workflow. The missing bridge is:

```
context-pack → agent prompt → structured artifact
```

## Proposed Change

Add Kaddo agent prompt packs as versionable Markdown files, installed via:

```bash
kaddo add agents
```

First agents: `capability-agent`, `architecture-agent`, `roadmap-agent`, `legacy-agent`,
`adr-agent`. The CLI does not execute them — they are prompts for the user's preferred LLM
chat.

## Why Now

VS-004 introduced the LLM Context Pack. The next logical step is the instructions that make
the pack useful: CLI prepares context, LLM agents create understanding, Kaddo stores the
resulting knowledge.

## Scope

- Source prompt files for the base agents.
- Update the agents module to install those prompt files into `architecture/agents/`.
- Clear input/output contracts inside each agent.
- Docs on using the agents with `.kaddo/context-pack.md`.
- Tests that agents install correctly and are protected from silent overwrite.
- Agents remain optional, not installed by `kaddo init`.

## Out of Scope

- Calling an LLM, executing or orchestrating agents.
- Automatically generating capabilities, roadmap or architecture.
- Validating semantic quality of LLM outputs.
- A web UI; installing agents by default during `kaddo init`.

## Expected Value

A repeatable way to convert context packs into structured project knowledge. Agent outputs
become input for later flows: capability baseline, architecture baseline, roadmap
generation, create-from-roadmap, guard ownership.

## Risks

- Agents too generic or inconsistent across LLMs.
- Users may think Kaddo runs the agents automatically.
- Prompts may become too long or rigid.

## Success Criteria

`kaddo add agents` produces usable Markdown agents that clearly explain their role,
expected input, expected output, constraints, and where to save the result.
