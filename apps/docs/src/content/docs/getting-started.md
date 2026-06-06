---
title: Getting started
description: Install Kaddo and initialize it in your project.
---

## Install

```bash
npx @kaddo/cli init
```

Or install globally:

```bash
npm install -g @kaddo/cli
kaddo --help
```

## Initialize

```bash
kaddo init
```

Creates:

```
knowledge/
  knowledge.md      ← current state of the product
  roadmap.md        ← intentions and priorities
  work-items/       ← one file per work item
.kaddo/
  config.yml        ← project config
```

## The full workflow

```bash
kaddo init          # state: new | pre-ai | legacy, team size, structure
kaddo bootstrap     # new projects: initial knowledge base (Business → Product → Tech → Delivery)
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

## Which command, when?

Each command answers one question. If you are ever unsure what to do next, run
**`kaddo understand`** — it answers *"What should I do now?"* from the real state of your project.

| You want to… | Run | You get |
|---|---|---|
| Start a project | `kaddo init` | `.kaddo/config.yml` |
| Create the knowledge baseline | `kaddo bootstrap` | `knowledge/**` |
| See the tech reality | `kaddo scan` | `scan.json` · inventory |
| Package context for an LLM | `kaddo context` | `context-pack.md` |
| Know what to do next | `kaddo understand` | phase + recommendation |
| See what Kaddo knows | `kaddo explain` | project summary |
| Materialize a roadmap item | `kaddo create --from roadmap` | a Work Item |
| Connect knowledge to code | `kaddo owners suggest` | `code:` globs |
| Check for drift | `kaddo guard` | drift warnings |

`scan`, `context`, `explain` and `understand` end with a **Question answered / Suggested next**
footer, so the next step is always one glance away. The full table lives in the
[Commands overview](/commands/overview/).

See the [Workflow](/workflow/) page for the CLI vs LLM split and how Kaddo supports new,
pre-AI and legacy projects.
