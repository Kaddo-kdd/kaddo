# Design: Documentation Realignment

## Messaging Strategy

Lead with practical value, not philosophy.

- Hero: `Prepare any codebase for AI-assisted evolution.`
- Plain line: `Kaddo helps your repo remember why the code exists.`
- Subtitle: `Kaddo is an open-source CLI and agent prompt toolkit that helps new, pre-AI and
  legacy projects build a living knowledge layer close to the code.`

## Core Positioning

Kaddo is an open-source CLI and agent prompt toolkit for Knowledge Driven Development. It
helps new projects, pre-AI projects and legacy systems build and maintain project knowledge,
technical inventory, context packs, agent prompts, roadmaps, work items, ownership metadata
and knowledge drift detection.

## CLI vs LLM Explanation (must be explicit)

**CLI does (deterministic):** initialize knowledge structure, scan signals, generate context
packs, install agent prompts, guide handoff (`understand`), create work items, declare
ownership, detect drift (`guard`), explain project state.

**LLM chat does (interpretation):** extract capabilities, reconstruct architecture, propose
roadmap, identify risks, draft structured artifacts.

**Kaddo does not:** call an LLM by default, require API keys, generate code automatically,
replace human review, replace Jira/Linear/GitHub Issues, infer business truth.

## Full Workflow (the spine of the docs)

```bash
kaddo init                 # state: new | pre-ai | legacy, team size, structure
kaddo scan                 # deterministic technical inventory → .kaddo/scan.json
kaddo context              # LLM context pack → .kaddo/context-pack.md
kaddo add agents           # install agent prompt packs
kaddo understand           # guided CLI → LLM handoff plan
# use your LLM with the context pack + agents to create capabilities, architecture, roadmap
kaddo create --from roadmap  # turn a roadmap candidate into a Work Item
kaddo owners suggest         # declare code: ownership on the Work Item
kaddo guard                  # detect possible knowledge drift
kaddo explain                # summarize what Kaddo currently knows
```

## Documentation Changes

- **Root README**: workflow-first structure (What / Why / How / Quickstart / Full workflow /
  New vs Pre-AI vs Legacy / CLI vs LLM / Commands / What Kaddo does not do / Roadmap). Remove
  stale "upcoming" labels from shipped commands.
- **CLI README**: keep practical; refresh the roadmap/version table and the workflow line.
- **Docs homepage (EN/ES)**: fix the "understand with agents *(upcoming)*" card, show the real
  loop, keep cards concise.
- **Getting started (EN/ES)**: replace the old `scan → create → guard` next steps with the
  real loop including `context`, `add agents`, `understand`, `owners suggest`, `explain`.
- **Command overview**: present commands in workflow order.
- **New Workflow page (EN/ES)**: single page covering CLI vs LLM, project states and the full
  demo flow plus "What Kaddo does not do". Added to the sidebar under "Start here".

## Project States

- **new** — start with a minimal knowledge structure; grow the roadmap gradually.
- **pre-AI** — scan, prepare a context pack, understand with agents before evolving.
- **legacy** — map ownership gradually and identify risk areas before changing code.

## Language Consistency

Use consistent terms: Kaddo, Knowledge Driven Development, Context Pack, Agent Prompt Packs,
Understand Flow, Work Item, Ownership, Guard Lite, Knowledge Drift, Project Explanation.

## EN/ES Parity

Every changed English page has its Spanish counterpart updated in the same change.

## Alternatives Considered

- **Keep docs conceptual** — rejected; there is enough implementation to teach via workflow.
- **Commands-only docs** — rejected; users need the why and the CLI/LLM split.
- **Rewrite the manifesto** — out of scope; the manifesto stays as foundation.

## Risks and Mitigation

- Verbosity → README stays concise; depth lives in the docs site.
- Marketing-heavy landing → plain language, no overpromise.
- README/docs duplication → README practical, docs deeper.
