---
title: kaddo bootstrap
description: Create the structural knowledge baseline for any project — new, pre-ai or legacy — tailored to project.state.
---

```bash
kaddo bootstrap
```

`kaddo bootstrap` creates the **structural knowledge baseline** Kaddo expects. It is not
"new-project bootstrap" — it is **knowledge-baseline bootstrap** and applies to every project type.
What changes by `project.state` is the **template content and orientation**, not whether bootstrap
applies:

| State | Orientation |
|---|---|
| `new` | intent — product vision, planned capabilities, initial technical direction |
| `pre-ai` | discovery — current state, observed capabilities, assumptions, open questions |
| `legacy` | risk — constraints, criticality, dependencies, technical debt, modernization |

`bootstrap` is deterministic: it never calls an LLM, never generates source code, never decides the
architecture, never installs agents/skills, and never runs scan/context/git. It writes starter
templates (with placeholders, assumptions and `[open]` questions) that you then refine with agents.

## What it creates

The common baseline (files + directories), with state-aware content:

```txt
knowledge/business/business.md
knowledge/product/product.md
knowledge/product/capabilities.md
knowledge/tech/codebase.md
knowledge/tech/current-state.md
knowledge/tech/decisions/
knowledge/delivery/roadmap.md
knowledge/delivery/work-items/
```

Every generated file carries `project_state:` in its front matter. `pre-ai` and `legacy` templates
add discovery/risk sections (e.g. *Observed technical signals*, *Risks of interpretation*,
*Critical dependencies*, *Modernization notes*).

### Existing capability discovery (pre-ai / legacy)

For existing projects, `knowledge/product/capabilities.md` is scaffolded as an **evidence-backed
capability inventory**, not a wishlist. The `capability-agent` fills it in a state-aware way:

- **new** → *Planned Capability Definition* (`[planned]` capabilities).
- **pre-ai** → *Existing Capability Discovery* — a `## Capability Inventory` where each capability has
  a `Status` (`implemented`/`partial`/`inferred`/`risky`/`deprecated`/`unknown`) with **evidence**
  (paths, routes, tables, functions), plus `## Capability Gaps` and `## Roadmap Candidate Signals`.
- **legacy** → *Legacy Capability Discovery* — the same inventory plus `Criticality`, `Change risk`,
  `Operational dependency` and `Modernization notes`.

The `roadmap-agent` then treats `capabilities.md` as its **primary source** for roadmap candidates
(partial capabilities, gaps, candidate signals, risky capabilities) and won't build a roadmap from a
placeholder. The agent never invents evidence — no evidence means `inferred` or `unknown`.

## Behavior

- Requires `kaddo init` first.
- **State-aware messages** — no more "this project is not marked as new" warning on `pre-ai`/`legacy`.
- **Never overwrites** existing files — they are reported as skipped. An existing
  `knowledge/knowledge.md`, `roadmap.md` or `work-items/` is kept.
- **Idempotent** — running it again writes nothing new.
- Does **not** install agents or skills — those stay `kaddo add agents` / `kaddo add skills`.

## Where it fits

```txt
kaddo init → kaddo bootstrap → kaddo add agents → kaddo add skills → …
```

[`kaddo explain`](explain/) reports `bootstrap-incomplete` and recommends `kaddo bootstrap` until the
baseline exists; afterwards it advances to `agents-missing` / `skills-missing`. `kaddo understand`
also recommends `kaddo bootstrap` first when the baseline is incomplete — agents have no target files
to refine until it exists.

## Next steps

```bash
kaddo add agents     # install agent prompt packs
kaddo add skills     # install reusable skills
kaddo scan           # (pre-ai/legacy) capture deterministic signals from the code
kaddo understand     # guided handoff
```

Kaddo prepares structure; your LLM and your team provide the content. Kaddo never invents business
facts and never writes code.
