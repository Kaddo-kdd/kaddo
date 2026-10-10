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
