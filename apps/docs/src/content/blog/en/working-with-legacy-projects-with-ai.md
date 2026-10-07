---
title: How to work with legacy projects using AI without breaking what already works
description: AI does not remove the uncertainty of a legacy system by itself. A safe approach makes risks, unknowns and dependencies visible before changing code.
publishedAt: 2026-10-05
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - legacy
  - migration
  - software-architecture
locale: en
cover: /blog/legacy-ai/cover.webp
featured: false
translationKey: legacy-ai-modernization
---

> Originally published on [AWS Builder Center](https://builder.aws.com/content/3KHwuq79rg4dyQPg2oaSrt13YKV/como-trabajar-con-proyectos-legacy-con-ia-sin-romper-lo-que-ya-funciona) (Spanish). Fifth article in the Knowledge Driven Development (KDD) series.

## Understand a legacy system before modernizing it

It is easy to imagine the ideal AI development scenario: connect an agent to the repository, ask it
to understand the system, then refactor, update dependencies or replace old components. Legacy
systems are different. Code can show what a system does, but not necessarily why it does it.

An apparently unnecessary condition may protect an undocumented business rule. Duplication may exist
because customers or countries behave differently. An old dependency may sustain a critical process
that still runs every day. When AI enters a legacy project, its first responsibility should not be
to change code. It should help reduce uncertainty.

That is the principle of Kaddo's legacy approach: **understand before changing, then carry that
understanding through the whole change lifecycle.**

## Legacy does not simply mean old code

![A legacy system requires understanding knowledge and dependencies, not only its technology](/blog/legacy-ai/legacy-definition.webp)

A system is not legacy merely because it uses an old version of Java, .NET or PHP. Even a recent
project becomes legacy when nobody understands its dependencies, important decisions are missing, or
people are afraid to touch a part of it because they do not know what might break.

The risk lies not only in what we know about the code, but in what we do not know. A known shared
transaction is a risk to mitigate; not knowing who consumes a table or why a validation exists is an
unknown to investigate. Treating them separately is safer than letting an agent fill the gap with an
assumption.

## Turn uncertainty into explicit knowledge

![Risks, unknowns and modernization candidates become explicit knowledge](/blog/legacy-ai/uncertainty.webp)

Kaddo begins by assembling a clearer picture from technical signals, existing context and agent
assistance. The result distinguishes three forms of knowledge:

- **Known risks**: areas where a change could have significant consequences.
- **Unknowns**: questions we cannot yet answer confidently.
- **Modernization candidates**: opportunities worth validating, not implementation commitments.

Rather than declaring that a module must be replaced, we can record that it appears to be a candidate
because it concentrates dependencies and known risks. That preserves uncertainty and keeps an early
observation from becoming an architectural decision too soon. This matters with AI: models can
produce plausible explanations, but legacy work must show when those explanations remain hypotheses.

## Current architecture comes before future architecture

![Current architecture and product capabilities guide safe modernization](/blog/legacy-ai/current-state.webp)

Modernization discussions quickly jump to services, containers, events or serverless. Yet a target
architecture has little value if the current one is not understood. Before deciding how to modernize,
we should know which capabilities each module supports, who depends on it, which integrations are
critical, where risk is concentrated and what remains unknown.

Kaddo relates the current system state to product capabilities. The goal is not diagrams for their
own sake, but understanding which software parts support value and which require extra care. In a
legacy project, `current state` is the basis for deciding whether `target state` makes sense.

## Modernization does not mean a rewrite

![Modernization must preserve behavior and validate impact before replacement](/blog/legacy-ai/modernization.webp)

Agents make a rewrite look tempting because they can generate code quickly. But generating code is
rarely the hardest part of replacing a legacy system. The hard part is reproducing accumulated
behavior: undocumented business rules, validations, queries, integrations and user expectations.

AI can help discover opportunities; it cannot automatically recover lost knowledge. That is why
modernization candidates remain candidates. Before turning one into work, the team needs to
understand its impact, dependencies and value. The decision still requires context and human
judgment.

## Make small changes with relevant context

There is no need to understand every part of a legacy system before touching anything; that can become
an endless project. Small changes are more useful when they deliver value and teach us something:
validating a hypothesis, confirming a dependency or checking an integration. A roadmap can order
those steps so early changes carry controlled risk and produce knowledge for the next ones.

That knowledge must reach the implementer. Once a Work Item is ready, the
[Implementation Handoff](/workflow/) brings the relevant risks, unknowns and candidates into the
change. The agent does not need the whole history of the system; it needs the context relevant to the
decision at hand. `kaddo guard` likewise makes it visible when changed files intersect with known
risk areas. It does not block the change; it restores memory when it matters.

## Implementing is not finishing

In a partially understood system, an agent changing code and running a few tests is not enough to
declare work done. Implementation describes what happened; verification establishes whether it meets
the actual need.

Kaddo gathers implementation evidence: changed files and areas, validations run, decisions made,
deviations from the plan and newly discovered knowledge gaps. `verify` then compares that evidence
with the acceptance criteria and original intent. The question shifts from “did you finish?” to
“what changed, and what evidence shows it meets the request?”

## Every change should increase system knowledge

![Learning from each change returns as context for the next one](/blog/legacy-ai/learning-loop.webp)

Imagine discovering that an apparently internal table is also used by an undocumented nightly job. If
that finding remains only in an agent conversation, the next person must learn it again. It should
return to the project.

Kaddo includes `learn` in the lifecycle so Work Item learning can update risks, resolve unknowns,
reclassify findings or add constraints. The loop becomes:

```text
Understand -> Small change -> Verify -> Learn -> Better context
```

For legacy systems, this lets knowledge grow at the same pace as modernization. The goal is not to
pause a project for perfect documentation, but to learn while evolving the system.

## Modernization starts by reducing uncertainty

Kaddo does not automatically turn a monolith into microservices or replace a team's judgment. The
CLI gathers signals and evidence; agents help interpret, form hypotheses and identify risks; people
retain decisions with real impact. Its value is continuity: knowledge discovered during analysis does
not disappear during implementation, and learning becomes available for the next change.

A legacy system begins to stop being legacy when we recover the ability to understand it, change it
and learn from it without depending on the fear of breaking what already works. See the
[legacy project workflow](/use-cases/legacy-project/) to put this approach into practice.

