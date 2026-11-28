---
type: feature
id: WI-104
title: Findings & Evidence Explorer
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

_What did we learn? Update after completion._
