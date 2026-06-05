# Spec: Author Attribution & Knowledge Identity

## Acceptance Criteria
- AC1 — `/about` page exists.
- AC2 — `/knowledge-driven-development` page exists.
- AC3 — Homepage includes visible attribution.
- AC4 — README includes author + context.
- AC5 — Manifesto includes an Origin section.
- AC6 — Footer references the author.
- AC7 — SEO metadata includes a Person schema (JSON-LD).
- AC8 — Docs clearly distinguish "Knowledge Driven Development" from "Kaddo".
- AC9 — Kaddo is presented as a practical implementation of KDD for the AI era.
- AC10 — Build and docs pass.
- AC11 — No claim that the author invented KDD.

## Validation
```bash
pnpm --filter docs build
```
