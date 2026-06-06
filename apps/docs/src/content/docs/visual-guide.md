---
title: Visual Guide
description: Understand Kaddo at a glance — the knowledge loop, CLI vs LLM split, artifact flow, Guard, multirepo and governance, as Mermaid diagrams.
---

This page is the visual map of Kaddo. It shows the **implemented v2.6+ knowledge loop**:
what the deterministic CLI does, what your LLM agents do, how artifacts connect, and how
Guard, multirepo and governance fit in. Click any diagram to open it full-screen.

> These diagrams describe behavior that exists today. They do **not** imply any future
> automation — see [What the diagrams do not mean](#what-the-diagrams-do-not-mean).

## Knowledge layers (macro flow)

Kaddo frames the whole project as four macro layers under `knowledge/`. Each answers one
question and stays connected to the one above it.

```mermaid
flowchart TD
    B[Business — why it exists] --> P[Product — what we build]
    P --> T[Tech — how we build it]
    T --> D[Delivery — how we evolve it]
    B --> B1[problem · users · constraints · business-rules]
    P --> P1[product-brief · capabilities]
    T --> T1[codebase · current-state · decisions · modules]
    D --> D1[roadmap · work-items]
```

`kaddo bootstrap` seeds the minimal base (Business + Product + `tech/codebase.md`);
Delivery and decisions emerge later through agents and real work.

## Repository Exploration Tax

Without structured knowledge, agents spend part of every session rediscovering the project. With
Kaddo, they can start from a context pack built from explicit knowledge.

```mermaid
flowchart LR
    subgraph Without["Without Kaddo"]
        A[Repository] --> B[Search files]
        B --> C[Infer architecture]
        C --> D[Infer capabilities]
        D --> E[Infer roadmap]
    end

    subgraph With["With Kaddo"]
        F[Knowledge] --> G[Context Pack]
        G --> H[Agent]
    end
```

## Knowledge maturity

Kaddo recognizes knowledge by **front-matter type** (not file name) and reports a maturity
per layer. Knowledge grows from consolidated to traceable as the project earns it.

```mermaid
flowchart LR
    A[Consolidated<br/>business.md · product.md · codebase.md] --> B[Structured<br/>capabilities · current-state · ADRs]
    B --> C[Traceable<br/>roadmap · work-items · ownership]
```

## Kaddo Knowledge Loop

The full loop, from a raw repo to an explained knowledge state. CLI steps are
deterministic; the agent step happens in your own LLM chat.

```mermaid
flowchart TD
    A[Repo / Project] --> B[kaddo init]
    B --> C[kaddo scan]
    C --> D[scan.json + inventory.md]
    D --> E[kaddo context]
    E --> F[context-pack.md]
    F --> G[kaddo understand]
    G --> H[understand.md]
    H --> I[LLM Chat + Kaddo Agents]
    I --> J[capabilities.md]
    I --> K[current-state.md]
    I --> L[roadmap.md]
    L --> M[kaddo create --from roadmap]
    M --> N[work-items/draft/*.md]
    N --> O[kaddo owners suggest]
    O --> P[front matter code: globs]
    P --> Q[Code changes]
    Q --> R[kaddo guard]
    R --> S{Possible drift?}
    S -->|Yes| T[Review / update artifact]
    S -->|No| U[Continue]
    T --> V[kaddo explain]
    U --> V
    V --> W[explain.md]
```

## Agent flow & responsibility boundaries

Each agent produces knowledge and hands off to the next. Only the **implementation-agent** may
suggest a Git branch — and only by respecting the project Git strategy. The roadmap-agent and
work-item-agent never suggest branches or commits.

```mermaid
flowchart TD
    A[business-agent] --> B[product-agent]
    B --> C[codebase-agent]
    C --> D[architecture-agent]
    D --> E[roadmap-agent]
    E --> F[kaddo create --from roadmap]
    F --> G[work-item-agent]
    G --> H[implementation-agent]
    H --> I[kaddo scan]
    I --> J[kaddo owners suggest]
    J --> K[kaddo guard]
    K --> L[kaddo explain]
    H -. only this agent suggests a branch .-> H
```

## Unified knowledge discovery

Every command discovers knowledge artifacts through one shared service, so `explain`, `context`,
`understand`, `owners suggest` and `guard` always agree on what exists. Work Items are discovered
recursively across lifecycle subfolders.

```mermaid
flowchart TD
    K[knowledge/ artifacts<br/>recursive · front-matter aware] --> D[Unified discovery service]
    D --> E[explain]
    D --> C[context]
    D --> U[understand]
    D --> O[owners suggest]
    D --> G[guard]
```

## CLI vs LLM

Kaddo works in two layers. The CLI is deterministic and never calls an LLM; your LLM
chat (with Kaddo agent prompts) does the interpretation. The Knowledge Repository is the
shared ground between them.

```mermaid
flowchart LR
    subgraph CLI["Kaddo CLI · deterministic"]
        A[init]
        B[scan]
        C[context]
        D[understand]
        E[create --from roadmap]
        F[owners suggest]
        G[guard]
        H[explain]
    end
    subgraph LLM["LLM Chat + Kaddo Agents · interpretation"]
        I[capability-agent]
        J[architecture-agent]
        K[roadmap-agent]
        L[legacy-agent]
        M[adr-agent]
        N[operational agents]
    end
    subgraph Repo["Knowledge Repository"]
        O[.kaddo/]
        P[knowledge/]
        Q[work-items]
        R[ownership globs]
    end
    B --> O
    C --> O
    D --> I
    D --> J
    D --> K
    I --> P
    J --> P
    K --> P
    P --> E
    E --> Q
    Q --> F
    F --> R
    R --> G
    G --> H
```

## Human ↔ CLI ↔ LLM

The operational handoff. The human runs every command and saves every reviewed artifact —
Kaddo never calls the LLM for you.

```mermaid
sequenceDiagram
    participant H as Human
    participant CLI as Kaddo CLI
    participant Repo as Knowledge Repo
    participant LLM as LLM Chat + Agents
    H->>CLI: kaddo init
    CLI->>Repo: .kaddo/config.yml
    H->>CLI: kaddo scan
    CLI->>Repo: scan.json + inventory.md
    H->>CLI: kaddo context
    CLI->>Repo: context-pack.md
    H->>CLI: kaddo add agents
    CLI->>Repo: knowledge/agents/*.md
    H->>CLI: kaddo understand
    CLI->>Repo: understand.md
    H->>LLM: context-pack + selected agent
    LLM-->>H: proposed artifact
    H->>Repo: save reviewed artifact
    H->>CLI: kaddo create --from roadmap
    CLI->>Repo: work item
    H->>CLI: kaddo owners suggest
    CLI->>Repo: code globs in front matter
    H->>CLI: kaddo guard
    CLI-->>H: non-blocking FYI
    H->>CLI: kaddo explain
    CLI->>Repo: explain.md
```

## Artifact graph

How each artifact feeds the next, from `config.yml` to `explain.md`.

```mermaid
flowchart LR
    A[config.yml] --> B[scan.json]
    B --> C[inventory.md]
    B --> D[context-pack.md]
    D --> E[capabilities.md]
    E --> F[current-state.md]
    F --> G[roadmap.md]
    G --> H[work-items/state/*.md]
    H --> I[code: globs]
    I --> J[guard]
    J --> K[drift FYI]
    E --> L[explain.md]
    F --> L
    G --> L
    H --> L
```

## Project states

`kaddo init` records the project state. The state changes which agents you reach for
first, but the loop and artifacts are the same.

```mermaid
flowchart TD
    A[Project] --> B{State}
    B -->|new| C[Start with lightweight knowledge]
    B -->|pre-AI| D[Prepare existing repo for LLM-assisted evolution]
    B -->|legacy| E[Understand before changing]
    C --> F[roadmap-agent + architecture-agent]
    D --> G[capability-agent + architecture-agent + roadmap-agent]
    E --> H[legacy-agent + architecture-agent + capability-agent]
    F --> I[Roadmap + Work Items]
    G --> I
    H --> I
    I --> J[Ownership]
    J --> K[Guard]
    K --> L[Explain]
```

## Multirepo map

From the architecture repo you map secondary repos as modules; each gets its own
knowledge structure. Existing files are never overwritten.

```mermaid
flowchart TD
    A[Architecture Repo] --> B[.kaddo/modules.yml]
    A --> C[knowledge/tech/modules/]
    B --> D[frontend repo]
    B --> E[backend repo]
    B --> F[worker repo]
    B --> G[infra repo]
    C --> H[frontend/module-design.md]
    C --> I[backend/module-design.md]
    C --> J[worker/module-design.md]
    C --> K[infra/module-design.md]
    H --> H1["stack · security · standards · diagrams · adrs"]
    I --> I1["stack · security · standards · diagrams · adrs"]
    J --> J1["stack · security · standards · diagrams · adrs"]
    K --> K1["stack · security · standards · diagrams · adrs"]
```

## Ownership flow

Ownership is proposed from scan signals by an agent and **confirmed by a human** before it
is recorded on the artifact. `code:` accepts multiple globs.

```mermaid
flowchart LR
    A[kaddo scan] --> B[kaddo owners suggest]
    B --> C[agent interprets signals]
    C --> D[human confirms]
    D --> E[ownership recorded on artifact: code: globs]
    E --> F[kaddo guard relates code changes]
```

## Roadmap → Candidates → Materialized Work Items

A roadmap lists **candidates**, not Work Items. The roadmap-agent (in your LLM chat) writes the
roadmap in any supported format; the Kaddo CLI parses candidates deterministically; you
materialize them into real Work Items with `kaddo create --from roadmap`. `explain` and
`understand` report the gap (remaining candidates).

```mermaid
flowchart LR
    A[roadmap-agent in LLM chat] --> B[knowledge/delivery/roadmap.md<br/>table · bullet · checklist · mixed]
    B --> C[Parsed candidates<br/>WI-001, WI-002, …]
    C -->|kaddo create --from roadmap| D[Materialized Work Items<br/>knowledge/delivery/work-items/draft/]
    C -.remaining candidates.-> E[explain · understand<br/>candidates vs materialized]
    D -.-> E
```

## Work Item lifecycle workspace

Work Items are an active workspace organized by lifecycle state. Phase and initiative remain
front matter metadata; they do not create folders.

Each Work Item has a **type** — `feature`, `bugfix`, `hotfix`, `spike` or `chore` — that flows
through the same lifecycle. `chore` keeps maintenance/tooling/config/infra work from being
mislabeled as a feature.

```mermaid
flowchart TD
    T["type: feature · bugfix · hotfix · spike · chore"] --> A
    A[Roadmap Candidate] --> B[Draft]
    B --> C[Ready]
    C --> D[In Progress]
    D --> E[Completed]
    E --> F[Archived]
    D --> G[Blocked]
    G --> C
```

## Work Item delivery lifecycle

From a Work Item to a commit, with knowledge kept in sync. The Kaddo CLI never touches git:
the implementing agent (work-item-agent) creates the branch and commits only with your
confirmation.

```mermaid
flowchart TD
    A[Roadmap] --> B[Create Work Item]
    B --> C[Branch — agent, per git strategy]
    C --> D[Implementation]
    D --> E[kaddo scan]
    E --> F[kaddo owners suggest → human confirms]
    F --> G[kaddo guard before commit]
    G --> H[Update knowledge: ADR · capabilities · current-state]
    H --> I[Review human]
    I --> J[Commit e.g. feat scope: message]
```

## Guard Lite

Guard reads `git diff`, matches changed files against declared `code:` globs, and emits a
**non-blocking** FYI only when an owning artifact was not updated in the same diff. It is
silent when no artifact declares ownership.

```mermaid
flowchart TD
    A[git diff] --> B[Changed files]
    C[Artifacts with front matter] --> D[code: globs]
    B --> E[Match files vs globs]
    D --> E
    E --> F{Match?}
    F -->|No| G[No warning]
    F -->|Yes| H{Artifact also changed?}
    H -->|Yes| I[No warning]
    H -->|No| J[Possible Knowledge Drift FYI]
    J --> K[Human reviews]
    K --> L[Update artifact or confirm no impact]
```

## Governance levels

Governance scales by team size. Kaddo never enforces it — review happens by exception.

```mermaid
flowchart TD
    A[Kaddo Project] --> B{Team size}
    B -->|Indie| C[No formal owner]
    B -->|Small team| D[Review in PR]
    B -->|Medium team| E[Tech Lead by exception]
    B -->|Enterprise| F[Domain Owners]
    C --> G[Minimum sufficient knowledge]
    D --> G
    E --> G
    F --> G
    G --> H[Work Items by Knowledge Level]
    H --> I[Guard as non-blocking signal]
```

## Kaddo at a glance

A high-level map of commands, agents, artifacts, templates and principles.

```mermaid
mindmap
  root((Kaddo))
    CLI
      init
      scan
      context
      understand
      create
      owners
      guard
      explain
      modules
    Agents
      capability
      architecture
      roadmap
      legacy
      adr
      work-item
      git-strategy
      security
      standards
      stack
      module-design
    Artifacts
      .kaddo
      architecture
      work-items
      modules
    Templates
      core
      architecture
      module
      operations
      legacy
    Principles
      CLI deterministic
      No LLM calls
      Human confirms
      Guard non-blocking
      Ownership in front matter
```

## What the diagrams do not mean

To keep expectations honest, these diagrams do **not** imply that:

- Kaddo calls an LLM — you run agents in your own chat.
- Guard blocks — it is always a non-blocking FYI.
- Ownership is inferred — `code:` globs are declared and human-confirmed.
- Kaddo scans remote repos or calls Git/GitHub APIs.
- Kaddo generates these diagrams automatically — they are authored docs.

---

Next: walk the same loop with real artifacts in the [Examples](/examples/), or read the
step-by-step [Prompt Workflow](/playbook/prompt-workflow/).
