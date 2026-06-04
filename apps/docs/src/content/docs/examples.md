---
title: Examples
description: Real, reproducible demo repositories showing Kaddo applied to new, pre-AI, legacy, and multirepo projects.
---

These are not "let me explain the concept" pages — they are **demo repositories you
can open and inspect**. Each lives under [`examples/`](https://github.com/Kaddo-kdd/kaddo/tree/main/examples)
in the Kaddo repo, with committed `.kaddo/` and `knowledge/` artifacts so you can
see exactly what Kaddo produces before running anything.

## The four scenarios

| Example | Scenario | State | Highlights |
| --- | --- | --- | --- |
| [Task Pilot](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/new-project) | Greenfield app | `new` | Structured knowledge from day one; full loop |
| [Loyalty Lite](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/pre-ai-project) | Existing app | `pre-ai` | `scan` + agents + **Guard drift demo** |
| [Old Orders](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/legacy-project) | Legacy MVC app | `legacy` | Understand-before-change; legacy risks/unknowns |
| [Commerce Stack](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/multirepo-workspace) | Many repos | `multirepo` | `modules map` + per-module artifacts |

## How each example is laid out

- `README.md` — the scenario, the commands to run, and what to inspect.
- `expected-flow.md` — a `command → output → artifact → next step` walkthrough.
- `prompt-flow.md` — the **prompt flow**: a Mermaid diagram, the CLI↔LLM split, an
  input/output table (CLI command / LLM agent / input / output / save as), copy/paste
  prompt handoffs and the artifact chain — so you can reproduce the loop without
  guessing which prompt to use.
- committed sample files (`.kaddo/`, `knowledge/`, `sample/`) so the artifacts
  are visible without running anything.

## What is real vs illustrative

- **CLI artifacts** (`.kaddo/config.yml`, `knowledge/delivery/work-items/*.md`, the
  roadmap skeleton, `.kaddo/modules.yml`, module folders) are exactly what `kaddo`
  writes.
- **Agent outputs** (capabilities, current-state, filled-in module designs) are
  **illustrative** — produced by running the Kaddo agent prompts in your own LLM.
  Kaddo never calls an LLM, generates code, or understands a system automatically.

## Related use cases

- [New project](/use-cases/new-project/)
- [Pre-AI project](/use-cases/pre-ai-project/)
- [Legacy project](/use-cases/legacy-project/)
- [Full workflow](/use-cases/full-workflow/)
