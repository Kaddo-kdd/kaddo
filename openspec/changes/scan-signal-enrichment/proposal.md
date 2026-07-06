# VS-081 — Scan Signal Enrichment

**Status**: shipped (v3.48.0)

## Problem

`kaddo scan` detects stack, dirs, and domains but misses actionable signals like auth providers, payment integrations, webhook routes, missing tests, and environment variable usage. Agents and humans need richer context to understand what a project actually does.

## Solution

Add a deterministic signal detection engine (`scan-signals.ts`) that inspects `package.json` dependencies, file/directory patterns, and `.env.example` variable names (never values) across 14 categories: auth, payments, webhooks, storage, background_jobs, email, database, migrations, api_routes, tests, security, infrastructure, external_integrations, environment.

Each signal carries a confidence level (high/medium/low), evidence array, and optional `recommended_review` suggestion.

## Integration points

- `ScanResult.signals` — scanner output
- `ScanBaseline.signals` — persisted baseline
- `kaddo scan` console — renders signals after stack
- `knowledge/inventory.md` — "Detected Signals" section
- `ContextPack.scanSignals` — context-pack field + template section
- `ProjectExplanation.scanSignals` — explain field + rendered section
- `RouteContext.hasScanWarnings` — project-route scan step evaluator
- `kaddo://scan-signals` MCP resource — read-only JSON

## Security

- Environment detection reads variable **names only**; values are never stored or exposed.
- No git operations, no LLM calls, no network access.
