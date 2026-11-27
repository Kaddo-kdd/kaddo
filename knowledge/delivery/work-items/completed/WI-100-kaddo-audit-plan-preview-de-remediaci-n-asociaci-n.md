---
type: feature
id: WI-100
title: >-
  kaddo audit plan — preview de remediación + asociación a Planning con
  aprobación
knowledge_level: K3
status: completed
phase: now
initiative: INI-001
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/core/audit*
  - packages/cli/src/commands/audit.ts
  - packages/cli/tests/audit*
created_at: '2026-11-27'
source: initiative
source_id: AUD-C11
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-7
  - EP-001 AC-10
dependencies:
  - AUD-C10
  - AUD-C9
ready_at: '2026-11-27'
implementation_evidence:
  repositories:
    cli:
      role: module
      status: completed
      changed_paths:
        - packages/cli/src/core/audit-plan.ts
        - packages/cli/src/commands/audit.ts
        - packages/cli/src/index.ts
        - packages/cli/tests/audit-plan.test.ts
        - packages/cli/tests/audit-work-item-link.test.ts
      validations:
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: >-
            pnpm --filter @kaddo/cli exec vitest run tests/audit-plan.test.ts
            tests/audit-work-item-link.test.ts
            tests/audit-report-command.test.ts tests/audit-run-command.test.ts
            tests/audit-correlation.test.ts tests/audit-report.test.ts
            tests/audit-contract.test.ts
          status: passed
          reason: 46 tests passed including the CLI process fixture.
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: Build completed with duplicate audit page ID warnings.
        - command: node packages/cli/dist/index.js guard --ci
          status: passed
          reason: Eight informational ownership findings.
  ac_verifications:
    - criterion: >-
        Previsualizar de forma determinista las acciones propuestas a partir de
        una auditoría persistida, con evidencia, prioridad y cobertura
        incompleta claramente indicada.
      status: passed
      evidence: >-
        Core fixture tests ordering, evidence, determinism and partial coverage;
        CLI process tests a persisted run.
      reference: >-
        packages/cli/tests/audit-plan.test.ts;
        packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        Distinguir vínculos aprobados y sugerencias, evitando proponer
        duplicados para hallazgos ya asociados.
      status: passed
      evidence: >-
        CLI process verifies already-linked actions and the projection separates
        confirmed from suggested Work Items.
      reference: >-
        packages/cli/tests/audit-work-item-link.test.ts;
        packages/cli/src/core/audit-plan.ts
      method: automated
    - criterion: >-
        Asociar un hallazgo a un Work Item existente únicamente con aprobación
        explícita mediante la operación canónica de WI-099.
      status: passed
      evidence: >-
        CLI fixture rejects an unapproved link, accepts an explicitly confirmed
        one and verifies idempotence.
      reference: packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        El preview no escribe archivos ni modifica lifecycles; errores y
        ausencia de aprobación no alteran Planning.
      status: passed
      evidence: >-
        CLI fixture compares Work Item and audit contents before and after
        preview and rejects invalid audit IDs.
      reference: packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        Cubrir Core y CLI con pruebas, documentar el flujo y validar builds y
        guard.
      status: passed
      evidence: >-
        46 tests and CLI and docs builds passed; guard completed with
        informational findings.
      reference: >-
        packages/cli/tests/audit-plan.test.ts;
        packages/cli/tests/audit-work-item-link.test.ts;
        apps/docs/src/content/docs/commands/audit.md;
        apps/docs/src/content/docs/es/commands/audit.md
      method: automated
completed_at: '2026-11-27'
telemetry_work_item_id: d7a3d92d-1f45-453d-8ada-3288cb73dafc
---

# kaddo audit plan — preview de remediación + asociación a Planning con aprobación

> Materialized from Initiative INI-001, candidate AUD-C11.

## Problem

Los hallazgos de auditoría necesitan una propuesta revisable de remediación que preserve su evidencia y sus relaciones existentes sin modificar Planning automáticamente.

## Acceptance Criteria

- [ ] Previsualizar de forma determinista las acciones propuestas a partir de una auditoría persistida, con evidencia, prioridad y cobertura incompleta claramente indicada.
- [ ] Distinguir vínculos aprobados y sugerencias, evitando proponer duplicados para hallazgos ya asociados.
- [ ] Asociar un hallazgo a un Work Item existente únicamente con aprobación explícita mediante la operación canónica de WI-099.
- [ ] El preview no escribe archivos ni modifica lifecycles; errores y ausencia de aprobación no alteran Planning.
- [ ] Cubrir Core y CLI con pruebas, documentar el flujo y validar builds y guard.

## Out of scope

Ejecución de remediaciones, modificación automática de código y creación automática de entidades Planning.

## Validation

Pruebas Core y CLI con fixtures de auditoría y Work Items, build y Kaddo Guard.

## Learning

Un preview determinista debe separar sugerencias de vínculos aprobados, exponer cobertura parcial y delegar las escrituras confirmadas en el flujo canónico existente.
