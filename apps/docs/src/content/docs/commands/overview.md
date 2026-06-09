---
title: Commands overview
description: The Kaddo CLI surface.
---

These commands group into Kaddo's four [operating moments](/operating-moments/) —
**Base → Definition → Projection → Execution** — which explain *when* each one is used.

## Command responsibility matrix

Each command answers one question and has a clear next step:

| Command | Question answered | Suggested next |
|---|---|---|
| `kaddo init` | How do I start a Kaddo project? | `kaddo bootstrap` |
| `kaddo bootstrap` | What minimum knowledge should exist? | `kaddo add agents`, then `kaddo context` |
| `kaddo scan` | What technical signals exist in the repository? | `kaddo explain` or `kaddo context` |
| `kaddo context` | What should I give to an LLM? | Use the recommended agent (`kaddo understand`) |
| `kaddo understand` | What should I do now? | Execute the recommended action |
| `kaddo explain` | What does Kaddo know? | `kaddo understand` |
| `kaddo create --from roadmap` | How do roadmap candidates become Work Items? | Refine with the work-item-agent |
| `kaddo owners suggest` | Who owns this code? | `kaddo guard` |
| `kaddo guard` | Is knowledge drifting from code? | Update the affected knowledge |
| `kaddo add agents` | Which agents are available? | `kaddo understand` |

> `scan`, `context`, `explain` and `understand` also print this — a **Question answered /
> Suggested next** footer — at the end of their output, so the next step is always one glance away.

## Recommended workflows

**New project**

```text
init → bootstrap → add agents → context → business-agent → product-agent →
codebase-agent → roadmap-agent → create --from roadmap → work-item-agent →
implementation-agent
```

**Active development**

```text
implementation-agent → scan → owners suggest → guard → explain
```

**Lost / unsure** — run `kaddo understand`. It always answers *"What should I do now?"* from the
real knowledge state.

Commands in workflow order:

| Command | What it does |
|---|---|
| `kaddo init` | Initialize Kaddo in the current project |
| `kaddo bootstrap` | Build the initial knowledge base for a new project (Business → Product → Tech → Delivery) |
| `kaddo scan` | Detect project stack and suggest domains |
| `kaddo context` | Generate an LLM context pack for agent handoff |
| `kaddo add agents` | Install agent prompt packs for your LLM chat |
| `kaddo understand` | Guide the CLI → LLM handoff with a state-aware agent plan |
| `kaddo create <type>` / `--from roadmap` | Create a Work Item (feature, bugfix, hotfix, spike, chore) |
| `kaddo owners suggest` | Assistant to declare `code:` ownership on artifacts |
| `kaddo guard` | Check if modified code has related artifacts that were not updated |
| `kaddo explain` | Summarize what Kaddo currently knows about the project |

## scan · context · explain · understand

These four are easy to confuse. Each has a distinct purpose, input, output and the question it
answers:

| Command | Purpose | Input | Output | Answers |
|---|---|---|---|---|
| `scan` | Detect technical signals | the repository | `.kaddo/scan.json`, `knowledge/inventory.md` | "What is this codebase made of?" |
| `context` | Package knowledge for an LLM | knowledge + scan | `.kaddo/context-pack.md` / `.json` | "What does the agent need to know?" |
| `explain` | Summarize what Kaddo knows | knowledge | `.kaddo/explain.md` / `.json` | "What does Kaddo know?" |
| `understand` | Build the CLI → agent handoff | knowledge + scan | `.kaddo/understand.md` + recommendation | "What should I do now?" |

- **scan** detects; it never interprets architecture, builds a roadmap or calls an LLM. Run it
  after significant technical changes or after implementing a Work Item.
- **context** consolidates Business → Product → Tech → Delivery + ownership + roadmap + Work Items
  into a pack. It does not recommend or analyze. Run it before using any agent.
- **explain** reports maturity and coverage. It does not recommend agents or build LLM context.
- **understand** decides the next step from the **real** knowledge state (roadmap, Work Items,
  ownership) — not just `project.state` — and recommends the agent to run next.

**Recommended order:** `scan → context → understand` (then run the recommended agent), and
`explain` any time to inspect state.

Supporting commands:

| Command | What it does |
|---|---|
| `kaddo status` | Show the current state of the Knowledge Repository |
| `kaddo learn` | Close a Work Item and record what was learned |
| `kaddo classify` | Detect classification drift in the diff |
| `kaddo history` | List Work Items with filters |
| `kaddo owners` | List domain owners |
| `kaddo module` | Show or init the multirepo module descriptor |
| `kaddo capsule export` | Export a [Knowledge Capsule](/knowledge-capsules/) about this project |
| `kaddo capsule add <path>` | Import an external Knowledge Capsule as context |
| `kaddo add <module>` | Install an optional module |
