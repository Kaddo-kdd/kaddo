# Proposal: Understand Flow

> Status: Ready

## Problem

Kaddo now supports project initialization, deterministic scan, LLM context pack generation
and agent prompt packs. But users still need to manually connect those pieces to understand
a project. The current workflow is possible but not guided:

```
kaddo scan
kaddo context
kaddo add agents
manual LLM usage
manual artifact creation
```

This creates friction and makes the next step unclear, especially for pre-AI and legacy
projects.

## Proposed Change

Add a new command:

```bash
kaddo understand
```

It guides the user through the CLI → LLM handoff. It does not call an LLM. It prepares or
verifies the required inputs and provides clear instructions for running the recommended
Kaddo agents in the user's preferred LLM chat.

## Why Now

VS-004 introduced the LLM Context Pack; VS-005 introduced Agent Prompt Packs. The next step
connects them into a guided workflow, making the Kaddo narrative real: CLI prepares context,
LLM agents create understanding, Kaddo stores the resulting knowledge.

## Scope

- Create `kaddo understand`.
- Read validated `.kaddo/config.yml`.
- Check whether `.kaddo/scan.json` exists; suggest `kaddo scan` if needed.
- Generate or refresh `.kaddo/context-pack.md`.
- Check whether agents are installed; suggest `kaddo add agents` if needed.
- Recommend agents based on project state.
- Show a copy/paste-ready LLM handoff flow with expected outputs and save locations.
- Generate a reusable `.kaddo/understand.md`.

## Out of Scope

- Calling an LLM or running agents automatically.
- Generating capabilities / architecture / roadmap automatically.
- Validating semantic quality of LLM output.
- Importing agent output back into Kaddo.
- Orchestration between agents; a web UI.

## Expected Value

Users know exactly how to move from a scanned project to a first structured understanding,
reducing friction and easing adoption.

## Risks

- May feel like documentation printed in the terminal, or be too verbose.
- Users may expect full automation.
- May overlap with `kaddo context`.

## Success Criteria

`kaddo understand` makes clear which context file to use, which agent to use first, what to
paste into the LLM, what output to expect, and where to save the result.
