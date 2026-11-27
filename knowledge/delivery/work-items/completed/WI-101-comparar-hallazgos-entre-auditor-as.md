---
type: feature
id: WI-101
title: Comparar hallazgos entre auditorías
status: completed
work_type: feature
knowledge_level: K2
created_at: '2026-11-27'
source:
  type: manual
  inferred: false
generated_by: kaddo-admin
affected_modules:
  - cli
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/core/audit*
  - packages/cli/src/commands/audit.ts
  - packages/cli/tests/audit*
epic: EP-001
scope_confidence:
  level: medium
  reasons:
    - >-
      La comparabilidad de cobertura parcial y cambios de herramientas requiere
      validación conservadora.
summary: Comparar ejecuciones de auditoría con cobertura y alcance explícitos.
telemetry_work_item_id: 8f499fab-6451-49b9-b1ef-7e888b59bd73
ready_at: '2026-11-27'
implementation_evidence:
  repositories:
    cli:
      role: module
      status: completed
      changed_paths:
        - packages/cli/src/core/audit-compare.ts
        - packages/cli/src/commands/audit.ts
        - packages/cli/src/index.ts
        - packages/cli/tests/audit-compare.test.ts
      validations:
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: >-
            pnpm --filter @kaddo/cli exec vitest run tests/audit-compare.test.ts
            tests/audit-contract.test.ts tests/audit-run-command.test.ts
            tests/audit-report-command.test.ts tests/audit-analyzers.test.ts
            tests/audit-orchestrator.test.ts tests/audit-scope.test.ts
          status: passed
          reason: 60 tests passed.
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: Build passed with existing duplicate audit page ID warnings.
        - command: node packages/cli/dist/index.js guard --ci
          status: passed
          reason: Eight informational ownership findings.
  ac_verifications:
    - criterion: >-
        Comparar dos auditorías por IDs explícitos y clasificar hallazgos nuevos
        y persistentes mediante sus IDs estables, sin duplicar entradas y con
        orden determinista.
      status: passed
      evidence: >-
        Fixtures verify stable IDs, ordering, deduplication and comparison
        classifications.
      reference: packages/cli/tests/audit-compare.test.ts
      method: automated
    - criterion: >-
        Clasificar como resuelto un hallazgo ausente solo cuando la evidencia de
        alcance y cobertura de la ejecución posterior permita concluir que el
        área y la fuente correspondientes fueron evaluadas; de lo contrario
        marcarlo como no verificable, con motivo.
      status: passed
      evidence: >-
        Fixtures exercise matching file and tool coverage and conservative
        unverifiable cases.
      reference: packages/cli/tests/audit-compare.test.ts
      method: automated
    - criterion: >-
        Mostrar cambios relevantes de severidad, confianza, estado y evidencia
        para hallazgos persistentes, conservando las referencias originales de
        ambas ejecuciones.
      status: passed
      evidence: >-
        Comparison fixture verifies all four changed fields and preserves both
        findings.
      reference: packages/cli/tests/audit-compare.test.ts
      method: automated
    - criterion: >-
        Detectar y explicar ejecuciones parciales o fallidas, cambios de alcance
        o herramientas, datos incompletos e incompatibilidades; no afirmar
        cobertura completa ni resolución cuando no esté sustentada.
      status: passed
      evidence: >-
        Fixtures cover partial, missing, different scope, unknown version and
        changed tool versions.
      reference: packages/cli/tests/audit-compare.test.ts
      method: automated
    - criterion: >-
        `kaddo audit compare` ofrece salida legible y JSON coherente desde Core,
        rechaza IDs inválidos o inexistentes y no ejecuta herramientas ni
        modifica auditorías, conocimiento, Planning o lifecycles.
      status: passed
      evidence: >-
        CLI process fixture checks JSON, human output, invalid and missing IDs
        and unchanged audit files; command uses Core only.
      reference: >-
        packages/cli/tests/audit-compare.test.ts;
        packages/cli/src/commands/audit.ts
      method: automated
    - criterion: >-
        Tratar de forma explícita la comparación de una auditoría consigo misma,
        duplicados, ausencia de baseline y datos históricos con campos
        opcionales ausentes.
      status: passed
      evidence: >-
        Fixtures cover identical runs, duplicate IDs, missing CLI argument and
        missing coverage and tool metadata.
      reference: packages/cli/tests/audit-compare.test.ts
      method: automated
    - criterion: >-
        Documentar la semántica y limitaciones de identidad: el ID actual
        incluye línea y ruta, por lo que movimientos pueden aparecer como
        hallazgos distintos; no inferir equivalencias sin evidencia.
      status: passed
      evidence: >-
        English and Spanish documentation state the identity and coverage
        limitations.
      reference: >-
        apps/docs/src/content/docs/commands/audit.md;
        apps/docs/src/content/docs/es/commands/audit.md
      method: manual
    - criterion: >-
        Cubrir Core y CLI con pruebas automatizadas de comparación, cobertura
        parcial, ámbitos distintos, errores y ausencia de escrituras; ejecutar
        builds, regresión pertinente y `kaddo guard --ci`.
      status: passed
      evidence: >-
        60 tests and CLI and docs builds passed; guard completed with eight
        informational findings.
      reference: packages/cli/tests/audit-compare.test.ts
      method: automated
