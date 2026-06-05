---
title: Kaddo Manifesto
description: Knowledge Driven Development — software guided by knowledge, living architecture, minimum context, and traceable evolution.
---

Software does not degrade only because code ages. It degrades because knowledge is lost.

It is lost in meetings no one documented, in unsearchable chats, in tickets closed without context, in architectural decisions that stayed in someone's head, in legacy systems that keep working even though no one knows exactly why, and in changes that look small but end up affecting critical parts of the product. For years we accepted this loss as a normal part of software development.

Kaddo starts from a different idea: product knowledge should be treated as a living piece of the system. Not as decorative documentation, not as a formality after coding, nor as a graveyard of Markdown files no one reads again. Knowledge must guide how we understand, design, change, validate, and evolve software.

We call this **Knowledge Driven Development.**

## The core idea

Kaddo proposes a simple cycle:

**Classify → Capture → Structure → Build → Learn**

Every change should be able to answer:

- What do we want to change?
- Why do we want to change it?
- What part of the product does it impact?
- What existing knowledge is affected?
- What decision, design, or context must be updated?
- What did we learn after making the change?

The goal is not to write more documentation. The goal is to preserve the minimum sufficient knowledge so that humans and artificial intelligence can build software with less ambiguity, less rework, and more traceability.

## The macro flow of a project

Beneath that per-change cycle, Kaddo frames the project as a whole through four macro layers:

**Business → Product → Tech → Delivery**

This is the macro concept that governs the project end to end. Each layer answers one question and stays connected to the one above it:

- **Business** — _why does it exist?_ problem, users, constraints, business rules, value.
- **Product** — _what do we build?_ product brief, capabilities, scope, goals.
- **Tech** — _how do we build it?_ codebase, decisions, modules, stack, standards.
- **Delivery** — _how do we evolve it?_ roadmap, work items, ownership, learning.

Knowledge flows down these layers — so product answers to business, tech answers to product, and delivery answers to all three. Physically, the knowledge repository mirrors them: `knowledge/business/`, `knowledge/product/`, `knowledge/tech/`, `knowledge/delivery/`.

Every project state enters and traverses these layers differently:

- **new** — start at Business and build the layers from an idea (this is what `kaddo bootstrap` does today).
- **pre-AI** — _phases to be defined._ The layers already exist implicitly in the code; Kaddo reconstructs them upward into explicit knowledge.
- **legacy** — _phases to be defined._ The layers are entered cautiously, understanding before changing.

The per-change cycle (Classify → Capture → Structure → Build → Learn) operates _inside_ these layers; the layers give the project its shape, the cycle keeps it alive.

## The problem Kaddo wants to solve

Many teams do not have a tooling problem. They have a context problem.

The code exists, but the reasoning behind the code does not always exist. The architecture exists, but it is not always connected to the decisions that shaped it. The roadmap exists, but it is not always connected to the product's real capabilities. The tickets exist, but they do not always explain the impact. The documentation exists, but it is often out of date.

And now, with AI, this problem gets bigger. An AI agent without context does not build on knowledge: it builds on assumptions.

That is why Kaddo does not put AI at the start of the process. First it organizes knowledge; then it lets AI help build. AI does not replace product knowledge: AI needs good knowledge to be useful.

## The north star

Kaddo's central question is:

**How does Kaddo know that the correct knowledge was impacted by this change?**

That question guides the whole system. It is not just about knowing which files changed, but about understanding which artifacts, decisions, domains, capabilities, contracts, or risks could be related to that change.

If someone modifies `src/payments/**`, Kaddo should be able to suggest:

> "This change touches the payments domain. There is a related ADR, capability, or contract. Check whether the knowledge is still valid."

That does not need magic from day one. It needs a clear relationship between code and knowledge.

## Core principle

Knowledge guides the evolution of the product. The expected cycle is:

```
Knowledge → Context → Architecture → Decisions → Roadmap → Work Items → Code → Learning → Updated knowledge
```

Code should not evolve disconnected from knowledge. Every important change should strengthen the understanding of the system, not make it more opaque.

