# Design: Example Prompt Flows & Visual Diagrams

## Documentation Strategy

Each example gets a dedicated `prompt-flow.md`. Mermaid diagrams live **inside**
`prompt-flow.md` (no standalone `.mmd` files — the docs site and GitHub both render
fenced ```mermaid blocks, and a separate file would duplicate maintenance).

```txt
examples/
  new-project/        README.md · expected-flow.md · prompt-flow.md
  pre-ai-project/     README.md · expected-flow.md · prompt-flow.md
  legacy-project/     README.md · expected-flow.md · prompt-flow.md
  multirepo-workspace/README.md · expected-flow.md · prompt-flow.md
```

## Standard Prompt Flow Format

Each `prompt-flow.md` follows the same skeleton:

```txt
# Prompt Flow — <Example>
## Goal
## Workflow diagram      (Mermaid)
## CLI vs LLM            (who does what)
## Step-by-step table    (CLI command / LLM agent / input / output / save as)
## Prompt handoffs       (copy/paste snippets)
## Artifact chain
## Validation checklist
> Sample-output disclaimer
```

## Step-by-step table format

```txt
| Step | CLI command | LLM agent | Input | Output | Save as |
```

Example (pre-AI full loop):

| Step | CLI command | LLM agent | Input | Output | Save as |
|---|---|---|---|---|---|
| Scan | `kaddo scan` | — | repo files | scan baseline | `.kaddo/scan.json` |
| Context | `kaddo context` | — | config + scan | context pack | `.kaddo/context-pack.md` |
| Capabilities | — | `capability-agent` | context pack | capabilities | `architecture/capabilities.md` |
| Architecture | — | `architecture-agent` | context + capabilities | current state | `architecture/current-state.md` |
| Roadmap | — | `roadmap-agent` | context + caps + arch | roadmap | `architecture/roadmap.md` |
| Work Item | `kaddo create --from roadmap` | — | roadmap | Work Item | `architecture/work-items/*.md` |
| Ownership | `kaddo owners suggest` | — | Work Item + scan | code globs | updated Work Item |
| Guard | `kaddo guard` | — | git diff + ownership | drift FYI | terminal |
| Explain | `kaddo explain` | — | Kaddo artifacts | explanation | `.kaddo/explain.md` |

## Mermaid diagrams per use case

- **Full workflow (generic):** scan → context → agents → roadmap → work item → guard → explain.
- **New project:** idea → roadmap → architecture baseline → first Work Item.
- **Pre-AI:** existing repo → scan → capabilities → architecture → roadmap → Work Item → guard.
- **Legacy:** fragile system → risks/unknowns → safe roadmap → small Work Item → guard.
- **Multirepo:** architecture repo → mapped modules → module design → per-module stack/security/standards.

Diagrams are `flowchart`/`graph` with a CLI vs LLM visual split (subgraphs).

## Prompt handoffs

Copy/paste snippets that reference the **installed** agent files (not copies), e.g.:

```txt
Use the Kaddo context pack with the capability-agent instructions.
Input:
- .kaddo/context-pack.md
- architecture/agents/capability-agent.md
Task: Generate architecture/capabilities.md.
Constraints: don't invent business facts; mark assumptions; include evidence + open questions.
```

## Artifact chain

```txt
.kaddo/scan.json → .kaddo/context-pack.md → architecture/capabilities.md →
architecture/current-state.md → architecture/roadmap.md → architecture/work-items/*.md →
front-matter code: globs → kaddo guard → .kaddo/explain.md
```

## Sample-output disclaimer

Every prompt-flow.md ends with:

> Sample LLM outputs in this example are illustrative — produced with Kaddo agent
> prompts in an LLM chat. Kaddo never calls an LLM. Review and adapt before using.

## Docs updates

Link the prompt flows from: README Examples section, docs Examples page (EN/ES), and
the use-case pages. The playbook prompt-workflow page already covers the generic
CLI-input→prompt→output→artifact mapping, so it only needs a pointer to the examples.

## EN/ES parity

`prompt-flow.md` files stay in English (code-oriented, alongside the examples). Docs
pages that describe/link them are updated in both EN and ES.
