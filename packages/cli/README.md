<!-- Generated from /README.md by scripts/sync-npm-readme.mjs. Run `pnpm npm-readme:sync`; do not edit directly. -->

<p align="center">
  <img src="https://raw.githubusercontent.com/Kaddo-kdd/kaddo/main/assets/banner.png" alt="Kaddo — Knowledge Driven Development Toolkit" width="100%" />
</p>

# Kaddo — Knowledge Driven Development

> **Prepare any codebase for AI-assisted evolution.**
> Kaddo helps your repo remember why the code exists.

Kaddo is an open-source **Knowledge Driven Development (KDD) toolkit** for AI-assisted
software engineering. It scans your repo, structures product knowledge into four layers
(Business, Product, Tech, Delivery), manages the full Work Item lifecycle — from captured
intent through implementation handoff, evidence collection and verification — and keeps
knowledge alive as the system evolves.

It works in two layers:

- **The CLI** does the deterministic work — no AI, no API key.
- **Your LLM** does the interpretation — using Kaddo agents in your chat (Claude, ChatGPT,
  Cursor, Copilot, Windsurf…).

> **Knowledge Driven Development ≠ Kaddo.** KDD is a prior concept in software engineering and
> knowledge management. Kaddo is a **practical implementation of KDD principles** — it applies
> them; it did not invent them.

## Quick Start

```bash
npx @kaddo/cli init       # configure project state, structure & language (en/es)
kaddo bootstrap            # new projects: seed Business → Product → Tech → Delivery knowledge
kaddo scan                 # deterministic technical inventory → .kaddo/scan.json
kaddo add agents           # install agent prompt packs
kaddo context              # LLM context pack → .kaddo/context-pack.md
kaddo understand           # guided CLI → LLM handoff plan
```

Then use your LLM with the context pack and agents to extract capabilities, architecture and
a roadmap. Continue the delivery loop:

```bash
kaddo create --from roadmap   # roadmap candidate → Work Item draft
kaddo verify                  # evidence collection + AC verification
kaddo owners suggest          # declare code: ownership
kaddo guard                   # detect possible knowledge drift
kaddo explain                 # summarize what Kaddo currently knows
```

**Lost? Run `kaddo understand`** — it always answers *"What should I do now?"* from the
real state of your project.

## Proof of Concept mode

Use POC mode when the immediate question is whether an assumption is true, rather than how to
plan a complete product increment. It is independent from project state and keeps the work focused
on a hypothesis, observable success criteria, minimal technical context, experiment evidence, and
a conclusion.

```bash
kaddo init --mode poc
# or change an existing project
kaddo project mode poc
kaddo bootstrap
```

The canonical record is `knowledge/delivery/poc.md`. It concludes as `validated`, `rejected`, or
`inconclusive`; Work Items retain their normal lifecycle, with a `spike` often being the right
first experiment. Token savings can result from this focused context, but the goal is better
evidence and decisions, not prompt optimization.

## The Knowledge Model

Kaddo organizes project knowledge into four layers under `knowledge/`:

| Layer | What it captures |
|---|---|
| **Business** | Problem, users, value proposition, constraints |
| **Product** | Capabilities, decisions, quality attributes |
| **Tech** | Architecture, stack, codebase foundation, ADRs, modules |
| **Delivery** | Roadmap, Work Items, build contract, evidence |

Each layer feeds the next. Agents don't guess — they read structured context.

## The Kaddo Lifecycle

Work Items follow the **Kaddo-native Build Contract** — a lifecycle that ensures every change
is traceable from intent to verified delivery:

```
Captured Intent → Refinement → Human Review → Ready
    → Implementation Handoff → Implementation
    → Evidence Collection → Verification → Completed → Learning
```

| Stage | What happens | Tool |
|---|---|---|
| **Captured Intent** | An idea becomes a Work Item draft | `kaddo create` / `kaddo work-item import` |
| **Refinement** | ACs, scope, affected modules, validation plan | work-item-agent |
| **Human Review** | A person reviews and approves the refined WI | — |
| **Ready** | WI moves from `draft/` to `ready/` | `kaddo mark-ready` |
| **Implementation Handoff** | Agent-agnostic context assembly + design deliberation | implementation-agent |
| **Implementation** | Code changes guided by the handoff | developer + agents |
| **Evidence** | Changed paths, validations, AC checks | `kaddo verify` |
| **Verification** | Evidence vs ACs, release gates, completion decision | `kaddo verify` |
| **Completed** | WI moves to `completed/` with learning capture | — |
| **Learning** | Friction and insights feed future work | — |

Work Items physically move between directories: `draft/` → `ready/` → `in-progress/` →
`completed/`. The lifecycle is enforced by convention — no lock-in, no platform dependency.

