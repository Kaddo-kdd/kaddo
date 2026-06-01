---
type: capabilities
updated_at: 2026-06-01
---

> Sample output from the Kaddo `capability-agent` prompt in an LLM chat.
> Illustrative — review before using.

# Loyalty Lite — Capabilities

## CAP-001 — Earn loyalty points

**Description:** Users accrue points based on spend.
**Status:** existing
**Related domains:** loyalty
**Evidence:** `sample/src/loyalty/points.ts` (`earnPoints`, `EARN_RATE`).

## CAP-002 — Redeem points for rewards

**Description:** Users spend points from their balance.
**Status:** existing
**Related domains:** loyalty, rewards
**Evidence:** `sample/src/loyalty/points.ts` (`redeemPoints`).

## CAP-003 — Tiered rewards

**Description:** Reward higher spenders with better earn rates.
**Status:** proposed
**Related domains:** loyalty

## Assumptions

- Points and rewards share a single balance per user.

## Open questions

- Is there a rewards catalog, or only point redemption?

## Quality checklist

- [x] Capabilities describe outcomes, not implementation.
- [x] Each capability cites evidence or is flagged as an assumption.
