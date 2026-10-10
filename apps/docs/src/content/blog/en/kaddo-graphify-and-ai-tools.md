---
title: 'Kaddo, Graphify and other AI tools: what really makes them different?'
description: Understanding how code works is not the same as understanding why it exists and how the system should evolve.
publishedAt: 2026-10-10
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - code-intelligence
  - context-engineering
  - software-architecture
locale: en
cover: /blog/kaddo-graphify/cover.webp
featured: false
translationKey: kaddo-graphify-ai-tools
---

**Understanding how code works is not the same as understanding why it exists and how the system should evolve.**

Kaddo, Graphify, GitNexus, OpenSpec and Spec Kit all relate to a problem that has become central when building software with AI agents: providing the context they need to work well. Their capabilities overlap only partly, though. Some tools discover repository structure, some organize change specifications and others guide a development process.

![A knowledge core connects code exploration, product intent and verification](/blog/kaddo-graphify/cover.webp)

To see where Kaddo fits, it helps to distinguish those responsibilities first.

## Context is not one thing

An agent refactoring a function needs callers, dependencies and contracts. An agent changing checkout also needs business rules, product capabilities, architectural constraints and criteria for verifying the change. Both need context, but not the same context.

We can have a detailed map of relationships between functions and classes without knowing why a business rule exists. We can also have a clear specification without understanding the technical dependencies affected by it. These perspectives complement one another, but they are not interchangeable.

## Graphify and GitNexus: discovering how code is connected

![A repository reveals functions, modules and dependencies as a queryable technical network](/blog/kaddo-graphify/code-discovery.webp)

Graphify turns code, documentation and other materials into a queryable graph. AST-based analysis can identify relationships between files, functions, classes and imports, while distinguishing extracted information from inferred signals. GitNexus follows a related direction with a strong code-intelligence focus: it indexes repositories, dependencies, call chains and execution flows for agents to query.

These capabilities are particularly useful for exploring an unfamiliar codebase, investigating the technical impact of a modification or discovering which modules participate in a flow. Graphify is also extending into change analysis and enterprise verification, so it would be inaccurate to describe it merely as a dependency visualizer. Its primary strength remains building and querying relationships from the sources it analyzes.

## Where does Kaddo fit?

![Kaddo connects code to business, product and delivery knowledge](/blog/kaddo-graphify/kaddo-core.webp)

Kaddo starts with a different question: how do we preserve and use the knowledge needed to evolve a system through its entire development lifecycle? It does not try to reconstruct a deep graph of function calls. It keeps decisions, product capabilities, technical constraints and the work performed against them explicit.

That is why Kaddo organizes knowledge around **Business, Product, Tech and Delivery**. Architectural decisions, modules, Project Resources, initiatives and Work Items connect to that model. Its graph is built primarily from declared relationships between these artifacts instead of inferring the entire code structure through symbol analysis.

Code may show how a discount is calculated, but not why a customer gets special treatment or which commercial decision justified an exception. That knowledge must be discovered, validated and kept explicit regardless of the agent changing the implementation.

## A payment change shows both perspectives

![Technical dependencies and product intent converge in a software change](/blog/kaddo-graphify/payment-change.webp)

Suppose a team needs to allow retries when a payment fails. A code-intelligence tool can reveal where the provider is called, which modules participate, how errors propagate and which technical dependencies could be affected.

Questions remain that a technical graph cannot answer on its own: what happens when the first attempt was processed but the response never arrived, how many retries does the business allow, what behavior does the user expect and which conditions prove the change is correct?

In Kaddo, those answers belong to product knowledge and the Work Item. Refinement defines the scope, relates modules and resources, and establishes acceptance criteria. The Implementation Handoff gathers context for construction; evidence and verification compare the result with the request. One perspective discovers how software is connected; the other preserves what to change, why and how to prove it.

## OpenSpec and Spec Kit: turning intent into structured work

OpenSpec and Spec Kit are closer to turning intent into specifications, planning and implementation. There is greater overlap with Kaddo here: all of them recognize that AI-assisted development requires more than a prompt and generated code.

The distinction is the role project knowledge plays. In Kaddo, a Work Item does not contain the whole truth about a system. It relates to knowledge that exists before the change and must keep evolving afterwards. Capabilities, architectural decisions, resources and memory from earlier implementations can inform future work without being rebuilt from scratch for every task.

## Kaddo also has a graph, but it represents a different kind of relationship

Kaddo's Knowledge Graph connects knowledge and work artifacts: capabilities to Work Items, decisions to the areas they govern, initiatives to changes and modules to external resources. Its purpose is traceability, knowledge-impact analysis and context selection for work.

A technical dependency graph can complement it by providing signals about the code. An automatically discovered relationship, however, is not yet a validated business decision. Technical discovery can produce evidence; interpreting and confirming its meaning remains a separate responsibility.

## Knowledge needs to survive implementation

![Intent, construction, verification and learning return knowledge to the next change](/blog/kaddo-graphify/knowledge-lifecycle.webp)

The lifecycle does not end merely because new code exists. In Kaddo, the Work Item preserves intent, moves through refinement and planning, reaches implementation and then gathers evidence to verify its criteria. If implementation reveals an unknown dependency, technical constraint or undocumented business rule, that learning can return to the project so the next change does not need to discover it again.

There is no need to choose a single tool. Repomix can prepare repository content; Graphify or GitNexus can explore technical relationships; OpenSpec or Spec Kit can structure development; and Kaddo can preserve product, architecture and delivery knowledge between changes. The choice depends on the problem and on the level of knowledge a decision requires.

Kaddo does not aim to replace code analysis, specification generators or development agents. Its goal is to keep connected the knowledge that enables better decisions before, during and after implementation: AI must be able to explore a system, but teams must also retain why it works the way it does and how they want it to evolve.