Frameworks can change, AI models can change, tools can change, and teams can change. But the product's knowledge must survive.

## What Kaddo is

Kaddo is an open source toolkit for applying Knowledge Driven Development in new, existing, or legacy projects. It is not meant to be just a boilerplate for AI agents, nor to replace management tools, agent frameworks, orchestration platforms, agile methodologies, or documentation systems.

Kaddo aims to occupy a deeper layer: the layer of the product's living knowledge. Its purpose is to help teams build products that are more understandable, governable, traceable, evolvable, and less dependent on oral memory.

Kaddo does not want to generate documentation for the sake of documentation. It wants the correct knowledge to be available when the team or an agent needs it.

## What Kaddo is not

Kaddo is not a replacement for Jira, Linear, GitHub Issues, or Trello. It is not an agent framework, an AI platform, or a heavy methodology. It is not an enterprise system that forces you to map the whole company before writing a single line of code, nor an excuse to bureaucratize development.

Kaddo must ask little, deliver fast, and grow only when the project needs it. The rule is simple: more context when there is more risk; less context when the change is simple. Because not every change deserves the same level of analysis.

Changing a text should not require a committee, but migrating payments does deserve more care. Updating a color does not need an ADR, but changing a critical integration probably does. Kaddo must understand that difference.

## Minimum Sufficient Knowledge

One of Kaddo's most important principles is minimum sufficient knowledge. It is not about asking for documents, but about asking for the answers needed based on the impact of the change.

Kaddo organizes this into knowledge levels:

**K0 — Trivial change.** Small changes like text, CSS, or minor visual tweaks. No additional context required.

**K1 — Hotfix or simple fix.** The problem and expected result must be clear.

**K2 — Feature or functional bugfix.** Must include problem, impact, and acceptance criteria.

**K3 — Capability, integration, or relevant functional change.** Must include sufficient design, impact, acceptance, and related artifacts.

**K4 — Architectural change, migration, or high-risk decision.** Must include ADR, risks, alternatives, mitigation, or rollback.

This model lets Kaddo be lightweight when the change is simple and more rigorous when the change can affect architecture, operation, or business. Documentation is not measured by quantity; it is measured by sufficiency.

## Work Items as the minimum unit of change

Kaddo uses Work Items as traceable units of change. A Work Item is not just a task: it is a way to connect intent, context, decision, implementation, and learning.

A Work Item can be a bugfix, hotfix, feature, capability, spike, RFC, migration, architecture change, incident, or vertical slice.

Not everything must be a vertical slice, not everything must be an ADR, and not everything must go through the same flow. Each type of change needs the appropriate level of knowledge.

## Knowledge Repository

Kaddo proposes that each project have a knowledge repository. It can live inside the code repository itself or in a dedicated architecture repository, and it can include files like `knowledge.md`, `roadmap.md`, `knowledge/`, `work-items/`, `contracts/`, `capabilities/`, `incidents/`, and `.kaddo/config.yml`.

The idea is not to create a pretty folder. The idea is to build a living source that explains what the product is, how it is organized, what decisions shaped it, what capabilities it has, what contracts it exposes, what risks exist, and what knowledge must be updated when the system changes.

## Knowledge ownership

One of the risks of any documentation system is creating another place that also goes out of date. That is why Kaddo avoids depending on a central file where someone has to manually maintain relationships like `payments → ADR-004`.

Instead, each artifact declares what it protects. For example, an ADR can declare that it is related to the payments domain, the payment-processing capability, the files `src/payments/**`, certain contracts, and certain owners.

This way, knowledge does not live in a fragile central map: it lives distributed in the same artifacts that explain the system. Each artifact is born with its relationships.

## Knowledge Graph

From the declared ownership, Kaddo can build a Knowledge Graph. This graph connects:

```
Artifacts → Domains → Capabilities → Code → Contracts → Decisions → Learnings
```

In its initial version, the graph can be very simple: an artifact declares code globs, Kaddo reads the git diff, detects that related code was touched, and suggests reviewing the artifact.

