---
title: What is Knowledge-Driven Development?
description: Knowledge-Driven Development treats project knowledge as a first-class, observable artifact so humans and AI agents evolve software from the same shared context.
publishedAt: 2026-10-04
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - software-architecture
locale: en
cover: /banner.png
featured: true
---

Software teams have always run on knowledge: why a system is shaped the way it is, which
constraints are load-bearing, what was tried before and abandoned. The problem is that most of this
knowledge lives in people's heads, in scattered chat threads, or in commit messages nobody reads
again. When an AI coding agent joins the work, it inherits none of that — it sees code, not context.

**Knowledge-Driven Development (KDD)** is a simple reframing: treat project knowledge as a
first-class, observable artifact that lives in the repository, next to the code, and have both
humans and AI agents work from that same shared context.

## Why context is the real bottleneck

A capable coding agent rarely fails because it cannot write code. It fails because it does not know
*this* project: the domain language, the architectural boundaries, the decisions that are not up for
debate. Give it the code alone and it will confidently produce changes that are locally correct and
globally wrong.

KDD's answer is not "write more documentation." It is to capture the knowledge that actually drives
decisions — business intent, product capabilities, technical constraints, delivery history — in a
structured, versioned form, and to make it observable so you can see when it drifts from reality.

## Knowledge as an artifact, not a wiki

The distinction matters. A wiki is prose that rots silently. A KDD knowledge base is structured: it
has layers (business, product, tech, delivery), it is versioned with the code, and it can be queried
and verified. When a change lands, the knowledge that justified it is right there — and when the
knowledge no longer matches the system, that drift is visible rather than hidden.

This is what lets an AI agent contribute like a well-onboarded teammate instead of a fast stranger.

## Where Kaddo fits

Kaddo is a toolkit for practicing KDD. It gives you a knowledge base in the repo, a work-item
lifecycle that ties intent to delivery, and an MCP server so agents can read the same context you
do — without ever treating that context as instructions to execute blindly.

If you want the concepts in depth, read
[Knowledge-Driven Development](/knowledge-driven-development/). To see it on a real codebase, the
[legacy project use case](/use-cases/legacy-project/) walks through adopting KDD on software whose
knowledge only lived in people's heads. When you are ready to try it, start with
[Getting started](/getting-started/).

The goal is not to replace developers with agents. It is to make sure that whoever is working —
human or AI — is building from what the team actually knows.
