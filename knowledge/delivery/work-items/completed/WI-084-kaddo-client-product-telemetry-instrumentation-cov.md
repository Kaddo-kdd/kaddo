---
type: feature
id: WI-084
title: Kaddo Client — Product Telemetry Instrumentation & Coverage
status: completed
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
implemented_by: codex
implementation_evidence:
  repositories:
    cli:
      role: module
      status: completed
      changed_paths:
        - packages/cli/src/core/telemetry.ts
        - packages/cli/src/core/telemetry-events.ts
        - packages/cli/src/core/telemetry-identity.ts
        - packages/cli/src/core/work-item-write.ts
        - packages/cli/src/commands/learn.ts
        - packages/cli/tests/telemetry.test.ts
        - packages/cli/tests/telemetry-lifecycle.test.ts
        - packages/cli/tests/telemetry-http-harness.test.ts
      validations:
        - command: GitHub Actions 43813179421 — Telemetry HTTP Integration
          status: passed
          reason: >-
            Real Kaddo client completed signed HTTP delivery against pinned
            telemetry harness and DynamoDB Local.
        - command: GitHub Actions 43813179389 — CI
          status: passed
          reason: Full monorepo build and regression suite passed.
    mcp:
      role: module
      status: completed
      changed_paths:
        - packages/mcp/src/tools.ts
      validations:
        - command: pnpm --filter @kaddo/mcp build
          status: passed
          reason: MCP build passed locally and the shared CI passed.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/telemetry.md
      validations:
        - command: GitHub Actions 43813179389 — CI
          status: passed
          reason: Documentation checks and complete CI passed.
  ac_verifications:
    - criterion: >-
        Contract and privacy. CLI and MCP 1.1 events pass shared fixtures and
        reject historical `properties.interface`, commands containing arguments,
        and sensitive/unallowlisted values before delivery. One invalid queued
        event does not prevent delivery of other valid events.
      status: passed
      evidence: >-
        Shared telemetry validation tests reject non-contract properties and
        sensitive/unallowlisted values before transport.
      reference: packages/cli/tests/telemetry.test.ts; GitHub Actions run 43813179389
      method: automated
      verified_at: '2026-11-16'
    - criterion: >-
        Projects and versions. Two installations of the same project report a
        single stable opaque `projectId`; an installation updating Kaddo can be
        represented under both actual versions without changing its installation
        ID.
      status: passed
      evidence: >-
        Identity fixtures cover restarts, path moves, clones, independent
        projects and installations without deriving identifiers from names or
        paths.
      reference: packages/cli/tests/telemetry.test.ts
      method: automated
      verified_at: '2026-11-16'
    - criterion: >-
        Lifecycle actions. A created Work Item, two effective refinements and a
        completion emit four distinct lifecycle actions with one stable
        `workItemIdAnon`. Retries preserve IDs; failed or cancelled operations
        do not emit success events.
      status: passed
      evidence: >-
        Persistent lifecycle and real HTTP integration tests verify canonical
        create/refine/complete events, stable anonymous identity, retries and
        no-op behavior.
      reference: >-
        packages/cli/tests/telemetry-lifecycle.test.ts;
        packages/cli/tests/telemetry-http-harness.test.ts; GitHub Actions run
        43813179421
      method: automated
      verified_at: '2026-11-16'
    - criterion: >-
        Technology and AI. Allowlisted TypeScript detection remains one project
        technology. Explicit observed model interactions populate model
        distribution; missing values are omitted and reported zero usage is
        preserved.
      status: passed
      evidence: >-
        Telemetry event fixtures retain only observed, allowlisted technologies
        and preserve omitted model fields and zero reported usage.
      reference: packages/cli/tests/telemetry.test.ts
      method: automated
      verified_at: '2026-11-16'
    - criterion: >-
        Consent and signed delivery. Disabled consent emits and queues nothing.
        Enabled consent supports registration, stable event retry, and signed
        HTTP `202` delivery. Any production test event is explicitly synthetic.
      status: passed
      evidence: >-
        The cross-repository E2E verifies registration, Ed25519 HTTP delivery,
        retry/idempotency, disabled consent and best-effort recovery only
        against local DynamoDB.
      reference: >-
        packages/cli/tests/telemetry-http-harness.test.ts; GitHub Actions run
        43813179421
      method: automated
      verified_at: '2026-11-16'
    - criterion: >-
        Coverage. Deterministic fixtures reach 100% `kaddoVersion` for eligible
        events and at least 95% stable project and Work Item identifiers where
        eligible. Documentation explains period, denominator and privacy
        threshold; a production period without publishable sample remains
        pending evaluation.
      status: passed
      evidence: >-
        Deterministic coverage fixtures and product documentation distinguish
        eligible denominators, unavailable data and privacy thresholds without
        requiring production telemetry.
      reference: >-
        packages/cli/tests/telemetry.test.ts;
        apps/docs/src/content/docs/telemetry.md
      method: automated
      verified_at: '2026-11-16'
completed_at: '2026-11-16'
telemetry_work_item_id: 97aba4d5-6f6a-4b80-86c9-62c101c25fd5
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

- Contract and privacy. CLI and MCP 1.1 events pass shared fixtures and reject historical `properties.interface`, commands containing arguments, and sensitive/unallowlisted values before delivery. One invalid queued event does not prevent delivery of other valid events.
- Projects and versions. Two installations of the same project report a single stable opaque `projectId`; an installation updating Kaddo can be represented under both actual versions without changing its installation ID.
- Lifecycle actions. A created Work Item, two effective refinements and a completion emit four distinct lifecycle actions with one stable `workItemIdAnon`. Retries preserve IDs; failed or cancelled operations do not emit success events.
- Technology and AI. Allowlisted TypeScript detection remains one project technology. Explicit observed model interactions populate model distribution; missing values are omitted and reported zero usage is preserved.
- Consent and signed delivery. Disabled consent emits and queues nothing. Enabled consent supports registration, stable event retry, and signed HTTP `202` delivery. Any production test event is explicitly synthetic.
- Coverage. Deterministic fixtures reach 100% `kaddoVersion` for eligible events and at least 95% stable project and Work Item identifiers where eligible. Documentation explains period, denominator and privacy threshold; a production period without publishable sample remains pending evaluation.

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

## Learning

El E2E cruzado con el harness local de kaddo-telemetry validó registro, firma Ed25519, entrega HTTP, persistencia, reintentos, idempotencia, consentimiento y compatibilidad 1.0/1.1 sin usar AWS de producción.
