---
title: Delivery templates
description: How the product evolves — work items and roadmap.
---

The **Delivery** layer answers *how do we evolve it?* — the everyday units of the Kaddo
loop, under `knowledge/delivery/`.

| Template | Purpose | Output path | Command | Agent |
|---|---|---|---|---|
| Work Item | Smallest traceable unit of product evolution | `knowledge/delivery/work-items/` | `kaddo create` | `work-item-agent` |
| Roadmap | Initiatives + candidate work items | `knowledge/delivery/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |

## Work Item

The unit Guard, classify, history and learn revolve around. Carries front matter for
traceability (`id`, `type`, `knowledge_level`, `source`, `domains`, `capabilities`,
`code`). Sections: Problem · Expected result · Acceptance criteria · Design (optional)
· Risks (optional) · Definition of Done · Learning.

> Declare `code:` globs so Guard can relate changes to the work item.

## Roadmap

Structured initiatives (`RM-001`) and candidate work items (`WI-CANDIDATE-001`) for
human review — not commitments. `kaddo create --from roadmap` turns candidates into
real Work Items with `source` traceability.
