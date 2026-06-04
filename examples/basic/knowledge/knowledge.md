---
type: current-state
updated_at: 2026-05-31
---

# basic-example — Knowledge

## Purpose

A simple e-commerce backend demonstrating Kaddo structure.

## Architecture overview

REST API with two main domains: payments and orders.

## Key domains

- **payments** — payment processing, retry logic, provider selection
- **orders** — order lifecycle, state transitions, fulfillment

## Active constraints

- PCI-DSS compliance required for payment data handling
- Orders are immutable once confirmed
