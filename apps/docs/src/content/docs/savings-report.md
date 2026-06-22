---
title: Savings Report
description: Translate Kaddo's impact metrics into approximate time, effort and value estimates using explicit, configurable assumptions — evidence-based, not exact ROI.
---

`kaddo savings` turns the [impact metrics](/impact-report/) into **approximate** time/effort/value
estimates, so you can talk about Kaddo's impact in terms non-technical stakeholders understand.

```bash
kaddo savings                  # Markdown to stdout (writes nothing) — scope: all
kaddo report savings           # alias
kaddo savings --json
kaddo savings --scope active
kaddo savings --output .kaddo/reports/savings-report.md
kaddo savings init             # write an editable .kaddo/savings.yml
```

> **Evidence-based estimate, not exact ROI.** These figures are estimates, not accounting savings.
> Calibrate the assumptions with real team data.

## Assumptions: `.kaddo/savings.yml`

Estimates = metrics + **explicit assumptions**. Run `kaddo savings init` to create an editable
`.kaddo/savings.yml` (use `--force` to overwrite):

```yaml
currency: USD
hourly_cost: 40
assumptions:
  context_preparation_minutes_saved_per_work_item: 30
  rework_hours_avoided_per_resolved_drift: 2
  onboarding_hours_saved_per_new_contributor: 4
  review_minutes_saved_per_work_item_with_ownership: 20
  clarification_minutes_saved_per_ready_work_item: 25
  architecture_discovery_hours_saved_when_graph_good: 3
team:
  expected_new_contributors_per_month: 1
  expected_work_items_per_month: 8
```

Without the file, Kaddo uses conservative defaults and says so.

## What it estimates

| Driver | Formula | Source |
|---|---|---|
| **Context preparation** | completed Work Items × minutes saved | impact evidence |
| **Review effort** | Work Items with ownership × minutes saved | impact evidence |
| **Clarification reduction** | Work Items with acceptance criteria × minutes saved | impact evidence |
| **Onboarding** | new contributors × hours × Context-Readiness multiplier (Low .25 → Very High 1.0) | impact evidence |
| **Architecture discovery** | hours × graph-quality multiplier (empty 0 → good 1.0) | impact evidence |
| **Drift prevention** | *not available* — Guard history isn't persisted yet | — |

Estimated value = `estimated hours saved × hourly_cost`, shown as **Estimated value** (never "ROI",
"profit" or "real savings"). Defaults to **`scope: all`** like `kaddo impact`; `--scope active`
measures only the active context.

## What it does NOT estimate

No exact ROI, no individual productivity, no per-person attribution, no team benchmarking, no
persisted Guard history or time trends, no Jira/Linear/GitHub integration, no LLM, no dashboard. It
never modifies code or knowledge, and writes nothing unless you pass `--output`.

## Confidence

Each report carries a confidence level: **Low** (impact score &lt; 60 or empty graph), **Medium**
(solid evidence but default assumptions and/or no Guard history), **High** (strong evidence +
calibrated assumptions + Guard history). Because Guard history isn't persisted yet, confidence is
**capped at Medium** for now — by design.

## Over MCP

The [MCP server](/mcp-server/) exposes it read-only: `kaddo://savings-report` (saved or in-memory)
and the `kaddo_generate_savings_report` tool (`format` · `scope` · `output`) which writes **only**
under `.kaddo/reports/`.

## Using it with stakeholders

Pair it with the [Impact Report](/impact-report/): impact shows *what is true* about the knowledge;
savings translates that into *directional* time and value. Always present it as an estimate to
calibrate — that honesty is the point.
