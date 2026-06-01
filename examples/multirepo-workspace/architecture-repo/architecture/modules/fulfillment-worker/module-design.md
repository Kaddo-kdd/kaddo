---
type: module-design
module: fulfillment-worker
status: draft
owner: fulfillment-team
repoPath: ../worker
capabilities: [reserve-stock, ship-order]
code:
  - ../worker/**
---

# Fulfillment Worker — Design

> Illustrative: refined output of the `module-design-agent` over the CLI scaffold,
> aligned to the Kaddo `module-design` template. Review before using.

**Type:** worker
**Repository:** ../worker
**Main technology:** Node.js
**Owner:** fulfillment-team

## Purpose

Consumes `OrderPlaced` events, reserves stock, and triggers shipping. Async only —
no inbound HTTP.

## Boundaries

- Subscribes to the event bus; never called synchronously.
- Owns stock reservations; reads orders only via events, not the DB.

## Inputs / Outputs

- **In:** `OrderPlaced` events.
- **Out:** `StockReserved`, `OrderShipped` events.

## Dependencies

- Platform Infra (`platform-infra`) — event bus.
- Orders API (`orders-api`) — upstream event producer.

## Related capabilities

- reserve-stock
- ship-order

## Risks & open questions

- What happens when stock is insufficient? (needs a documented compensation path)

## Quality checklist

- [x] Boundaries make clear what is in and out of the module.
- [x] Dependencies on other modules are listed.
