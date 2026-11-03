---
type: feature
id: WI-075
title: Kaddo Admin — Unified Planning Experience
status: completed
work_type: feature
knowledge_level: K3
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - admin
  - admin-server
antecedent: WI-074
scope_confidence:
  level: high
  reasons:
    - >-
      El dominio (Plans/Epics/Initiatives) ya existe tras WI-074; esto es
      integración y navegación de UI, no modelo.
    - >-
      Reutiliza las pantallas y endpoints existentes de Initiatives y la
      proyección de Planning Core.
    - >-
      Alcance acotado a Admin (frontend + una ampliación de proyección de solo
      lectura), sin tocar lifecycle ni contratos CLI/MCP.
summary: >-
  Unificar la experiencia de planificación en Kaddo Admin: una única entrada
  "Planning" con navegación secundaria (Overview, Delivery Plans, Epics,
  Initiatives), reutilizando las pantallas existentes de Initiatives y las
  proyecciones de Core, preservando relaciones opcionales, enlaces existentes y
  compatibilidad con proyectos legacy. Sin crear relaciones ni migrar artifacts.
ready_at: '2026-11-02'
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    admin:
      role: frontend
      status: completed
      changed_paths:
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/routes/Initiatives.tsx
        - packages/admin/src/components/Sidebar.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/planning.spec.ts
        - >-
          packages/admin/e2e/fixtures/project/knowledge/delivery/initiatives/INI-051.md
      validations:
        - command: pnpm vitest run packages/admin/tests
          status: passed
        - command: pnpm --filter @kaddo/admin exec playwright test planning.spec.ts
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
    admin-server:
      role: projection
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/tests/planning.test.ts
      validations:
        - command: pnpm vitest run packages/admin-server/tests/planning.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin-server build
          status: passed
verified_at: '2026-11-03'
completed_at: '2026-11-03'
released_in: v3.132.0
---

# WI-075 — Kaddo Admin Unified Planning Experience

## Contexto

WI-074 incorporó Delivery Plans y Epics. Hoy Admin tiene dos entradas separadas (Initiatives y
Planning). Planning solo muestra Plans/Epics; si un proyecto (p. ej. Wasma, con 9 Initiatives) no tiene
Plans/Epics, Planning aparece "vacío", dando la impresión falsa de que no hay planificación. Es un
problema de integración/navegación, no de dominio.

## Objetivo

Una experiencia unificada: ver y gestionar Plans, Epics e Initiatives desde un mismo espacio,
preservando relaciones opcionales y compatibilidad. **Reutilizar** Core y endpoints existentes; sin
heurísticas de frontend, sin migración automática, sin Git Collaboration Evidence.

## Alcance

1. **Navegación unificada.** Sidebar: una sola entrada **Planning**; eliminar Initiatives del menú
   principal. Dentro de Planning, navegación secundaria (tabs del Design System): Overview · Delivery
   Plans · Epics · Initiatives. No duplicar las pantallas de Initiatives. Preservar `/initiatives` e
   `/initiatives/:id` (compatibilidad de rutas/redirección) sin romper bookmarks.
2. **Unified Planning Overview** (`/planning`): indicadores independientes (Delivery Plans, Epics,
   Initiatives, Work Items asociados, elementos bloqueados, Initiatives sin Epic). Debajo, secciones
   Delivery Plans / Epics / Initiatives (las Initiatives se muestran siempre, aun sin Plans/Epics).
3. **Consolidar gestión de Initiatives.** Reutilizar listado/creación/detalle/lifecycle/candidatos/
   coverage/delivery/relaciones existentes, accesibles desde Planning → Initiatives. Si existe un
   contrato de actualización que asocie Initiative↔Epic, ofrecer una acción explícita; si Admin no lo
   soporta de forma segura, documentar la limitación (sin mutación improvisada). Nunca asociar ni crear
   Plans/Epics automáticamente.
4. **Navegación jerárquica** Plan → Milestone → Epic → Initiative → Work Item, con breadcrumbs/contexto
   cuando existan asociaciones. Una Initiative sin Epic se muestra como independiente (sin inventar
   relaciones).
5. **Métricas de progreso:** cuando no haya Work Items asociados, mostrar **"No Work Items linked"** en
   vez de `0/0`. Mantener separados Planning Coverage / Delivery Progress / Completion Readiness. No
   inferir asociaciones por nombre/ID; no marcar una Initiative completada por tener sus WIs cerrados.
6. **Empty States inteligentes:** (A) hay Initiatives pero no Plans/Epics → mostrar Initiatives +
   explicar que pueden organizarse opcionalmente; (B) hay Plans/Epics → jerarquía; (C) solo Work Items
   → explicar que Planning es opcional + acceso a WIs; (D) nada de planificación → guía breve. Nunca
   presentar la ausencia de Plans/Epics como falta total de planificación.

## Límites arquitectónicos

Preservar Delivery Planning Core, lifecycle, asociaciones opcionales, Knowledge Graph, compatibilidad
CLI/MCP, progreso determinístico y aprobación humana. Reutilizar proyecciones/endpoints de Core; sin
relaciones derivadas por heurística; sin migración; sin Git evidence.

## Acceptance Criteria

