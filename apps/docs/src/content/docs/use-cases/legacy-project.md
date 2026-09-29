---
title: Legacy project
description: Understand a fragile system before changing it, carry that knowledge through implementation, and verify against it.
---

**When to use this:** you maintain a legacy system where knowledge lives in people's heads,
changes are risky, and you need to understand before you touch anything.

The guiding principle for legacy projects is **understand before changing** — and then
**carry that understanding through every change.**

## Workflow

### Phase 1 — Understand

```bash
kaddo init          # state: legacy, team size, structure
kaddo scan          # deterministic technical inventory → .kaddo/scan.json
kaddo context       # LLM context pack → .kaddo/context-pack.md
kaddo add agents    # install agent prompt packs
kaddo understand    # guided CLI → LLM handoff plan
```

In your LLM, use **legacy-agent** FIRST — it reads scan signals, System Graph and existing
knowledge to produce structured risks (RISK-xxx), unknowns (UNK-xxx) and modernization
candidates (MOD-xxx). Then use **architecture-agent**, **capability-agent** and
**roadmap-agent** (which explicitly consults legacy risks and unknowns).

### Phase 2 — Plan

```bash
kaddo create --from roadmap   # small, low-risk Work Items from the roadmap
kaddo owners suggest          # declare code: ownership on each Work Item
```

Refine each Work Item with the **work-item-agent** — it references relevant legacy risks
and unknowns by identifier (e.g. `legacy_risks: [RISK-001, RISK-003]`) without copying
the full legacy analysis. Then mark ready:

```bash
kaddo ready WI-001            # draft/ → ready/
```

### Phase 3 — Implement with legacy context

The **Implementation Handoff** automatically includes relevant legacy context (risks,
unknowns, modernization candidates) for the areas being modified. Use the
**legacy-risk-assessment** skill to evaluate which risks require attention before or after
implementing.

```bash
# Implementation → Evidence → Verification
kaddo verify WI-001           # collect evidence, verify ACs, capture learnings
kaddo guard                   # legacy-aware: flags changes in risk areas
```

Guard detects when touched files intersect with known legacy risks and surfaces them as
additional context — it never blocks a change, but ensures the team is aware.

### Phase 4 — Learn

```bash
kaddo learn WI-001            # capture learnings, update legacy knowledge
```

Learnings from implementation can update `knowledge/legacy/risks.md` — a risk confirmed,
mitigated, or reclassified during implementation feeds back into the knowledge base for
future Work Items.

## CLI vs LLM

- **CLI (deterministic):** `scan` inventories the stack; `create` materializes Work Items;
  `ready` controls the lifecycle transition; `verify` collects evidence and verifies ACs;
  `guard` detects drift and legacy risk intersections; `owners suggest` and `guard` connect
  knowledge to fragile code.
- **LLM (interpretation):** the legacy-agent surfaces structured risks and unknowns; the
  work-item-agent references relevant legacy findings during refinement; the
  implementation-agent receives legacy context via the handoff; the legacy-risk-assessment
  skill evaluates risk intersections.

Kaddo does **not** understand a legacy system automatically. It structures signals and guides
your LLM — the human stays in control of every change.

## Context efficiency

In a legacy project, exploration is expensive because wrong assumptions can be dangerous. Kaddo
reduces that cost by making risks, unknowns, ownership and current architecture explicit before
implementation starts. Legacy findings travel through the lifecycle via stable identifiers
(RISK-xxx, UNK-xxx, MOD-xxx) — agents reference them without duplicating content, keeping
context windows efficient.

## Expected artifacts

```txt
knowledge/legacy/risks.md                     # RISK-xxx structured risks
knowledge/legacy/unknowns.md                  # UNK-xxx known unknowns
knowledge/legacy/modernization-candidates.md  # MOD-xxx candidates
knowledge/tech/current-state.md
knowledge/product/capabilities.md
knowledge/delivery/roadmap.md
knowledge/delivery/work-items/draft/*.md      # → ready/ → in-progress/ → completed/
```

## MCP resources

Legacy knowledge is also available via MCP for agents connected through the protocol:

- `kaddo://legacy-risks` — known risks
- `kaddo://legacy-unknowns` — known unknowns
- `kaddo://modernization-candidates` — modernization candidates

## Next steps

Prefer small Work Items, capture unknowns as you learn, and declare ownership on the riskiest
areas first so `kaddo guard` flags changes that may need knowledge review. See the
[Full workflow](/use-cases/full-workflow/).

> Not sure what to run next at any point? `kaddo understand` answers *"What should I do now?"*
> from the real state of the project.

See it in action: the [**Old Orders**](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/legacy-project)
demo repo, or browse all [Examples](/examples/).
