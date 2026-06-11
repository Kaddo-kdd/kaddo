---
title: Prompt Workflow
description: What input the CLI produces, what prompt or agent to use, what output to expect and where to save it — step by step.
---

This page maps every step of the Kaddo loop to its **CLI input**, the **LLM prompt/agent**
to use, the **expected output** and **where to save it**. Steps marked *none* are fully
deterministic and need no LLM.

| Step | CLI input | LLM prompt/agent | Expected output | Save as |
|---|---|---|---|---|
| Scan | `kaddo scan` | none | technical inventory | `.kaddo/scan.json`, `knowledge/inventory.md` |
| Context | `kaddo context` | none | LLM-ready pack | `.kaddo/context-pack.md` |
| Capability understanding | context pack | `capability-agent` | capabilities | `knowledge/product/capabilities.md` |
| Architecture understanding | context + capabilities | `architecture-agent` | architecture baseline | `knowledge/tech/current-state.md` |
| Roadmap | context + capabilities + architecture | `roadmap-agent` | roadmap | `knowledge/delivery/roadmap.md` |
| Backlog capture | a raw idea / notes / transcript | `backlog-agent` | Work Item draft or roadmap candidate | `knowledge/delivery/work-items/draft/*.md` or a roadmap candidate |
| Work Item | roadmap | none | work item | `knowledge/delivery/work-items/*.md` |
| Work Item refinement | context + draft Work Item | `work-item-agent` | ready Work Item (acceptance · how to test · DoD) | updated Work Item |
| Ownership proposal | context + Work Items + inventory | `ownership-agent` | precise `code:` globs (human confirms) | applied via `kaddo owners suggest` |
| Ownership | work item + scan | none | front matter ownership | updated Work Item |
| Implementation | context + ready Work Item | `implementation-agent` | code · tests · suggested branch/commit | repository + updated knowledge |
| Guard | `git diff` + ownership | none | drift warning | terminal output |
| Knowledge Capsule | `kaddo capsule export` draft | `capsule-agent` | refined capsule (no secrets/source) | `.kaddo/exports/<system>.capsule.md` |
| Explain | Kaddo artifacts | none | project summary | `.kaddo/explain.md` |
| Module design | `kaddo modules map` | `module-design-agent` | module design | `knowledge/tech/modules/<id>/module-design.md` |
| Standards / security / stack | `kaddo add <topic>` | `standards-` / `security-` / `stack-agent` | global artifact | `knowledge/tech/<topic>.md` |
| Git strategy | `kaddo add git-strategy` | `git-strategy-agent` | git strategy | `knowledge/tech/git-strategy.md` |

> Kaddo never calls an LLM for you. You run the agents in your own chat (Claude, ChatGPT,
> Cursor, Copilot, Windsurf…), then save the output to the artifact path above.

## How to run an agent step

1. Open `.kaddo/context-pack.md` and the relevant agent prompt in `knowledge/agents/`.
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
knowledge/product/capabilities.md.
```

### architecture-agent

```txt
You are the Kaddo architecture agent. Using the context pack and capabilities.md, describe
the current architecture: main modules, boundaries, data flow and notable risks. Mark
assumptions explicitly. Output Markdown for knowledge/tech/current-state.md.
```

### roadmap-agent

```txt
You are the Kaddo roadmap agent. Using the context pack, capabilities and current-state,
propose a prioritized roadmap of candidate Work Items. For each candidate: title, problem,
expected result, affected domains and a suggested knowledge level (K0–K4). Output Markdown
for knowledge/delivery/roadmap.md.
```

### backlog-agent

```txt
Using the backlog-agent, capture the following idea:

[paste free text, bullets, meeting notes or a transcript]

Decide where it should live: a Work Item draft (clear and small) or a roadmap candidate
(too large), and split it into separate items if it contains multiple ideas. Infer initiative,
domains, suggested type (feature/bugfix/hotfix/spike/chore) and knowledge level, and flag
duplicates or dependencies. Do not refine fully, do not write code, do not run other agents.
End with a human-decision handoff (refine / add candidate / split / keep draft). Output Markdown
for a draft under knowledge/delivery/work-items/draft/ (or propose a WI-CANDIDATE for the roadmap).
```

### legacy-agent

```txt
You are the Kaddo legacy agent. Using the context pack, identify high-risk areas of this
legacy system: code with no clear ownership, fragile boundaries and missing knowledge.
Recommend what to understand before changing each area. Mark uncertainty explicitly.
```

### ownership-agent

```txt
You are the Kaddo ownership agent. Using the context pack, the Work Items under
knowledge/delivery/work-items/ and the technical inventory, propose precise code: globs for each
Work Item missing ownership. Prefer narrow globs (src/payments/**) over broad ones (src/**); use
only real paths; flag unclear ownership instead of guessing. Do not modify files — I will apply
your proposal with kaddo owners suggest.
```

### implementation-agent

```txt
You are the Kaddo implementation agent. Implement Work Item WI-014 from the context pack. First
suggest a branch name per the project Git strategy (do not run git). Implement with tests, state
how to test it (exact commands/manual steps), suggest running kaddo scan / owners suggest / guard,
update affected knowledge, and end with a suggested Conventional Commit message — then wait for my
confirmation. Never commit, push or merge.
```

### capsule-agent

```txt
You are the Kaddo capsule agent. Refine the draft Knowledge Capsule in
.kaddo/exports/<system>.capsule.md using the context pack, capabilities and current-state. Sharpen
purpose, public contracts (never invent them), risks, owners and out-of-scope; mark unknowns. Never
include secrets, credentials, PII or source code. Output Markdown for the capsule file.
```

### adr-agent

```txt
You are the Kaddo ADR agent. Given a decision and its context, draft an Architecture
Decision Record: context, decision, alternatives considered, consequences and risks. Keep
it concise. Output Markdown for an ADR artifact.
```

---

See it end-to-end: each [example](/examples/) ships a `prompt-flow.md` with a Mermaid
diagram, an input/output table and copy/paste prompt handoffs for its scenario.

Next: [Work Item Traceability](/playbook/work-item-traceability/) — how the loop stays
connected.
