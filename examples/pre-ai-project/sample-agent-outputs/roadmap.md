---
type: roadmap
updated_at: 2026-06-01
---

> Sample output from the Kaddo `roadmap-agent` prompt in an LLM chat.
> Illustrative — review before using.

# Loyalty Lite — Roadmap

## Initiatives

### RM-001 — Loyalty engagement

**Goal:** Make the loyalty program drive repeat spend.
**Related capabilities:** CAP-001, CAP-003
**Impact:** High
**Risk:** Medium — touches existing balance calculations.
**Suggested Knowledge Level:** K2
**Dependencies:** none
**Why now:** Flat earn rate gives no reason to spend more.

#### Candidate Work Items

- **WI-CANDIDATE-001** — Introduce loyalty tiers · type: feature · level: K2 · value: higher AOV · notes: needs migration plan for existing balances.
- **WI-CANDIDATE-002** — Rewards catalog · type: feature · level: K3 · value: gives points a destination.

## Assumptions

- Existing point balances must be preserved during any earn-rate change.

**Open questions:**

- How is a user's tier recalculated over time?

## Suggested execution order

1. RM-001 / WI-CANDIDATE-001

## Not now

- Multi-region, partner points.

## Quality checklist

- [x] Each initiative has a goal, impact and risk.
- [x] Candidates are marked as candidates, not decisions.
- [x] Priorities reflect the project state (new / pre-ai / legacy).
