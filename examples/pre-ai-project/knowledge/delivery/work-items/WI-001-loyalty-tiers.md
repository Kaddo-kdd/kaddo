---
type: feature
id: WI-001
title: "Introduce loyalty tiers"
knowledge_level: K2
status: in-progress
domains:
  - loyalty
code:
  - sample/src/loyalty/**
created_at: 2026-06-01
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
summary: "Reward higher spenders with tiered earn rates"
---

# Introduce loyalty tiers

> Type: feature · Level: K2

## Source

- Source: roadmap
- Candidate: WI-CANDIDATE-001
- Initiative: RM-001 — Loyalty engagement

## Problem

All users earn points at the same flat rate, so there is no incentive to spend more.

## Expected Value

Increases average order value by rewarding higher tiers with better earn rates.

## Acceptance Criteria

- [ ] Tiers (Bronze/Silver/Gold) map to earn-rate multipliers.
- [ ] A user's tier is derived from rolling 12-month spend.

## Risks

Changing `EARN_RATE` logic affects every existing balance — needs a migration plan.

## Definition of Done

- [ ] Code merged
- [ ] Knowledge updated or intentionally unchanged

## Learning

_What did we learn? Fill in after completion (`kaddo learn`)._