## Interfaces

Kaddo exposes its capabilities through four interfaces:

| Interface | What it does |
|---|---|
| **CLI** (`@kaddo/cli`) | Deterministic commands: init, scan, context, create, guard, verify, explain. No LLM, no API key. |
| **MCP Server** (`@kaddo/mcp`) | [Model Context Protocol](https://modelcontextprotocol.io) server — exposes knowledge, Work Items, graph, lifecycle tools and agent prompts to MCP-compatible IDEs and agents. |
| **Admin** (`@kaddo/admin`) | Web UI for Work Item management, integration configuration, external work item discovery and import provenance. |
| **Agents** | LLM prompt packs installed with `kaddo add agents` — business, product, architecture, roadmap, work-item, implementation, graph, capsule and more. |

The MCP server is mostly read-only. Lifecycle tools (import, ready, handoff, evidence, verify)
can write under `knowledge/delivery/work-items/`; derived tools regenerate artifacts under
`.kaddo/`. Everything else is strictly read-only.

```json
{ "mcpServers": { "kaddo": { "command": "npx", "args": ["@kaddo/mcp"], "cwd": "/path/to/project" } } }
```

See the [MCP Server docs](https://kaddo.org/mcp-server/).

## Integrations

Kaddo connects to external work systems through the **Integration Adapter Foundation**:

```
External system (GitHub Issues, Jira, Azure DevOps…)
    → discovery: browse & filter external items
    → import: bring an item into Kaddo as a Work Item draft
    → refinement: enrich with ACs, scope, affected modules
```

Import is always human-confirmed — Kaddo never creates Work Items silently. Secrets are
managed through environment variables and never exposed. Configure integrations through the
Admin UI or `@kaddo/integrations` programmatically.

## Knowledge Capsules

For repos you can't (or don't want to) map as multirepo modules — other teams, restricted
access, integration-only context — exchange **Knowledge Capsules**:

```bash
kaddo capsule export   # share a minimal summary of this project
kaddo capsule add      # import an external capsule into the context pack
```

No multirepo mapping needed, no source access required. See the
[Knowledge Capsules docs](https://kaddo.org/knowledge-capsules/).

## Operating Moments

Kaddo matures a project's knowledge through four moments — **Base → Definition → Projection →
Execution**:

- **Base** — `init` · `bootstrap` · `scan` · `add agents` · `context` · `understand` (set up the
  workspace and knowledge structure).
- **Definition** — business-agent · product-agent · capability-agent · codebase-agent ·
  architecture-agent (turn the idea into clear knowledge).
- **Projection** — roadmap-agent · backlog-agent · `create --from roadmap` · work-item-agent ·
  ownership-agent (turn knowledge into a delivery plan).
- **Execution** — implementation-agent · `verify` · `scan` · `owners suggest` · `guard` · `explain`
  (build, verify and keep knowledge in sync).

See [**Operating Moments**](https://kaddo.org/operating-moments/) for the full breakdown.

## Commands

Each command answers one question and has a clear next step.

| Command | Question answered | Suggested next |
|---|---|---|
| `kaddo init` | How do I start a Kaddo project? | `kaddo bootstrap` |
| `kaddo bootstrap` | What minimum knowledge should exist? | `kaddo add agents` → `kaddo context` |
| `kaddo scan` | What technical signals exist in the repo? | `kaddo explain` / `kaddo context` |
| `kaddo context` | What should I give to an LLM? | the recommended agent |
| `kaddo understand` | What should I do now? | the recommended action |
| `kaddo explain` | What does Kaddo know? | `kaddo understand` |
| `kaddo create --from roadmap` | How do roadmap candidates become Work Items? | work-item-agent |
| `kaddo verify` | Is the Work Item complete? | evidence + AC verification |
| `kaddo owners suggest` | Who owns this code? | `kaddo guard` |
| `kaddo guard` | Is knowledge drifting from code? | update the affected knowledge |
| `kaddo add agents` | Which agents are available? | `kaddo understand` |

Supporting commands: `kaddo status`, `kaddo learn`, `kaddo classify`, `kaddo history`,
`kaddo module`, `kaddo modules map|list`, `kaddo capsule export|add`, `kaddo graph export`,
`kaddo report impact`, `kaddo savings`, `kaddo guard --record`, `kaddo drift`, `kaddo questions`,
`kaddo ignore`, `kaddo add <module>`, `kaddo work-item import`, `kaddo adapters install|list|status`.

## Multirepo Modules & Global Artifacts

Map secondary repositories as living modules of one system:

```bash
kaddo modules map    # register a secondary repo as a module
kaddo modules list   # list mapped modules
```

Per-module knowledge (`module-design`, `stack`, `security`, `standards`) is generated under
`knowledge/tech/modules/<id>/`. Global artifacts cover cross-cutting concerns:

```bash
kaddo add standards    # knowledge/tech/standards.md
kaddo add security     # knowledge/tech/security.md
kaddo add stack        # knowledge/tech/stack.md
kaddo add git-strategy # knowledge/tech/git-strategy.md + .kaddo/git.yml
```

## Skills

**[Skills](https://kaddo.org/skills/)** standardize *how* agents do common things well
(writing an ADR, refining a Work Item, planning implementation, collecting evidence). Agents
orchestrate; skills standardize. Install with:

```bash
kaddo add skills                  # recommended (delivery + tech)
kaddo add skills --all            # every skill
kaddo add skills --group tech     # one group: delivery | tech | integration
```

## Adapters (AGENTS.md / CLAUDE.md)

Generate native instruction files so AI coding tools work inside a Kaddo repo:

```bash
kaddo adapters install codex        # AGENTS.md for Codex
kaddo adapters install claude       # CLAUDE.md for Claude Code
kaddo adapters install kiro         # AGENTS.md for Kiro
kaddo adapters install opencode     # AGENTS.md for OpenCode
kaddo adapters install antigravity  # AGENTS.md for Antigravity
```

Both are compact projections of the project's knowledge map — Kaddo stays the source of truth.
See [Custom Adapters](https://kaddo.org/custom-adapters/) for the shared Adapter Contract.

## Kaddo Power

The official [`kaddo-power/`](https://github.com/Kaddo-kdd/kaddo/blob/main/kaddo-power/README.md) packages Kaddo Skills, KDD workflow
guidance and `@kaddo/mcp` integration using the Agent Plugins specification. Kiro Powers is
the first supported consumer.

## Templates

Kaddo ships templates for its main artifacts — organized into six categories: **core**,
**business**, **architecture**, **module**, **operations** and **legacy**. Each carries a
purpose, when-to-use, output path and quality checklist. See the
[Templates docs](https://kaddo.org/templates/overview/).

## Examples

The [`examples/`](https://github.com/Kaddo-kdd/kaddo/tree/main/examples) folder has reproducible demo repositories:

| Example | Scenario | State | Highlights |
|---|---|---|---|
| [Task Pilot](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/new-project) | Greenfield app | `new` | Structured knowledge from day one; full loop |
| [Loyalty Lite](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/pre-ai-project) | Existing app | `pre-ai` | `scan` + agents + Guard drift demo |
| [Old Orders](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/legacy-project) | Legacy MVC app | `legacy` | Understand-before-change; legacy risks/unknowns |
| [Commerce Stack](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/multirepo-workspace) | Many repos | `multirepo` | `modules map` + per-module artifacts |

Each includes a `prompt-flow.md` with a Mermaid diagram, CLI↔LLM split and copy/paste prompt
handoffs. See the [Examples docs](https://kaddo.org/examples/).

## Self-hosting

Kaddo builds Kaddo with Kaddo. The project uses its own lifecycle to manage Work Items,
collect evidence, verify ACs and capture learnings — the same workflow it provides to any
project. The `knowledge/` directory contains Kaddo's own product knowledge; `.kaddo/` holds
its derived artifacts. This self-hosting validates the lifecycle end-to-end and ensures that
friction encountered internally feeds back into improvements.

## How Ownership and Guard Work

Ownership is declared in artifact front matter — no central mapping file:

```yaml
---
type: feature
id: WI-001
title: "Add payment retry logic"
status: in-progress
code:
  - src/payments/**
  - src/shared/payment/**
---
```

`kaddo guard` reads `git diff`, finds artifacts whose `code:` globs match changed files, and
shows a **non-blocking FYI** when the artifact was not updated in the same diff. Guard is
**silent** when no artifacts declare ownership — no noise on day one.

## What Kaddo Does Not Do

- Not a code generator
- Not an agent execution framework (it ships agent *prompts*, it does not run them)
- Not a replacement for Jira, Linear or documentation tools
- Not a platform
- Does not call an LLM or require an API key

## About the Author

Kaddo is created and maintained by **Julian Dario Luna Patiño** — Cloud Solutions Architect
Lead, AWS Community Builder and content creator at [TryCatch.tv](https://trycatch.tv). It is
the result of years designing software architectures, leading development teams and
documenting systems. Kaddo applies Knowledge Driven Development principles to AI-assisted
software development; it does not claim to have invented KDD.
[GitHub](https://github.com/judlup) · [LinkedIn](https://www.linkedin.com/in/judlup/) ·
[About](https://kaddo.org/about/).

## Contributing

See [CONTRIBUTING.md](https://github.com/Kaddo-kdd/kaddo/blob/main/CONTRIBUTING.md).

## License

MIT
