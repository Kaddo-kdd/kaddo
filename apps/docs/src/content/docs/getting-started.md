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

## Project knowledge language vs CLI language

`kaddo init` asks for a **project language** (`en` or `es`). This sets the language of the
**project knowledge** only — templates, agent outputs, the context pack, roadmap, Work Items,
ADRs, capabilities and current-state. It defaults to English.

The **CLI itself is always English**: commands, flags, configuration keys, interactive prompts and
messages do not change. File names also stay stable (`business.md`, `product.md`, `codebase.md`)
regardless of language.

```yaml
project:
  language: es   # knowledge is written in Spanish; the CLI stays English
```

Every agent is instructed to write generated knowledge in the configured language (and never to
translate code, file names, CLI commands or config keys). `explain`, `context` and `understand`
all report the active project language.

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

> Have a new idea outside the roadmap at any time? Capture it with the
> [`backlog-agent`](/modules/agents/) — it turns free text, bullets or notes into a Work Item
> draft or a roadmap candidate, then hands back to you to decide the next step.

Back in the CLI, turn understanding into evolving code:

```bash
kaddo create --from roadmap   # turn a roadmap candidate into a Work Item
# work-item-agent → refine it · ownership-agent → propose code: globs
kaddo owners suggest          # confirm or adjust the proposed ownership
# implementation-agent → implement
kaddo scan                    # refresh the technical inventory
kaddo guard                   # detect possible knowledge drift before committing
kaddo explain                 # summarize what Kaddo currently knows
```

After creating or refining a Work Item, use the [`ownership-agent`](/modules/agents/) to propose
precise `code:` globs. Then confirm or adjust them with `kaddo owners suggest`. This keeps
ownership human-controlled while avoiding broad guesses like `src/**`.

> **Ownership in Kaddo:** the agent proposes · the human confirms · the CLI records · Guard
> verifies.

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