- [x] AC-01: Planning es la única entrada principal para Plans, Epics e Initiatives.
- [x] AC-02: existe navegación secundaria entre Overview, Delivery Plans, Epics e Initiatives.
- [x] AC-03: Planning Overview muestra las Initiatives existentes aunque no existan Plans ni Epics.
- [x] AC-04: se conserva la creación, visualización y gestión actual de Initiatives.
- [x] AC-05: los enlaces existentes hacia Initiatives continúan funcionando.
- [x] AC-06: las Initiatives sin Epic se identifican sin tratarlas como errores.
- [x] AC-07: la navegación jerárquica conserva contexto y permite acceder a Work Items.
- [x] AC-08: las métricas distinguen candidatos materializados de Work Items vinculados.
- [x] AC-09: no se crean ni modifican relaciones automáticamente.
- [x] AC-10: proyectos legacy funcionan sin migraciones.
- [x] AC-11: los cambios respetan el Design System y funcionan en Light/Dark/mobile.
- [x] AC-12: existen pruebas de regresión y E2E para la navegación y los estados vacíos.

## Validation

- Reutiliza endpoints existentes (`/api/v1/admin/initiatives`, `/planning`) ampliando la proyección de
  overview para incluir Initiatives + detección de "sin Epic" en Core/adapter (solo lectura).
- Pruebas E2E de navegación (tabs, jerarquía, retorno) y de Empty States (A-D); regresión de rutas
  `/initiatives` e `/initiatives/:id`.
- Validación visual local Light/Dark/mobile con fixtures representativos de Wasma (9 Initiatives sin
  Plans/Epics); sin modificar conocimiento canónico.

## Out of Scope

- Git Collaboration Evidence / observación de actividad.
- Migración automática de artifacts.
- Creación/asociación automática de Plans/Epics o Initiatives.
- Cambios en Delivery Planning Core, lifecycle o contratos CLI/MCP (salvo ampliar una proyección de
  solo lectura).
- Reabrir WI-074.

## Commit Gate

No realizar commit, push, tag ni release sin aprobación explícita. Antes: ejecutar builds y pruebas;
levantar Admin; mostrar Planning Overview con las Initiatives de Wasma; validar navegación completa y
Empty States; validar Light/Dark/mobile; presentar capturas y diff; solicitar aprobación.

## Guiding Principle

Planning es el espacio donde se comprende, organiza y supervisa el trabajo; Work Items donde se
ejecuta y completa. La planificación crece progresivamente, sin obligar a usar Plans o Epics.

## Learning

Capturado al cerrar WI-075 (liberado en v3.132.0).

- **Unificar vista ≠ unificar modelo.** La experiencia se unificó en una sola entrada *Planning* con
  navegación secundaria (Overview · Delivery Plans · Epics · Initiatives) reutilizando las pantallas
  de Initiatives y las proyecciones de Core, sin crear ni migrar relaciones. La integración vivió en
  navegación y en una ampliación de solo lectura de `getPlanningOverviewAdmin`; el dominio de WI-074
  quedó intacto. Confirma que problemas de "parece vacío" suelen ser de presentación, no de datos.

- **Ausencia de Plans/Epics no es ausencia de planificación.** Las Initiatives se muestran siempre, y
  las que no tienen Epic se marcan como *independent (no epic)* con un indicador "Initiatives without
  Epic" — informativo, nunca un error. Los proyectos legacy (Wasma: Initiatives sin Plans/Epics)
  funcionan sin migración. El empty state comunica que Plans/Epics son opcionales.

- **Tipos distintos exigen normalización explícita en el borde de la proyección.** El bug
  "delivery undefined" nació de tratar `InitiativeDelivery` (`{ total, byState }`, sin `completed`)
  como si fuera `DeliveryProgress` de Epics/Plans (`{ total, byState, completed, blocked }`). La cura
  fue normalizar en el adapter (`completed = prog.delivery.byState?.completed ?? 0`) y una regresión
  que afirma que ningún indicador rinde `undefined`/`NaN`. **Por qué:** mezclar dos contratos de
  progreso en una misma tarjeta rompe silenciosamente; la frontera de proyección es donde se reconcilian.

- **"Bloqueado" necesita un sustantivo.** Un único "Blocked: 0" junto a Epics era ambiguo. Se separó
  en **"Blocked Work Items"** (Work Items realmente bloqueados) y **"Epics with pending dependencies"**
  (derivado de `validatePlanningGraph`, visible solo cuando `> 0`), manteniendo el hallazgo en
  *Planning checks*. **Clave:** una dependencia de Epic pendiente **nunca** cambia el estado de
  lifecycle del Epic — sigue `in-progress`; la completitud siempre es human-gated.

- **No toda asociación cabe en la UI de esta entrega.** La asociación Initiative↔Epic se dejó como
  limitación documentada (disponible vía `kaddo epic associate` / MCP `kaddo_associate_initiative_epic`)
  en lugar de improvisar una mutación en Admin. Preferir documentar el camino existente a inventar uno.

### Impacto en conocimiento canónico

- Ninguna modificación de conocimiento canónico. Los fixtures de demostración (PLAN-001, EP-001/002,
  INI-900/901/902, WI-950) fueron temporales para validación visual y se eliminaron antes del commit;
  solo persisten los fixtures de prueba bajo `packages/admin/e2e/fixtures/`.
