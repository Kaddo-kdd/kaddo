---
title: Project scope
description: What Kaddo does, what it does not do, and the layers it operates in.
---

Kaddo is an open-source CLI and agent prompt toolkit for building a living knowledge layer
close to the code. This page makes its current scope explicit.

## What Kaddo does

- Initializes a project knowledge structure (`kaddo init`).
- Detects deterministic repo signals (`kaddo scan`).
- Creates LLM context packs (`kaddo context`).
- Installs agent prompt packs (`kaddo add agents`).
- Guides the CLI → LLM handoff (`kaddo understand`).
- Creates Work Items from a roadmap (`kaddo create --from roadmap`).
- Helps declare code ownership (`kaddo owners suggest`).
- Detects possible knowledge drift (`kaddo guard`).
- Explains the project state (`kaddo explain`).

## What Kaddo does not do

- It does **not** call an LLM by default.
- It does **not** require an API key.
- It does **not** generate code.
- It does **not** replace human review.
- It does **not** infer business truth automatically.
- It does **not** replace Jira, Linear or GitHub Issues.
- It does **not** understand legacy systems magically.

## The two layers

| Layer | Responsibility |
|---|---|
| **CLI (deterministic)** | scan signals, package context, install agent prompts, guide handoff, create Work Items, declare ownership, detect drift, explain state |
| **LLM (interpretation)** | extract capabilities, reconstruct architecture, propose a roadmap, identify risks, draft structured artifacts |

The CLI prepares and stores context; your LLM interprets it using Kaddo agents.

## Supported project states

- **new** — start with a minimal knowledge structure from day one.
- **pre-AI** — prepare an existing repo for humans and LLM agents.
- **legacy** — understand and reduce risk before changing fragile systems.

See the per-state guides: [New project](/use-cases/new-project/),
[Pre-AI project](/use-cases/pre-ai-project/), [Legacy project](/use-cases/legacy-project/).

## Current limitations

- The interpretation steps (capabilities, architecture, roadmap, legacy analysis) happen in
  your LLM chat using Kaddo agents — they are not produced by the CLI.
- Drift detection is glob-based (`code:` ownership vs `git diff`); it does not perform semantic
  code analysis.
- Ownership assistance currently targets Work Items.
