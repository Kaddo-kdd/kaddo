# Proposal: Roadmap Agent Output

## Problem

Kaddo can now prepare context packs and guide users through LLM-based understanding flows
(`init → scan → context → agents → understand`).

However, there is no standard roadmap output that connects project understanding to
execution. Without a consistent roadmap format, the output of the `roadmap-agent` may be
useful for humans but difficult for Kaddo to process later.

Kaddo needs a roadmap artifact that can bridge:

```txt
understanding → roadmap → work items
```

## Proposed Change

Define the expected output format for the `roadmap-agent` and ensure Kaddo documentation,
agent prompts and templates guide users to save the result as:

```txt
architecture/roadmap.md
```

The roadmap should be structured enough to support future CLI commands such as:

```txt
kaddo create --from roadmap
kaddo create --capability <name>
```

## Why Now

The Understand Flow can now guide users toward agents. The next natural output after
capabilities and architecture understanding is a roadmap. This roadmap becomes the first
planning artifact that connects KDD knowledge with execution.

## Scope

- Define the standard roadmap output format.
- Update `roadmap-agent.md`.
- Ensure the roadmap agent asks for structured candidate work items.
- Ensure roadmap entries reference capabilities, risks and dependencies.
- Add a suggested Knowledge Level for each candidate work item.
- Add guidance tailored to new, pre-ai and legacy projects.
- Update docs to explain how to save and use `architecture/roadmap.md`.
- Add tests validating the roadmap agent prompt content.

## Out of Scope

- Automatically generating the roadmap from the CLI.
- Calling an LLM.
- Implementing `kaddo create --from roadmap`.
- Parsing roadmap into work items.
- Creating work items automatically.
- Advanced prioritization algorithms.
- Integration with Jira, Linear or GitHub Issues.

## Expected Value

After this change, users can use Kaddo agents to produce a roadmap that is human-readable
today and machine-processable later. The roadmap becomes the bridge between understanding
and execution.

## Risks

- The roadmap format may become too complex.
- The LLM may generate inconsistent sections if the prompt is weak.
- Users may treat roadmap suggestions as final decisions.
- Candidate work items may be too broad.

## Success Criteria

The `roadmap-agent` produces a roadmap that clearly lists initiatives, related capabilities,
risks, dependencies, suggested order and candidate work items — ready to bridge toward a
future `kaddo create --from roadmap`.
