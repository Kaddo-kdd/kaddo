---
title: How to run AI POCs without accidentally building a whole product
description: A proof of concept should reduce one concrete uncertainty with evidence, not accidentally turn into a complete product.
publishedAt: 2026-10-09
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - proof-of-concept
  - context-engineering
  - software-architecture
locale: en
cover: /blog/poc-mode/cover.webp
featured: true
translationKey: ai-proof-of-concept-mode
---

> Originally published on [AWS Builder Center](https://builder.aws.com/content/3KThC5dOufn6IFl0nToQ2UdRjlR/como-hacer-pocs-con-ia-sin-terminar-construyendo-un-producto-entero) (Spanish). Seventh article in the Knowledge Driven Development (KDD) series.

A proof of concept often begins with a small question and ends with architecture, integrations, a backlog and decisions that would only make sense for an approved product. With AI, that drift can happen even faster: expanding a prototype is easy; proving that an idea deserves to become a product is different.

A POC should not measure how much we can build. It should reduce one concrete uncertainty with enough evidence to decide what happens next. That is why Kaddo has **POC Mode**.

## A POC needs a different route

![A POC follows a focused route from hypothesis to conclusion](/blog/poc-mode/poc-route.webp)

Project state still matters: a system may be new, pre-AI or legacy. That classification describes the system, not necessarily the right way to guide the work. When the goal is validating an idea, starting with a complete Business, Product, Tech and Delivery baseline can add work that does not yet answer the question.

POC Mode focuses the lifecycle on what is needed to evaluate the experiment:

```text
Hypothesis -> success criteria -> minimum technical context -> resources -> experiment -> evidence -> conclusion
```

The conclusion can be `validated`, `rejected` or `inconclusive`. Separating expectations from what was actually demonstrated keeps a compelling demo from being mistaken for a validated decision.

## The hypothesis is the center of the process

![A hypothesis and its success criteria keep a POC focused](/blog/poc-mode/hypothesis.webp)

Many POCs begin with a technology: a model, framework, database or cloud service. A more useful order is the reverse: state the uncertainty, the hypothesis and the evidence that would enable a decision.

The `poc.md` artifact records the problem, hypothesis, expected value, success criteria, constraints and non-goals. It is not intended to document the whole system. It bounds the knowledge needed by the experiment and keeps new ideas from turning the scope into an accidental product.

This also changes the starting point for an AI agent. Instead of receiving an unbounded amount of context and inferring the goal, it can work from an explicit question, conditions for success and the components that take part in validation.

## An experiment does not need to reproduce the whole operation

![A deterministic layer can prepare context so AI focuses on the reasoning that matters](/blog/poc-mode/credit-architecture.webp)

For example, a credit-evaluation POC can explore how much processing belongs in deterministic rules before AI is asked to interpret and analyze what actually requires reasoning. The traditional layer normalizes information, evaluates known rules and prepares structured context; AI receives that context to reason where it adds value.

The POC does not need to connect to every corporate system on day one, recreate every existing rule or use sensitive data. Representative scenarios and clear criteria can validate the pattern before the team invests in a complete integration.

## Minimum context is not poor context

![POC context should grow with the decision it needs to support](/blog/poc-mode/minimum-context.webp)

Reducing scope does not mean ignoring knowledge. It means selecting the knowledge that can answer the question. A relevant API, database or AI service can be modeled as a [Project Resource](/project-resources/); an important technical decision or constraint should also be available to the people and agents running the experiment.

The difference from standard mode is proportionality. A POC does not need an exhaustive capability map or a roadmap to test a hypothesis. Context should grow with the pending decision, not with everything that could possibly be documented.

## Evidence matters more than a demo

A demonstration can work and still fail to answer the original hypothesis. The criteria defined at the start must be compared with observable results to conclude whether the idea is validated, rejected or still inconclusive. The conclusion should come from evidence, not implementation enthusiasm.

## Communicate the result without losing traceability

![A final report turns evidence and conclusions into a versioned communication artifact](/blog/poc-mode/final-report.webp)

`poc.md` remains the working source of truth. When the result needs to be communicated, Kaddo can prepare traceable context for a versioned final report: what was tested, which architecture was used, which experiments ran, what results appeared and which recommendation follows.

The report is not silently rewritten. A person confirms each version, and later evidence can make it stale without erasing the record of the earlier decision. The context may include directly related resources, decisions and Work Items, but it excludes secrets, passwords, private keys and connection strings.

## A POC also needs to know when to end

![Evidence allows a team to continue, change direction or stop with an explicit decision](/blog/poc-mode/decision.webp)

When evidence supports the hypothesis and the value justifies proceeding, the project can move to [standard mode](/poc-mode/) and establish the knowledge baseline for durable delivery. When the hypothesis is rejected or evidence remains insufficient, there is no need to invent a roadmap to justify the work: the definition, experiments and conclusion still become valuable project knowledge.

POC Mode is also Knowledge Driven Development. The hypothesis defines what to learn, the criteria define how to recognize an answer, implementation produces evidence and the conclusion turns that evidence into a decision. Before building more, the most valuable outcome is sometimes learning enough to know whether it is worth building at all.

Read the [POC Mode documentation](/poc-mode/) to start an experiment with Kaddo.
