---
title: kaddo bootstrap
description: Build the initial knowledge base for a new project across Business → Product → Tech → Delivery.
---

```bash
kaddo bootstrap
```

For **new projects**, `kaddo bootstrap` turns an initial idea into structured knowledge
**before** you write code. It scaffolds the **minimal** base of the project's four macro
layers from the template registry:

```txt
Business → Product → Tech → Delivery
```

`bootstrap` is deterministic: it never calls an LLM, never generates source code, and
never decides the architecture. It creates **starter artifacts** (with `TBD`, assumptions
and open questions) that you then refine with the bootstrap agents in your own LLM. It
generates only the minimal base — **Delivery** (roadmap, work items) and **decisions**
emerge later, through agents and real work.

## The macro layers

```mermaid
flowchart TD
    A[kaddo init] --> B[kaddo bootstrap]
    B --> C[Business]
    C --> C1[problem · users · value-proposition · constraints · business-rules]
    B --> D[Product]
    D --> D1[product-brief · capabilities]
    B --> E[Tech]
    E --> E1[codebase]
    E1 --> G[kaddo context → agents → roadmap → create --from roadmap]
    G -.later.-> H[Delivery: roadmap · work-items/]
```

## What it generates

| Layer | Artifacts |
|---|---|
| **Business** | `knowledge/business/{problem, users, value-proposition, constraints, business-rules}.md` |
| **Product** | `knowledge/product/{product-brief, capabilities}.md` |
| **Tech** | `knowledge/tech/codebase.md` |

It does **not** generate `knowledge/delivery/roadmap.md`, `knowledge/delivery/work-items/`
or `knowledge/tech/decisions/` — those come later through agents and project evolution.

## Behavior

- Requires `kaddo init` first (otherwise: `Run 'kaddo init' first.`).
- Oriented to `state: new`. On `pre-ai`/`legacy` it warns and asks for confirmation.
- **Never overwrites** existing artifacts — they are reported as skipped.
- All artifacts come from the central template registry.

## Next steps

```bash
kaddo context        # prepare the LLM context pack
kaddo add agents     # installs business-agent, bootstrap-agent, codebase-agent
kaddo understand     # guided handoff
# refine the artifacts in your LLM, then:
kaddo create --from roadmap
```

The three bootstrap agents — `business-agent`, `bootstrap-agent` and
`codebase-agent` — turn these starter artifacts into real definition. Kaddo
prepares structure; your LLM and your team provide the content. Kaddo never invents
business facts and never writes code.
