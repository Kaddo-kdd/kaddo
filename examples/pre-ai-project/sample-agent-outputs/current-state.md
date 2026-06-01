---
type: current-state
updated_at: 2026-06-01
---

> Sample output from the Kaddo `architecture-agent` prompt in an LLM chat.
> Illustrative — review before using.

# Loyalty Lite — Current State (Architecture Baseline)

## Components

- **web** — Next.js frontend (account & rewards pages).
- **api** — Express service exposing loyalty endpoints.
- **loyalty module** — point earn/redeem logic (`sample/src/loyalty`).

## Data & integrations

- Relational DB with `users`, `point_ledger` (see `sample/migrations`).
- OpenAPI contract at `sample/openapi.yaml`.

## Cross-cutting concerns

- Auth assumed via the API; not yet documented.

## Known gaps

- No rewards catalog service identified.
- Tiering logic does not exist yet.

## Assumptions

- Single currency, single region.

## Quality checklist

- [x] Components map to real code areas.
- [x] Gaps and assumptions are explicit, not hidden.
