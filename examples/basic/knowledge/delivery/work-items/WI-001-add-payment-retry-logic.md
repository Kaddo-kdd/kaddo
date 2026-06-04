---
type: feature
id: WI-001
title: "Add payment retry logic"
knowledge_level: K2
status: in-progress
domains:
  - payments
code:
  - src/payments/**
  - src/shared/payment/**
created_at: 2026-05-31
summary: "Adds retry policy for failed payment attempts"
---

# Add payment retry logic

> Type: feature · Level: K2

## Problem

Payment attempts fail silently when the provider returns a transient error. Users are not retried and lose their checkout progress.

## Expected result

Failed payments are retried up to 3 times with exponential backoff before marking as failed.

## Impact

~15% of failed payments are transient errors that would succeed on retry.

## Acceptance criteria

- Payment is retried up to 3 times on transient error (5xx, timeout)
- Each retry uses exponential backoff (1s, 2s, 4s)
- Permanent failures (4xx) are not retried
- Retry attempts are logged with attempt number and reason

## Definition of Done

- [ ] Problem is clear.
- [ ] Expected result is defined.
- [ ] Impact of not doing it is stated.
- [ ] Acceptance criteria are verifiable.

## Learning

_What did we learn from this change? Update after completion._
