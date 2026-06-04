---
title: Full workflow
description: The complete Kaddo loop end to end, with the artifact produced at each step.
---

This is the complete Kaddo loop as one narrative. Each step shows the command, what it
contributes, and the artifact it produces.

| # | Step | Command | Produces |
|---|---|---|---|
| 1 | Initialize | `kaddo init` | `.kaddo/config.yml` |
| 2 | Scan | `kaddo scan` | `.kaddo/scan.json`, `knowledge/inventory.md` |
| 3 | Context pack | `kaddo context` | `.kaddo/context-pack.md` |
| 4 | Install agents | `kaddo add agents` | `knowledge/agents/*.md` |
| 5 | Understand | `kaddo understand` | `.kaddo/understand.md` |
| 6 | Understand in LLM | *(your chat)* | `knowledge/product/capabilities.md`, `knowledge/tech/current-state.md`, `knowledge/delivery/roadmap.md` |
| 7 | Create from roadmap | `kaddo create --from roadmap` | `knowledge/delivery/work-items/*.md` |
| 8 | Declare ownership | `kaddo owners suggest` | updated `code:` front matter |
| 9 | Guard | `kaddo guard` | drift FYI on `git diff` |
| 10 | Explain | `kaddo explain` | `.kaddo/explain.md`, `.kaddo/explain.json` |

## The loop in detail

```mermaid
flowchart TD
    A[Request / Need] --> B[Initial discovery]

    B --> B1[Stakeholders explain context]
    B --> B2[CLI surfaces existing signals]
    B2 --> B3[kaddo scan]
    B3 --> B4[Technical inventory<br/>.kaddo/scan.json<br/>knowledge/inventory.md]

    B1 --> C[Context Pack]
    B4 --> C
    C --> C1[kaddo context<br/>.kaddo/context-pack.md]

    C1 --> D[Understanding with LLM + Agents]
    D --> D1[Capability Agent]
    D --> D2[Architecture Agent]
    D --> D3[Legacy Agent if applicable]
    D --> D4[ADR Agent if applicable]

    D1 --> E1[knowledge/product/capabilities.md]
    D2 --> E2[knowledge/tech/current-state.md]
    D3 --> E3[knowledge/legacy/risks.md<br/>unknowns.md<br/>modernization-candidates.md]
    D4 --> E4[knowledge/tech/decision-candidates.md]

    E1 --> F[Prioritization]
    E2 --> F
    E3 --> F
    E4 --> F

    F --> F1[Roadmap Agent]
    F1 --> F2[knowledge/delivery/roadmap.md]
    F2 --> F3[Roadmap initiatives<br/>RM-001, RM-002...]
    F3 --> F4[Candidate Work Items<br/>WI-CANDIDATE-001...]

    F4 --> G[Classification]
    G --> G1{Change type}

    G1 -->|Feature| H1[K2]
    G1 -->|Bugfix| H2[K2]
    G1 -->|Hotfix| H3[K1]
    G1 -->|Spike| H4[K2/K3]
    G1 -->|Architecture Change| H5[K4]
    G1 -->|Migration| H6[K4]
    G1 -->|Incident follow-up| H7[K2/K3]

    H1 --> I[Create Work Item]
    H2 --> I
    H3 --> I
    H4 --> I
    H5 --> I
    H6 --> I
    H7 --> I

    I --> I1[kaddo create --from roadmap]
    I1 --> I2[knowledge/delivery/work-items/WI-*.md]

    I2 --> J[Capture minimum sufficient knowledge]
    J --> J1[Problem]
    J --> J2[Expected result]
    J --> J3[Impact]
    J --> J4[Acceptance criteria]
    J --> J5[Design / Risk if applicable]

    J --> K[Ownership]
    K --> K1[kaddo owners suggest]
    K1 --> K2[Updated front matter]
    K2 --> K3[code:<br/>- src/module/**]

    K3 --> L[Build]
    L --> L1[Implementation in code]
    L1 --> L2[Tests / Validation]
    L2 --> L3[Pull Request]

    L3 --> M[Guard Lite]
    M --> M1[kaddo guard]
    M1 --> M2{Code changed and related artifact did not?}

    M2 -->|Yes| N[Possible Knowledge Drift]
    N --> N1[Check if the artifact is still valid]
    N1 --> O[Update knowledge or justify no impact]

    M2 -->|No| P[No warning]

    O --> Q[Release / Merge]
    P --> Q

    Q --> R[Learning]
    R --> R1[Update Learning in Work Item]
    R --> R2[Update roadmap / architecture if applicable]
    R --> R3[kaddo explain]

    R3 --> S[Project explained and knowledge updated]
    S --> T[New evolution cycle]
    T --> A
```

## The commands

```bash
kaddo init
kaddo scan
kaddo context
kaddo add agents
kaddo understand
# ── use your LLM with .kaddo/context-pack.md + the recommended agents to create
#    capabilities, the architecture baseline and the roadmap ──
kaddo create --from roadmap
kaddo owners suggest
kaddo guard
kaddo explain
```

## What happens where

- **Steps 1–5 (CLI):** Kaddo prepares deterministic context — config, technical inventory,
  context pack, agent prompts and a handoff plan. No LLM, no API key.
- **Step 6 (LLM chat):** you run the Kaddo agents in your preferred LLM to turn that context
  into capabilities, architecture and a roadmap. This is where interpretation happens.
- **Steps 7–10 (CLI):** Kaddo turns the roadmap into Work Items, connects them to code via
  ownership, and closes the loop — Guard warns on drift and Explain summarizes the state.

## How the loop closes

`kaddo guard` reads `git diff`, matches changed files against each artifact's `code:` globs,
and shows a **non-blocking FYI** when related knowledge was not updated. `kaddo explain` then
reports what Kaddo knows, what is missing and what to do next — so the next iteration starts
with full context instead of guesswork.

Pick your starting point: [New project](/use-cases/new-project/),
[Pre-AI project](/use-cases/pre-ai-project/) or [Legacy project](/use-cases/legacy-project/).
