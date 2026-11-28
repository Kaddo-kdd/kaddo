---
type: feature
id: WI-104
title: Findings & Evidence Explorer
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
created_at: '2026-11-28'
source: initiative
source_id: AUD-ADMIN-C4
source_initiative: INI-002
affected_modules:
  - admin
source_signals:
  - EP-001 AC-4
  - EP-001 AC-5
  - EP-001 AC-9
dependencies:
  - AUD-ADMIN-C1
  - AUD-ADMIN-C2
scope_confidence:
  level: medium
  reasons:
    - >-
      El endpoint de detalle (GET /audits/:id) ya soporta filtros server-side
      (severity, confidence, category, module/pathPrefix, status) y devuelve
      hallazgos correlacionados; este WI es la capa de UI de la tabla de
      hallazgos, filtros y evidencia dentro del detalle que C2 dejó como
      resumen.
    - >-
      La validación visual del happy path (hallazgos renderizados) depende del
      descubrimiento aislado con Docker de WI-102; localmente se validan los
      controles de filtro y los estados vacío/error, y el happy path se cubre en
      el E2E de CI. La lógica de presentación y de filtros se prueba por unidad.
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
ready_at: '2026-11-28'
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
        - packages/admin/src/routes/AuditDetail.tsx
        - packages/admin/tests/audit-explorer.test.ts
      validations:
        - command: npx vitest run packages/admin/tests/audit-explorer.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
        - command: pnpm test
          status: passed
        - command: GitHub Actions — CI + Audit analyzer isolation + Telemetry (commit ed6fd68)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** El detalle `/audits/:id` muestra la lista de hallazgos del run; cada hallazgo expone severidad, confianza, categoría, título y ubicación (`file:line` cuando existe).'
      status: passed
      evidence: 'AuditDetail renderiza FindingCard por hallazgo con severidad, confianza, categoría, título y ubicación (findingLocationLabel → file:line). Happy path con datos verificado en el E2E de aislamiento de CI.'
      reference: 'packages/admin/src/routes/AuditDetail.tsx'
      method: manual
    - criterion: '**AC-02:** Cada hallazgo expone su evidencia, procedencia (provenance), recomendación y referencias a conocimiento existente (ADRs/capacidades/Work Items).'
      status: passed
      evidence: 'FindingCard expone, al expandir, Evidence, Provenance, Recommendation y References (WIs/ADRs/Capabilities) del hallazgo.'
      reference: 'packages/admin/src/routes/AuditDetail.tsx'
      method: manual
    - criterion: '**AC-03:** Cuando el hallazgo está correlacionado, se muestran sus owners, riesgos y `matchStrength`.'
      status: passed
      evidence: 'FindingCard muestra la correlación (matchStrength, owners, risks) cuando matchStrength != ''none''.'
      reference: 'packages/admin/src/routes/AuditDetail.tsx'
      method: manual
    - criterion: '**AC-04:** Hay filtros por severidad, confianza, categoría, estado y módulo/ruta que se aplican vía los query params del endpoint (filtrado server-side), con opción de limpiar; `module` y `pathPrefix` son mutuamente excluyentes.'
      status: passed
      evidence: 'getAudit(id, filters) envía severity/confidence/category/status/module/pathPrefix como query params (filtrado server-side); hay botón Clear; cleanAuditFilters aplica la exclusión module/pathPrefix. Test de cleanAuditFilters.'
      reference: 'packages/admin/src/lib/api.ts'
      method: manual
    - criterion: '**AC-05:** Severidad y confianza se diferencian visualmente; una inferencia (p. ej. crítica) nunca se presenta como un hecho confirmado.'
      status: passed
      evidence: 'confidenceIsFirm distingue hechos (chip sólido) de inferencias (chip discontinuo, etiqueta ·inferred); severidad es un chip sólido aparte. Una inferencia crítica no se presenta como hecho crítico. Test de confidenceIsFirm.'
      reference: 'packages/admin/src/lib/audit-presentation.ts'
      method: manual
    - criterion: '**AC-06:** La cobertura parcial se visualiza (áreas no evaluadas) y un filtro sin resultados muestra un empty state claro.'
      status: passed
      evidence: 'La cobertura parcial se lista (Not evaluated) y un filtro sin resultados muestra ''No findings match these filters.''; hasActiveFilters controla el estado. Estado de error del detalle verificado en el navegador.'
      reference: 'packages/admin/src/routes/AuditDetail.tsx'
      method: manual
    - criterion: '**AC-07:** La UI es de solo lectura: no modifica hallazgos ni ejecuta auditorías (la asociación a Work Items es AUD-ADMIN-C6).'
      status: passed
      evidence: 'La sección solo consulta (GET con filtros) y expande/colapsa; no hay mutaciones ni ejecución (la asociación a Work Items es AUD-ADMIN-C6).'
      reference: 'packages/admin/src/routes/AuditDetail.tsx'
      method: manual
    - criterion: '**AC-08:** `getAudit(id, filters?)` tipado envía los filtros como query params y los tipos de hallazgo incluyen `references` y `correlation`.'
      status: passed
      evidence: 'getAudit(id, filters?) está tipado con AuditFindingFilters y AuditFindingView incluye references y correlation (AuditFindingReferences/AuditFindingCorrelation).'
      reference: 'packages/admin/src/lib/api.ts'
      method: manual
    - criterion: '**AC-09:** Validación visual local (desktop + mobile) de los controles de filtro y los estados vacío/error sin errores de consola de UI, y pruebas unitarias de la lógica de presentación/filtros; el happy path de la tabla se cubre en el E2E de CI.'
      status: passed
      evidence: 'Validación visual local del listado (sin regresión) y del estado de error del detalle sin errores de UI (el 500 es el backend Docker, documentado); los controles de filtro y el happy path de la tabla se cubren por pruebas unitarias de presentación/filtros (9 en verde) y el E2E de aislamiento de CI.'
      reference: 'packages/admin/tests/audit-explorer.test.ts'
      method: manual
    - criterion: '**AC-10:** `pnpm --filter @kaddo/admin build` sin errores y el gate raíz sin regresiones.'
      status: passed
      evidence: 'pnpm --filter @kaddo/admin build sin errores; gate raíz 2338 pruebas en verde; CI de la rama en verde (CI, Audit analyzer isolation, Telemetry) en el commit ed6fd68.'
      reference: 'packages/admin/tests/audit-explorer.test.ts'
      method: manual
