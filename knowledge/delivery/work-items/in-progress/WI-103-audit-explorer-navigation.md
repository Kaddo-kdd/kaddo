---
type: feature
id: WI-103
title: Audit Explorer & Navigation
knowledge_level: K2
status: in-progress
phase: now
priority: high
initiative: INI-002
domains:
  - Tech
  - Product Experience
code:
  - packages/admin/src/**
created_at: '2026-11-27'
source: initiative
source_id: AUD-ADMIN-C2
source_initiative: INI-002
affected_modules:
  - admin
source_signals:
  - EP-001 AC-4
  - EP-001 AC-9
dependencies:
  - AUD-ADMIN-C1
scope_confidence:
  level: high
  reasons:
    - >-
      La API de lectura ya existe (WI-102: GET /api/v1/admin/audits y
      /audits/:id); este WI es la capa de UI de Admin (listado, métricas,
      estados, navegación) reutilizando el cliente api.ts y los componentes
      existentes.
    - >-
      Límite claro con candidatos hermanos: el explorador de hallazgos y
      evidencia es C4, la ejecución es C3 y la comparación es C5; aquí solo el
      explorador de ejecuciones y la navegación al detalle.
surfaces:
  product-ui: affected
  frontend: affected
  backend: reviewed-not-affected
  database: not-applicable
  configuration: not-applicable
  feature-flags: not-applicable
  content-copy: affected
  auth: reviewed-not-affected
  notifications: not-applicable
  analytics: not-applicable
  documentation: reviewed-not-affected
  operations-release: not-applicable
ready_at: '2026-11-27'
---

# Audit Explorer & Navigation

> Materialized from Initiative INI-002, candidate AUD-ADMIN-C2.

## 1. Problema y valor

**Actor:** quien usa Kaddo Admin para consultar auditorías.

**Comportamiento actual:** WI-102 expuso los contratos HTTP de lectura de
auditorías en Admin Server (`GET /api/v1/admin/audits`, `/audits/:id`, `/plan`,
`/audit-comparison`), pero Admin **no tiene sección Audit**: no hay forma de ver
las ejecuciones ni navegar a su detalle desde la UI.

**Comportamiento objetivo:** una sección **Audit** en Admin con un **explorador**
de ejecuciones (listado con id, fecha, estado y métricas de hallazgos), estados de
carga/error/vacío, y **navegación** a una ruta de detalle que muestra la cabecera
del run y un resumen de hallazgos. La UI es de **solo lectura** (ejecutar es C3; el
explorador completo de hallazgos y evidencia es C4; la comparación es C5),
consumiendo el cliente `api.ts` y los componentes existentes (EmptyState,
breadcrumbs, badges de estado, métricas).

**Valor (EP-001 AC-4, AC-9):** centralizar la consulta de auditorías dentro de
Kaddo Admin, con resultados consistentes del mismo contrato Core.

**Completitud observable:** la ruta `/audits` lista las ejecuciones persistidas
con sus métricas y estados; sin auditorías muestra un empty state con guía; cada
fila navega a `/audits/:id` con la cabecera del run y el resumen de hallazgos;
validado visualmente en desktop y mobile sin errores de consola.

## 2. Alcance

- **Cliente API** en `packages/admin/src/lib/api.ts`: `listAudits()` →
  `GET /api/v1/admin/audits` (resúmenes de run) y `getAudit(id, filters?)` →
  `GET /api/v1/admin/audits/:id` (run + findings), tipados.
- **Ruta `/audits`** (Audit Explorer, `routes/Audits.tsx`): listado de ejecuciones
  con id, fecha, estado y métricas (total de hallazgos, confirmados vs
  inferencias), en orden determinista.
- **Estados:** carga, error (via `errorComponent`/RouteErrorFallback) y **empty
  state** cuando no hay auditorías (mensaje + guía: ejecutar `kaddo audit run`).
- **Ruta de detalle `/audits/$auditId`** (`routes/AuditDetail.tsx`): cabecera del
  run (id, fecha, commit, scope, estado, cobertura) y un **resumen** de hallazgos
  por severidad/confianza. El explorador completo de hallazgos y evidencia es C4.
- **Navegación:** entrada "Audit" en la navegación de Admin y breadcrumbs
  coherentes; cada fila del listado enlaza al detalle.
- **Honestidad de cobertura:** un run `partial`/`failed` se marca visualmente; no
  se presenta como un resultado limpio.
- **Solo lectura:** la UI no ejecuta auditorías ni modifica artefactos.
- **Validación visual** local (preview) en anchos desktop y mobile, sin errores de
  consola, conforme a INI-002.
- Pruebas de componente/e2e del listado, el empty state y la navegación al detalle.

## 3. Fuera de alcance

- Ejecutar una auditoría desde Admin (lanzar `kaddo audit run`): AUD-ADMIN-C3.
- Explorador completo de hallazgos, filtros avanzados y evidencia: AUD-ADMIN-C4
  (aquí el detalle solo muestra cabecera + resumen).
- Experiencia de comparación entre auditorías: AUD-ADMIN-C5.
- Planificación de remediación y asociación a Work Items: AUD-ADMIN-C6.
- Cambios en los contratos HTTP de Admin Server (ya entregados en WI-102).

## 4. Acceptance Criteria

- [ ] **AC-01:** `api.ts` expone `listAudits()` (GET /api/v1/admin/audits) y `getAudit(id, filters?)` (GET /api/v1/admin/audits/:id) tipados, reutilizando el helper de fetch existente.
- [ ] **AC-02:** La ruta `/audits` lista las ejecuciones persistidas con id, fecha, estado y métricas (total de hallazgos, confirmados vs inferencias) en orden determinista.
- [ ] **AC-03:** El explorador maneja estados de carga, error y vacío; sin auditorías muestra un empty state con guía para ejecutar `kaddo audit run`.
- [ ] **AC-04:** Cada ejecución navega a `/audits/$auditId`, que muestra la cabecera del run (id, fecha, commit, scope, estado, cobertura) y un resumen de hallazgos por severidad/confianza.
- [ ] **AC-05:** La sección Audit aparece en la navegación de Admin, con breadcrumbs coherentes entre listado y detalle.
- [ ] **AC-06:** Un run `partial` o `failed` se marca visualmente (estado y áreas no evaluadas), nunca como un resultado limpio.
- [ ] **AC-07:** La UI es de solo lectura: no ejecuta auditorías ni modifica artefactos (la ejecución es AUD-ADMIN-C3).
- [ ] **AC-08:** Validación visual local (preview) en anchos desktop y mobile sin errores de consola, y pruebas de componente/e2e del listado, el empty state y la navegación al detalle.
- [ ] **AC-09:** `pnpm --filter @kaddo/admin build` sin errores y el gate raíz sin regresiones.

## 5. Validación

- Preview local de Admin (dev server) mostrando `/audits` con datos de prueba y en
  estado vacío; navegación a `/audits/:id`; captura en desktop y mobile.
- `read_console_messages` sin errores.
- Pruebas de componente/e2e nuevas en verde.
- `pnpm --filter @kaddo/admin build` y `pnpm test` sin regresiones.

## 6. Definición de Done

- Sección Audit en Admin: cliente API, ruta de listado con métricas/estados/empty
  state, ruta de detalle (cabecera + resumen), navegación y breadcrumbs.
- Las 9 ACs verificadas, incluida la validación visual (desktop + mobile).
- Build de admin y gate raíz en verde.
- Cambios presentados con evidencia visual para aprobación humana antes de commit
  (regla de INI-002).

## 7. Preguntas abiertas

- ¿El detalle (`/audits/:id`) en C2 muestra ya la lista de hallazgos o solo un
  resumen por severidad/confianza? Propuesta: solo cabecera + resumen; la tabla de
  hallazgos con filtros y evidencia es C4, para no duplicar.
- ¿Métricas del listado desde el resumen (`listAudits`) o calculadas en cliente?
  Propuesta: desde el resumen del endpoint (total/confirmed/inferences), que ya lo
  provee.

## 8. Dependencias

- **AUD-ADMIN-C1 / WI-102** (completado): los contratos HTTP de lectura que esta
  UI consume.
- Habilita AUD-ADMIN-C3 (ejecución), C4 (hallazgos/evidencia) y C5 (comparación),
  que extienden esta sección.

## 9. Learning

_What did we learn? Update after completion._
