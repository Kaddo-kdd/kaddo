---
title: Roadmap Quality
description: Kaddo grades how well roadmap candidates are grounded in a capability domain, a related capability and a source signal — so priorities are traceable to real project knowledge instead of invented ideas.
---

A roadmap candidate shouldn't be an idea from nowhere. Every candidate should be **traceable** to
something Kaddo already knows about the system: a capability domain, a related capability and a source
signal (a capability gap, an open question, a drift, a decision candidate). Kaddo grades that grounding
and surfaces it — without blocking the roadmap (VS-077).

Grounding is **quality guidance, not a hard gate**. You can still write simple candidates; Kaddo just
tells you which ones are grounded and which need refinement.

## Two levels: initiatives vs Work Item candidates

A roadmap has **two** distinct levels, and Kaddo counts them separately (VS-077.1) so the numbers stop
being ambiguous:

| Level | What it is | Heading |
|---|---|---|
| Roadmap initiatives | strategic groupings graded on grounding | `### RM-001` |
| Work Item candidates | materializable items inside an initiative | `- WI-CANDIDATE-001: …` |

`kaddo explain` shows a **Roadmap Status** block that keeps them apart:

```txt
## Roadmap Status
- Initiatives: 3
- Work Item candidates: 7
- Materialized Work Items: 0
- Remaining Work Item candidates: 7
```

And **Roadmap Quality** grades each level on its own:

```txt
## Roadmap Quality
Initiatives:
- Candidates evaluated: 3
- Grounded: 0/3
- With related domain: 0/3
- With related capability: 3/3
- With source signals: 0/3

Work Item Candidates:
- Candidates: 7
- With source initiative: 7/7
- With related domain: 7/7
- With related capability: 7/7
```

## What makes an initiative grounded

A roadmap candidate (a `### RM-xxx` heading in `knowledge/delivery/roadmap.md`) is **grounded** when it
carries all three:

| Field | Meaning |
|---|---|
| Related domain | the capability domain the candidate belongs to |
| Related capabilities | one or more capabilities it touches |
| Source signals | the traceable reason — capability gap, open question, drift, decision candidate |

The parser is format-tolerant: it accepts both `- Related domain:` bullets and `**Related domain:**`
inline fields, and each field can carry an inline value or an indented sub-bullet list.

## Roadmap quality status

Kaddo computes a `roadmap_quality` summary from the candidates:

```bash
kaddo explain          # shows a ## Roadmap Quality section
kaddo context          # carries the same summary into the context pack
kaddo understand       # nudges you to ground or to create --from roadmap
```

The `roadmapQuality` summary has two sub-objects — `initiatives` (with `total`, `grounded`, the
per-field counts and `needs_refinement`) and `work_item_candidates` (with `total`,
`with_source_initiative`, `with_related_domain`, `with_related_capability`). When every initiative is
grounded, `understand` suggests materializing candidates with `kaddo create --from roadmap`; when some
need refinement it recommends the **roadmap-agent** to add the missing domain / capability / source
signals. When Work Item candidates carry good metadata, `explain` prints `Work Item candidate quality:
good.`

This is deterministic and read-only: the CLI never invents domains or capabilities, never calls an LLM
and never runs git.

## Over MCP

Agents can query grounding directly via the read-only resource `kaddo://roadmap-quality`, which returns
the two-level object (`initiatives` + `work_item_candidates`). The materializable candidates themselves
are exposed read-only via `kaddo://work-item-candidates`. The CLI and MCP share the same
`buildRoadmapQuality(dir)` and `parseRoadmapCandidates` sources, so both resources are deterministic and
never write anything.

## Metadata carried into Work Items

When you materialize a candidate with `kaddo create --from roadmap`, the new Work Item's front matter
preserves **and normalizes** the traceability (VS-078):

```yaml
source: roadmap
source_roadmap_initiative: RM-001
source_work_item_candidate: WI-CANDIDATE-001
source_initiative_title: "Estabilización y Despliegue de Suscripciones PRO"
related_domain: "Billing & Subscriptions"
domains:
  - "Billing & Subscriptions"
related_capabilities:
  - "Payment Webhook Processing"
  - "Trial Management"
expected_value: "Reduces payment activation risk"
risks:
  - "Medium"
dependencies:
  - "Edge Function deploy"
source_signals:
  - "Capability Gap: webhook hardening"
decision_candidates:
  - "INTERNAL_CRON_SECRET"
related_decisions: []
```

**Normalization rules:** `domains` is filled from `related_domain` (never left empty when a related
domain exists), and comma-joined capability strings are split into a real list — one capability per
item, never a single `"a, b, c"` string. The Work Item body gets an improved **Source** block
(initiative + Work Item candidate + related domain/capabilities) and a **Context From Roadmap** section
with expected value, risks, dependencies and source signals. When the roadmap has no source signals it
says `**Source signals:** _Not provided in roadmap._` rather than inventing them. If the candidate
depends on a tech decision candidate with no ADR yet, the body carries a warning and the front matter
records `decision_candidates` + `related_decisions: []`.

So the line from **capability → roadmap initiative → Work Item candidate → Work Item** stays traceable
end to end. Fields are only written when the candidate carried them — Kaddo never invents values.

## The roadmap-agent

The `roadmap-agent` produces grounded candidates in `knowledge/delivery/roadmap.md`. Each `### RM-xxx`
initiative carries **Related domain**, **Related capabilities**, **Source signals**,
**Problem / opportunity**, **Expected value**, **Risks**, **Dependencies**, a **Suggested Work Items**
list and a **Not now** note — plus a `## Not Now` section and grounding rules. The agent **suggests**
Work Items but never materializes them: it never creates files under `knowledge/delivery/work-items/`.
Candidates are candidates, not decisions, and the agent never writes code or runs git.