Over time, that graph can grow and incorporate domains, capabilities, owners, contracts, events, incidents, runtime signals, change history, and impact evidence.

The graph is the long-term differentiator, but it must not block the MVP. Kaddo must start simple and improve with the team's real usage.

## Guard Lite

Guard Lite is the first practical version of the knowledge protection system. Its job is not to "understand everything". Its initial job is much humbler: read the diff, read the globs declared in artifacts, cross both, and warn when code related to knowledge that did not change was touched.

For example:

> "`src/payments/payments.service.ts` was modified. ADR-004 declares ownership over `src/payments/**`. ADR-004 was not updated. Check whether the decision still reflects the implementation."

That already adds value. It does not block by default, it does not invent magic percentages, it does not pretend to be smarter than it is, and it does not generate noise if there is no declared ownership. It just says: "There is a possible relationship. Review it."

And that, in many teams, is already a lot. Almost like that teammate who does not code but remembers everything. Only without asking for coffee.

## Governance by exception

Kaddo does not believe everything must go through approval. Everyday knowledge does not need bureaucracy; governance should appear when there is risk, impact, or relevant decisions.

That is why Kaddo proposes governance by exception: in personal projects no owner is needed; in small teams the PR can be the natural review; in mid-size teams the Tech Lead reviews by exception; and in enterprise environments Domain Owners review only the changes in their domain.

The idea is not to slow the team down. The idea is to protect knowledge where it really matters.

## Current State vs Historical Knowledge

Kaddo distinguishes between knowledge that represents the product's current state and historical knowledge. The current state answers *what is true now?*; the historical answers *why did we get here?*. Both are important, but they should not be used the same way.

The current state can live in `knowledge.md`, `roadmap.md`, `capabilities.md`, `contracts/`, `module.md`, and `.kaddo/config.yml`. The historical can live in ADRs, RFCs, Work Items, Vertical Slices, incidents, migrations, release notes, and learnings.

Kaddo does not delete history: it turns it into evidence. But the runtime should not load all history for every action; first it must consult the current state and only load historical artifacts when they are relevant. History explains; the current state guides.

## Context efficiency

Kaddo does not only seek to improve knowledge quality; it also seeks to improve context efficiency. A living knowledge system fails if answering one question requires loading all the project's documents.

That is why Kaddo must act as a context selection engine. It must prefer metadata over full documents, summaries over full artifacts, related artifacts over global context, deterministic analysis over unnecessary LLM calls, and small, explainable context over giant prompts.

The full manifesto must not be loaded on every execution. Operational rules must live in compact files like `.kaddo/rules.md`, and project knowledge must be exposed with enough metadata, summaries, ownership, and relationships so that Kaddo knows what to load and what to ignore.

The goal is not to send more information to the agent. The goal is to send the correct information.

## Classification and Classification Drift

Kaddo lets you declare what type of change is being made, but it can also observe signals in the diff. For example, someone can declare "this is a bugfix", but the diff shows a database migration, changes to API contracts, infrastructure modification, or critical dependency updates.

In that case, Kaddo can suggest:

> "This may be more than a bugfix. Consider classifying it as feature, migration, or architecture change."

Kaddo does not replace the human decision: it contrasts what was declared with what was observed. The goal is not to punish, but to prevent big changes from sneaking in disguised as small changes. Because we have all seen that "quick fix" PR that ends up touching half the system. A classic episode of technical horror.

## Evidence Score, not false magic

Kaddo avoids showing confidence percentages that look scientific but are actually heuristic. Instead of saying "Confidence: 92%", Kaddo should say:

> "Evidence: 3 of 3 related globs were touched; the artifact is K4; the domain is critical; there is an associated capability."

The signal must be explainable. A number without an explanation creates false confidence; transparent evidence creates trust. If Kaddo cannot explain why it suggests something, it should not show it as truth.

## Diff Analysis Core

Kaddo should not have three different engines reading the same git diff. There must be a common diff analysis core that feeds Knowledge Drift, Classification Drift, the Classification Engine, Guard, and future plugins.

