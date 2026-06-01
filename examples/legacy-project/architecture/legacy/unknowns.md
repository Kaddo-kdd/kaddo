---
type: legacy-unknowns
updated_at: 2026-06-01
---

> Sample output from the Kaddo `legacy-agent` prompt in an LLM chat.
> Illustrative — review before using.

# Old Orders — Legacy Unknowns

## UNK-001 — Who consumes the orders feed?

**Question:** Which downstream systems read the `orders` table directly?
**Why it matters:** A schema change could silently break them.
**How to find out:** Audit DB grants and search the data-warehouse jobs.

## UNK-002 — Are there scheduled jobs touching invoices?

**Question:** Is there a nightly cron that re-issues or voids invoices?
**Why it matters:** It may conflict with any new invoicing logic.
**How to find out:** Check the ops crontab and the legacy scheduler config.
