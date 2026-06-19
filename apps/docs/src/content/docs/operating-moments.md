---
title: Operating Moments
description: "How Kaddo operates through a project — knowledge maturing in four moments: Base, Definition, Projection, Execution."
---

Kaddo is not a long list of commands. It is a **progressive flow of knowledge maturation**. Across
a project's life it moves through four moments:

```text
Base → Definition → Projection → Execution
```

| Moment | Question | You go from… to… |
|---|---|---|
| **Base** | How do I set up the workspace? | nothing → a place for knowledge + context |
| **Definition** | What is this product? | an idea → clear business / product / tech knowledge |
| **Projection** | What do we build first? | knowledge → a delivery plan (roadmap + Work Items) |
| **Execution** | Build, verify, keep knowledge in sync | Work Items → code + updated knowledge |

In every moment: the **CLI** prepares deterministic context, the **LLM agents** interpret, and the
**human** confirms. Kaddo never calls an LLM and never runs Git.

## Moment 1 — Base

**Purpose:** prepare the project to operate with Kaddo — create the space where knowledge lives and
configure the project.

**Commands**

```bash
kaddo init          # .kaddo/config.yml (state · structure · team · language)
kaddo bootstrap     # knowledge/business|product|tech base files (new projects)
kaddo scan          # .kaddo/scan.json + knowledge/inventory.md
kaddo add agents    # knowledge/agents/
kaddo context       # .kaddo/context-pack.md / .json
kaddo understand    # .kaddo/understand.md — current phase + next step
kaddo explain       # .kaddo/explain.md / .json — what Kaddo knows
```

**Agents that may help:** `bootstrap-agent` · `business-agent` · `codebase-agent`.

**Result:** initial configuration, a knowledge structure, installed agents, and context ready for
an LLM.

## Moment 2 — Definition

**Purpose:** turn the initial idea into clear Business, Product and Tech knowledge. The human feeds
Kaddo real project information.

**Commands:** `kaddo context` · `kaddo understand` · `kaddo explain` · `kaddo scan`.

**Agents**

| Agent | Refines / produces |
|---|---|
| `business-agent` | problem · users · rules · constraints → `knowledge/business/business.md` |
| `product-agent` | product · scope · out of scope · value · success criteria → `knowledge/product/product.md` |
| `capability-agent` | system capabilities → `knowledge/product/capabilities.md` |
| `codebase-agent` | technical intent → `knowledge/tech/codebase.md` |
| `architecture-agent` | technical reality / baseline → `knowledge/tech/current-state.md` |
| `adr-agent` / `decision-agent` | decisions → `knowledge/tech/decisions/` |

**Result:** clarity on why the product exists, what it will build, how it is intended to be built,
which decisions are already made, and which capabilities matter.

## Moment 3 — Projection

**Purpose:** turn defined knowledge into a delivery plan — from *"we know what we want"* to *"we
know what to build first"*.

**Commands:** `kaddo context` · `kaddo understand` · `kaddo create --from roadmap` · `kaddo explain`.

**Agents**

| Agent | Role |
|---|---|
| `roadmap-agent` | knowledge → initiatives, dependencies, Work Item candidates, suggested order → `knowledge/delivery/roadmap.md` |
| `backlog-agent` | informal ideas → a Work Item draft or a roadmap candidate (never implements/refines) |
| `work-item-agent` | refine a draft into a ready Work Item (problem · acceptance · validation · DoD · ownership) → `knowledge/delivery/work-items/` |
| `ownership-agent` | propose precise `code:` globs; the human confirms with `kaddo owners suggest` |

`kaddo create --from roadmap` materializes roadmap candidates into real Work Items under
`knowledge/delivery/work-items/`.

**Result:** a roadmap, candidates, draft/ready Work Items, and proposed or declared ownership.

## Moment 4 — Execution

**Purpose:** implement Work Items, verify changes and keep knowledge in sync with code. This is
Kaddo's core loop:

```text
Work Item → Code → kaddo scan → kaddo guard → knowledge update
```

**Commands:** `kaddo context` · `kaddo understand` · `kaddo scan` · `kaddo owners suggest` ·
`kaddo guard` · `kaddo explain`.

**Agents**

| Agent | Role in execution |
|---|---|
| `implementation-agent` | implement a Work Item; suggest branch name / validation commands (never runs git) |
| `ownership-agent` | adjust ownership when touched code changes or new paths appear |
| `architecture-agent` | update `current-state.md` when technical reality changes |
| `capability-agent` | update capabilities when product behavior changes |
| `adr-agent` / `decision-agent` | record an ADR when a relevant decision appears |
| `guard-agent` | interpret `kaddo guard` findings and propose what knowledge to review (never auto-edits) |

**Recommended loop**

```text
work-item-agent → implementation-agent → kaddo scan → kaddo owners suggest → kaddo guard →
the right agent updates knowledge → kaddo explain
```

**Result:** code, verified changes, and knowledge that still reflects reality.

## Cyclic commands

Some commands recur across moments — run them whenever the question applies:

| Command | When | Question it answers |
|---|---|---|
| `kaddo context` | before using agents | What should I give the LLM? |
| `kaddo understand` | when unsure what's next | What should I do now? |
| `kaddo explain` | to inspect state | What does Kaddo know? |
| `kaddo scan` | after technical changes | What technical signals exist? |
| `kaddo owners suggest` | to record/fix ownership | Which artifact owns which code? |
| `kaddo guard` | before closing a change | What knowledge might be outdated? |
| `kaddo graph export` | onboarding, impact analysis, review | How is the knowledge connected? |

## Cyclic agents

| Agent | Appears whenever… |
|---|---|
| `ownership-agent` | a Work Item is created or changed |
| `architecture-agent` | technical reality changes |
| `capability-agent` | a capability changes |
| `adr-agent` | a relevant decision appears |
| `work-item-agent` | a Work Item moves from draft to ready |
| `implementation-agent` | a Work Item is executed |
| `backlog-agent` | an idea appears outside the roadmap |
| `capsule-agent` | this project's knowledge must be shared with another project ([Knowledge Capsules](/knowledge-capsules/)) |

---

Lost at any point? Run **`kaddo understand`** — it tells you the current moment/phase and the next
step from the real state of your project.
