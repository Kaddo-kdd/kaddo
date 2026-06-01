---
type: module-design
module: storefront-web
status: draft
owner: web-team
repoPath: ../frontend
capabilities: [browse-catalog, checkout]
code:
  - ../frontend/**
---

# Storefront Web — Design

> Illustrative: refined output of the `module-design-agent` over the CLI scaffold,
> aligned to the Kaddo `module-design` template. Review before using.

**Type:** frontend
**Repository:** ../frontend
**Main technology:** Next.js
**Owner:** web-team

## Purpose

Customer-facing storefront. Renders the catalog and drives checkout. Owns no
business state — it reads the catalog and submits orders to Orders API.

## Boundaries

- Talks only to Orders API over HTTPS/JSON.
- Never reads the orders database directly.
- No payment secrets in the browser bundle.

## Inputs / Outputs

- **In:** product catalog (read), user session.
- **Out:** `POST /orders` (place order), `GET /orders/:id` (status).

## Dependencies

- Orders API (`orders-api`) — hard runtime dependency.

## Related capabilities

- browse-catalog
- checkout

## Risks & open questions

- How is the catalog cached? (needs confirmation)

## Quality checklist

- [x] Boundaries make clear what is in and out of the module.
- [x] Dependencies on other modules are listed.
