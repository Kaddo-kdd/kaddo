# Proposal: Prompt Playbook & Work Item Traceability Guide

## Problem

Kaddo now supports a complete knowledge loop, but users still need a practical guide
explaining how to use prompts, agents and artifacts across the workflow.

The CLI can generate context, install agents and guide the handoff, but users need to
understand:

- what each Kaddo concept means,
- what input to give the LLM,
- what prompt or agent to use,
- what output to expect,
- where to save that output,
- how the output connects to the next Kaddo command,
- how to collaborate without turning the process into bureaucracy.

Without a playbook, the workflow may still feel abstract.

## Proposed Change

Add a Prompt Playbook and Work Item Traceability Guide to the documentation.

The guide defines Kaddo's core concepts, explains the full workflow from CLI input to LLM
output, documents prompt usage, shows examples with other tools, and includes a
collaboration guide.

## Why Now

Kaddo already has the core loop:

```txt
init → scan → context → add agents → understand → roadmap → create from roadmap → owners suggest → guard → explain
```

The next step is to document how users should actually operate this loop with prompts and
collaboration practices.

## Scope

This change includes:

- Defining Kaddo concepts such as Work Item, Knowledge Level, Context Pack, Agent Prompt
  Pack, Ownership, Knowledge Drift, Guard Lite and Explain.
- Creating a prompt workflow guide.
- Mapping each workflow step to CLI input, LLM prompt, expected output and target artifact.
- Explaining Work Item traceability.
- Adding examples of how Kaddo can be used alongside other tools.
- Adding a collaboration guide.
- Updating README/docs navigation to link the playbook.
- Maintaining EN/ES parity.

## Out of Scope

This change does not include:

- Implementing new CLI commands.
- Calling LLMs.
- Adding provider-specific integrations.
- Creating a SaaS/platform.
- Replacing Jira, Linear, GitHub Issues, BMAD, OpenSpec, Spec-Kit or other tools.
- Changing Kaddo's core workflow.

## Expected Value

Users can follow a practical operating guide instead of guessing how to combine CLI
commands, LLM chats and artifacts. The playbook makes Kaddo easier to adopt in real teams.

## Risks

- The guide may become too long.
- The prompts may feel too rigid.
- Examples with other tools may sound like formal integrations.
- Collaboration guidance may become bureaucratic.

## Success Criteria

A user can read the playbook and understand:

- what a Work Item is,
- what each prompt is for,
- what input/output each step expects,
- how traceability works,
- how to collaborate using Kaddo,
- how Kaddo fits with other tools.