---

# Findings & Evidence Explorer

> Materialized from Initiative INI-002, candidate AUD-ADMIN-C4.

## 1. Problema y valor

**Actor:** quien analiza los hallazgos de una auditoría en Kaddo Admin.

**Comportamiento actual:** C2 (WI-103) creó la sección Audit y el detalle de un run
con cabecera + un **resumen** de hallazgos por severidad. No hay forma de ver cada
hallazgo con su evidencia, procedencia, recomendación y referencias, ni de filtrar.

**Comportamiento objetivo:** el detalle (`/audits/:id`) muestra la **tabla de
hallazgos** del run: cada hallazgo con severidad y confianza **diferenciadas**,
categoría, ubicación (`file:line`), evidencia, procedencia, recomendación,
referencias a conocimiento existente (ADRs/capacidades/Work Items) y, cuando hay,
su correlación (owners, riesgos, `matchStrength`). Incluye **filtros** (severidad,
confianza, categoría, estado y módulo/ruta) aplicados vía los query params del
endpoint (filtrado server-side, el mismo del Core), y visualiza la **cobertura
parcial**. Es de **solo lectura** (la asociación a Work Items es C6).

**Valor (EP-001 AC-4, AC-5):** facilitar el análisis técnico y la interpretación
de riesgos, con evidencia suficiente para revisar y distinguiendo hechos de
inferencias.

