---
title: Workflow
description: The full Kaddo loop, the CLI vs LLM split, and how it supports new, pre-AI and legacy projects.
---

Kaddo has one practical loop:

```bash
kaddo init          # state: new | pre-ai | legacy, team size, structure
kaddo scan          # deterministic technical inventory → .kaddo/scan.json
kaddo context       # LLM context pack → .kaddo/context-pack.md
kaddo add agents    # install agent prompt packs
kaddo understand    # guided CLI → LLM handoff plan
# ── use your LLM with the context pack + agents to create
#    capabilities, architecture and a roadmap ──
kaddo create --from roadmap   # turn a roadmap candidate into a Work Item
kaddo owners suggest          # declare code: ownership on the Work Item
kaddo guard                   # detect possible knowledge drift
kaddo explain                 # summarize what Kaddo currently knows
```

In one sentence: **scan the repo → prepare context → use agents in your LLM → create
roadmap-driven work items → connect knowledge to code → guard against drift → explain the
state.**

## CLI vs LLM agents

Kaddo works in two layers, and the split is deliberate.

| Layer | Responsibility |
|---|---|
| **Kaddo CLI (deterministic)** | initialize knowledge structure, scan signals, generate context packs, install agent prompts, guide handoff, create work items, declare ownership, detect drift, explain project state |
| **LLM chat (interpretation)** | extract capabilities, reconstruct architecture, propose a roadmap, identify risks, draft structured artifacts |

> The CLI prepares and stores context. Your LLM interprets it using Kaddo agents. **Kaddo
> does not call an LLM by default** and never requires an API key.

## New, pre-AI and legacy projects

Kaddo adapts to where your project is.

| Project state | What Kaddo does |
|---|---|
| **new** | Start with a minimal knowledge structure (roadmap, work items, minimum context) without process overhead. |
| **pre-AI** | Scan the repo, prepare a context pack and understand it with agents before evolving. |
| **legacy** | Map ownership gradually and identify risky areas before changing code. |

`kaddo init` asks for the project state, team size and repository structure, and the rest
of the commands adapt their guidance accordingly.

## What Kaddo does not do

- It is **not** a code generator.
- It is **not** an agent execution framework — it ships agent *prompts*, it does not run them.
- It does **not** replace Jira, Linear or documentation tools.
- It is **not** a platform.
- It does **not** call an LLM, require an API key, or infer business truth.
- It does **not** replace human review.
