# Proposal: Author Attribution & Knowledge Identity

## Problem

Kaddo has its own conceptual model, manifesto, knowledge taxonomy and methodology, but
little public information connects these to the project's author. This weakens semantic
indexing, author↔project association and academic positioning. It also risks conflating
**Knowledge Driven Development (KDD)** — a prior concept in software engineering / knowledge
management — with **Kaddo**.

## Proposed Change

Add explicit, correct attribution and identity across the docs site, manifesto, README and
metadata:

- Position Kaddo as **a practical implementation of KDD principles for AI-assisted software
  development** — never claiming authorship of KDD itself.
- New `/about` page (creator bio, why Kaddo, evolution, TryCatch.tv, vision).
- New `/knowledge-driven-development` page (what KDD is, KDD ≠ Kaddo, layers, maturity,
  human-in-the-loop).
- Homepage + footer: discreet "Created by Julian Dario Luna Patiño" → `/about`.
- Manifesto: an **Origin** section.
- README: "About the Author" + "Why Kaddo Exists".
- SEO: `author`/`creator` meta + JSON-LD `Person` schema.

## Principle (must hold)

Kaddo does **not** claim authorship of "Knowledge Driven Development". It states: *Julian
Dario Luna Patiño created Kaddo, an open-source implementation of KDD principles for
AI-assisted software development.*

## Out of Scope

CLI changes; any claim that KDD was invented by the author or by Kaddo.

## Success Criteria

`/about` and `/knowledge-driven-development` exist (EN/ES); homepage, footer, manifesto and
README carry correct attribution; Person JSON-LD is present; docs clearly distinguish KDD
from Kaddo; docs build passes.
