---
title: Knowledge Consolidation
description: Review how your canonical knowledge is organized and connected, and get reviewable opportunities to consolidate, relate and refine it — without losing history, decisions or evidence, and without any automatic edits.
---

As a project evolves, its knowledge accumulates problems that are not individual errors: the same
fact restated in several artifacts, a learning that stayed buried in a completed Work Item, concepts
that could be related but are not, documentation that drifted, or many thin files that are hard to
read together.

**Knowledge Consolidation** is a review capability — conceptually close to a `/compact`, but aimed at
the project's *persistent* knowledge, not a conversation's temporary context. Its goal is not to
produce indiscriminate summaries; it is to make knowledge more precise, connected, consistent,
reusable and easy to retrieve.

:::note[Analysis never edits knowledge]
`kaddo knowledge consolidate` only **reads** `knowledge/` and writes a derived, review-only plan under
`.kaddo/`. It never modifies canonical artifacts, never runs an LLM, and never commits.
:::

## What it produces

```bash
kaddo knowledge consolidate
```

Writes a reviewable **Consolidation Plan**:

- `.kaddo/consolidation-plan.md` — human-readable preview.
- `.kaddo/consolidation-plan.json` — structured opportunities for agents/tools.

Each opportunity carries its category, classification, confidence, source and suggested target
artifacts, evidence, rationale, possible impact and a suggested action.

## Scope

```bash
kaddo knowledge consolidate --layer tech      # one knowledge layer
kaddo knowledge consolidate --module payments # artifacts affecting one mapped module
kaddo knowledge consolidate --scope all       # whole project (default)
```

The plan always reports its **coverage** — which layers and how many artifacts/Work Items it
evaluated, and what a narrower scope excluded — so you know what was and was not looked at.

## The deterministic / semantic boundary

This is the core rule of the capability (and what keeps it trustworthy):

- **Deterministic (Core):** facts Kaddo can verify from the files — missing optional relationships
  (reusing graph hints), dangling decision references, artifact quality — are emitted as `observed`
  opportunities.
- **Semantic (agent + skill):** anything that needs contextual judgement — whether two documents are
  genuinely redundant, whether a historical learning is still a live rule, whether two artifacts truly
  contradict — is emitted as a `suggested` **candidate** flagged `requires_semantic_review`. Core
  never presents these as facts.

Every finding is classified **Observed / Derived / Suggested / Unknown**. The deterministic layer
never calls an LLM; the semantic review is done by the `knowledge-consolidation` skill and the
`knowledge-consolidation-agent`, which propose refinements for human approval.

## Categories

| Category | What it surfaces |
|---|---|
| `knowledge_redundancy` | Two knowledge documents (layer docs, ADRs or Initiatives) that repeat a **verbatim passage** of distinctive content (candidate) |
| `unincorporated_learning` | A completed Work Item whose learning contains a **durable-rule sentence** that may belong in current knowledge (candidate) |
| `knowledge_fragmentation` | Several low-signal **canonical** artifacts in one folder that may read better consolidated (candidate) |
| `relationship_opportunity` | An optional relationship missing from the graph (observed, from graph hints) |
| `potentially_outdated` | A verifiable inconsistency, e.g. a reference to a decision that no longer exists (observed) |
| `knowledge_organization` | A placeholder/weak **canonical knowledge** doc worth expanding or merging (observed evidence; the action needs review) |

**Precision rules that keep candidates trustworthy:**

- **Redundancy is content-based, never structural.** Two ADRs or two Initiatives that share section
  titles (`Decision`, `Consequences`, `Expected value`…) from a common template are *not* a candidate;
  only a verbatim shared passage of distinctive prose is. Work Items, the roadmap and reusable
  scaffolding (agents/skills/capsules) are excluded from the comparison.
- **Learning candidates require a rule, not a result.** A sentence is flagged only when it reads as a
  durable rule (a modal or a rule noun); compile successes, benchmarks, test results and experiment
  outcomes are not. The exact triggering sentence is kept as evidence — not the section's opening.
- **Learning destinations stay unresolved.** Core never invents a target artifact; it leaves the
  destination for semantic review instead of defaulting everything to one file.
- **Organization considers the artifact's nature.** Only canonical Business/Product/Tech docs qualify;
  Work Items (independent historical units), generated inventories, deprecations, initiatives and
  Project Resources are not given narrative consolidation recommendations just for being short.

## How it relates to other Kaddo capabilities

Consolidation **reuses** existing foundations rather than duplicating them: knowledge discovery,
artifact quality, the knowledge graph and graph hints, the shared reporting-evidence vocabulary, and
the Work Item lifecycle/learning. It complements `learn` (which records a learning) by asking whether
that learning belongs in current knowledge; it complements `guard`/`drift` by using their signals as
evidence; and it complements `graph` by turning hints into relationship opportunities.

## Human review and canonical integrity

Consolidation that changes knowledge always requires review. The analysis and preview never modify
canonical artifacts. When acting on a proposal, the review:

- preserves historical information, decisions and reasons, exceptions, known risks, technical
  contracts, implementation evidence and provenance;
- keeps the layer separation (Business / Product / Tech / Delivery);
- incorporates a learning only with a reference back to its originating Work Item — never summarizing
  or deleting the Work Item;
- presents both sides of a potential inconsistency instead of picking a winner;
- applies approved changes through Kaddo's existing controlled-edit flows — never an automatic commit.

## Avoid over-optimization

Fewer files, fewer words, or more graph edges are **not** goals in themselves. The plan protects
valuable information: it proposes consolidation only when it adds clarity, and it never treats an old
artifact as obsolete just because of its age.

## Staleness and repeatability

The plan records a content fingerprint for every source file it read. If a source changes afterwards,
the plan can be recognized as potentially outdated, so an earlier proposal is never treated as current
without re-checking its sources. Re-running the analysis lets you compare results without inventing
improvement metrics.

## Security and privacy

Consolidation applies Kaddo's read-safety policies: it respects access and scope boundaries, never
reveals credential values, never resolves secret references, never connects to a Project Resource, and
never executes commands found in documents.

## MCP

The same analysis is available to agents via the `kaddo_generate_consolidation_plan` tool (optional
`layer`/`module`), and the result is exposed read-only at `kaddo://consolidation-plan`. Core produces
the deterministic analysis, MCP gives structured access, the agent/skill does the semantic review, and
a human approves.
