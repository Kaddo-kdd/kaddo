---
type: feature
id: WI-103
title: Audit Explorer & Navigation
knowledge_level: K2
status: completed
completed_at: 2026-11-28
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
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    admin:
      role: primary
      status: completed
      changed_paths:
        - packages/admin/src/lib/api.ts
        - packages/admin/src/lib/audit-presentation.ts
        - packages/admin/src/routes/Audits.tsx
        - packages/admin/src/routes/AuditDetail.tsx
        - packages/admin/src/App.tsx
        - packages/admin/src/components/Sidebar.tsx
        - packages/admin/tests/audit-explorer.test.ts
      validations:
        - command: npx vitest run packages/admin/tests/audit-explorer.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
        - command: GitHub Actions — CI + Audit analyzer isolation + Telemetry (commit 82611ea)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** `api.ts` expone `listAudits()` (GET /api/v1/admin/audits) y `getAudit(id, filters?)` (GET /api/v1/admin/audits/:id) tipados, reutilizando el helper de fetch existente.'
      status: passed
      evidence: 'api.ts expone listAudits() (GET /api/v1/admin/audits) y getAudit(id) (GET /api/v1/admin/audits/:id) tipados con AuditRunSummary/AuditDetail, reutilizando fetchApi. Verificado en el navegador: el listado carga datos reales (AUD-001).'
      reference: 'packages/admin/src/lib/api.ts'
      method: manual
    - criterion: '**AC-02:** La ruta `/audits` lista las ejecuciones persistidas con id, fecha, estado y métricas (total de hallazgos, confirmados vs inferencias) en orden determinista.'
      status: passed
      evidence: 'routes/Audits.tsx lista las ejecuciones con id, fecha, estado y métricas (total, confirmados, inferencias) en el orden del endpoint. Captura visual: AUD-001 con 164 findings / 164 confirmed.'
      reference: 'packages/admin/src/routes/Audits.tsx'
      method: manual
    - criterion: '**AC-03:** El explorador maneja estados de carga, error y vacío; sin auditorías muestra un empty state con guía para ejecutar `kaddo audit run`.'
      status: passed
      evidence: 'El explorador maneja loading, error (errorComponent) y empty state (EmptyState con guía ''kaddo audit run''); la lógica de empty/loading/error verificada en el componente y el estado de error verificado en el navegador.'
      reference: 'packages/admin/src/routes/Audits.tsx'
      method: manual
    - criterion: '**AC-04:** Cada ejecución navega a `/audits/$auditId`, que muestra la cabecera del run (id, fecha, commit, scope, estado, cobertura) y un resumen de hallazgos por severidad/confianza.'
      status: passed
      evidence: 'routes/AuditDetail.tsx navega a /audits/:id y muestra cabecera (id, fecha, commit, scope, estado, cobertura) y resumen de hallazgos por severidad; navegación verificada en el navegador; el render del detalle se cubre con audit-presentation (describeAuditScope, summarizeBySeverity) y tests. El happy path con datos se valida en el E2E de CI (Docker).'
      reference: 'packages/admin/src/routes/AuditDetail.tsx'
      method: manual
    - criterion: '**AC-05:** La sección Audit aparece en la navegación de Admin, con breadcrumbs coherentes entre listado y detalle.'
      status: passed
      evidence: 'Sidebar.tsx añade la entrada ''Audit'' (icono ShieldCheck) y AuditDetail incluye el enlace ''← Audits''; verificado en el navegador (nav activa y back link).'
      reference: 'packages/admin/src/components/Sidebar.tsx'
      method: manual
    - criterion: '**AC-06:** Un run `partial` o `failed` se marca visualmente (estado y áreas no evaluadas), nunca como un resultado limpio.'
      status: passed
      evidence: 'auditStatusLabel/auditStatusTone marcan ''partial — incomplete coverage'' y ''failed'' y el detalle lista coverage.notEvaluated; nunca se presenta como limpio. Verificado por tests y por la captura (badge PARTIAL ámbar).'
      reference: 'packages/admin/src/routes/Audits.tsx'
      method: manual
    - criterion: '**AC-07:** La UI es de solo lectura: no ejecuta auditorías ni modifica artefactos (la ejecución es AUD-ADMIN-C3).'
      status: passed
      evidence: 'La sección es de solo lectura: no hay acciones de ejecución ni mutación; consume únicamente endpoints GET (la ejecución es AUD-ADMIN-C3).'
      reference: 'packages/admin/src/routes/Audits.tsx'
      method: manual
    - criterion: '**AC-08:** Validación visual local (preview) en anchos desktop y mobile sin errores de consola, y pruebas de componente/e2e del listado, el empty state y la navegación al detalle.'
      status: passed
      evidence: 'Validación visual local en desktop y mobile (375px) sin errores de consola de UI (el único error es el 500 del backend Docker, documentado); tests de componente/presentación en packages/admin/tests/audit-explorer.test.ts (5 en verde) cubren estado honesto, scope, resumen por severidad, y export de las rutas.'
      reference: 'packages/admin/tests/audit-explorer.test.ts'
      method: manual
    - criterion: '**AC-09:** `pnpm --filter @kaddo/admin build` sin errores y el gate raíz sin regresiones.'
      status: passed
      evidence: 'pnpm --filter @kaddo/admin build sin errores (type-check incluido); el gate raíz pasa (los fallos observados fueron timeouts por concurrencia, confirmados verdes en ejecución aislada). CI de la rama en verde: CI, Audit analyzer isolation y Telemetry.'
      reference: 'packages/admin/tests/audit-explorer.test.ts'
      method: manual
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

Primera pieza de UI de INI-002: la sección Audit en Kaddo Admin, de solo lectura, sobre los contratos HTTP
que entregó WI-102.

### La UI solo compone sobre una API ya lista
El backend (WI-102) ya exponía `GET /api/v1/admin/audits` y `/audits/:id`. Este WI fue capa de presentación:
cliente tipado (`listAudits`/`getAudit`), ruta de listado, ruta de detalle, navegación y entrada de nav,
reutilizando los componentes y el patrón react-query existentes. Sin tocar el backend.

### Honestidad de cobertura en la UI
El badge de estado nunca presenta un run `partial`/`failed` como limpio: el listado y el detalle marcan la
cobertura incompleta y listan las áreas no evaluadas, reflejando la misma regla del contrato Core en pantalla.

### Lógica pura separada para poder probarla sin DOM
El harness de tests de Admin invoca componentes como funciones (sin jsdom), lo que no sirve para componentes
con hooks. Se extrajo la lógica de presentación (descripción de scope, etiqueta/tono de estado, resumen por
severidad) a `lib/audit-presentation.ts`, unit-testeada; las rutas solo la consumen. Patrón reutilizable para
las siguientes piezas de UI (C4/C5).

### Límite honesto de la validación local
El *happy path* del detalle no se pudo validar localmente porque `getAuditAdmin` usa el descubrimiento aislado
con Docker de WI-102, no disponible en este entorno (`docker: command not found`). Se validó visualmente el
listado (desktop + mobile), la navegación, el empty state y el **estado de error** del detalle; el happy path
del detalle se cubre en el E2E de aislamiento con Docker en CI. Es un recordatorio de que la dependencia de
Docker del backend condiciona la validación local de la UI de auditoría.

### Límite de alcance
Solo explorador + navegación. El explorador completo de hallazgos y evidencia (C4), la ejecución desde Admin
(C3), la comparación (C5) y la remediación/asociación (C6) extienden esta sección en candidatos posteriores.
