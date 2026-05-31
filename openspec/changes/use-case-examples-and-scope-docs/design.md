# Design: Use Case Examples & Project Scope Documentation

## Documentation Strategy

Organize docs around real user situations, not only commands. Use case pages focus on **when
and why**; command pages keep focusing on **how each command works**. This is the main
mitigation against duplication.

## Page Paths (matching the current docs structure)

English docs live at the docs root; Spanish under `es/`.

```txt
apps/docs/src/content/docs/use-cases/new-project.md
apps/docs/src/content/docs/use-cases/pre-ai-project.md
apps/docs/src/content/docs/use-cases/legacy-project.md
apps/docs/src/content/docs/use-cases/full-workflow.md
apps/docs/src/content/docs/project-scope.md

apps/docs/src/content/docs/es/use-cases/new-project.md
apps/docs/src/content/docs/es/use-cases/pre-ai-project.md
apps/docs/src/content/docs/es/use-cases/legacy-project.md
apps/docs/src/content/docs/es/use-cases/full-workflow.md
apps/docs/src/content/docs/es/project-scope.md
```

A new sidebar group **Use Cases** (Casos de uso) holds the four use case pages. **Project
Scope** (Alcance) goes under "Start here". The existing `workflow.md` reference page stays;
`use-cases/full-workflow.md` is the narrative walk-through with artifacts per step.

## Core Message

Kaddo is an open-source CLI and agent prompt toolkit for building a living knowledge layer
close to the code. It supports new projects, pre-AI projects and legacy systems through two
layers: the **CLI** (deterministic scanning, context packaging, work items, ownership, guard,
explain) and the **LLM** (capabilities, architecture, roadmap and risk understanding via Kaddo
agents).

## Use Case 1 — New Project

**Purpose:** start with a lightweight knowledge structure from day one.

```bash
kaddo init
kaddo context
kaddo add agents
kaddo understand
# use roadmap-agent and architecture-agent in your LLM
kaddo create --from roadmap
kaddo owners suggest
kaddo guard
kaddo explain
```

**Expected artifacts:** `.kaddo/config.yml`, `.kaddo/context-pack.md`, `.kaddo/understand.md`,
`architecture/roadmap.md`, `architecture/current-state.md`, `architecture/work-items/*.md`,
`.kaddo/explain.md`.

**Key message:** avoid starting with scattered decisions from day one.

## Use Case 2 — Pre-AI Project

**Purpose:** prepare an existing project not designed for AI-assisted development.

```bash
kaddo init
kaddo scan
kaddo context
kaddo add agents
kaddo understand
# use capability-agent, architecture-agent and roadmap-agent in your LLM
kaddo create --from roadmap
kaddo owners suggest
kaddo guard
kaddo explain
```

**Expected artifacts:** `.kaddo/scan.json`, `architecture/inventory.md`,
`architecture/capabilities.md`, `architecture/current-state.md`, `architecture/roadmap.md`,
`architecture/work-items/*.md`, `.kaddo/explain.md`.

**Key message:** turn an existing repo into structured context for humans and LLM agents.

## Use Case 3 — Legacy Project

**Purpose:** understand before changing.

```bash
kaddo init
kaddo scan
kaddo context
kaddo add agents
kaddo understand
# use legacy-agent first, then architecture-agent, capability-agent, roadmap-agent
kaddo create --from roadmap
kaddo owners suggest
kaddo guard
kaddo explain
```

**Expected artifacts:** `architecture/legacy/risks.md`, `architecture/legacy/unknowns.md`,
`architecture/legacy/modernization-candidates.md`, `architecture/current-state.md`,
`architecture/capabilities.md`, `architecture/roadmap.md`, `architecture/work-items/*.md`.

**Key message:** reduce risk before touching fragile systems.

## Use Case 4 — Full Workflow

A single narrative covering the complete loop with the exact commands and the artifact
produced at each step, closing with Guard and Explain.

## Project Scope Page

**What Kaddo does:** initializes knowledge structure, detects deterministic repo signals,
creates LLM context packs, installs agent prompt packs, guides LLM handoff, creates Work Items
from roadmap, helps declare ownership, detects possible knowledge drift, explains project
state.

**What Kaddo does not do:** call LLMs by default, require API keys, generate code, replace
human review, infer business truth automatically, replace Jira/Linear/GitHub Issues, or
understand legacy systems magically.

## Homepage & README

Homepage adds a "Choose your starting point" block linking to the three use cases. README adds
a "Choose your use case" section linking to docs.

## EN/ES Parity

Every new page exists in both English and Spanish with the same structure and examples.

## Alternatives Considered

- **Fold use cases into command docs** — rejected; commands answer "how", use cases answer
  "when/why".
- **One mega page** — rejected; per-state pages let users jump straight to their situation.
