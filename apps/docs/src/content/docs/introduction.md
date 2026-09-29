---
title: Introduction
description: What Kaddo is, the layer it occupies, and its lifecycle.
---

**Prepare any codebase for AI-assisted evolution. Kaddo helps your repo remember why the
code exists.**

Kaddo is an open-source **Knowledge Driven Development (KDD) toolkit** for AI-assisted
software engineering. It scans your repo, structures product knowledge into four layers
(Business, Product, Tech, Delivery), manages the full Work Item lifecycle — from captured
intent through implementation handoff, evidence collection and verification — and keeps
knowledge alive as the system evolves.

It works in two layers: the **CLI** does the deterministic work (no AI, no API key), and
your **LLM** does the interpretation using Kaddo agents. Four interfaces expose the same
knowledge layer: CLI, MCP Server, Admin UI and Agent prompt packs. See the
[Workflow](/workflow/) page for the full loop and the CLI vs LLM split.

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
