---
title: For agents, not every task needs the same knowledge
description: The knowledge an AI agent needs should grow with the scope of the task. The challenge is not giving it all the information possible, but the right information.
publishedAt: 2026-09-14
updatedAt: 2026-09-15
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - agents
  - context-engineering
locale: en
cover: /blog/task-knowledge/cover.webp
featured: false
translationKey: task-knowledge-level
---

> Originally published on [AWS Builder Center](https://builder.aws.com/content/3JCgxJbn6MqJGnINVPKo743K2Eg/para-los-agentes-no-todas-las-tareas-necesitan-el-mismo-conocimiento) (Spanish). First article in the Knowledge Driven Development (KDD) series.

When we talk about AI-assisted development, we tend to treat context as if it were a binary condition:
the model either has context or it does not. In practice, the problem is much more nuanced.

Changing the text of a button does not require the same level of knowledge as modifying a full
registration flow. Working on a small project, where a single person understands almost the whole
system, is also not the same as working in an organization with several teams, domains and
repositories.

That is why one of the ideas I find most useful when working with AI is this: **the knowledge an agent
needs should grow according to the scope of the task it is going to solve.** The challenge is not
giving it all the information possible, but giving it the right information.

## Context should grow with the task

![Context grows from Local to Module, System and Business](/blog/task-knowledge/context-grows.webp)

Let's think of a simple example. If we want to change a button's text from "Buy" to "Add to cart", it
is probably enough to know the component where that button lives, the frontend conventions and, maybe,
how the project handles internationalization.

We do not need to explain the whole system architecture or how the payment process works. But if the
task changes and we now want to keep the cart between sessions, the required context grows. Knowing the
visual component is no longer enough. We have to understand how state is managed, where information is
persisted, how the user is identified and what happens when they are not yet authenticated.

If we later want to allow guest purchases, the scope can grow even more and affect authentication,
checkout, orders, payments or even several repositories. The same product can require very different
levels of knowledge depending on what we want to change.

A practical way to think about it is to split that knowledge into four levels (related to Kaddo's
[Knowledge Levels](/knowledge-levels/)):

| Level | What it needs to understand | Example |
|---|---|---|
| **Local** | File, component, function and nearby conventions | Changing a validation or a piece of text |
| **Module** | The module's responsibility, dependencies and domain rules | Adding a new operation to the cart |
| **System** | Interactions between modules, services and repositories | Modifying the registration flow |
| **Business** | Goal, rules, constraints and expected outcome | Changing the user onboarding model |

The problem appears when we treat a task as local when it actually has systemic impact. For example, a
work item like "enable registration after the beta" can look like a simple backend change. However, the
frontend might still show a screen inviting users to register for the beta, there might be a feature
flag, or there might be an additional rule in another repository.

The agent could correctly implement the technical change and still leave the product goal incomplete.
In that case, the problem would not necessarily be the model's capability, but having worked with a
level of knowledge lower than the task's real scope.

## Team size also changes how knowledge is managed

![With larger teams, knowledge moves from implicit to shared](/blog/task-knowledge/team-size.webp)

The same logic applies as teams grow. In a project maintained by a single person, much of the
knowledge can be implicit. The developer remembers previous decisions, knows the dependencies and
understands why certain parts of the system work the way they do.

When the team grows, that model starts falling short: people specialized in frontend, backend,
infrastructure or product appear. Ownership by module, different repositories and decisions not
everyone knows about also start to exist.

A developer can understand their service perfectly and not know what happens before or after it in the
full flow; AI faces exactly the same problem. An agent working inside the payments repository can
understand that code very well, but that does not mean it knows how checkout creates an order or how
another service interprets the payment result.

As team size grows, knowledge needs to move from being mainly implicit to becoming something shared and
structured.

## The challenge is even bigger in multirepo projects

![A knowledge core related to the web, users, orders and payments repos](/blog/task-knowledge/multirepo.webp)

In distributed systems, this need becomes much more evident. Imagine a platform with four
repositories: web, users, orders and payments. Now a work item appears asking to allow guest purchases.
If an agent only analyzes users, it can propose a correct solution from an authentication standpoint. If
it works only in web, it might solve the visual part. If it goes directly into orders, it will probably
modify how the buyer is identified.

Each change can make sense within its repository and still not fully solve the need. Before
implementing, we need to understand the end-to-end scope: which modules take part, what responsibilities
each one has and which ones will probably need to change. That understanding must appear before entering
the code.

## The work item should also carry knowledge

![A work item gathers the knowledge needed to build the change](/blog/task-knowledge/work-item.webp)

With AI-assisted development, a work item stops being only a description of what we want to build. It
can also become the place where we gather the knowledge needed to build it correctly.

A good refinement should help us answer three things: what outcome we want to achieve, which parts of
the system take part and which changes are really necessary. Only after answering those questions does
it make sense to go down to the level of files, APIs, functions or components.

If we start directly from the code, we risk finding a local solution for a problem that was actually
systemic.

## How I am approaching this problem with Kaddo

![Kaddo assembles the right level of knowledge for each task](/blog/task-knowledge/kaddo-approach.webp)

This idea has influenced how I am refining [Kaddo](/knowledge-driven-development/) quite a bit. The goal
is not to always give an agent all the project's knowledge —that could introduce noise and unnecessarily
increase the context— but for the agent to work with the right level of knowledge for each task.

A small change can be solved with module context. A work item that affects a whole capability needs
additional information about architecture and product. In a multirepo solution, we first need a global
view that lets us identify which repositories are part of the scope. That is why Kaddo keeps business,
product, technology, delivery, architecture and ownership knowledge, and seeks to relate it to the work
items being refined.

On multirepo projects, moreover, one repository can act as the core of the general knowledge, while the
others keep the specific context of each module. This way, when a work item is refined from the core, it
is possible to assess the impact on different parts of the solution before starting implementation. The
intent is simple: understand the scope before building.

## More context does not always mean better context

![Too much context adds noise; what matters is relevant context](/blog/task-knowledge/more-context.webp)

There is also the opposite mistake: thinking the solution is to hand the model the whole repository, all
the documents and all the available decisions.

More information does not guarantee a better answer. Too much context can introduce noise, make it
harder to prioritize information and make the agent lose sight of what really matters for the task.

The goal should be to deliver enough knowledge for the decision being made: a local modification needs
local context, an architectural decision needs to understand the system, a feature that changes the user
experience may need to reach product and business. Context should grow proportionally to the scope.

## When the team grows, the project's memory must grow too

![Several teams and repos need a shared project memory](/blog/task-knowledge/project-memory.webp)

In small teams, many decisions can survive thanks to frequent conversations. However, when several
teams, domains and repositories appear, relying exclusively on people's memory stops scaling. At that
point we need a shared project memory.

Not necessarily more documentation, but better connections between what we already know: which module
belongs to whom, which decisions exist, which risks there are, which capabilities depend on which
components and what someone should know before modifying a given part of the system.

That knowledge not only helps people; it also becomes the base AI agents can work from. That is why, in
an AI-assisted development context, knowledge starts to work as part of the project's infrastructure.

## Conclusion

Not every task needs the same level of knowledge, and not every team can manage that knowledge the same
way. A small modification can be solved by understanding a few lines of code, while an end-to-end feature
may require business, product and architecture context across several repositories.

As the scope of a task grows and the knowledge is distributed across more people and systems, the
importance of having shared, traceable context close to the project grows too.

That is why, before asking which model to use or how to write a better prompt, it is worth starting with
a more basic question: **what does the AI need to know to correctly solve this task?** In AI-assisted
development, the quality of the solution is often defined before writing a single line of code.
