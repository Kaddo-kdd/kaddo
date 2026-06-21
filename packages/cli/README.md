<p align="center">
  <img src="https://raw.githubusercontent.com/Kaddo-kdd/kaddo/main/assets/banner.png" alt="Kaddo — Knowledge Driven Development Toolkit" width="100%" />
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
npx @kaddo/cli init
```

Or install globally:

```bash
npm install -g @kaddo/cli
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
knowledge/
  knowledge.md             ← current state of the product
  delivery/
    roadmap.md             ← intentions and priorities
    work-items/            ← one file per work item
.kaddo/
  config.yml               ← project config
```

Asks for the project state (`new | pre-ai | legacy`), team size, repo structure and the
**project knowledge language** (`en | es`) — the language your knowledge artifacts are
written in; the CLI itself stays English.

---

### `kaddo scan`

Detect your project stack deterministically.

```bash
kaddo scan
```

Detects language, framework, package manager, code dirs, migration dirs, contract files, infra and test dirs. Suggests domains for human confirmation — never assumes.

It also persists a reusable baseline of the project:

- **`.kaddo/scan.json`** — structured, machine-readable (for the CLI and future context-pack commands).
- **`knowledge/inventory.md`** — human-readable inventory you can paste into an LLM chat.

Scan detects signals and asks confirmation questions — it never claims to understand your business capabilities or architecture.

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

Once the baseline exists and artifacts declare ownership, `create` and `guard` operate
on real context instead of starting from scratch.

```bash
kaddo init                        # state: new | pre-ai | legacy, team size, structure
kaddo scan                        # deterministic technical inventory
kaddo context                     # assemble an LLM context pack for agent handoff
kaddo add agents                  # install agent prompt packs for your LLM chat
kaddo understand                  # guide the CLI → LLM handoff with a state-aware plan
# ── use your LLM with the context pack + agents to create the baseline + roadmap ──
kaddo create --from roadmap       # turn a roadmap candidate into a real work item
kaddo owners suggest              # declare code: ownership on the work item
kaddo guard                       # detect possible knowledge drift
kaddo explain                     # summarize what Kaddo currently knows
```

The CLI prepares context; your LLM interprets it; Kaddo turns understanding into Work
Items; Guard warns on drift; Explain summarizes the state. Kaddo does not call an LLM.

---

### `kaddo context`

Assemble an LLM context pack for handoff to a chat agent (Claude, ChatGPT, Cursor, Copilot, Windsurf…).

```bash
kaddo context
```

Reads existing Kaddo artifacts — `.kaddo/config.yml`, `.kaddo/scan.json`,
`knowledge/inventory.md`, `knowledge/knowledge.md`, `knowledge/delivery/roadmap.md` and
work-item front matter — and writes two files:

- **`.kaddo/context-pack.md`** — compact, LLM-friendly markdown to paste into a chat.
- **`.kaddo/context-pack.json`** — structured data for future tooling and automations.

The pack is **deterministic**. Kaddo does not call an LLM, require an API key, or
interpret your system — it assembles metadata and summaries, marks any missing context
explicitly, and recommends which agents to use based on your project state:

| State | Recommended handoff |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent |

> `scan` collects technical signals. `context` packages those signals (plus knowledge and
> work items) for an LLM. `understand` ties it together — it refreshes the pack and tells
> you which agent to run next, in what order, for your project state.

---

### `kaddo add agents`

Install Kaddo agent prompt packs — versionable Markdown prompts you use **in your LLM
chat** (Claude, ChatGPT, Cursor, Copilot, Windsurf…). Kaddo does not execute them.

```bash
kaddo add agents
```

Creates `knowledge/agents/` with:

- `capability-agent.md` — extract/propose system capabilities → `knowledge/product/capabilities.md`
- `architecture-agent.md` — reconstruct the architecture baseline → `knowledge/tech/current-state.md`
- `roadmap-agent.md` — propose roadmap candidates → `knowledge/delivery/roadmap.md`
- `legacy-agent.md` — surface risks/unknowns before changing legacy code
- `adr-agent.md` — propose candidate architecture decisions

Each prompt declares its role, required input, expected output, constraints, output format,
where to save the result, and a quality checklist. The primary input is always
`.kaddo/context-pack.md`.

**Workflow:**

```bash
kaddo scan          # technical signals
kaddo context       # → .kaddo/context-pack.md
kaddo add agents    # → knowledge/agents/*.md
# then: paste context-pack.md + an agent prompt into your LLM chat
```

Recommended agent order by project state:

| State | Order |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

Existing agent files are never overwritten silently. `kaddo init` does not install agents —
add them only when you need them.

#### Roadmap agent output

The `roadmap-agent` is the bridge between understanding and execution. In your LLM chat it
produces a **structured** `knowledge/delivery/roadmap.md`:

```txt
context pack → roadmap agent → knowledge/delivery/roadmap.md → kaddo create --from roadmap
```

Each initiative (`RM-001`, …) includes a goal, related capabilities, impact, risk, a
suggested Knowledge Level (K1–K4), dependencies, and **candidate work items** (with type,
suggested knowledge level, expected value and notes), plus assumptions, suggested execution
order and the next recommended work item. Initiatives and work items are **candidates** for
human review — not final commitments — and priorities adapt to the project state. Turn a
candidate into a real Work Item with [`kaddo create --from roadmap`](#kaddo-create).

---

### `kaddo understand`

Guide the handoff from the CLI (deterministic context) to your LLM (interpretation).

```bash
kaddo understand
```

It refreshes the context pack, recommends which agents to use — in what order — based on
your project state, flags any agents not yet installed, and writes a reusable guide:

- **`.kaddo/context-pack.md`** / **`.kaddo/context-pack.json`** — the input for agents.
- **`.kaddo/understand.md`** — the step-by-step handoff guide (recommended flow, expected
  outputs, copy/paste instructions).

`kaddo understand` is **deterministic** — it does not call an LLM, execute agents, or
auto-generate architecture artifacts. It works even when context is incomplete: if the scan
baseline or some agents are missing, it still produces a plan and tells you the next
concrete step (`kaddo scan` or `kaddo add agents`).

| State | Recommended flow |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

---

### `kaddo create`

Create a Work Item with the minimum context for its Knowledge Level.

```bash
kaddo create feature   # K2: delivers a user-facing capability
kaddo create bugfix    # K2: fixes a known defect
kaddo create hotfix    # K1: urgent fix on a released version
kaddo create spike     # K3: exploratory / reduce uncertainty
kaddo create chore     # K1: maintenance, tooling, config, infra
```

New Work Items land in `knowledge/delivery/work-items/draft/` with `status: draft`
(lifecycle: `draft → ready → in-progress → blocked → completed → archived`). Aliases like
`setup`, `tooling`, `maintenance`, `infrastructure` or `refactor` resolve to `chore`.

**From a roadmap candidate:**

```bash
kaddo create --from roadmap          # pick a candidate from knowledge/delivery/roadmap.md
kaddo create feature --from roadmap  # same, with a default type
```

Reads `knowledge/delivery/roadmap.md`, lets you select a candidate work item (`WI-CANDIDATE-001`,
…), and prefills the Work Item from the roadmap (title, type, suggested Knowledge Level,
expected value, notes, related capabilities/impact/risk/dependencies and the parent
initiative). It asks only for the required fields the candidate does not provide and keeps
source traceability in the front matter (`source: roadmap`, `source_id`, `source_initiative`).
This closes the loop `scan → context → agents → roadmap → work item`. If the roadmap is
missing or has no candidates, Kaddo shows a helpful message. No LLM is called.

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

  ⚠ Possible knowledge drift: WI-001 (feature, K2)
    Changed code matching this artifact:
      - src/payments/payments.service.ts
    Declared ownership:
      - src/payments/**
    WI-001 was not updated in this diff.
    Evidence: 1/1 globs matched · artifact K2 · domain: payments
    Suggested action: review WI-001 and update it if the behavior changed,
    or ignore this artifact below if the change does not affect the knowledge.
```

