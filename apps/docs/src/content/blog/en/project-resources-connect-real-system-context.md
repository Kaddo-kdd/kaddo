---
title: 'Project Resources in Kaddo: connecting real system context'
description: Project Resources make the external dependencies that shape a system visible, so people and agents can connect modules, capabilities and Work Items to real operating context.
publishedAt: 2026-10-07
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - project-resources
  - context-engineering
  - multirepo
locale: en
cover: /blog/project-resources/cover.webp
featured: false
translationKey: project-resources-real-context
---

> Originally published on [AWS Builder Center](https://builder.aws.com/content/3KNMYqCefLOjsoyFfnnkfRSq0Un/project-resources-en-kaddo-conectar-el-contexto-real-del-sistema) (Spanish). Sixth article in the Knowledge Driven Development (KDD) series.

When we talk about context for AI agents, we usually start with code, documentation, architecture or
Work Items. A real system does not live only in the repository, though. It depends on databases, APIs,
queues, storage, shared components and external services that shape how it works and evolves.

That context is often spread across environment variables, infrastructure, documentation and team
knowledge. We may understand what a module does while still not knowing what it needs to operate.
Kaddo **Project Resources** make those dependencies part of the project's explicit knowledge.

![System context includes external dependencies, not only repository code](/blog/project-resources/external-context.webp)

## Knowing the technology is not knowing the resource

Knowing that a project uses PostgreSQL, Redis, Kafka or S3 helps explain its stack, but not how those
technologies participate in the system. It does not tell us which database a module uses, why it uses
it, what else depends on it, or what could be affected by a change.

Imagine an order system split between checkout, orders and notifications. Architecture can describe
how modules communicate and product knowledge can identify the ability to create an order. The real
flow may also depend on a database, event queue, receipt storage and external payment provider. Those
are all parts of the real architecture, even though they are not code in the same repository.

![External resources complete the architecture that code alone cannot show](/blog/project-resources/resources-vs-tech.webp)

## Project Resources as system knowledge

The aim is not to turn Kaddo into an infrastructure management tool. It is to model the resources
that matter to understanding the system and connect them to the rest of its knowledge.

A database may run in AWS, Azure, GCP or private infrastructure. For Kaddo, what matters is that it
exists, its purpose, scope and dependent modules. The same applies to an external API, queue, bucket
or shared service. This connects what a module does, what it depends on, what resources it uses and
what work could be affected when one changes.

## The value is in the relationships

A resource in isolation provides limited information. Its value comes from relationships to
capabilities, modules and Work Items. If a payments module depends on an external provider and a Work
Item changes retries, that relationship changes how the work should be refined and implemented.

The Knowledge Graph becomes closer to the real system: not only modules linked to one another, but
modules depending on shared resources and capabilities spanning several parts of the solution. That
helps identify impact before code changes begin.

![Relationships between modules, capabilities, Work Items and resources make impact visible](/blog/project-resources/relationships.webp)

## Less time rediscovering dependencies

Without this knowledge, every agent must discover dependencies again. It may find an environment
variable, API call or event producer, but still has to infer its meaning and impact. The exploration
repeats and relies too heavily on local signals.

Once resources are structured knowledge, the starting point changes. The agent can reason about how a
change interacts with dependencies instead of discovering that they exist first. This is a practical
form of [context efficiency](/token-efficiency/): reducing unnecessary exploration rather than adding
context indiscriminately.

![Structured knowledge reduces repeated exploration of dependencies](/blog/project-resources/exploration.webp)

## Better refinement, not more bureaucracy

This connection is especially useful while refining a Work Item. Consider allowing an order to retry
after a payment failure. Looking only at the orders module may produce a local solution. Resources
raise the necessary questions: does the payment provider support idempotency, is there a queue between
components, where is attempt state stored, and do other modules consume the events that will change?

The Work Item better represents the real change: not just code to modify, but the part of the system
being altered and dependencies to consider before building. Resource roles bring this into the
Implementation Handoff without loading the agent with the whole project inventory.

![Relevant resources give refinement a system view before implementation](/blog/project-resources/refinement.webp)

## It matters even more in multirepo

When a solution is distributed across repositories, understanding dependencies is not optional. One
repository can know its implementation well while missing that it shares a database, queue or external
service with other modules.

Kaddo maintains a global view from a core while each module keeps its own technical context. Project
Resources connect modules through their actual shared dependencies. Two repositories that appear
independent may depend on the same resource; seeing that changes impact assessment and prevents
solutions that are locally correct but incomplete at system level.

![A shared resource catalog connects context across repositories](/blog/project-resources/multirepo.webp)

## Knowing is not accessing

Representing a resource does not mean storing secrets, credentials or sensitive information. Knowing
that a module uses a database is knowledge; having its password is access. Kaddo records enough to
reason about purpose, interfaces and boundaries, while credentials remain in tools intended to protect
them.

That boundary is central: Project Resources are read-only knowledge. Kaddo does not connect to AWS,
Supabase or another provider, run interfaces or store secret values.

![Context describes dependencies and boundaries without turning the repository into a secret store](/blog/project-resources/knowledge-and-access.webp)

## From documents to a living model

Business explains why a system exists; Product, the capabilities it delivers; Tech, how it is built;
and Delivery, how it should evolve. Modules show where responsibilities live. Project Resources expose
the dependencies connecting them to services, data and infrastructure. Work Items turn that context
into work, and the lifecycle carries a change through verification and learning.

The goal is not another documentation category. It is better connections between what we already know,
so we can more confidently answer which product area is changing, what it depends on and what else may
be affected.

![Structured knowledge becomes a living model of the system](/blog/project-resources/living-model.webp)

Read the [Project Resources documentation](/project-resources/) to model them in your project.

