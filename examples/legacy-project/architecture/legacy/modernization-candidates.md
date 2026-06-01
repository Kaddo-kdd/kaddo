---
type: modernization-candidates
updated_at: 2026-06-01
---

> Sample output produced after reviewing the legacy risks/unknowns.
> Illustrative — candidates for human review, not commitments.

# Old Orders — Modernization Candidates

## MOD-001 — Centralize money & rounding

**Current state:** Rounding logic duplicated across three controllers.
**Target state:** A single `Money` value object used everywhere.
**Value:** Eliminates cent-level discrepancies (addresses RISK-002).
**Risk:** Medium — touches many call sites.
**Suggested Knowledge Level:** K3

## MOD-002 — Make issued invoices immutable

**Current state:** Recalculation mutates issued invoices.
**Target state:** Append-only invoice records with explicit credit notes.
**Value:** Protects financial integrity (addresses RISK-001).
**Risk:** High — changes the financial model.
**Suggested Knowledge Level:** K4