That core answers questions like: was code related to existing artifacts touched?, was the related knowledge updated?, does the declared classification match the observed signals?, what K level might apply?, and what type of Work Item seems most appropriate?

The base must be simple, deterministic, and extensible: filesystem and git first, AI later if needed.

## Cold start

Kaddo understands that a project is not born with a complete Knowledge Graph, and that a legacy system cannot be fully mapped before starting either. That is why Kaddo must have graceful degradation.

In a new project, Guard Lite can stay silent until the first artifact with declared ownership exists. In a brownfield or legacy project, Kaddo must not require documenting the whole company before making a change.

The rule is `touch the domain, improve the graph`: when you touch a domain, you improve the knowledge of that domain. Not before, not all at once, not as punishment. The graph grows with real work.

For new projects, Kaddo offers a guided bootstrap so a project can be born with context: it captures the minimum sufficient knowledge across the base layers — `Business → Product → Tech → Delivery` — before code is written, without generating code or deciding the architecture automatically.

**Knowledge grows progressively.** Not all knowledge must exist at the start. Bootstrap creates only one consolidated file per layer (`business.md`, `product.md`, `codebase.md`); specialized documents (`problem.md`, `users.md`, `capabilities.md`, …) and the rest of the agents appear later, as the project earns them. Kaddo should feel light at the beginning and grow with real work — never more files than knowledge, never more agents than needs.

**Knowledge is discovered progressively, but reality and intent must remain distinct.** What we plan (`codebase.md`) is not the same as what is actually built (`current-state.md`), and neither is the same as why we decided it (an ADR) or what the tools detected (`scan.json`). Kaddo keeps these separate so the project never confuses a plan with the truth.

## Quality Gates

A Quality Gate in Kaddo does not validate the amount of documentation; it validates knowledge sufficiency. For K0 there may be no gate; for K1 problem and expected result are enough; for K2 acceptance criteria are needed; for K3 sufficient design and reviewed related artifacts are needed; and for K4 ADR, risks, alternatives, and a mitigation or rollback plan are needed.

A change is done when the code works, the relevant tests pass, and the affected knowledge is updated or explicitly marked as not impacted. That last point is key: knowledge is not updated "if there is time left". It is part of the Definition of Done.

## Kaddo modules

Kaddo Core must be small. It must include the minimum to start: classification, Knowledge Levels, Work Items, ownership, Guard Lite, and base configuration.

Then the project can grow with modules:

- **ADR Module** — To record architectural decisions.
- **RFC Module** — To explore relevant changes before building them.
- **Migration Module** — To handle data, infrastructure, or technology changes.
- **Incident Module** — To document incidents, learnings, and preventive actions.
- **Legacy Module** — To understand systems with technical debt or low knowledge.
- **Contracts Module** — To connect APIs, events, and integrations with knowledge.
- **Capabilities Module** — To map product capabilities.
- **Guard Advanced Module** — For Evidence Score, Classification Drift, CI, and deeper analysis.
- **Agents Module** — To add reusable agents once the team already has enough structure.
- **Skills Module** — For reusable capabilities across agents, teams, or projects.

None of this should be mandatory from the start. Kaddo grows out of need, not by default.

## Kaddo CLI

Kaddo must have a realistic CLI. It must not promise to magically guess the whole architecture: it must detect the cheap stuff and ask about the ambiguous.

It can detect stack, framework, dependencies, project structure, migration folders, contract files, lockfiles, and infrastructure. But it should ask for human confirmation on domains, capabilities, criticality, ownership, and the relationship between artifact and code.

Expected commands:

- `kaddo init` — Initializes the base structure.
- `kaddo bootstrap` — For new projects: builds the initial knowledge base across Business → Product → Tech → Delivery.
- `kaddo scan` — Detects structure, stack, and possible domains.
- `kaddo create` — Creates Work Items or artifacts.
- `kaddo guard` — Checks changes against declared ownership.
- `kaddo status` — Shows the knowledge state.
- `kaddo explain` — Explains the project for humans or agents.
- `kaddo learn` — Records learning and updates the current state.
- `kaddo classify` — Contrasts declared classification with observed signals.
- `kaddo history` — Queries history by domain, artifact, or range.

