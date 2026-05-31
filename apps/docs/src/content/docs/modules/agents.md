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

`kaddo add agents` creates `architecture/agents/`:

```
architecture/agents/
  README.md
  capability-agent.md
  architecture-agent.md
  roadmap-agent.md
  legacy-agent.md
  adr-agent.md
```

Existing agent files are never overwritten silently — re-running the command only installs
missing files. `kaddo init` does **not** install agents; add them when you need them.

## The agents

| Agent | Purpose | Saves to |
|---|---|---|
| `capability-agent` | Extract/propose system capabilities | `architecture/capabilities.md` |
| `architecture-agent` | Reconstruct the architecture baseline | `architecture/current-state.md` |
| `roadmap-agent` | Propose roadmap candidates | `architecture/roadmap.md` |
| `legacy-agent` | Surface risks/unknowns before changing legacy code | `architecture/legacy/*.md` |
| `adr-agent` | Propose candidate architecture decisions | `architecture/decision-candidates.md` |

Each prompt declares: Role · When to Use · Input Required · Expected Output · Instructions ·
Constraints · Output Format · Where to Save the Result · Quality Checklist. The primary
input is always `.kaddo/context-pack.md`.

## Workflow

```bash
kaddo scan          # deterministic technical signals
kaddo context       # → .kaddo/context-pack.md
kaddo add agents    # → architecture/agents/*.md
```

Then, in your LLM chat:

1. Paste `.kaddo/context-pack.md`.
2. Paste the agent prompt for your task.
3. Save the output where the agent specifies.

## Recommended order by project state

- **new** → roadmap-agent → architecture-agent
- **pre-ai** → capability-agent → architecture-agent → roadmap-agent
- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent

## CLI vs LLM

- **Kaddo CLI** prepares, detects, structures and stores: `init`, `scan`, `context`,
  `add agents`, `create`, `guard`.
- **Your LLM + agents** interpret, understand and propose: capabilities, architecture,
  roadmap, risks.
