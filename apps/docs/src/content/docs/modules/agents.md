---
title: Agent Prompt Packs
description: Reusable LLM prompts that turn context packs into project knowledge.
---

```bash
kaddo add agents
```

Agent prompt packs are versionable Markdown prompts you use **in your preferred LLM chat**
(Claude, ChatGPT, Cursor, Copilot, Windsurf…). They turn a Kaddo context pack into
structured project knowledge.

> **Kaddo does not execute these agents.** The CLI prepares deterministic context; the LLM
> does the interpretation. No API key, no model provider, no automation.

## Installing

`kaddo add agents` creates `knowledge/agents/`:

```
knowledge/agents/
  README.md
  # Understanding agents
  capability-agent.md
  architecture-agent.md
  roadmap-agent.md
  legacy-agent.md
  adr-agent.md
  # Operational agents
  work-item-agent.md
  git-strategy-agent.md
  security-agent.md
  standards-agent.md
  stack-agent.md
  module-design-agent.md
```

Existing agent files are never overwritten silently — re-running the command only installs
missing files. `kaddo init` does **not** install agents; add them when you need them.

## Understanding agents

| Agent | Purpose | Saves to |
|---|---|---|
| `capability-agent` | Extract/propose system capabilities | `knowledge/product/capabilities.md` |
| `architecture-agent` | Reconstruct the architecture baseline | `knowledge/tech/current-state.md` |
| `roadmap-agent` | Propose roadmap candidates | `knowledge/delivery/roadmap.md` |
| `legacy-agent` | Surface risks/unknowns before changing legacy code | `knowledge/legacy/*.md` |
| `adr-agent` | Propose candidate architecture decisions | `knowledge/tech/decision-candidates.md` |

## Bootstrap agents

For new projects, these refine the knowledge base created by
[`kaddo bootstrap`](/commands/bootstrap/) across Business → Product → Tech → Delivery.

| Agent | Purpose | Saves to |
|---|---|---|
| `business-agent` | Turn an idea into a business definition | `knowledge/business/*.md` |
| `bootstrap-agent` | Go from business to capabilities, quality attributes and roadmap | `knowledge/bootstrap-summary.md`, `capabilities.md`, `roadmap.md` |
| `codebase-agent` | Propose a codebase foundation (no code) | `knowledge/tech/codebase.md` |

## Operational agents

These support day-to-day execution and the multirepo / global artifacts (VS-017).

| Agent | Purpose | Saves to |
|---|---|---|
| `work-item-agent` | Draft and refine a work item from context | active work item |
| `git-strategy-agent` | Refine the Git strategy | `knowledge/tech/git-strategy.md` |
| `security-agent` | Document security considerations (no scanning) | `knowledge/tech/security.md` |
| `standards-agent` | Define lightweight standards | `knowledge/tech/standards.md` |
| `stack-agent` | Document the stack | `knowledge/tech/stack.md` |
| `module-design-agent` | Fill in a module's design | `knowledge/tech/modules/<id>/module-design.md` |

Each prompt declares: Role · When to Use · Input Required · Expected Output · Instructions ·
Constraints · Output Format · Where to Save the Result · Quality Checklist. The primary
input is always `.kaddo/context-pack.md`.

## Writing a custom agent

An agent is a versionable Markdown prompt — not code. To add your own, drop a
`<name>-agent.md` file in `knowledge/agents/` following the canonical structure
below. These nine sections are **required** (Kaddo's own agents are validated against
them), so keep them for consistency:

```markdown
# <Name> Agent

## Role
Who the agent is and what it does. Always state: it does not write code, does not
invent business facts, infers cautiously and marks assumptions.

## When to Use
Which commands precede it (e.g. `kaddo scan` + `kaddo context`) and in which
project states (new / pre-ai / legacy).

## Input Required
Primary input: `.kaddo/context-pack.md`. Optional: README, docs, OpenAPI, notes.

## Expected Output
The artifact it produces and where it belongs.

## Instructions
Numbered steps describing what to analyze and produce.

## Constraints
What NOT to do (don't invent business context, mark assumptions, no code, etc.).

## Output Format
The exact output shape (a markdown block with the artifact's sections).

## Where to Save the Result
The destination path — it must match the `outputPath` of the related template.

## Quality Checklist
- [ ] quality criteria for the output
```

Four rules keep a custom agent aligned with Kaddo:

1. **Include all nine sections** above (title + the `##` headings).
2. **Reference `.kaddo/context-pack.md`** as the primary input — Kaddo never calls an
   LLM, so the human pastes the prompt into their own chat.
3. **Match the output path** in *Where to Save the Result* to the related template's
   `outputPath`, preserving the agent ↔ template traceability.
4. Keep it a **prompt, not code**: declarative, versionable, no execution.

## Workflow

```bash
kaddo scan          # deterministic technical signals
kaddo context       # → .kaddo/context-pack.md
kaddo add agents    # → knowledge/agents/*.md
```

Then, in your LLM chat:

1. Paste `.kaddo/context-pack.md`.
2. Paste the agent prompt for your task.
3. Save the output where the agent specifies.

## Recommended order by project state

- **new** → roadmap-agent → architecture-agent
- **pre-ai** → capability-agent → architecture-agent → roadmap-agent
- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent

## The roadmap agent output

The `roadmap-agent` is the bridge between understanding and execution. Used in your LLM
chat, it produces a **structured** `knowledge/delivery/roadmap.md` designed to be both readable
today and machine-processable later:

```txt
context pack → roadmap agent → knowledge/delivery/roadmap.md → (future) kaddo create --from roadmap
```

Each initiative (`RM-001`, `RM-002`, …) includes a goal, related capabilities, project area,
impact, risk, a **suggested Knowledge Level** (K1–K4), dependencies, why it comes now, and
**candidate work items** with type, suggested knowledge level, expected value and notes. The
roadmap also lists assumptions, a suggested execution order, a "Not Now" list, and the next
recommended work item.

> Initiatives and work items are **candidates** for human review — not final commitments.
> The roadmap is generated in your LLM chat, never by the CLI, and priorities adapt to the
> project state (new / pre-ai / legacy). A future `kaddo create --from roadmap` will be able
> to read these candidates — but it is not implemented yet.

## CLI vs LLM

- **Kaddo CLI** prepares, detects, structures and stores: `init`, `scan`, `context`,
  `add agents`, `create`, `guard`.
- **Your LLM + agents** interpret, understand and propose: capabilities, architecture,
  roadmap, risks.
