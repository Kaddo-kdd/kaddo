# Proposal: Knowledge Impact Report (VS-061)

## Why

Kaddo's value is real but distributed across explain, context, graph, hints, guard, roadmap, work
items, skills and agents. There is no consolidated way to show that impact to tech leads,
architects, sponsors, product teams or people evaluating adoption.

## What

A new deterministic report command:

```bash
kaddo report impact          # Markdown to stdout (writes nothing)
kaddo impact                 # alias
kaddo report impact --json
kaddo report impact --output .kaddo/reports/impact-report.md
kaddo report impact --json --output .kaddo/reports/impact-report.json
```

Sections: Executive Summary, Knowledge Health, Knowledge Coverage, Ownership Coverage,
Traceability, Context Readiness, Work Item Readiness, Graph Quality, Guard Activity (`not
available` — no persisted history yet), Impact Signals, Suggested Actions. Optional transparent
Knowledge Impact Score (0–100).

MCP: read-only resource `kaddo://impact-report` (saved report, or built in memory) and derived tool
`kaddo_generate_impact_report` (`format` · `scope` · `output`) writing only under `.kaddo/reports/`.

## Principle

> Evidence first. Estimation later.

No money, no ROI, no individual productivity, no LLM. Money/effort estimation is VS-062.

## Impact

- New `core/impact-report.ts` (builder + Markdown/JSON renderers), `commands/report.ts`,
  `report impact` + `impact` alias, command-help entry.
- MCP: `.kaddo/reports/` added to the derived-write allowlist; `generateImpactReport`; resource +
  tool.
- New docs page (EN/ES) + Commands Overview / MCP Server cross-links; READMEs.
- Both packages bump to 3.23.0. Additive → minor.