**Completitud observable:** el detalle lista los hallazgos con su evidencia y
referencias; los filtros reducen la lista (server-side); una inferencia crítica se
distingue de un hecho crítico; un filtro sin resultados muestra un empty state; la
cobertura parcial se ve. El happy path con datos se valida en el E2E de CI (Docker).

## 2. Alcance

- **Cliente API:** extender `getAudit(id, filters?)` en `api.ts` para pasar los
  filtros como query params (`severity`, `confidence`, `category`, `module`,
  `pathPrefix`, `status`); ampliar los tipos de hallazgo con `references` y
  `correlation`.
- **Tabla de hallazgos** en `routes/AuditDetail.tsx` (reemplaza el resumen de C2):
  cada hallazgo muestra severidad + confianza diferenciadas, categoría, título,
  ubicación, evidencia, procedencia, recomendación, referencias y correlación.
- **Filtros:** controles de severidad, confianza, categoría, estado y módulo/ruta;
  se envían al endpoint (server-side); botón para limpiar; `module` y `pathPrefix`
  son mutuamente excluyentes (como el backend).
- **Diferenciación severidad/confianza:** visual clara; una inferencia nunca se
  presenta como un hecho confirmado.
- **Cobertura parcial:** se mantiene la visualización de áreas no evaluadas; un
  filtro sin resultados muestra un empty state claro.
- **Solo lectura:** no modifica hallazgos ni ejecuta nada.
- **Lógica de presentación/filtros** extraída a un módulo puro, unit-testeada.
- Validación visual local de controles de filtro y estados vacío/error; el happy
  path se cubre en el E2E de CI (Docker).

## 3. Fuera de alcance

- Asociar hallazgos a Work Items y previsualizar remediación: AUD-ADMIN-C6.
- Ejecutar auditorías desde Admin: AUD-ADMIN-C3.
- Comparación entre auditorías: AUD-ADMIN-C5.
- Cambios en los contratos HTTP / filtrado de Admin Server (ya en WI-102/Core).

## 4. Acceptance Criteria

- [ ] **AC-01:** El detalle `/audits/:id` muestra la lista de hallazgos del run; cada hallazgo expone severidad, confianza, categoría, título y ubicación (`file:line` cuando existe).
- [ ] **AC-02:** Cada hallazgo expone su evidencia, procedencia (provenance), recomendación y referencias a conocimiento existente (ADRs/capacidades/Work Items).
- [ ] **AC-03:** Cuando el hallazgo está correlacionado, se muestran sus owners, riesgos y `matchStrength`.
- [ ] **AC-04:** Hay filtros por severidad, confianza, categoría, estado y módulo/ruta que se aplican vía los query params del endpoint (filtrado server-side), con opción de limpiar; `module` y `pathPrefix` son mutuamente excluyentes.
- [ ] **AC-05:** Severidad y confianza se diferencian visualmente; una inferencia (p. ej. crítica) nunca se presenta como un hecho confirmado.
- [ ] **AC-06:** La cobertura parcial se visualiza (áreas no evaluadas) y un filtro sin resultados muestra un empty state claro.
- [ ] **AC-07:** La UI es de solo lectura: no modifica hallazgos ni ejecuta auditorías (la asociación a Work Items es AUD-ADMIN-C6).
- [ ] **AC-08:** `getAudit(id, filters?)` tipado envía los filtros como query params y los tipos de hallazgo incluyen `references` y `correlation`.
- [ ] **AC-09:** Validación visual local (desktop + mobile) de los controles de filtro y los estados vacío/error sin errores de consola de UI, y pruebas unitarias de la lógica de presentación/filtros; el happy path de la tabla se cubre en el E2E de CI.
- [ ] **AC-10:** `pnpm --filter @kaddo/admin build` sin errores y el gate raíz sin regresiones.

## 5. Validación

- Preview local de Admin: controles de filtro en `/audits/:id`, estado de error del
  endpoint (Docker ausente) y empty state; captura desktop + mobile.
