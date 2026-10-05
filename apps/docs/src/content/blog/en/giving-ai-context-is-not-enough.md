---
title: 'Giving AI context is not enough: AI-assisted development needs a full lifecycle'
description: Giving an AI agent context does not guarantee a correct result. AI-assisted development needs a full lifecycle that connects intent, planning, implementation, evidence, verification and learning.
publishedAt: 2026-09-29
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
  - sdlc
  - agents
locale: en
cover: /blog/cycle/cover.webp
featured: true
translationKey: cycle-complete-ai-development
---

> Originally published on [AWS Builder Center](https://builder.aws.com/content/3JsFSWtFxGITb1j8n0uwTMmfpxu/dar-contexto-a-la-ia-no-es-suficiente-el-desarrollo-asistido-necesita-un-ciclo-completo) (Spanish). Fifth article in the Knowledge Driven Development (KDD) series.

Over the last few months I have worked a lot around a single question: what does an AI agent really
need to build software correctly? The first answer seemed obvious: context.

An agent can have access to the repository and still not understand why a feature exists, which
business rules it must respect, which architectural decisions have already been made, or what the
product actually expects. That is why, from the start, Kaddo was built around a simple idea: project
knowledge should stay close to development and be reusable whenever humans or agents need to make
decisions.

However, as I used that approach on real projects a more interesting problem appeared: having good
context before you start does not guarantee that the final result is correct.

Between understanding a need and considering an implementation finished, many things happen:
technical decisions are made, new constraints appear, the agent can drift from the plan, files that
were not initially considered get modified, and in some cases the project itself learns something it
did not know before. That led to an important evolution in Kaddo.

## The problem does not end when the agent understands the task

In many AI-assisted development flows the process evolves from `Need → Prompt → Code` to
`Need → Context → Agent → Code`:

![From a direct prompt to a flow with context before the agent](/blog/cycle/problem.webp)

That improves the result a lot, but it still leaves important questions unanswered:

- How did the agent decide to approach the change technically?
- Which parts of the system did it end up modifying?
- Which validations did it run?
- Did the implementation actually meet the defined criteria?
- What did we learn during the process?

If those answers remain only inside a conversation with the agent, the project loses much of the
knowledge produced during implementation. So I started to think of AI-assisted development not just
as a context problem, but as a lifecycle problem.

## From intent to learning

Kaddo's Lifecycle v2 organizes that journey from the moment a need appears until the learning
generated during implementation can return to the project's knowledge.

The general flow is:

```text
Captured Intent → Refinement → Human Review → Ready → Implementation Handoff →
Human Confirmation → Implementation → Implementation Evidence → Verification →
Human Review → Completed → Learning
```

The intent is not to create more bureaucracy. On the contrary, each stage tries to solve a different
responsibility so that a single document does not have to explain everything.

The Work Item defines what we want to change and why. The Implementation Handoff helps decide how to
approach it. Implementation produces evidence. Verification contrasts that evidence against what was
originally requested. Finally, the relevant learnings can return to the project's knowledge. This
makes the process stop being linear and start behaving like a cycle.

## Refining does not mean designing the whole solution

A separation I find especially important is the one between refinement and implementation. During
refinement we try to understand what we want to change, why we need to do it, what behavior we
expect, which constraints exist, and how we will know the work is done. That does not mean we have
to decide every technical detail at that moment.

A Work Item reaches Ready when there is enough clarity to start deciding how to implement the change,
not when we have a gigantic specification. That difference lets us separate two conversations we
often mix:

- **Refinement** defines WHAT + WHY.
- **Implementation Handoff** defines HOW, using the project's current context.

![Refinement defines what and why; the handoff defines how](/blog/cycle/refinement.webp)

This separation is especially useful with agents, because it prevents a functional description from
ending up full of technical decisions that could become obsolete or depend on the current state of
the system.

## The Implementation Handoff: the right context just before building

Before modifying code, Kaddo can combine the Work Item with relevant project knowledge, system
context and repository context to produce an Implementation Handoff.

![The Implementation Handoff combines Work Item, knowledge, system and repository](/blog/cycle/handoff.webp)

That handoff can include the technical approach, affected areas, implementation steps, relevant
constraints, design decisions, alternatives, trade-offs and a validation strategy — but there is an
important principle: the depth of the handoff should be proportional to the change.

Changing a piece of text does not need the same level of deliberation as adding a full feature. In
the same way, an architectural decision requires more context than a localized modification.

The idea is not to generate more documents, but to give the agent the right amount of knowledge
before touching the system. This connects with something I have been exploring a lot in
[KDD](/knowledge-driven-development/): more context does not always mean better context. What matters
is delivering the knowledge that actually corresponds to the scope of the decision.

## Implementing and verifying are two different things

Another frequent problem in AI-assisted development appears when the agent finishes a task and simply
replies something like:

> "Implementation completed successfully."

![Implementation produces evidence; verification contrasts that evidence against the request](/blog/cycle/verification.webp)

That should not be enough.

Executing changes is one thing; demonstrating that those changes meet what was requested is a
different one. That is why the lifecycle includes Implementation Evidence.

The evidence can record what changed, which files or areas were modified, which validations were run,
which decisions emerged during implementation, what deviated from the initial plan, and which new
knowledge gaps appeared.

That information lets the next stage, Verification, not depend solely on what the agent claims to
have done. Verification can contrast the initial intent, the acceptance criteria, the validation
results, the exceptions and the evidence produced during implementation. So completing a Work Item
stops meaning simply changing its state to done.

## Human in the loop where it really matters

This cycle does not aim for the AI to make every decision either. There are points where human
review is still necessary, especially before starting a relevant implementation and before
considering a change fully finished.

The agent can analyze, propose, implement and gather evidence, but the team keeps the ability to
validate important decisions. This also keeps Kaddo neutral with respect to the agent used.
Implementation can run with Kiro, Claude, Codex, Cursor, Copilot, another agent, or even directly by
a person. Kaddo does not try to replace those tools: its responsibility is to maintain the
knowledge, the Work Item and the cycle around whoever is executing the change.

## Knowledge should also learn from implementation

Maybe the part of this cycle that interests me the most appears after the work is completed. During
an implementation we almost always discover things we did not know before: a technical constraint, an
unexpected dependency, a business rule, a new convention, or an architectural decision that ended up
being necessary.

If that knowledge stays only in the code or in the conversation with the agent, it will probably have
to be discovered again in the future. That is why the lifecycle ends with Learning. Relevant
learnings can return to the project's Knowledge and become context for future Work Items.

The cycle ends up looking like `Knowledge → Work Item → Implementation → Evidence → Learning →
Knowledge`:

![Knowledge returns to the project and the cycle closes](/blog/cycle/learning.webp)

There, knowledge stops being static documentation and starts evolving together with the software.

## From context for agents to a layer around delivery

This evolution also changed the way I see Kaddo as a product. Initially, the focus was mainly on
structuring the knowledge that agents need to work better. Now that knowledge can take part during
almost the whole journey of a change: definition, planning, implementation, evidence, verification
and learning.

Kaddo does not replace GitHub, Jira, the IDE or the agents used to program: it works as a knowledge
and coordination layer around delivery. This keeps traceability between what was requested, what was
understood, how it was planned, what was implemented, how it was verified and why it was finally
considered done. On projects with several people or several agents, that traceability becomes
especially valuable.

## Context should also be proportional

Another principle that holds within this evolution is avoiding that each Work Item carries all the
available knowledge of the project. Knowledge stays separate and context is assembled according to
what each change needs.

A small change requires little context. A change across several modules needs a broader view. An
architectural modification requires deeper knowledge of the system. This avoids turning every Work
Item into a huge document and lets the project's memory keep growing without forcing every agent to
process all of it.

The goal is not to maximize context, it is to maximize relevant context.

## Kaddo now builds Kaddo

One of the most interesting tests of this lifecycle was applying it to the project itself. During the
last iterations, Kaddo incorporated the capabilities needed to replace the flow that previously
depended on OpenSpec. Then we started building real Work Items using exclusively the native lifecycle
until we removed OpenSpec from the active workflow.

Even the work needed to remove OpenSpec was managed as a Kaddo Work Item. In other words: Kaddo
defines work with Kaddo, plans it with Kaddo, implements it with Kaddo, verifies it with Kaddo, and
uses what it learned to keep improving Kaddo. I summarized that milestone a while ago in one phrase:
"Build Kaddo with Kaddo".

![Kaddo defines, plans, implements and verifies Kaddo with Kaddo](/blog/cycle/dogfooding.webp)

It does not mean the cycle is finished. Friction and opportunities to simplify it will surely keep
appearing, but it does represent something important: Kaddo can already evolve using the same
principles it proposes for other projects.

## AI-assisted development needs memory, not just prompts

The most important evolution for me is not having added more states to a Work Item; it is
understanding that AI-assisted development needs to connect several things that are usually separate:

```text
Knowledge + Intent + Planning + Implementation + Evidence + Verification + Learning
```

Agents will keep improving and will increasingly be able to execute more work on their own, but
precisely because of that we need better mechanisms to keep intent, context, evidence and learning
around what they do.

Kaddo's goal remains the same: that agents do not build software only with the code in front of them,
but with the knowledge needed to make better decisions within the project.

The difference is that now that knowledge can accompany much more of the development cycle, because
giving context to the AI is important, but knowing what happened after you gave it is even more
important.
