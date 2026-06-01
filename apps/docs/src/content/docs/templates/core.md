---
title: Core templates
description: Work item, roadmap, capabilities and knowledge.
---

The everyday templates of the Kaddo loop.

| Template | Purpose | Output path | Command | Agent |
|---|---|---|---|---|
| Work Item | Smallest traceable unit of product evolution | `architecture/work-items/` | `kaddo create` | `work-item-agent` |
| Roadmap | Initiatives + candidate work items | `architecture/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |
| Capabilities | What the system can do | `architecture/capabilities.md` | — | `capability-agent` |
| Knowledge | What is true about the product now | `architecture/knowledge.md` | `kaddo init` | — |

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

## Capabilities

Outcome-oriented capability list (`CAP-001`), each citing evidence or flagged as an
assumption.

## Knowledge

Created by `kaddo init`: purpose, architecture overview, key domains and active
constraints — kept current as the product evolves.