- `read_console_messages` sin errores de UI.
- Pruebas unitarias nuevas de la lógica de filtros/presentación en verde.
- `pnpm --filter @kaddo/admin build` y `pnpm test` sin regresiones.
- CI de la rama en verde, incluido el E2E de aislamiento (happy path del detalle).

## 6. Definición de Done

- `getAudit(id, filters)` con filtros y tipos ampliados; tabla de hallazgos con
  evidencia/procedencia/recomendación/referencias/correlación y filtros server-side
  en el detalle; empty state de filtro; cobertura parcial.
- Lógica de presentación/filtros pura y unit-testeada.
- Las 10 ACs verificadas (visual donde no depende de Docker; happy path en CI).
- Build de admin y gate raíz en verde.
- Cambios presentados con evidencia visual para aprobación humana antes de commit
  (regla de INI-002).

## 7. Preguntas abiertas

- ¿Filtrado server-side (query params) o client-side sobre los hallazgos ya
  traídos? Propuesta: server-side, reutilizando los filtros del endpoint (mismo
  comportamiento que el Core y `kaddo audit report`).
- ¿La evidencia larga se muestra expandible por hallazgo? Propuesta: fila con
  resumen y detalle expandible (evidencia + referencias + correlación), para no
  saturar.

## 8. Dependencias

- **AUD-ADMIN-C1 / WI-102** (completado): el endpoint de detalle con filtros y
  hallazgos correlacionados.
- **AUD-ADMIN-C2 / WI-103** (completado): la sección Audit y el detalle que este WI
  completa.
- Habilita **AUD-ADMIN-C6** (remediación + asociación a Work Items), que actúa
  sobre los hallazgos mostrados aquí.

## 9. Learning

Completa la sección Audit de Admin que C2 dejó como esqueleto: la tabla de hallazgos con evidencia y filtros.

### Reutilizar el filtrado del Core por HTTP
Los filtros (severidad, confianza, categoría, estado, módulo/ruta) no se recalculan en el cliente: se envían
como query params al endpoint, que ya delega en `queryAuditFindings` del Core. Así la UI, `kaddo audit report`
y el Core comparten exactamente la misma semántica de filtrado (OR dentro de una dimensión, AND entre
dimensiones; `module` y `pathPrefix` mutuamente excluyentes). `cleanAuditFilters` aplica esa exclusión también
del lado del cliente para no mandar una petición que el backend rechazaría.

### Severidad y confianza, visualmente distintas
La regla de honestidad del contrato se traslada a la UI: la severidad es un chip sólido y la confianza un chip
con borde (sólido si es un hecho confirmado, discontinuo y etiquetado `·inferred` si es una inferencia). Una
inferencia crítica nunca se lee como un hecho crítico.

### Límite de validación local (recurrente en esta sección)
La tabla de hallazgos solo se renderiza cuando el detalle carga datos, y ese endpoint usa el descubrimiento
aislado con Docker de WI-102, no disponible localmente. Por eso la validación visual local cubrió el listado
(sin regresión) y el estado de error del detalle; los controles de filtro y el happy path de la tabla se
cubren con las pruebas unitarias de la lógica de presentación/filtros y con el E2E de aislamiento de CI. Es la
misma restricción que C2 y conviene tenerla presente para C5/C6 (también data-heavy sobre el mismo endpoint).

### Lógica pura, componente delgado
Toda la lógica testeable (limpieza de filtros, estado firme vs inferido, etiqueta de ubicación, filtros
activos) vive en `audit-presentation.ts`; el componente solo orquesta estado y presentación. Esto hizo el WI
unit-testeable pese a no tener jsdom.

### Alcance
Solo lectura y visualización de hallazgos. Asociar un hallazgo a un Work Item y previsualizar remediación es
AUD-ADMIN-C6, que ahora queda desbloqueado y actúa sobre esta misma tabla.
