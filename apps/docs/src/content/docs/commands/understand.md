---
title: kaddo understand
description: Guide the CLI → LLM handoff with a state-aware agent plan.
---

```bash
kaddo understand
```

Guides the handoff from the CLI (deterministic context) to your LLM (interpretation). It
refreshes the context pack, recommends which agents to use — in what order — based on your
project state, and writes a reusable guide you can re-open any time.

It writes / refreshes:

- **`.kaddo/context-pack.md`** and **`.kaddo/context-pack.json`** — the input for agents.
- **`.kaddo/understand.md`** — the step-by-step handoff guide with the recommended flow,
  expected outputs and copy/paste instructions.

## What it does

1. Requires an initialized project (`kaddo init`).
2. Checks for a scan baseline (`.kaddo/scan.json`) — warns but continues if missing.
3. Generates / refreshes the context pack (reuses `kaddo context`).
4. Builds a state-aware agent plan and flags any agents not yet installed
   (`kaddo add agents`).
5. Prints a concise terminal summary and writes `.kaddo/understand.md`.

## Deterministic, no LLM

`kaddo understand` does **not** call an LLM, execute agents, or auto-generate architecture
artifacts. It prepares context and tells you exactly which agent to run next. You stay in
control of the interpretation.

## State-aware agent flow

The recommended flow adapts to the project state recorded by `kaddo init`:

| State | Recommended flow |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

Each step maps to an expected output, for example:

- `capability-agent` → `knowledge/product/capabilities.md`
- `architecture-agent` → `knowledge/tech/current-state.md`
- `roadmap-agent` → `knowledge/delivery/roadmap.md`
- `legacy-agent` → `knowledge/legacy/risks.md`

## Works even when context is incomplete

If the scan baseline or some agents are missing, the command still produces a plan and
tells you the next concrete step (run `kaddo scan` or `kaddo add agents`).

## scan vs context vs understand

- **`scan`** collects deterministic technical signals.
- **`context`** packages those signals (plus knowledge and work items) into an LLM-ready pack.
- **`understand`** ties it together: refreshes the pack and tells you which agent to run
  next, in what order, for your project state.

## Example

```text
Kaddo Understand

Project: demo
State: pre-ai
Team: indie
Structure: monorepo

Recommended flow:
  1. capability-agent → knowledge/product/capabilities.md
  2. architecture-agent → knowledge/tech/current-state.md
  3. roadmap-agent → knowledge/delivery/roadmap.md

First step: use capability-agent.

  Context:         .kaddo/context-pack.md
  Agent prompt:    knowledge/agents/capability-agent.md
  Expected output: knowledge/product/capabilities.md

Kaddo does not call an LLM. You stay in control of the interpretation.
```
