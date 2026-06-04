# Proposal: Knowledge Repository Realignment

## Problem

Kaddo started architecture-centric: almost every artifact lives under `architecture/`.
But the product now manages business, product, technology and delivery knowledge — much of
which is not architecture. Files like `architecture/business/problem.md`,
`.../users.md`, `.../business-rules.md` are clearly not architecture. The physical
structure no longer matches the product's real purpose.

## Proposed Change

Realign Kaddo from **architecture-centric** to **knowledge-centric**. Replace the central
concept `architecture/` with `knowledge/`, organized into four explicit layers that become
the primary framing for artifacts, agents, templates, docs, examples and workflows:

```txt
Business → Product → Tech → Delivery
```

This is a conceptual realignment, not a folder rename. It updates the manifesto,
onboarding, examples, templates, agents and the way the product is explained.

## Why Now

The bootstrap VS introduced explicit base layers and surfaced the mismatch: business
artifacts living under `architecture/` is conceptually wrong. Aligning the structure with
the four layers makes Kaddo coherent end to end.

## Layers

- **Business** — *why does it exist?* problem, users, constraints, business rules, value
  proposition.
- **Product** — *what do we build?* product brief, capabilities, scope, hypotheses, goals.
- **Tech** — *how do we build it?* codebase, decisions, modules, diagrams, stack, standards,
  Git strategy, quality attributes.
- **Delivery** — *how do we evolve it?* roadmap, work items, ownership, history, learning.

## Scope

- Introduce `knowledge/` as the canonical knowledge root with `business/`, `product/`,
  `tech/`, `delivery/`.
- Consolidate `stack/standards/git-strategy/quality-attributes` into `tech/codebase.md`
  sections; `codebase-foundation.md` → `codebase.md`; `adrs/` → `tech/decisions/`;
  `modules/` → `tech/modules/`; roadmap + work-items → `delivery/`.
- Reduce `kaddo bootstrap` to the minimal artifacts (business + product + `tech/codebase.md`).
- Update agents, context pack, explain, templates, docs, examples.
- Add `kaddo migrate knowledge-layout` (moves folders, preserves content, no overwrite,
  prints a report).
- Keep Guard's algorithm unchanged (paths only).
- Backward compatibility: readers fall back to `architecture/` when `knowledge/` is absent,
  so existing repos keep working until migrated.

## Out of Scope

MCP, portal, cloud, GitHub App, new AI agents, new project types, changes to the Guard
algorithm.

## Expected Value

Kaddo's structure matches its purpose: a knowledge repository for the whole product, with a
clear Business → Product → Tech → Delivery macro flow that humans and agents can navigate.

## Risks

- Large blast radius (54 CLI files, 62 docs, 4 examples) → centralize paths in one layout
  module; migrate in phases with green tests at each step.
- Breaking change for existing repos → backward-compatible reads + `kaddo migrate`.
- Manifesto macro flow changes from `…Architecture→Codebase→Development` to
  `…Product→Tech→Delivery` → update consistently.

## Success Criteria

`knowledge/` is the official layout with the four layers reflected in manifesto, docs and
examples; bootstrap generates only the minimal artifacts; `codebase.md` and `decisions/`
replace their predecessors; roadmap and work items live under `knowledge/delivery/`;
context and explain group knowledge by layer; `kaddo migrate knowledge-layout` exists; and
build + tests + examples pass.
