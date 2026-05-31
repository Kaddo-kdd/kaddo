---
type: bugfix
id: WI-002
title: "Fix broken pagination on orders list"
knowledge_level: K2
status: in-progress
domains:
  - orders
code:
  - src/orders/**
created_at: 2026-05-31
summary: "Orders list skips items when page size exceeds 50"
---

# Fix broken pagination on orders list

> Type: bugfix · Level: K2

## Problem

The orders list endpoint skips items when the requested page size exceeds 50. Users on page 2+ see incomplete results.

## Expected result

Pagination works correctly for all page sizes up to the configured maximum (200).

## Impact

Merchant dashboards show incomplete order history, causing reconciliation issues.

## Acceptance criteria

- Orders list returns correct items for page sizes 1–200
- No items are skipped between pages
- Total count in response matches actual record count

## Definition of Done

- [ ] Problem is clear.
- [ ] Expected result is defined.
- [ ] Impact of not doing it is stated.
- [ ] Acceptance criteria are verifiable.

## Learning

_What did we learn from this change? Update after completion._
