---
type: current-state
updated_at: 2026-06-01
---

# Old Orders — Current State (Architecture Baseline)

> Illustrative output of the Kaddo `architecture-agent` prompt run in an LLM chat,
> **after** the `legacy-agent` mapped risks and unknowns. Follows the Kaddo
> `current-state` template. Review before using — Kaddo does not generate this
> automatically.

## Components

- **Orders controller** (`sample/src/orders/`) — handles status transitions with
  in-place mutation and no audit trail (the target of WI-001).
- **Invoicing** (not yet read) — recalculation mutates already-issued invoices (RISK-001).
- **Tax / totals** — rounding logic duplicated across three controllers (RISK-002).

## Data & integrations

- Single `orders` table, read directly by unknown downstream consumers (UNK-001).
- Possible nightly job re-issuing/voiding invoices (UNK-002) — unconfirmed.
- No event bus or status log today.

## Cross-cutting concerns

- **Auth:** session-based, in the controllers (not yet audited).
- **Logging:** request logs only; no domain/audit events — WI-001 adds append-only
  status logging.
- **Error handling:** ad-hoc per controller.

## Known gaps

- UNK-001 — which systems read the `orders` table directly?
- UNK-002 — is there a scheduled job touching invoices?
- Invoicing module not yet read in detail.

## Assumptions

- Status transitions happen only through the orders controller.
- Issued invoices must be treated as immutable (per RISK-001 mitigation).

## Quality checklist

- [x] Components map to real code areas.
- [x] Gaps and assumptions are explicit, not hidden.
