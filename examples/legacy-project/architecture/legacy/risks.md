---
type: legacy-risks
updated_at: 2026-06-01
---

> Sample output from the Kaddo `legacy-agent` prompt in an LLM chat.
> Illustrative — review before using.

# Old Orders — Legacy Risks

## RISK-001 — Order total recalculation

**What:** `OrderController.recalculate()` mutates totals in place.
**Why risky:** Invoices already issued reference the old total; recalculating retroactively corrupts financial records.
**Blast radius:** All historical orders and invoices.
**Mitigation:** Treat issued invoices as immutable; recalc only draft orders.

## RISK-002 — Implicit tax rounding

**What:** Tax rounding happens in three different places.
**Why risky:** Changing one path produces totals that disagree by cents.
**Blast radius:** Reporting, refunds, reconciliation.
**Mitigation:** Centralize rounding before any change.
