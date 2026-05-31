<p align="center">
  <img src="assets/banner.png" alt="Kaddo — Knowledge Driven Development Toolkit" width="100%" />
</p>

# Kaddo — Knowledge Driven Development

> Observable knowledge for evolving software with humans and AI.

Kaddo is an open source CLI toolkit based on **Knowledge Driven Development (KDD)**. It helps teams keep the minimum necessary context alive next to the code — without turning development into bureaucracy.

## Why Kaddo

Projects fail or degrade because knowledge is scattered across meetings, chats, tickets, emails, and outdated documents. With AI, this problem gets worse: agents build on assumptions when they lack context.

Kaddo puts knowledge first, then lets AI help you build.

**The central question:** *How does Kaddo know the right knowledge was impacted by this change?*

## What Kaddo is not

- Not a code generator
- Not an agent framework
- Not a replacement for Jira, Linear, or documentation tools
- Not a platform

Kaddo occupies a different layer:

```
Execution tools
      ↓
Agent frameworks
      ↓
Specifications
      ↓
Kaddo
      ↓
Product knowledge
```

## Install

```bash
npx kaddo init
```

Or install globally:

```bash
npm install -g kaddo
kaddo --help
```

## Commands

### `kaddo init`

Initialize Kaddo in the current project.

```bash
kaddo init
```

Creates:
```
architecture/
  knowledge.md      ← current state of the product
  roadmap.md        ← intentions and priorities
  work-items/       ← one file per work item
.kaddo/
  config.yml        ← project config
```

---

### `kaddo scan`

Detect your project stack deterministically.

```bash
kaddo scan
```

Detects language, framework, package manager, code dirs, migration dirs, contract files, and infra. Suggests domains for human confirmation — never assumes.

---

## CLI + LLM Agents

Kaddo works in two layers:

- **The CLI** handles deterministic work: initializing the knowledge repository,
  scanning the codebase, creating work items, reading git diff and detecting possible
  knowledge drift. No AI needed.
- **Your LLM** handles interpretation: using Kaddo agents to extract capabilities,
  reconstruct architecture, identify risks and propose a roadmap from the project context.

> Kaddo does not try to make the CLI "understand everything". The CLI collects and
> structures signals. The LLM agents turn those signals into product understanding.

## From scan to knowledge baseline

`kaddo scan` gives Kaddo a technical inventory. But inventory is not understanding.

Kaddo does not start by creating tasks — it starts by understanding the state of the
project. For pre-AI and legacy projects, the next step is to turn that inventory into a
knowledge baseline using Kaddo agents in your preferred LLM chat (Claude, ChatGPT,
Cursor, Copilot, Windsurf…):

- capabilities
- modules
- risks and unknowns
- ownership candidates
- architecture notes
- roadmap candidates

This agent-assisted stage is on the roadmap (`understand`, `architecture`, `roadmap`).
Once the baseline exists and artifacts declare ownership, `create` and `guard` operate
on real context instead of starting from scratch.

```bash
kaddo init                        # state: new | pre-ai | legacy, team size, structure
kaddo scan                        # deterministic technical inventory
kaddo understand                  # extract capabilities, risks, open questions  (upcoming)
kaddo architecture                # reconstruct decisions → ADR candidates       (upcoming)
kaddo roadmap                     # turn the baseline into a roadmap             (upcoming)
kaddo create feature              # work items grounded in capability + roadmap
kaddo guard                       # detect knowledge drift
```

---

### `kaddo create`

Create a Work Item with the minimum context for its Knowledge Level.

```bash
kaddo create feature   # K2: 4 questions
kaddo create bugfix    # K2: 4 questions
kaddo create hotfix    # K1: 2 questions
kaddo create spike     # K3: 4 questions
```

**Knowledge Levels:**

| Level | When | Questions |
|---|---|---|
| K0 | Trivial change | None |
| K1 | Hotfix / simple fix | Problem + expected result |
| K2 | Feature or bugfix with functional impact | + impact + acceptance criteria |
| K3 | Capability or significant change | + design |
| K4 | Architecture change or migration | + risks |

The generated file includes front matter, Definition of Done, and a Learning section.

**To activate Guard Lite**, add code globs to the `code:` field of the generated front matter:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```

---

### `kaddo guard`

Check if modified code has related artifacts that were not updated.

```bash
kaddo guard           # checks staged + unstaged files
kaddo guard --staged  # checks only staged files
```

Guard Lite reads `git diff`, finds artifacts with matching `code:` globs, and shows a **non-blocking FYI** if the artifact was not updated in the same diff.

```
Touched files:
  - src/payments/payments.service.ts

  FYI: src/payments/payments.service.ts matches WI-001
  WI-001 was not modified in this diff.
  Consider reviewing whether WI-001 still reflects the implementation.
```

Guard is **silent** when no artifacts declare ownership. No noise on day one.

---

## How ownership works

Ownership is declared in the front matter of each artifact — no central mapping file.

```yaml
---
type: feature
id: WI-001
title: "Add payment retry logic"
knowledge_level: K2
status: in-progress
code:
  - src/payments/**
  - src/shared/payment/**
summary: "Adds retry policy for failed payment attempts."
---
```

Kaddo builds a simple Knowledge Graph from these front matters at runtime:

```
artifact → code globs → git diff intersection
```

## Roadmap

Foundation commands (`init`, `scan`, `create`, `guard`) ship today. The knowledge
baseline stage (`understand`, `architecture`, `roadmap`) is the next narrative step:
Kaddo should understand a project's state before you build tasks on top of it.

| Version | What shipped |
|---|---|
| v1.0 | `init`, `scan`, `create`, `guard` (Guard Lite) |
| v1.1 | `explain`, `status`, `learn`, Evidence Score |
| v1.2 | `classify` (Classification Drift), `history` |
| v1.4 | `guard --ci` (JSON output for CI/PR) |
| v2.0 | Optional module system (`kaddo add`) |
| v2.1 | Semantic plugins: `prisma`, `openapi` |
| v2.2 | Domain Owners (`kaddo owners`) |
| v2.3 | Multirepo Module Descriptor (`kaddo module`) |
| v2.4–2.5 | Modules: `contracts`, `capabilities`, `guard-advanced`, `agents`, `skills` |

**Planned — knowledge baseline (agent-assisted):**

| Version | Planned |
|---|---|
| next | `init` asks project state (new / pre-AI / legacy), team size and structure |
| next | `understand` — extract capabilities, modules, risks and open questions |
| next | `architecture` — reconstruct existing decisions into ADR candidates |
| next | `roadmap` — turn the knowledge baseline into a prioritized roadmap |
| next | `create --from roadmap` / `create --capability <name>` |

**Optional modules (installed with `kaddo add`):**

`adr` · `rfc` · `incident` · `migration` · `legacy` · `contracts` · `capabilities` · `guard-advanced` · `agents` · `skills`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
