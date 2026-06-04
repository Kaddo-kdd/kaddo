---
type: module-design
module: orders-api
status: draft
owner: orders-team
repoPath: ../backend
capabilities: [place-order, order-status]
code:
  - ../backend/**
---

# Orders API — Design

> Illustrative: refined output of the `module-design-agent` over the CLI scaffold,
> aligned to the Kaddo `module-design` template. Review before using.

**Type:** backend
**Repository:** ../backend
**Main technology:** NestJS
**Owner:** orders-team

## Purpose

System of record for orders. Accepts orders from Storefront Web, persists them,
and emits `OrderPlaced` events for the Fulfillment Worker.

## Boundaries

- Owns the `orders` table exclusively.
- Publishes events to the bus; does not call the worker directly.
- Does not handle shipping logic.

## Inputs / Outputs

- **In:** `POST /orders`, `GET /orders/:id`.
- **Out:** `OrderPlaced`, `OrderCancelled` events on the bus.

## Dependencies

- Platform Infra (`platform-infra`) — event bus + database.

## Related capabilities

- place-order
- order-status

## Risks & open questions

- Idempotency of `POST /orders` under client retries (needs confirmation).

## Quality checklist

- [x] Boundaries make clear what is in and out of the module.
- [x] Dependencies on other modules are listed.
