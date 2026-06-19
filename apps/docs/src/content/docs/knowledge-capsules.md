---
title: Knowledge Capsules
description: Export and import minimal, portable knowledge about external systems — context without mapping a whole repo or reading its source.
---

A **Knowledge Capsule** is a minimal, portable, versionable summary that one project exports about
itself, so other projects can consume it as **external context** — without mapping it as a
multirepo module or having access to its source.

> Kaddo doesn't need all the external code. It needs the right knowledge.

In large systems a solution depends on many repositories (frontend, payments, identity, orders…)
that belong to other teams, are access-restricted, too large, or simply out of scope. You rarely
need their source — you need to know **how to integrate with them**.

## What a capsule answers

- What does this system do? What are its responsibilities and scope?
- What capabilities and **public contracts** (APIs, events) does it expose?
- What does it depend on, and what are the known integration risks?
- Who owns it, and which ADRs affect integration?
- What is **out of scope** for this capsule?

## Export a capsule

```bash
kaddo capsule export
```

Reads the project's `knowledge/` (business, product, tech, capabilities, current-state, ADRs,
ownership) and writes a deterministic **draft**:

```text
.kaddo/exports/<project-name>.capsule.md
.kaddo/exports/<project-name>.capsule.json
```

The CLI never reads source code or secrets. Refine the draft with the
[`capsule-agent`](/modules/agents/) before sharing — it sharpens purpose, contracts, risks and
out-of-scope, and marks unknowns.

```md
---
type: knowledge-capsule
system: orders-service
version: 1
updated_at: 2026-06-10
owner: Orders Team
---

# Orders Service — Knowledge Capsule

## Purpose
Manages customer orders, order lifecycle and status transitions.

## Exposed Capabilities
- Order Creation
- Order Status Tracking

## Public Contracts
- `POST /orders`
- `OrderCreated`

## Known Risks
- Order status transitions must remain idempotent.

## Out of Scope
- Payment authorization
```

## Import a capsule

```bash
kaddo capsule add ../orders-service/.kaddo/exports/orders-service.capsule.md
```

This copies the capsule into `external/<id>.capsule.md` and registers it in `.kaddo/external.yml`:

```yaml
external:
  - id: orders-service
    type: knowledge-capsule
    path: external/orders-service.capsule.md
    owner: Orders Team
    lastImportedAt: 2026-06-10
```

## Where capsules show up

- **`kaddo context`** adds an `## External Knowledge` section (purpose · capabilities · contracts ·
  owner · risks) so the LLM has just-enough external context.
- **`kaddo explain`** lists registered capsules and warns when one looks stale (last updated > 90
  days ago).
- **`kaddo understand`** reminds you to review the relevant capsule before changing integration
  behavior.

## Multirepo vs Knowledge Capsules

| Use **multirepo** when… | Use a **Knowledge Capsule** when… |
|---|---|
| you have access to the repo | you don't want to map the whole repo |
| the repo is in scope | you don't have full access |
| you need to map modules | the repo belongs to another team |
| you need cross-repo ownership | you only need integration context |
|  | you want to reduce noise |

## Security

A capsule must **never** include secrets, tokens, passwords, private keys, PII, credentials or
source code. Review it before sharing. The `capsule-agent` is instructed to never export those.

## Out of scope

No remote scanning, GitHub API, automatic sync, permissions, portal, MCP, RAG or vector databases.
Capsules are plain, versionable Markdown/JSON — copy them like any other file.

## See also

- [Knowledge Graph Export](/knowledge-graph-export/) — imported capsules appear in the graph as
  `provides_external_context` edges into your project.
