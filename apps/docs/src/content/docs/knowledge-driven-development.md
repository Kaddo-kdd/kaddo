---
title: Knowledge Driven Development
description: What Knowledge Driven Development is, and how Kaddo applies its principles to AI-assisted software development.
---

## What is Knowledge Driven Development?

**Knowledge Driven Development (KDD)** is an approach to building software where the
**knowledge** behind a system — why it exists, what it does, how it is built and how it
evolves — is treated as a first-class asset, kept close to the code and updated as the
system changes. It draws on long-standing ideas in software engineering and knowledge
management: capturing decisions, preserving context, and reducing the gap between what a
team knows and what the codebase records.

KDD is **not** a concept invented by Kaddo. It is a prior idea that Kaddo builds upon.

## Relationship with Kaddo

> **Kaddo did not invent Knowledge Driven Development.**
>
> Kaddo provides a **practical implementation of KDD principles for AI-assisted software
> development** — for the era of LLMs, agents and modern repositories.

Where KDD is a philosophy, Kaddo is a concrete toolkit: a deterministic CLI plus agent
prompt packs that operationalize KDD so that business knowledge, product thinking, technical
decisions and delivery workflows stay connected to the code.

## Knowledge layers

Kaddo organizes a project's knowledge into four macro layers:

```txt
Business → Product → Tech → Delivery
```

- **Business** — why it exists.
- **Product** — what we build.
- **Tech** — how we build it.
- **Delivery** — how we evolve it.

## Knowledge maturity

Knowledge grows progressively, recognized by meaning (front-matter type), not file names:

```txt
Consolidated → Structured → Traceable
```

## Human-in-the-loop

Knowledge guides development, but **critical decisions stay human**. Kaddo's CLI is
deterministic and never calls an LLM; the agents run in your chat and propose, while a human
confirms. Kaddo never commits, pushes or merges on its own.

## Why it matters for the AI era

AI agents build on assumptions when they lack context. By keeping minimum sufficient
knowledge next to the code — and packaging it deterministically for an LLM — Kaddo lets
agents work on real knowledge rather than giant, noisy prompts.

See the [Manifesto](/manifesto/) for the full philosophy, and [About](/about/) for the
project's origin and author.