The `kaddo explain` command is especially important because it turns the Knowledge Repository into human onboarding and efficient context for agents.

## Open Source and extensibility

Kaddo must be open source and extensible, but extensible does not mean messy. The community must be able to contribute templates, modules, agents, skills, plugins, real examples, and per-stack integrations.

But each extension must declare what it does, when it is used, what files it installs, what inputs it needs, what outputs it produces, how it is validated, and what its limits are. Extension contracts prevent Kaddo from becoming a chaotic collection of prompts and folders. Extensibility must have structure.

## Design principles

Kaddo rests on these principles:

1. **Knowledge guides development.** Code must evolve connected to the product's knowledge.
2. **Less documentation, more sufficiency.** Documentation is not asked for by quantity. The minimum necessary context is asked for based on impact and risk.
3. **AI needs context before instructions.** An agent without product knowledge can only guess.
4. **The MVP must be small.** Kaddo must install fast, ask little, and add value from the first artifact.
5. **The graph grows incrementally.** Not everything is mapped at the start. Knowledge improves when a domain is touched.
6. **Governance appears by exception.** Not every change needs formal review. Only changes with relevant risk or impact.
7. **Evidence must be explainable.** Kaddo must show signals, not magic percentages.
8. **Current state and history are not the same.** The current state guides. History explains.
9. **Knowledge should be easier to discover than code.** Agents should not have to wander through
   a repository just to infer the product, architecture, ownership and roadmap before they can
   make a decision.
10. **Context must be efficient.** Kaddo must load the minimum necessary, not the whole knowledge repository.
11. **Extensions are optional.** Modules, agents, skills, and plugins add value, but must not be a Core requirement.
12. **Affected knowledge is part of the Definition of Done.** A change is not done just when the code compiles. It is done when the relevant knowledge is updated or justified.
13. **Kaddo must be honest.** If it cannot detect something with certainty, it must ask for confirmation or show limited evidence. Better useful and clear than magical and false.

## The vision

Kaddo starts with a humble MVP: classify changes, create Work Items, declare ownership, read git diff, and alert when related knowledge might become out of date.

But its vision is bigger: to build a layer of living knowledge that lets humans and AI evolve digital products with more clarity, continuity, and traceability.

Kaddo does not want each team to document more. It wants each team to lose less knowledge. It wants decisions to survive the passage of time, legacy systems to be understood progressively, new projects to be born with context, and AI agents to work on real knowledge rather than giant prompts full of noise. It wants every important change to leave the product a little clearer than before.

## Closing

Kaddo does not try to solve the whole living-knowledge problem in its first version. It must start small, it must be installable, it must ask little, and it must add value fast. But without betraying its differentiator: building, little by little, a reliable answer to the question **how do we know that the correct knowledge was impacted by this change?**

Kaddo's advantage is not in generating ADRs, RFCs, Work Items, agents, or skills. Anyone can copy that. The advantage is in connecting those pieces so that the product's knowledge evolves together with the code.

The MVP must be humble. The vision can be ambitious. Because the future of development with AI will not be just writing code faster: it will be building systems that better understand what they are changing.

Kaddo brings Knowledge Driven Development to AI-assisted software development: software guided by knowledge, living architecture, minimum context, and traceable evolution.

## Origin

**Knowledge Driven Development (KDD)** is a prior concept in software engineering and knowledge management — Kaddo did not invent it. Kaddo is a **practical implementation of KDD principles for the AI era**: LLMs, agents and modern repositories.

Kaddo was created by **Julian Dario Luna Patiño** out of years of designing architectures, leading teams and documenting systems — and the conviction that, with AI in the loop, projects need their knowledge to live next to the code. The goal is not to write code faster, but to build systems that understand what they are changing — while critical decisions remain human. See [Knowledge Driven Development](/knowledge-driven-development/) and [About](/about/).
