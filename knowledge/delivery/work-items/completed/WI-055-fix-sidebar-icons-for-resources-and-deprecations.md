---
type: bugfix
id: WI-055
title: Fix sidebar icons for Resources and Deprecations
knowledge_level: K2
status: completed
phase: now
work_type: bugfix
initiative: null
domains:
  - Tech
  - Delivery
code:
  - packages/admin/src/components/Sidebar.tsx
  - packages/admin/package.json
  - pnpm-lock.yaml
created_at: 2026-10-10T00:00:00.000Z
source:
  type: manual
  inferred: false
generated_by: kaddo-create
template_version: 1
summary: >-
  Los iconos actuales de Resources y Deprecations se muestran como glifos
  pequenos o ambiguos en el sidebar de Kaddo Admin
affected_modules:
  - admin
scope_confidence:
  level: high
  reasons:
    - >-
      El defecto está aislado en el arreglo de navegación de Sidebar y no altera
      rutas ni contratos de Resources o Deprecations.
    - >-
      El paquete Admin no tiene una librería de iconos; lucide-react aporta
      iconos SVG consistentes y accesibles con un cambio de dependencia mínimo.
refined_by: work-item-refinement (manual)
ready_at: '2026-10-10'
implementation_evidence:
  repositories:
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/Sidebar.tsx
        - packages/admin/package.json
        - pnpm-lock.yaml
      validations:
        - command: >-
            pnpm exec vitest run
            packages/admin/tests/work-items-presentation.test.ts
          status: passed
          reason: 14 sidebar route-state tests pass.
        - command: pnpm --filter @kaddo/admin build
          status: passed
          reason: TypeScript and the production Admin bundle compile successfully.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-10'
completed_at: '2026-10-10'
---

# Fix sidebar icons for Resources and Deprecations

> Type: bugfix · Level: K2

## Problem

Los iconos actuales de Resources y Deprecations se muestran como glifos pequenos o ambiguos en el sidebar de Kaddo Admin.

## Expected result

Resources y Deprecations usan iconos Lucide SVG claros, consistentes, accesibles y correctamente alineados en estados activo e inactivo.

## Impact

La navegacion se percibe inconsistente y dificulta reconocer estas dos secciones al escanear el Admin.

## Acceptance criteria

- [x] Resources usa `Database` y Deprecations usa `ArchiveX` de `lucide-react`, sin glifos Unicode.
- [x] Los iconos mantienen un área de 20 px, no desplazan las etiquetas y se ocultan de lectores de
      pantalla porque el texto del botón ya identifica la ruta.
- [x] Las rutas, el estado activo y la navegación del sidebar no cambian.

## Out of scope

- Rediseño completo del sidebar o sustitución de los iconos de otras rutas.
- Cambios funcionales a Resources, Deprecations, sus rutas o endpoints.

## Validation

- `pnpm --filter @kaddo/admin build`
- `pnpm exec vitest run packages/admin/tests/work-items-presentation.test.ts`
- Revisión visual local del sidebar en estados activo e inactivo.

## Definition of Done

- [x] Problem is clear.
- [x] Expected result is defined.
- [x] Impact of not doing it is stated.
- [x] Acceptance criteria are verifiable.

## Learning

Los iconos de navegacion deben ser SVG consistentes y accesibles; los glifos Unicode dependen de la fuente y pueden perder legibilidad en interfaces operativas.
