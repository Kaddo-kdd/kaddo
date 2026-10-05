---
title: Not all projects develop with AI the same way
description: New, pre-AI and legacy projects need different AI strategies. Before talking about AI-assisted development, we have to talk about the real state of the project and the knowledge the AI needs.
publishedAt: 2026-07-11
updatedAt: 2026-09-15
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - legacy
  - brownfield
locale: en
cover: /blog/project-types/cover.webp
featured: false
translationKey: project-ai-readiness
---

> Originally published on [AWS Builder Center](https://builder.aws.com/content/3GMWI4lfWvuf18IaGlNPJoQvh6I/no-todos-los-proyectos-se-desarrollan-con-ia-igual) (Spanish). Second article in the Knowledge Driven Development (KDD) series.

Artificial intelligence is changing the way we build software. Today we can use assistants and agents
to generate code, explain modules, create tests, review bugs, propose architectures or document parts
of a system. All of that sounds powerful, and it is, but there is an idea that is often overlooked:
**not all projects are equally prepared to work with AI.**

Using AI on a project that is just starting is not the same as using it on a product with several
years of evolution, or on a legacy system where touching a single line of code can break a behavior
nobody fully understands. AI can accelerate development, but when the project lacks enough context, it
can also accelerate errors, technical debt and misaligned decisions.

That is why, before talking about AI-assisted development, we need to talk about the real state of the
project. It is not only about asking the AI better questions, but about preparing the knowledge the AI
needs to help. That is where [Kaddo](/knowledge-driven-development/) comes in.

## The mistake: thinking AI works the same on every project

A common idea is to assume it is enough to open an AI editor, connect the repository and start asking
for changes. We can ask things like "add this feature", "refactor this module", "create an API" or
"modernize this code". The problem is that those instructions do not mean the same thing on every
project.

On a new project, AI can help structure from scratch. On an existing project, it first needs to
understand what already exists before proposing changes. And on a legacy system it must act with far
more care, because many decisions are undocumented and part of the knowledge lives in a few people's
heads.

The problem is not using AI. The problem is using it without considering the real state of the
project.

To work with AI more responsibly, we can think in terms of three project types: **new**, **pre-AI**
and **legacy**. This classification is not about labeling a project forever, but about answering a
practical question: what does the AI need to know before helping us build?

## 1. New projects: when knowledge can be created from the start

A new project is one that is just beginning. It does not yet have much technical debt, hidden
decisions or hard-to-understand historical layers. That does not make it easy, but it does represent a
very valuable opportunity: building a knowledge base from day one.

In this kind of project, the biggest risk is usually not breaking something existing, but moving fast
without leaving clarity about what is being built. At the start everything seems obvious: the team
knows what it wants to do, decisions are fresh, agreements live in recent conversations and the
architecture still looks simple. Over time, however, that clarity starts to fade.

What was a quick conversation at first ends up becoming an invisible decision. Then a new person joins
the team, the project is picked up again weeks later, or an AI agent is used to continue the work, and
many answers start depending on assumptions.

On a new project, AI can be very useful to help define the business context, the product intent, the
first modules, initial architectural decisions, the roadmap, the work items and the delivery criteria.
But the AI should not invent the business or decide the architecture on its own. Its role should be to
help structure the team's thinking.

In this scenario, the key is not to give the AI a huge repository to analyze, because that repository
probably does not exist yet or is barely being born. The key is to build a minimal knowledge base that
accompanies the project's growth. You do not need to document everything; you need to document enough
for the team and the AI to understand what problem is being solved, who it is being built for, which
decisions have been made, which constraints exist and how the product is expected to evolve.

### How Kaddo helps on new projects

On new projects, Kaddo helps create an initial knowledge structure without turning the process into an
unnecessary burden. The idea is not to start with huge documentation, but with a minimal base that
connects business, product, technology, delivery, roadmap and work items.

This lets the project be born with memory from the start. And that changes a lot about how AI is used,
because an agent does not only need code to help; it also needs intent. A well-prepared new project can
use AI to accelerate without losing direction. (See the
[new project use case](/use-cases/new-project/).)

## 2. Pre-AI projects: when the project exists but was not prepared for agents

A pre-AI project is one that already exists, but was created before the team seriously considered
assistants, copilots or AI agents. It can be a healthy project, with good code, tests and partial
documentation, but it was probably not designed to answer questions like: what context an agent needs
before modifying a module, which architectural decisions it must respect, or which parts of the code
are connected to each business capability.

This kind of project is very common. It is not necessarily broken and not necessarily legacy. It
simply was not prepared to work with AI consistently.

The problem appears when each assistant or agent starts exploring the repository from scratch. It
reads files, tries to infer architecture, looks for patterns, analyzes folder names and proposes
changes from partial signals. That exploration repeats over and over, because each new session
rediscovers the same thing.

The result is that AI can help, but not always in an aligned way. An agent can understand the project
one way today and another way tomorrow. So the project starts depending too much on individual
prompts, instead of having a shared base of knowledge.

On a pre-AI project, the first step should not be asking the AI to change code. The first step should
be understanding the project. Before implementing, it is worth reconstructing product capabilities,
current architecture, main modules, dependencies, conventions, roadmap, ownership, risks and existing
decisions.

The question changes. It is no longer just: "what can the AI generate?". The right question is: what
does the AI need to understand before generating anything?

### How Kaddo helps on pre-AI projects

On pre-AI projects, Kaddo helps move from an existing repository to a clearer knowledge layer. The
flow can start by scanning technical signals from the repository, preparing a context pack for LLM
agents and using specialized agents to interpret capabilities, architecture, roadmap and possible work
items.

Then that knowledge can be connected with ownership, decisions and real parts of the code. Commands
like `guard` help detect when the code changes but the related knowledge is not updated, while
`explain` lets you understand what Kaddo knows about the project and what is still missing. (See the
[pre-AI project use case](/use-cases/pre-ai-project/).)

## 3. Legacy projects: when changing code implies real risk

A legacy project is not simply an old project. A legacy system is one where change is risky because
the knowledge is incomplete, scattered or concentrated in a few people.

It can have old code, little documentation, fragile dependencies, hidden business rules, modules
nobody wants to touch and processes that work in production even though nobody dares to modify them. It
can also keep generating a lot of value for the organization. In fact, many legacy systems are
critical precisely because they have been supporting important processes for years.

In this kind of project, AI can be useful, but it can also be dangerous if used with too much
confidence. A seemingly correct suggestion can break an invisible rule. An elegant refactor can ignore
a historical decision. A modernization recommendation can overlook operational dependencies that were
never documented.

In legacy, the problem is not only technical. It is a knowledge problem. Before changing, you have to
understand. Before modernizing, you have to map risks. Before automating, you have to identify fragile
zones.

That is why, on a legacy project, AI should not enter as a "fast developer", but as support for
controlled exploration. The initial goal is not to produce more code, but to reduce uncertainty. In
legacy, speed without context is a threat.

### How Kaddo helps on legacy projects

On legacy projects, Kaddo helps work more carefully. It does not promise to modernize a system by
magic or replace the team's judgment. Its value is helping structure signals, risks and knowledge
before changing code: risks, unknowns, modernization candidates, current architecture, product
capabilities, roadmap, small work items and ownership associated with the code.

Instead of asking the AI to "modernize this system", the team can move forward in smaller pieces, with
context, with visible risks and with more control. (See the
[legacy project use case](/use-cases/legacy-project/).)

## The difference is not the AI, it is the context

All three project types can benefit from AI, but not in the same way.

| Project type | What it needs first | Main risk | Recommended approach |
|---|---|---|---|
| **New** | Create a knowledge base | Moving without direction | Structure intent, roadmap and decisions from the start |
| **Pre-AI** | Reconstruct context | The AI interpreting from partial signals | Scan, pack context and align agents |
| **Legacy** | Reduce uncertainty | Breaking invisible rules | Map risks, ownership and small changes |

The central idea is simple: AI should not approach every project the same way, because not every
project has the same level of available knowledge.

## Kaddo as a knowledge layer for AI

Kaddo starts from a very concrete idea: projects already have knowledge, but it is usually scattered.
Part lives in the code, part in tickets, part in documents, part in conversations, part in decisions
nobody wrote down and part in people who have been close to the system for years.

Kaddo's goal is to bring that knowledge close to the repository and turn it into useful context for
humans and AI agents. It is not about producing heavy documentation, but about creating a minimal,
living and actionable layer of knowledge.

### Deterministic CLI, human interpretation and LLM agents

An important part of Kaddo is the separation of responsibilities. The CLI does deterministic work: it
scans, packs context, creates structure, detects signals, relates changes to knowledge and explains
the project's state.

But Kaddo does not try to replace human interpretation. Interpretation happens with humans and
external LLM agents, using the context the project has prepared. Kaddo does not say: "I understand your
project, trust me". The proposal is more responsible: "here is the structured context; use it with
your team and your agents to make better decisions".

## It is not about AI-first, it is about knowledge-first

Many teams are trying to become AI-first. That can sound attractive, but before being AI-first, many
projects need to be **knowledge-first**.

AI needs a base to reason on. A project without structured knowledge forces the AI to guess; a project
with living knowledge lets it collaborate. That is the difference. It is not about using less AI, it is
about using it better.

## Conclusion

Not all projects develop with AI the same way: a new project needs to create knowledge from the start,
a pre-AI project needs to reconstruct and structure context before evolving, and a legacy project needs
to reduce uncertainty before changing code.

AI can be useful in all three cases, but the strategy must change. Kaddo proposes a way to address that
difference: building a living layer of knowledge close to the code, preparing context for humans and AI
agents, and keeping traceability between decisions, work and the evolution of the system.

Because the future of AI-assisted development does not depend only on better models. It also depends on
better projects to work with AI. And a better project is not just the one with more code, it is the one
that remembers why that code exists.