Guard acts only on **declared ownership** (the `code:` globs) — it performs **no inference**
and is **advisory/non-blocking** (it never fails your command or CI). If the artifact was
also changed in the same diff, no FYI is shown. Guard is **silent** when no artifacts declare
ownership. No noise on day one.

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

### Declaring ownership with the assistant

You don't have to edit YAML by hand. The ownership assistant proposes `code:` globs and
updates the front matter for you:

```bash
kaddo owners suggest
```

It lists Work Items missing ownership, suggests candidate globs from `.kaddo/scan.json` and
the artifact's `domains`/`capabilities`, and lets you pick or type globs. It updates **only**
the front matter (the body is preserved), is fully **deterministic** (no LLM, no source
changes), and works with manual entry when no scan baseline exists.

```
create work item → kaddo owners suggest → kaddo guard
```

---

### `kaddo explain`

Summarize what Kaddo currently knows about the project — useful for onboarding,
handoff, project review or preparing an agent.

```bash
kaddo explain               # project explanation (human-readable)
kaddo explain --for agent   # compact structured JSON
```

Run without filters, it reports project metadata, detected stack (from
`.kaddo/scan.json`), knowledge status (inventory, context pack, capabilities,
architecture baseline, roadmap, agents), work items, **ownership coverage**, the
**missing knowledge** and **suggested next steps**. It also writes
`.kaddo/explain.md` and `.kaddo/explain.json`. No LLM is called.