completed_at: '2026-11-27'
---

# Comparar hallazgos entre auditorías

> Type: feature

## Problem

Las auditorías guardan IDs estables y evidencia, pero no permiten explicar qué hallazgos son nuevos, persistentes o dejaron de observarse entre dos ejecuciones. Una ausencia con cobertura insuficiente no demuestra resolución.

## Target Behavior

Ofrecer una comparación de solo lectura entre dos `AuditRun` persistidos, utilizando el contrato Core compartido y exponiéndola mediante `kaddo audit compare`. Identificar los hallazgos comparables por su ID estable, conservar evidencia y procedencia, y comunicar diferencias de alcance, herramientas y cobertura.

## Acceptance Criteria

- [ ] Comparar dos auditorías por IDs explícitos y clasificar hallazgos nuevos y persistentes mediante sus IDs estables, sin duplicar entradas y con orden determinista.
- [ ] Clasificar como resuelto un hallazgo ausente solo cuando la evidencia de alcance y cobertura de la ejecución posterior permita concluir que el área y la fuente correspondientes fueron evaluadas; de lo contrario marcarlo como no verificable, con motivo.
- [ ] Mostrar cambios relevantes de severidad, confianza, estado y evidencia para hallazgos persistentes, conservando las referencias originales de ambas ejecuciones.
- [ ] Detectar y explicar ejecuciones parciales o fallidas, cambios de alcance o herramientas, datos incompletos e incompatibilidades; no afirmar cobertura completa ni resolución cuando no esté sustentada.
- [ ] `kaddo audit compare` ofrece salida legible y JSON coherente desde Core, rechaza IDs inválidos o inexistentes y no ejecuta herramientas ni modifica auditorías, conocimiento, Planning o lifecycles.
- [ ] Tratar de forma explícita la comparación de una auditoría consigo misma, duplicados, ausencia de baseline y datos históricos con campos opcionales ausentes.
- [ ] Documentar la semántica y limitaciones de identidad: el ID actual incluye línea y ruta, por lo que movimientos pueden aparecer como hallazgos distintos; no inferir equivalencias sin evidencia.
- [ ] Cubrir Core y CLI con pruebas automatizadas de comparación, cobertura parcial, ámbitos distintos, errores y ausencia de escrituras; ejecutar builds, regresión pertinente y `kaddo guard --ci`.

## Out of scope

Modificar estados canónicos o cerrar Work Items, ejecutar remediaciones, introducir coincidencia semántica o interfaces MCP/Admin nuevas. La paridad de interfaces es parte del trabajo posterior de EP-001.

## Validation

Fixtures de auditorías persistidas en un directorio temporal; pruebas Core y de proceso CLI, build de CLI y documentación y Kaddo Guard. No utilizar auditorías reales para fabricar resultados.

## Learning

La ausencia de un hallazgo no demuestra resolución sin cobertura explícita del archivo y versiones de herramienta comparables; los datos históricos incompletos deben permanecer como no verificables.
