---
title: Controlled Deprecation
description: Retire legacy functionality with evidence, staged environments, and a human-controlled production boundary.
---

Controlled Deprecation turns a risky deletion into a traceable lifecycle. Kaddo records the knowledge
needed to decide what can be retired; it never concludes that something is unused merely because a
code search found no reference.

## Lifecycle

Create a versioned Deprecation Plan under `knowledge/legacy/deprecations/`. Each target moves through
`candidate` → `usage-validated` → `soft-deprecated` → `disabled` → `removed-devtest` →
`production-ready` → `production-changed` → `observing` → `completed`.

Usage evidence keeps static, runtime, database, external-consumer, and human-review signals separate.
Missing evidence remains unknown; it is never treated as proof of no usage.

## Safe rollout

1. Identify the target and its module, resource, and dependent targets.
2. Validate usage, blast radius, reversibility, and removal order.
3. Soft-deprecate first, then observe explicit exit criteria and remove in development and test.
4. Verify the result and generate a Production Runbook when production is affected.

Production remains human controlled. Kaddo can prepare the runbook and record evidence, but it never
executes destructive production changes autonomously.

## Resources and multirepo projects

A target can reference a Project Resource and a module in a multirepo project. The Knowledge Graph
exposes plan, target, module/resource, Work Item, and `depends_on_removal` relationships so teams can
inspect retirement waves before acting.

## Commands

```bash
kaddo deprecation list
kaddo deprecation show DEP-001
kaddo deprecation status DEP-001
kaddo graph export --scope all --format json
```

The Admin **Deprecations** section provides the same read-only view: summary, lifecycle pipeline,
environment matrix, retirement waves, and related runbooks.

## Starting a deprecation: Admin vs LLM/MCP

There are two ways to begin, for two different situations.

**Admin — capture one known intent.** When you already know a single thing you want to retire, open
Admin → Deprecations → **New Deprecation** and provide only a title and a short description of what you
want to retire. Kaddo creates a **draft** plan with zero targets. Creating a plan records an intent to
*investigate* retirement — it does not authorize removal, change any target, or touch code, resources,
or environments. Admin then shows the plan needs refinement (no targets, analysis not performed,
dependencies unknown, removal waves not calculated).

A **captured intent** and a **refined plan** are different stages, and Admin shows the detail
progressively. A plan with zero targets shows only the captured-intent card and a refinement empty
state — the operational views (pipeline, retirement waves, environment matrix, board, targets) appear
as the plan gains knowledge: target views once targets are discovered, and retirement waves once there
is a real dependency ordering. Absence of analysis is never shown as absence of dependencies (`not
analyzed ≠ none`, `0 targets ≠ 0 dependencies`).

**LLM/MCP — discover, group and refine many.** When you have several possibly-obsolete things, or you
are not sure whether they belong together, use an MCP-connected agent. The agent analyses
relationships and proposes how to group them before creating anything:

- **Same retirement outcome → one plan with multiple targets.** For example, retiring the legacy credit
  flow may cover the old screen, `CalculateOldCredit()`, `/legacy/credit`, `sp_OldCredit`, and
  `OLD_CREDIT_RULES` — one `DEP` with several targets.
- **Independent outcomes → separate plans.** Legacy credit, legacy reporting, and the old customer sync
  are three different `DEP` plans. Grouping is about the retirement outcome, not merely sharing a repo.

Natural-language requests such as "let's deprecate X", "this screen should no longer exist", or "turn
off that old job" are read as an intent to *investigate safe retirement* — never as authorization to
delete immediately. When a request mentions several items, the agent first decides whether they are
targets of one outcome or separate plans, and shows the proposed grouping for human review. Admin
creates one plan at a time (no bulk creation); orchestrating multiple plan proposals belongs to the
agent. Either way, materializing targets stays `proposal → preview → human confirmation → Core`, and
Admin remains the surface to follow the lifecycle afterwards.
