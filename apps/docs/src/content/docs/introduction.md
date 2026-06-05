---
title: Introduction
description: What Kaddo is and the layer it occupies.
---

**Prepare any codebase for AI-assisted evolution. Kaddo helps your repo remember why the
code exists.**

Kaddo is an open-source **CLI and agent prompt toolkit** based on **Knowledge Driven
Development (KDD)**. It scans your repo, prepares context for your LLM, guides agent-based
understanding, turns roadmap candidates into Work Items, declares ownership and warns when
code changes may leave knowledge behind — without turning development into bureaucracy.

It works in two layers: the **CLI** does the deterministic work (no AI, no API key), and
your **LLM** does the interpretation using Kaddo agents. See the [Workflow](/workflow/)
page for the full loop and the CLI vs LLM split.

> **Knowledge Driven Development ≠ Kaddo.** KDD is a prior concept in software engineering and
> knowledge management. Kaddo is a **practical implementation of KDD principles for
> AI-assisted software development** — it applies them; it did not invent them. See
> [Knowledge Driven Development](/knowledge-driven-development/).

**The central question:** *How does Kaddo know the right knowledge was impacted by this change?*

## What Kaddo is not

- Not a code generator
- Not an agent framework
- Not a replacement for Jira, Linear, or documentation tools
- Not a platform

## The layer Kaddo occupies

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

Kaddo puts knowledge first, then lets AI help you build.
