---
type: feature
id: WI-001
title: "Add order status change logging"
knowledge_level: K2
status: in-progress
domains:
  - orders
code:
  - sample/src/orders/**
created_at: 2026-06-01
summary: "Observe before changing — log every order status transition"
---

# Add order status change logging

> Type: feature · Level: K2

## Problem

We do not fully understand how orders move between statuses (see UNK-001). Before
changing any logic we need observability.

## Expected result

Every order status transition is logged with the old status, new status, actor and
timestamp — a safe, additive first step.

## Acceptance Criteria

- [ ] Logging is append-only and does not alter order data.
- [ ] Logs are queryable by order id.

## Risks

Must not touch total/invoice logic (RISK-001, RISK-002).

## Definition of Done

- [ ] Code merged
- [ ] Knowledge updated (feed UNK-001 findings back into legacy/unknowns.md)

## Learning

_What did we learn about status transitions? Fill in after completion._
