---
title: Prompt Workflow
description: What input the CLI produces, what prompt or agent to use, what output to expect and where to save it — step by step.
---

This page maps every step of the Kaddo loop to its **CLI input**, the **LLM prompt/agent**
to use, the **expected output** and **where to save it**. Steps marked *none* are fully
deterministic and need no LLM.

| Step | CLI input | LLM prompt/agent | Expected output | Save as |
|---|---|---|---|---|
| Scan | `kaddo scan` | none | technical inventory | `.kaddo/scan.json`, `architecture/inventory.md` |
| Context | `kaddo context` | none | LLM-ready pack | `.kaddo/context-pack.md` |
| Capability understanding | context pack | `capability-agent` | capabilities | `architecture/capabilities.md` |
| Architecture understanding | context + capabilities | `architecture-agent` | architecture baseline | `architecture/current-state.md` |
| Roadmap | context + capabilities + architecture | `roadmap-agent` | roadmap | `architecture/roadmap.md` |
| Work Item | roadmap | none | work item | `architecture/work-items/*.md` |
| Ownership | work item + scan | none | front matter ownership | updated Work Item |
| Guard | `git diff` + ownership | none | drift warning | terminal output |
| Explain | Kaddo artifacts | none | project summary | `.kaddo/explain.md` |
| Module design | `kaddo modules map` | `module-design-agent` | module design | `architecture/modules/<id>/module-design.md` |
| Standards / security / stack | `kaddo add <topic>` | `standards-` / `security-` / `stack-agent` | global artifact | `architecture/<topic>.md` |
| Git strategy | `kaddo add git-strategy` | `git-strategy-agent` | git strategy | `architecture/git-strategy.md` |

> Kaddo never calls an LLM for you. You run the agents in your own chat (Claude, ChatGPT,
> Cursor, Copilot, Windsurf…), then save the output to the artifact path above.

## How to run an agent step

1. Open `.kaddo/context-pack.md` and the relevant agent prompt in `architecture/agents/`.
2. Paste the agent prompt into your LLM chat.
3. Attach or paste the context pack (and any prior artifact the agent depends on).
4. Review the output as a human.
5. Save it to the target artifact path.

## Prompt examples

These are starting points. The installed agent prompts (`kaddo add agents`) are the source
of truth; adapt the wording to your project.

### capability-agent

```txt
You are the Kaddo capability agent. Using the attached context pack, list the product
capabilities this codebase provides. For each capability: name, one-line purpose, the
domains it touches and the main source paths. Do not invent features. Output Markdown for
architecture/capabilities.md.
```

### architecture-agent

```txt
You are the Kaddo architecture agent. Using the context pack and capabilities.md, describe
the current architecture: main modules, boundaries, data flow and notable risks. Mark
assumptions explicitly. Output Markdown for architecture/current-state.md.
```

### roadmap-agent

```txt
You are the Kaddo roadmap agent. Using the context pack, capabilities and current-state,
propose a prioritized roadmap of candidate Work Items. For each candidate: title, problem,
expected result, affected domains and a suggested knowledge level (K0–K4). Output Markdown
for architecture/roadmap.md.
```

### legacy-agent

```txt
You are the Kaddo legacy agent. Using the context pack, identify high-risk areas of this
legacy system: code with no clear ownership, fragile boundaries and missing knowledge.
Recommend what to understand before changing each area. Mark uncertainty explicitly.
```

### adr-agent

```txt
You are the Kaddo ADR agent. Given a decision and its context, draft an Architecture
Decision Record: context, decision, alternatives considered, consequences and risks. Keep
it concise. Output Markdown for an ADR artifact.
```

---

Next: [Work Item Traceability](/playbook/work-item-traceability/) — how the loop stays
connected.