`context` vs `explain`: `kaddo context` prepares input for an LLM agent;
`kaddo explain` summarizes what Kaddo already knows. The focused flags
(`--scope`, `--type`, `--since`) still explain a subset of artifacts.

---

### `kaddo capsule`

Share or consume minimal, portable knowledge about a system — a **Knowledge Capsule** —
without mapping it as multirepo or reading its source.

```bash
kaddo capsule export        # → .kaddo/exports/<project>.capsule.md / .json
kaddo capsule add <path>    # import an external capsule → external/<id>.capsule.md
```

`export` builds a deterministic draft from `knowledge/` (purpose, capabilities, public
contracts, risks, ADRs, owners — never source code or secrets); refine it with the
`capsule-agent` before sharing. `add` registers the capsule in `.kaddo/external.yml`;
`kaddo context` then includes an **External Knowledge** section and `kaddo explain` lists
the capsules (warning when one looks stale). See the
[Knowledge Capsules guide](https://kaddo.trycatch.tv/knowledge-capsules/).

---

### `kaddo graph export`

Export the connections that already exist between your knowledge artifacts as a **lightweight,
file-based knowledge graph** — for onboarding, impact analysis and context selection.

```bash
kaddo graph export                  # → .kaddo/graph.json + .kaddo/graph.mmd
kaddo graph export --scope all      # include every artifact (default: active)
kaddo graph export --format mermaid # mermaid only (or --format json)
```

Nodes come from knowledge layers, Work Items, code globs, capabilities, ADRs and Knowledge
Capsules; edges come from front matter (`code`, `capabilities`, `decisions`, `source_id`,
`source_initiative`) and the external registry. It never reads `src/`, never reads source code
and never calls an LLM. `kaddo explain` and `kaddo context` show a graph **summary** once it has
been exported (they never generate it).

Every export also rates **relationship quality** and writes non-blocking metadata hints
(`.kaddo/graph-hints.md` + `.json`) — detecting active Work Items without `code`/`capabilities`,
ADRs without governed `code`, capabilities/capsules with no Work Item link, and more. The
`graph-agent` turns those hints into precise front matter you confirm and apply. See the
[Knowledge Graph Export guide](https://kaddo.trycatch.tv/knowledge-graph-export/).

## Roadmap

The full knowledge loop ships today: `scan → context → agents → understand → roadmap →
create --from roadmap → owners → guard → explain`.

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
| v2.6 | Knowledge loop: `context`, `understand`, `add agents`, roadmap output, `create --from roadmap`, Guard Lite end-to-end, `owners suggest`, project `explain` |
| v2.6 | Multirepo modules (`modules map/list`), global `standards`/`security`/`stack`/`git-strategy` artifacts, six operational agents |
| v2.6 | Central template registry (23 templates, layer categories (business/product/tech/delivery)) |
| v2.6 | Demo example repositories, prompt flows and a diagram-first Visual Guide (docs) |
| v2.7 | Multirepo hardening: module artifacts from the template registry, module-aware `context`/`explain`, opt-in `guard --workspace` |
| v2.8 | `kaddo bootstrap` for new projects (Business → Product → Tech → Delivery); business templates + bootstrap agents |
| v3.0 | Knowledge-centric realignment: `architecture/` → `knowledge/` with layers Business → Product → Tech → Delivery; context/explain by layer (breaking) |
| v3.1 | Minimum Sufficient Knowledge: bootstrap one consolidated file per layer; progressive `add agents` by group (state default, `--all`, `--group`) |
| v3.2 | New-project flow hardening: agents in per-layer folders; `new` recommends capability+architecture agents; explain Work Item parser fix; intent vs reality (codebase vs current-state) |
| v3.3 | Work Item delivery lifecycle: `understand` shows branch → scan → ownership → guard → knowledge → commit for active Work Items (suggestions only; Kaddo never runs git) |
| v3.4 | Delivery protocol in the `work-item-agent`: branch first per the Git strategy, commit only with human confirmation (CLI never touches git) |
| v3.5 | Knowledge discovery by front-matter type with per-layer maturity (explain/understand/context); context pack carries Operating Rules so agents never commit without confirmation |
| v3.5.1 | Author attribution & knowledge identity: Kaddo as a practical implementation of KDD for AI-assisted development (docs/README) |
| v3.6 | Flexible roadmap parsing and roadmap candidate/materialized Work Item reporting |
| v3.7 | Work Item lifecycle active workspace (`draft`, `ready`, `in-progress`, `blocked`, `completed`, `archived`) |
| v3.7.1 | Context Efficiency positioning: Repository Exploration Tax and structured-knowledge narrative |
| v3.8 | Agent Trace & responsibility boundaries: every prompt declares Agent/Produced/Next; new `implementation-agent` (the only agent that may suggest a branch) |
| v3.9 | New `chore` Work Item type (+ aliases setup/tooling/maintenance/infra); explain Work Items by Type; context Delivery Mix |
| v3.9.1 | Unified knowledge artifact discovery: one service behind explain/context/owners/guard (fixes owners missing lifecycle subfolders) |
| v3.10 | State-aware recommendations: real phase model (Discovery → Planning → Delivery Preparation → Active Delivery → Maintenance) drives understand/context/explain |
| v3.11 | Command workflow clarity: official command matrix + "Question answered / Suggested next" footer on scan/context/explain/understand; `chore/` branch prefix |
| v3.13 | New `backlog-agent`: capture raw ideas into a Work Item draft or roadmap candidate (human decides the next step) |
| v3.14 | Project knowledge language (`project.language: en\|es`): knowledge in your language, CLI stays English; all agents respect it |
| v3.15 | Delivery context consistency: phase-based handoff + per-phase LLM instructions; assisted `owners suggest` (normalize/validate globs); new `ownership-agent`; guard untracked-files warning; duplicate Work Item detection |
| v3.16 | Knowledge Capsules: `kaddo capsule export/add`, External Knowledge in context/explain, new `capsule-agent` |
| v3.17 | Knowledge Graph Export: `kaddo graph export` (`.kaddo/graph.json` + `.mmd`, `--scope`/`--format`); graph summary in context/explain |
| v3.18 | Graph relationship quality & metadata hints: `graph-hints.md`/`.json`, quality levels, `graph-agent`; hints in context/explain/understand |
| v3.19 | Read-only MCP server `@kaddo/mcp` (resources, tools, prompts over stdio) |
| v3.20 | MCP derived tools: safe regeneration of context/explain/understand/graph/capsule-draft under `.kaddo/` |
| v3.21 | Reusable Skills layer (`kaddo add skills`); skills in context/explain/understand, agent prompts and MCP |
| v3.22 | Guard & graph scope semantics: graph scope metadata, contextual-empty messaging, Guard ownership scope (active + completed; `--include-archived`) |
| v3.22.1 | Guard project-root path normalization: matches `code:` globs when the project is a subfolder of the Git root |
| v3.23 | Knowledge Impact Report: `kaddo report impact` (Markdown/JSON, `--output`); evidence-first health/coverage/traceability/readiness/signals; MCP resource + tool |
| v3.23.1 | Impact report Actionable Gaps: per-Work-Item missing source/initiative/ownership/level/acceptance/DoD/validation, broad globs, overlaps; Work-Item-specific Suggested Actions + Score Breakdown |

**Optional modules (installed with `kaddo add`):**

`adr` · `rfc` · `incident` · `migration` · `legacy` · `contracts` · `capabilities` · `guard-advanced` · `agents` · `skills` · `standards` · `security` · `stack` · `git-strategy`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
