---
title: Delivery templates
description: How the product evolves — work items and roadmap.
---

The **Delivery** layer answers *how do we evolve it?* — the everyday units of the Kaddo
loop, under `knowledge/delivery/`.

| Template | Purpose | Output path | Command | Agent |
|---|---|---|---|---|
| Work Item | Smallest traceable unit of product evolution | `knowledge/delivery/work-items/<state>/` | `kaddo create` | `work-item-agent` |
| Roadmap | Initiatives + candidate work items | `knowledge/delivery/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |

## Work Item

The unit Guard, classify, history and learn revolve around. Carries front matter for
traceability (`id`, `type`, `knowledge_level`, `source`, `domains`, `capabilities`,
`code`). Phase and initiative stay in front matter as planning and functional traceability;
folders represent lifecycle state. Sections: Problem · Expected result · Acceptance criteria ·
Design (optional) · Risks (optional) · Out of scope · How to test it (validation) ·
Definition of Done · Learning. The work-item-agent and implementation-agent always state
**how to test it** so a finished change can be verified.

Official lifecycle states are `draft`, `ready`, `in-progress`, `blocked`, `completed` and
`archived`. Agents should treat only `draft`, `ready`, `in-progress` and `blocked` as active
work; `completed` and `archived` are historical knowledge.

Official Work Item types are `feature`, `bugfix`, `hotfix`, `spike` and `chore` (technical /
maintenance / tooling work). See [create](/commands/create/#work-item-types).

> Declare `code:` globs so Guard can relate changes to the work item.

## Roadmap

Structured initiatives (`RM-001`) and candidate work items (`WI-CANDIDATE-001`) for
human review — not commitments. `kaddo create --from roadmap` turns candidates into
real Work Items with `source` traceability.
