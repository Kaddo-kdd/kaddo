# Proposal: Example Prompt Flows & Visual Diagrams

## Problem

Kaddo already has example use cases for new, pre-AI, legacy and multirepo projects
(VS-019). However, the examples stop at "commands + artifacts" and still leave
operational questions open:

- What do I paste into the LLM?
- Which prompt/agent do I use, exactly?
- What output should it produce?
- How does `capability-agent` connect to `roadmap-agent`?
- Which part is the CLI and which part is the LLM?
- How does the full flow look visually?

Because Kaddo works in two layers — **deterministic CLI** + **LLM chat with agents** —
examples that don't explain that interaction can make users think the CLI does
everything, or that they must invent prompts by hand.

## Proposed Change

Complement the existing examples with prompt workflows and Mermaid diagrams. Each
example gets a `prompt-flow.md` containing:

- a visual Mermaid diagram of the workflow,
- a prompt sequence (copy/paste handoff snippets),
- an input/output table (CLI command / LLM agent / input / output / save as),
- expected artifact outputs,
- a clear CLI vs LLM responsibility split,
- an artifact chain showing how each step feeds the next.

## Why Now

The core workflow is implemented and documented. The next step is making the examples
easy to follow and demo, so users understand the LLM handoff without guessing.

## Scope

- Add `prompt-flow.md` to the four examples + a shared full-workflow flow.
- Add Mermaid diagrams per use case.
- Add prompt handoff snippets, input/output tables, artifact chains.
- Add a sample-output disclaimer.
- Update README + docs to link the enhanced examples.
- Keep examples aligned with current CLI behavior.

## Out of Scope

- New CLI commands.
- Changing agent prompts.
- Calling LLMs / generating diagrams automatically.
- A diagram renderer beyond Mermaid.
- A web demo or official LLM-provider integrations.

## Expected Value

A user can open an example and follow the complete operating workflow:

```txt
CLI command → context artifact → agent prompt → LLM output → saved artifact → next Kaddo command
```

## Risks

- Examples may become too verbose → keep flows tight, one diagram + one table each.
- Prompts may drift from installed agents → reference the installed agent files, not copies.
- Diagrams may go stale if commands change → keep them at the workflow level.
- Users may think sample LLM outputs are deterministic → explicit disclaimer.

## Success Criteria

Each main example contains enough prompt guidance and visual explanation for a user to
reproduce the workflow manually with their preferred LLM chat.
