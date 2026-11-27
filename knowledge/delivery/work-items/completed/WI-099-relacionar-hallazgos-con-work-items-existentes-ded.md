---
type: feature
id: WI-099
title: Relacionar hallazgos con Work Items existentes + dedup
knowledge_level: K3
status: completed
phase: now
initiative: INI-001
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/core/audit*
  - packages/cli/tests/audit*
created_at: '2026-11-27'
source: initiative
source_id: AUD-C10
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-6
dependencies:
  - AUD-C7
ready_at: '2026-11-27'
implementation_evidence:
  repositories:
    cli:
      role: module
      status: completed
      changed_paths:
        - packages/cli/src/core/work-item-write.ts
        - packages/cli/src/core/audit-correlation.ts
        - packages/cli/src/core/audit-report.ts
        - packages/cli/src/commands/audit.ts
        - packages/cli/src/index.ts
        - packages/cli/tests/audit-work-item-link.test.ts
      validations:
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: >-
            pnpm --filter @kaddo/cli exec vitest run
            tests/audit-work-item-link.test.ts tests/audit-correlation.test.ts
            tests/audit-report.test.ts tests/audit-report-command.test.ts
            tests/audit-run-command.test.ts tests/audit-contract.test.ts
          status: passed
          reason: '45 tests passed, including a CLI process and filesystem fixture.'
  ac_verifications:
    - criterion: >-
        Identificar propuestas de Work Items relacionados con evidencia y
        distinguir coincidencias sugeridas de relaciones confirmadas.
      status: passed
      evidence: >-
        Correlation retains heuristic match strength and separately exposes
        approved Work Item links.
      reference: >-
        packages/cli/tests/audit-correlation.test.ts;
        packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        Asociar un hallazgo identificado por su ID estable a un Work Item
        existente únicamente tras aprobación explícita, validando ambas
        referencias.
      status: passed
      evidence: >-
        Core and CLI validate identifiers and require confirmation before
        writing.
      reference: packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        La asociación es idempotente y conserva la trazabilidad entre
        ejecuciones sin duplicar relaciones ni crear Work Items automáticamente.
      status: passed
      evidence: >-
        Repeated association is a no-op and a subsequent audit with the same
        stable ID recovers the link.
      reference: packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        Los errores, referencias inexistentes y ausencia de aprobación no
        modifican artifacts canónicos ni resultados existentes.
      status: passed
      evidence: >-
        The filesystem fixture checks rejected requests preserve the Work Item
        and the CLI test preserves the stored audit.
      reference: packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        Exponer la misma información desde Core a las interfaces existentes
        pertinentes, sin duplicar reglas de correlación.
      status: passed
      evidence: >-
        Audit CLI report invokes the Core correlation projection; no Audit
        interface currently exists in MCP or Admin.
      reference: >-
        packages/cli/src/commands/audit.ts;
        packages/cli/tests/audit-work-item-link.test.ts
      method: automated
    - criterion: >-
        Cubrir asociaciones, deduplicación, concurrencia y fallos con pruebas
        automatizadas y documentar el flujo.
      status: passed
      evidence: >-
        Tests exercise stale revisions, missing references, confirmation and
        idempotency; English and Spanish guides describe the command.
      reference: >-
        packages/cli/tests/audit-work-item-link.test.ts;
        apps/docs/src/content/docs/commands/audit.md;
        apps/docs/src/content/docs/es/commands/audit.md
      method: automated
completed_at: '2026-11-27'
telemetry_work_item_id: 6dbfa97e-d10a-4746-9f48-b3d3502dbb65
---

# Relacionar hallazgos con Work Items existentes + dedup

> Materialized from Initiative INI-001, candidate AUD-C10.

## Problem

La correlación de auditoría sugiere Work Items por ruta o módulo, pero no confirma que sean equivalentes al hallazgo. Se necesita una relación explícita, trazable y aprobada que permita reconocer trabajo existente y evitar duplicados sin confundir coincidencias heurísticas con vínculos confirmados.

## Acceptance Criteria

- [ ] Identificar propuestas de Work Items relacionados con evidencia y distinguir coincidencias sugeridas de relaciones confirmadas.
- [ ] Asociar un hallazgo identificado por su ID estable a un Work Item existente únicamente tras aprobación explícita, validando ambas referencias.
- [ ] La asociación es idempotente y conserva la trazabilidad entre ejecuciones sin duplicar relaciones ni crear Work Items automáticamente.
- [ ] Los errores, referencias inexistentes y ausencia de aprobación no modifican artifacts canónicos ni resultados existentes.
- [ ] Exponer la misma información desde Core a las interfaces existentes pertinentes, sin duplicar reglas de correlación.
- [ ] Cubrir asociaciones, deduplicación, concurrencia y fallos con pruebas automatizadas y documentar el flujo.

## Out of scope

Creación automática de Work Items, modificación de severidad o estado de hallazgos y el comando de planificación de remediación AUD-C11.

## Validation

Pruebas de Core e integración de las interfaces afectadas; build, regresión pertinente y Kaddo Guard.

## Learning

Las relaciones aprobadas deben conservar el ID estable del hallazgo y distinguirse de sugerencias heurísticas; la deduplicación requiere probar tanto reintentos como auditorías posteriores.
