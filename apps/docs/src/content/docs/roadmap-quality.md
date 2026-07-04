---
title: Roadmap Quality
description: Kaddo grades how well roadmap candidates are grounded in a capability domain, a related capability and a source signal — so priorities are traceable to real project knowledge instead of invented ideas.
---

A roadmap candidate shouldn't be an idea from nowhere. Every candidate should be **traceable** to
something Kaddo already knows about the system: a capability domain, a related capability and a source
signal (a capability gap, an open question, a drift, a decision candidate). Kaddo grades that grounding
and surfaces it — without blocking the roadmap (VS-077).

Grounding is **quality guidance, not a hard gate**. You can still write simple candidates; Kaddo just
tells you which ones are grounded and which need refinement.

## What makes a candidate grounded

A roadmap candidate (a `### RM-xxx` heading in `knowledge/delivery/roadmap.md`) is **grounded** when it
carries all three:

| Field | Meaning |
|---|---|
| Related domain | the capability domain the candidate belongs to |
| Related capabilities | one or more capabilities it touches |
| Source signals | the traceable reason — capability gap, open question, drift, decision candidate |

The parser is format-tolerant: it accepts both `- Related domain:` bullets and `**Related domain:**`
inline fields, and each field can carry an inline value or an indented sub-bullet list.

## Roadmap quality status

Kaddo computes a `roadmap_quality` summary from the candidates:

```bash
kaddo explain          # shows a ## Roadmap Quality section
kaddo context          # carries the same summary into the context pack
kaddo understand       # nudges you to ground or to create --from roadmap
```

The summary counts `candidates`, `grounded`, `with_related_domain`, `with_related_capability`,
`with_source_signals`, and sets `needs_refinement` when at least one candidate isn't grounded. When
every candidate is grounded, `understand` suggests materializing them with
`kaddo create --from roadmap`; when some need refinement it recommends the **roadmap-agent** to add the
missing domain / capability / source signals.

This is deterministic and read-only: the CLI never invents domains or capabilities, never calls an LLM
and never runs git.

## Over MCP

Agents can query grounding directly via the read-only resource `kaddo://roadmap-quality`, which returns
the same object as the `## Roadmap Quality` block (`candidates`, `grounded`, the per-field counts,
`needs_refinement` and `items`). The CLI and MCP share the same `buildRoadmapQuality(dir)` source, so
the resource is deterministic and never writes anything.

## Metadata carried into Work Items

When you materialize a grounded candidate with `kaddo create --from roadmap`, the new Work Item's front
matter preserves the traceability:

```yaml
source_roadmap_candidate: RM-001
related_domain: "Billing & Subscriptions"
related_capability: "Payment Webhook Processing"
related_capabilities: ["Payment Webhook Processing", "Trial Management"]
knowledge_level: K2
expected_value: "Reduces payment activation risk"
risks: "Mercado Pago webhook failures"
dependencies: ["ADR for internal endpoint protection"]
```

So the line from **capability → roadmap candidate → Work Item** stays traceable end to end. Fields are
only written when the candidate carried them — Kaddo never invents values.

## The roadmap-agent

The `roadmap-agent` produces grounded candidates in `knowledge/delivery/roadmap.md`. Each `### RM-xxx`
initiative carries **Related domain**, **Related capabilities**, **Source signals**,
**Problem / opportunity**, **Expected value**, **Risks**, **Dependencies**, a **Suggested Work Items**
list and a **Not now** note — plus a `## Not Now` section and grounding rules. The agent **suggests**
Work Items but never materializes them: it never creates files under `knowledge/delivery/work-items/`.
Candidates are candidates, not decisions, and the agent never writes code or runs git.
