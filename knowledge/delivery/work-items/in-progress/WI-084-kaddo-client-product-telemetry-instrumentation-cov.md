---
type: feature
id: WI-084
title: Kaddo Client — Product Telemetry Instrumentation & Coverage
status: in-progress
work_type: feature
knowledge_level: K4
project_state: ai-assisted
refined_by: codex
affected_modules:
  - cli
  - mcp
  - docs
domains:
  - Product
  - Tech
  - Delivery
scope_confidence:
  level: high
  reasons:
    - >-
      Collector contract 1.1 is deployed and its allowed dimensions are
      supplied.
    - >-
      The CLI already has consent, Ed25519 registration, signed delivery and a
      durable queue.
    - >-
      Project configuration and Work Item frontmatter are canonical, versioned
      persistence points.
source:
  type: external
  imported_at: '2026-11-16'
  source_format: markdown
  source_hash: 76d3474e1f525013d2c2bb004fe45cb1ddaafe52ea5ad77f8c6a875d4710c2e9
  inferred: false
summary: >-
  Instrument the Kaddo CLI and MCP producers for the telemetry collector 1.1
  contract, preserving consent, anonymous signed transport, privacy boundaries
  and compatibility with queued 1.0 events.
ready_at: '2026-11-16'
---

# WI-084 — Kaddo Client Product Telemetry Instrumentation & Coverage

## Intent

When telemetry is enabled, Kaddo must emit the bounded, anonymous evidence needed
to measure active projects and installations, versions, detected technologies,
observed AI models, and Work Item lifecycle activity. Every resulting metric must
remain interpretable with its coverage; telemetry is not evidence that work is
complete.

## Scope and design decisions

- Events use collector contract `1.1`. Existing queued `1.0` events remain
  deliverable unchanged; they are not rewritten or discarded.
- `source` is the top-level producer interface. `properties.interface` is not
  emitted by new 1.1 events.
- `kaddoVersion` comes from the actual emitting package. CLI and MCP share the
  event builder and validation boundary.
- `projectId` is an opaque UUID persisted under `.kaddo/config.yml`. It is
  independent of repository URL, path, project name and source code. It survives
  restarts, path changes and clones, so separate installations of the same
  versioned project report one project. A copied project intentionally retains
  that identity until a future explicit identity-rotation operation; rotation is
  outside this WI.
- `workItemIdAnon` is an opaque UUID persisted in each Work Item frontmatter. It
  remains stable through its lifecycle and is independent of its readable ID.
- Project-context events without a project identity declare
  `properties.projectContext: true`; the omission is measurable coverage, not a
  fallback identifier.
- Technology detection transmits only normalized allowlisted labels already
  produced by project analysis. No paths, dependency names, source, prompts,
  personal data or secrets are emitted.
- AI events are emitted only from an explicit observed integration. An MCP call
  alone is not an AI-model observation. Missing model/token fields stay absent;
  reported zero token usage stays zero. `tokenReportingCapable` distinguishes a
  capable source that omitted usage.
- Lifecycle telemetry is emitted only after the canonical operation persisted a
  successful mutation. Failed or cancelled operations emit no success event.

## Out of scope

- Remote telemetry reads, dashboards, model inference and identity rotation UI.
- Treating Git, commands, or telemetry activity as delivery completion.
- Collecting repository URLs, paths, dependency names, source content, prompts,
  arguments, credentials or PII.

## Acceptance Criteria

1. **Contract and privacy.** CLI and MCP 1.1 events pass shared fixtures and
   reject historical `properties.interface`, commands containing arguments, and
   sensitive/unallowlisted values before delivery. One invalid queued event does
   not prevent delivery of other valid events.
2. **Projects and versions.** Two installations of the same project report a
   single stable opaque `projectId`; an installation updating Kaddo can be
   represented under both actual versions without changing its installation ID.
3. **Lifecycle actions.** A created Work Item, two effective refinements and a
   completion emit four distinct lifecycle actions with one stable
   `workItemIdAnon`. Retries preserve IDs; failed or cancelled operations do not
   emit success events.
4. **Technology and AI.** Allowlisted TypeScript detection remains one project
   technology. Explicit observed model interactions populate model distribution;
   missing values are omitted and reported zero usage is preserved.
5. **Consent and signed delivery.** Disabled consent emits and queues nothing.
   Enabled consent supports registration, stable event retry, and signed HTTP
   `202` delivery. Any production test event is explicitly synthetic.
6. **Coverage.** Deterministic fixtures reach 100% `kaddoVersion` for eligible
   events and at least 95% stable project and Work Item identifiers where
   eligible. Documentation explains period, denominator and privacy threshold;
   a production period without publishable sample remains pending evaluation.

## Validation plan

- Unit tests for 1.1 construction, validation, compatibility, anonymous IDs and
  queues.
- CLI/MCP integration tests for producer parity, successful persistence and
  consent gating.
- Signed delivery tests using a local HTTP fixture, never production credentials.
- Build CLI and MCP and run affected regression suites.

## Delivery notes

The collector’s published contract is a dependency, not a source of truth inside
Kaddo. The client keeps the historical 1.0 event union solely for already queued
records and documents events that do not have a 1.1 catalogue equivalent.
