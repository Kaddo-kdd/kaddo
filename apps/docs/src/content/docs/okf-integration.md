---
title: Open Knowledge Format (OKF)
description: Export Kaddo's canonical knowledge as a portable Open Knowledge Format (OKF v0.2) bundle, and validate it — optional interoperability, read-only, Kaddo stays the source of truth.
---

Kaddo can project its canonical knowledge into an **Open Knowledge Format (OKF v0.2)** bundle: a
portable collection of Markdown concepts with structured metadata that other tools and agents can read
**without installing Kaddo**. This is optional interoperability — Kaddo remains the single source of
truth, and the export never modifies your knowledge.

## What is OKF?

[Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) is an open
specification for representing and exchanging knowledge as bundles of Markdown files with structured
frontmatter. The reference version for this adapter is **v0.2**.

## OKF vs Kaddo

| | Kaddo | OKF Bundle |
|---|---|---|
| Role | Structures, relates and governs knowledge over the lifecycle | Portable projection of that knowledge |
| Source of truth | Yes | No (a read-only snapshot) |
| Requires Kaddo to consume | — | No |

A **Knowledge Capsule** is a contextual summary for one consumer; an **OKF bundle** is a portable
collection of knowledge concepts. OKF complements capsules — it does not replace them.

## Architecture

```text
Kaddo Knowledge → Core Readers → OKF Adapter → OKF Bundle
```

The adapter is read-only and reuses Kaddo's existing Core readers (artifact discovery, Work Items,
Project Resources, deprecations, the knowledge graph). It never re-implements discovery or parsing and
never becomes a second source of truth.

## Commands

```bash
# Export the bundle (default: .kaddo/okf)
kaddo okf export
kaddo okf export --output ./exports/okf
kaddo okf export --with-reports   # also include Impact/Drift/Savings reports
kaddo okf export --with-agents    # also include agent/workflow instruction docs (under agents/)

# Validate a bundle (read-only)
kaddo okf validate
kaddo okf validate ./exports/okf
```

Both support `--json` for automation.

## Bundle structure

```text
.kaddo/okf/
  index.md            # root index — declares okf_version: "0.2"
  business/           # business knowledge + its index.md
  product/
  tech/
  delivery/
    work-items/
    deprecations/
    runbooks/
  resources/
  external/           # knowledge references (capsules)
```

`index.md` and `log.md` are reserved OKF file names; indexes provide progressive navigation and carry
**no frontmatter** (only the root index declares `okf_version`). Nested collections
(`delivery/work-items/`, `delivery/deprecations/`, `tech/modules/`…) each get their own local index.
Each concept is one Markdown file with a required `type`, plus `title`, `description`, `tags`, `sources`
(provenance) and the stable `kaddo_id` — and it carries the **full canonical Markdown body** of the
artifact (sections, tables, lists and code), with internal links rewritten to resolve inside the bundle.
Agent/workflow instruction docs are **excluded by default** (they describe how to work *with* the
system, not verified system knowledge); include them under `agents/` with `--with-agents`.

## Concept mapping

| Kaddo | OKF concept |
|---|---|
| Business / Product / Technical Knowledge | Business / Product / Technical Knowledge |
| Architecture / ADR | Architecture Decision |
| Capability | Capability |
| Work Item | Work Item |
| Initiative | Initiative |
| Project Resource | Project Resource |
| Controlled Deprecation | Deprecation Plan |
| Knowledge Capsule | Knowledge Reference |
| Impact / Drift / Savings Report | Report |

OKF has no closed type taxonomy: unknown Kaddo types are exported as readable generic concepts rather
than dropped, so a consumer can still treat them as knowledge.

## Provenance and trust

The adapter follows OKF v0.2 conventions (`sources`, `generated`, `verified`, `status`, `stale_after`)
and is conservative:

- **Provenance** is the artifact's real canonical path and id — never invented.
- **Trust** is not fabricated: a Work Item passing technical validation does not mean the whole
  knowledge document was human-reviewed, so verification is not asserted without evidence.
- **Freshness** (`stale_after`) is not generated arbitrarily; an export timestamp is not the knowledge's
  update date.
- OKF v0.2's **Attested Computation** is not executed — reports are not turned into attestations just
  because they use deterministic formulas.

## Validation

`kaddo okf validate` is read-only and **permissive**, separating three levels:

- **Conformance errors** — e.g. a concept with no `type`, invalid frontmatter, duplicate ids.
- **Warnings** — e.g. a missing root `okf_version`.
- **Informational** — e.g. an internal link that does not resolve yet (OKF allows unresolved
  references).

Unknown types, extra fields, missing optional fields and broken links are **not** conformance errors.

## Consuming a bundle without Kaddo

The bundle is plain Markdown + YAML frontmatter. A consumer reads `index.md` for navigation, follows
the per-layer indexes, and opens each concept file; relationships are ordinary relative Markdown links
resolved within the bundle. No Kaddo install, CLI, MCP or database is required.

## Security

Export is safe by default. It reads only `knowledge/*.md` artifacts (no code, no `.env`, no secrets),
and Project Resources carry only reference names, never credential values. A concept whose content
matches a high-signal secret pattern is **omitted from the bundle entirely** (not merely flagged after
writing), and the detected value is never printed in logs or errors. The destination is validated
before any write — the project root, parent directories and protected paths (`knowledge/`, source
directories) are refused, and the bundle is published atomically through a staging directory, so a
failed export never destroys a previous valid bundle. Identity collisions stop the export instead of
silently dropping a concept. Still, **review a bundle before sharing it externally** — it contains your
project's knowledge.

## Limitations

- Initial scope is **export + validate**. Importing OKF into Kaddo is future work.
- **Reports** are opt-in via `--with-reports` (they carry a `generated.at` timestamp, so they are not
  part of the stable core bundle); their findings, assumptions, confidence, limitations and the Savings
  disclaimer are preserved verbatim — estimates are never shown as observed values.
- **External Knowledge Capsules** (from `.kaddo/external.yml`) are represented as "Knowledge Reference"
  concepts preserving their source and access limitation, without pulling private sources or implying
  access to the origin system.
- The adapter targets OKF v0.2 and does not claim compatibility with unknown future versions.

## See also

- [Knowledge Capsules](/knowledge-capsules/) — contextual summaries for a consumer.
- [Knowledge Graph Export](/knowledge-graph-export/) — the relationships OKF preserves.
- [Commands overview](/commands/overview/).
