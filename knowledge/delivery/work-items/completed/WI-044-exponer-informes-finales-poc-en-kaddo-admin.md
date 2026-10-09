---
type: feature
id: WI-044
title: Exponer informes finales POC en Kaddo Admin
status: completed
work_type: feature
created_at: '2026-10-09'
source:
  type: external
  imported_at: '2026-10-09'
  source_format: markdown
  source_hash: 4234172d0e5b4cb54ab13258207d746d5ccf05094b16ce97d08a6b6cf243541b
  inferred: false
generated_by: kaddo-admin
domains:
  - Delivery
  - Tech
affected_modules:
  - core
  - admin
code:
  - packages/admin-server/src/contracts/schemas.ts
  - packages/admin-server/src/core-adapter.ts
  - packages/admin/src/lib/api.ts
  - packages/admin/src/routes/Overview.tsx
summary: >-
  Mostrar en Kaddo Admin el estado missing/current/stale, la conclusión y el
  último informe final de una POC.
original_snapshot:
  title: Exponer informes finales POC en Kaddo Admin
  description: >-
    Mostrar en Kaddo Admin el estado missing/current/stale, la conclusión y el
    último informe final de una POC.
scope_confidence:
  level: high
  reasons:
    - The report projection and its Core boundary already exist in WI-043.
    - >-
      The change is read-only and is bounded to the existing Admin overview
      contract.
refined_by: work-item-refinement (manual)
ready_at: '2026-10-09'
implementation_status: completed
validation_status: passed
verified_at: '2026-10-09'
completed_at: '2026-10-09'
release_version: v3.120.0
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/admin-server/src/contracts/schemas.ts
        - packages/admin-server/src/core-adapter.ts
        - packages/admin/src/lib/api.ts
        - packages/admin/src/components/PocFinalReport.tsx
        - packages/admin/src/routes/Overview.tsx
        - packages/cli/tests/admin-poc-report.test.ts
        - packages/admin/tests/poc-final-report-presentation.test.ts
      validations:
        - command: pnpm test -- --reporter=dot
          status: passed
          reason: Full workspace suite passed (143 files, 1906 tests).
        - command: pnpm --filter @kaddo/admin-server build && pnpm --filter @kaddo/admin build && pnpm --filter @kaddo/cli build
          status: passed
          reason: Admin Server, Admin, and CLI builds passed.
        - command: git diff --check
          status: passed
          reason: No whitespace errors.
---

# Exponer informes finales POC en Kaddo Admin

## Intent

Mostrar en Kaddo Admin el estado missing/current/stale, la conclusión y el último informe final de una POC.

## Scope

- Exponer desde Admin Server una proyección segura de `buildPocReportContext` dentro de
  `ProjectOverview`.
- Mostrar una sección read-only de Final POC Report en Overview, solo para proyectos en modo
  `poc`.
- Mostrar la conclusión canónica, el estado `missing`/`current`/`stale`, versión y ruta del último
  informe y su contenido cuando exista.
- Mostrar las fuentes seleccionadas y, cuando aplique, los cambios que hacen que un informe esté
  `stale`, sin incluir contenido de fuentes, fingerprints ni valores secretos.
- Añadir pruebas de contrato/adaptador y una prueba de presentación de Admin.

## Acceptance Criteria

- [x] Admin muestra el estado del informe para una POC concluida.
- [x] Admin muestra el contenido del último informe cuando existe.
- [x] El estado stale se presenta sin generar una nueva versión.
- [x] No se exponen secretos ni se agregan mutaciones silenciosas.
- [x] Los proyectos standard no muestran la sección Final POC Report.
- [x] La respuesta Overview mantiene compatibilidad para clientes existentes.

## Out of Scope

- Generar reportes desde la UI.
- Llamar proveedores de IA.
- Mostrar el contenido de fuentes seleccionadas o fingerprints.
- Cambiar el lifecycle de `poc.md`, el CLI, MCP o la semántica de frescura.

## Refinement

### Current behavior verified

- WI-043 ya expone `buildPocReportContext` desde Core y persiste reportes inmutables en
  `knowledge/delivery/poc-report-vNNN.md` después de confirmación humana.
- El endpoint existente `GET /api/v1/admin/overview` compone `ProjectOverview` desde el adaptador
  de Core; no existe una proyección Admin para los reportes POC.
- La pantalla Overview ya consume ese contrato y es el lugar donde el modo POC y la ruta del
  proyecto se muestran. Por tanto, no se necesita una nueva navegación ni endpoint.

### Target journey

1. Una persona abre Admin sobre un proyecto en modo POC.
2. Overview muestra Final POC Report con la conclusión canónica y el estado actual.
3. Si no hay informe, la pantalla deja claro que no existe aún, sin ofrecer una escritura.
4. Si existe, muestra la versión, ruta, fuentes seleccionadas y el Markdown del informe.
5. Si es `stale`, muestra cuáles fuentes cambiaron; la persona vuelve al flujo CLI/MCP para
   preparar y confirmar una nueva versión.

### Technical approach

1. Definir `PocReportSummarySchema` como una proyección serializable y segura: elegibilidad,
   conclusión, estado, metadatos mínimos del último informe, próxima ruta, fuentes por
   ruta/tipo, cambios detectados, handoff y contenido del último informe.
2. Construir la proyección en `core-adapter.ts` con `buildPocReportContext`. Leer el informe solo
   desde la ruta derivada por Core y devolverlo como Markdown; nunca devolver `sources.content`,
   digests ni fingerprints.
3. Incluir el campo opcional en `ProjectOverview` solo para POC, preservando la forma de las
   respuestas de proyectos standard.
4. Añadir una sección compacta y expandible en Overview. La sección es informativa: no tendrá
   botones de generación, persistencia ni mutación.

### Validation plan

- Adaptador: una POC concluida sin informe devuelve `missing`; tras persistir v001 devuelve
  `current` con contenido; al modificar una fuente seleccionada devuelve `stale`, sin crear v002.
- Seguridad: una fuente con una clave secreta no hace que el valor aparezca en Overview.
- Contrato: el esquema acepta Overview standard sin `pocReport` y POC con el resumen.
- Presentación: el componente hace visibles `missing`, `current`, `stale`, versión/ruta y el
  informe sin presentar controles de escritura.
- Regresión: ejecutar las pruebas focalizadas y los builds de Admin/Admin Server, además de
  `git diff --check`.

## Learning

Admin can consume a derived POC report safely when the Core boundary supplies only report metadata
and a sanitized persisted artifact. Keeping the UI read-only preserves the existing CLI/MCP
confirmation boundary while making report freshness visible to project stakeholders.
