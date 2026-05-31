# Proposal: LLM Context Pack

> Status: Ready

## Problem

Kaddo can initialize a project and generate a technical scan baseline, but there is no
standardized way to pass that context to an LLM chat. This creates a gap between the
deterministic CLI layer and the interpretation layer handled by LLM agents. Users
currently need to manually decide what files to copy, what context matters and how to
explain the project to the LLM.

## Proposed Change

Add a new command:

```bash
kaddo context
```

The command generates:

```
.kaddo/context-pack.md
.kaddo/context-pack.json
```

The context pack includes the minimum useful context for an LLM agent to understand the
project without loading the entire repository.

## Why Now

This change is required before building or using Kaddo agents such as `capability-agent`,
`architecture-agent`, `roadmap-agent`, `legacy-agent` and `adr-agent`. Those agents need a
consistent input format.

## Scope

- Read validated `.kaddo/config.yml`.
- Read `.kaddo/scan.json` if available.
- Read `architecture/inventory.md` if available.
- Read `architecture/knowledge.md` and `architecture/roadmap.md` when available.
- Read work item metadata and artifact front matter.
- Generate a compact, structured markdown context pack.
- Generate a JSON context pack.
- Avoid full repository loading.

## Out of Scope

- Calling an LLM, creating agents or running agent workflows.
- Generating capabilities, roadmap or architecture.
- Semantic code analysis / loading source code files.
- Loading all historical artifacts in full.

## Expected Value

Kaddo can prepare a clean handoff from the CLI to the user's preferred LLM, making the
"CLI prepares, LLM understands" workflow real and repeatable.

## Risks

- Context pack may become too verbose or miss important information.
- Users may assume Kaddo is already interpreting the project.
- JSON and markdown outputs may drift.

## Success Criteria

A user can run `kaddo context` and get a context pack that can be pasted into an LLM chat
together with a Kaddo agent prompt.
