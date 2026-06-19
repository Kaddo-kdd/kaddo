# Proposal: Knowledge Graph Export (VS-055)

## Why

Kaddo already captures connected knowledge across Markdown, front matter, Work Items, ADRs,
roadmap, ownership and Knowledge Capsules — but the connections are only *implicit*. A newcomer or
an enterprise team cannot quickly answer: which capability connects to this Work Item? which ADR
justifies this module? which code paths relate to this change? which external knowledge applies?
which artifacts go stale if I touch this folder?

## What

Add `kaddo graph export` — a deterministic command that emits the knowledge graph that already
exists implicitly, as simple, versionable, reviewable files:

- `.kaddo/graph.json` — for tools, tests, debugging, future integrations.
- `.kaddo/graph.mmd` — Mermaid, for quick visualization in GitHub / docs / Markdown.

Nodes come from existing knowledge artifacts (layers, capabilities, ADRs, Work Items, code globs,
capsules); edges come from front matter (`code`, `capabilities`, `decisions`, `source_id`,
`source_initiative`), the external registry and the known knowledge-layer relationships.

Options: `--scope active|all` (default `active`), `--format json|mermaid` (default both).

`kaddo explain` and `kaddo context` show a **summary** of the graph **only if it has been
exported** — they never generate it automatically and never inline the full graph.

## Principle

> You don't need a graph database to start thinking in graphs.

This is a **lightweight, file-based knowledge graph**, not a graph database, web portal, RAG,
embeddings store or visual engine. It reads only knowledge artifacts — never `src/`, never source
code content, never secrets — and never calls an LLM.

## Impact

- New command `graph export`; new core module `core/graph.ts`.
- `artifact-reader` gains a `decisions` field (WI → ADR edges).
- `explain` / `context` gain an optional graph summary.
- Docs: new "Knowledge Graph Export" page (EN/ES) + Overview / Visual Guide / Workflow / Context /
  Explain / Knowledge Capsules / Operating Moments / Agents updates.
- Additive, backward compatible → minor version bump.
