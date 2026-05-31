---
title: Getting started
description: Install Kaddo and initialize it in your project.
---

## Install

```bash
npx kaddo init
```

Or install globally:

```bash
npm install -g kaddo
kaddo --help
```

## Initialize

```bash
kaddo init
```

Creates:

```
architecture/
  knowledge.md      ← current state of the product
  roadmap.md        ← intentions and priorities
  work-items/       ← one file per work item
.kaddo/
  config.yml        ← project config
```

## The full workflow

```bash
kaddo init          # state: new | pre-ai | legacy, team size, structure
kaddo scan          # deterministic technical inventory → .kaddo/scan.json
kaddo context       # LLM context pack → .kaddo/context-pack.md
kaddo add agents    # install agent prompt packs
kaddo understand    # guided CLI → LLM handoff plan
```

Then use your LLM (Claude, ChatGPT, Cursor, Copilot, Windsurf…) with the generated
context pack and Kaddo agents to create capabilities, architecture and a roadmap. The CLI
never calls an LLM — it prepares the context; your LLM does the interpretation.

Back in the CLI, turn understanding into evolving code:

```bash
kaddo create --from roadmap   # turn a roadmap candidate into a Work Item
kaddo owners suggest          # declare code: ownership on the Work Item
kaddo guard                   # detect possible knowledge drift before committing
kaddo explain                 # summarize what Kaddo currently knows
```

See the [Workflow](/workflow/) page for the CLI vs LLM split and how Kaddo supports new,
pre-AI and legacy projects.
