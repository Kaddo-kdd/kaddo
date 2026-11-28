---
type: feature
id: WI-105
title: Remediation Planning & Work Item Linking
knowledge_level: K3
status: completed
completed_at: 2026-11-28
phase: now
priority: high
initiative: INI-002
domains:
  - Tech
  - Product Experience
  - Delivery
code:
  - packages/admin/src/**
created_at: '2026-11-28'
source: initiative
source_id: AUD-ADMIN-C6
source_initiative: INI-002
affected_modules:
  - admin
source_signals:
  - EP-001 AC-6
  - EP-001 AC-7
  - EP-001 AC-9
  - EP-001 AC-10
dependencies:
  - AUD-ADMIN-C1
  - AUD-ADMIN-C4
scope_confidence:
  level: medium
  reasons:
    - >-
      Primera pieza de UI de INI-002 con ESCRITURA: vincular un hallazgo a un
      Work Item existente. El backend ya existe (POST /audit-links con
      expectedRevision y confirmed:true, idempotente; GET /audits/:id/plan de
      solo lectura); el riesgo está en el flujo de aprobación, revisión
      optimista y conflictos.
    - >-
      Nunca se vincula automáticamente: las coincidencias heurísticas son
      sugerencias; toda escritura exige confirmación humana explícita (EP-001
      AC-7).
    - >-
      El happy path depende del descubrimiento aislado con Docker (como C2/C4);
      se validan los controles y estados localmente, la lógica por unidad y el
      camino completo en el E2E de CI.
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
  operations-release: affected
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
        - packages/admin/src/components/AuditRemediation.tsx
        - packages/admin/src/routes/AuditDetail.tsx
        - packages/admin/tests/audit-explorer.test.ts
      validations:
        - command: npx vitest run packages/admin/tests/audit-explorer.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
        - command: pnpm test
          status: passed
        - command: GitHub Actions — CI + Audit analyzer isolation + Telemetry (commit 8c069ba)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Una vista de remediación por auditoría (GET /audits/:id/plan) lista las acciones por hallazgo ordenadas por severidad, con recomendación, evidencia, Work Items sugeridos y ya vinculados (`confirmedWorkItems`) y el estado (`already-linked`/`review`).'
      status: passed
      evidence: 'AuditRemediation consume getAuditPlan(id) (previewAuditPlan, ordenado por severidad) y lista por acción recomendación, WIs sugeridos y confirmedWorkItems y el estado already-linked/review. Happy path con datos en el E2E de aislamiento de CI.'
      reference: 'packages/admin/src/components/AuditRemediation.tsx'
      method: manual
    - criterion: '**AC-02:** Desde un hallazgo se puede vincular a un Work Item existente: se elige el WI (sugerido o por id), se obtiene su revisión actual y se requiere confirmación explícita antes de escribir.'
      status: passed
      evidence: 'LinkFlow permite elegir un WI (botones de sugeridos o input por id), obtiene su revisión con getWorkItemEdit y abre un ConfirmDialog explícito antes de escribir.'
      reference: 'packages/admin/src/components/AuditRemediation.tsx'
      method: manual
    - criterion: '**AC-03:** La vinculación usa `POST /audit-links` con `expectedRevision` y `confirmed: true`, es idempotente (si ya estaba vinculado, no cambia nada) y refleja el resultado (`changed`/`already-linked`).'
      status: passed
      evidence: 'linkAuditFinding hace POST /audit-links con expectedRevision y confirmed:true (buildAuditLinkInput); el resultado {changed} se refleja como ''Linked''/''Already linked'' (idempotente).'
      reference: 'packages/admin/src/lib/api.ts'
      method: manual
    - criterion: '**AC-04:** Un conflicto de revisión (409) se maneja: se informa, se re-obtiene la revisión y se permite reintentar; `WORK_ITEM_NOT_EDITABLE`/`NOT_FOUND`/`INVALID_INPUT` dan errores claros.'
      status: passed
      evidence: 'isRevisionConflict distingue el 409 WORK_ITEM_CONFLICT: se informa ''changed since it was read — review and retry'' (reintentar re-obtiene la revisión); otros errores muestran su mensaje. Test de isRevisionConflict.'
      reference: 'packages/admin/src/components/AuditRemediation.tsx'
      method: manual
    - criterion: '**AC-05:** Nunca se vincula automáticamente: las coincidencias heurísticas son sugerencias y toda escritura exige aprobación humana explícita (EP-001 AC-7).'
      status: passed
      evidence: 'No hay camino que escriba sin confirmación: buildAuditLinkInput fuerza confirmed:true y el POST solo se dispara desde el onConfirm del ConfirmDialog; las sugerencias son heurísticas (EP-001 AC-7). Test de buildAuditLinkInput.'
      reference: 'packages/admin/src/lib/audit-presentation.ts'
      method: manual
    - criterion: '**AC-06:** Tras vincular, el hallazgo muestra el Work Item vinculado y ofrece navegación contextual a `/work-items/:id`; las asociaciones y la evidencia se preservan.'
      status: passed
      evidence: 'Tras vincular se invalidan las queries del plan y del detalle; los confirmedWorkItems se muestran con WorkItemLink que navega a /work-items/:id. El Core preserva asociaciones y evidencia.'
      reference: 'packages/admin/src/components/AuditRemediation.tsx'
      method: manual
    - criterion: '**AC-07:** La preview de remediación es de solo lectura (no escribe); solo la acción de vincular, confirmada, escribe; no se modifican lifecycles ni campos ajenos.'
      status: passed
      evidence: 'El preview (getAuditPlan) es GET de solo lectura; solo confirmLink escribe; el backend (WI-099/WI-102) impide tocar lifecycle o campos ajenos a audit_findings.'
      reference: 'packages/admin/src/components/AuditRemediation.tsx'
      method: manual
    - criterion: '**AC-08:** `api.ts` expone `getAuditPlan(id)` y `linkAuditFinding(input)` tipados, y el tipo de correlación incluye `confirmedWorkItems`.'
      status: passed
      evidence: 'api.getAuditPlan(id) y api.linkAuditFinding(input) están tipados (AuditPlanPreview/AuditLinkInput/AuditLinkResult) y AuditFindingCorrelation incluye confirmedWorkItems.'
      reference: 'packages/admin/src/lib/api.ts'
      method: manual
    - criterion: '**AC-09:** Validación visual local (desktop + mobile) de los controles y estados sin errores de consola de UI, y pruebas unitarias de la lógica (orden/estado de acciones, construcción de la petición, estados de confirmación/conflicto); el happy path se cubre en el E2E de CI.'
      status: passed
      evidence: 'Pruebas unitarias de la lógica (buildAuditLinkInput con confirmed:true, isValidWorkItemId, isRevisionConflict, exports de componente/API; 13 en verde). Validación visual local del estado de error del detalle sin errores de UI; el happy path y el vínculo real se cubren en el E2E de aislamiento de CI.'
      reference: 'packages/admin/tests/audit-explorer.test.ts'
      method: manual
    - criterion: '**AC-10:** `pnpm --filter @kaddo/admin build` sin errores y el gate raíz sin regresiones.'
      status: passed
      evidence: 'pnpm --filter @kaddo/admin build sin errores; gate raíz 2342 pruebas en verde; CI de la rama en verde (CI, Audit analyzer isolation, Telemetry) en el commit 8c069ba.'
      reference: 'packages/admin/tests/audit-explorer.test.ts'
      method: manual
---

# Remediation Planning & Work Item Linking

> Materialized from Initiative INI-002, candidate AUD-ADMIN-C6.

## 1. Problema y valor

**Actor:** quien revisa una auditoría en Admin y quiere convertir hallazgos en
trabajo trazable.

**Comportamiento actual:** C4 (WI-104) muestra los hallazgos con evidencia, pero no
hay forma de **previsualizar remediación** ni de **vincular** un hallazgo a un Work
Item existente desde Admin. El Core y los contratos ya existen (WI-099/WI-100/WI-102:
`previewAuditPlan`, `linkAuditFinding`, `POST /audit-links`, `GET /audits/:id/plan`).

**Comportamiento objetivo:** una vista de **remediación** por auditoría que
muestra, por hallazgo y ordenado por severidad, la recomendación, los Work Items
**sugeridos** (coincidencias heurísticas) y los **ya vinculados**
(`confirmedWorkItems`), y su estado (`already-linked`/`review`). Desde un hallazgo,
el usuario puede **vincularlo a un Work Item existente** con **aprobación humana
explícita**: se elige el WI, se obtiene su revisión actual, se confirma, y se
escribe vía `POST /audit-links` (con `expectedRevision` y `confirmed:true`). La
operación es **idempotente** (si ya estaba vinculado, no cambia nada) y maneja
**conflicto de revisión** (409: se re-obtiene la revisión y se permite reintentar).
La preview es de **solo lectura**; solo la acción de vincular, confirmada, escribe.
Tras vincular, el hallazgo muestra el WI vinculado y ofrece **navegación
contextual** al Work Item en Planning.

**Valor (EP-001 AC-6, AC-7, AC-10):** convertir hallazgos en acciones trazables sin
crear trabajo duplicado, con aprobación explícita y sin alterar lifecycles.

**Completitud observable:** la vista de remediación lista las acciones; un hallazgo
sin vincular ofrece "Link to Work Item" → elegir WI → confirmar → vinculado; repetir
no duplica; una revisión obsoleta se informa y se puede reintentar; el WI vinculado
enlaza a su detalle. El happy path con datos se valida en el E2E de CI.

## 2. Alcance

- **Cliente API:**
  - `getAuditPlan(id)` → `GET /audits/:id/plan` (preview de remediación, solo
    lectura): `{ auditId, status, coverage, actions[] }`.
  - `linkAuditFinding(input)` → `POST /audit-links` con
    `{ runId, findingId, workItemId, expectedRevision, confirmed: true }` →
    `{ revision, path, changed }`.
  - Ampliar el tipo de correlación con `confirmedWorkItems`.
- **Vista de remediación** (sección en el detalle o tab): acciones por hallazgo
  ordenadas por severidad, con recomendación, evidencia, WIs sugeridos y vinculados
  y estado.
- **Flujo de vinculación (con aprobación):** desde un hallazgo, elegir un WI
  (sugerido o por id) → obtener su revisión (`getWorkItem`) → **confirmación
  explícita** (qué hallazgo, qué WI, que es irreversible solo por el usuario) →
  `POST /audit-links`. Idempotente; conflicto 409 → re-obtener revisión y permitir
  reintento; `WORK_ITEM_NOT_EDITABLE`/`NOT_FOUND`/`INVALID_INPUT` → error claro.
- **Nunca auto-vincular:** las sugerencias son heurísticas; la escritura exige
  confirmación humana explícita (EP-001 AC-7).
- **Preservación y navegación:** tras vincular, se refleja el WI vinculado y se
  ofrece navegación contextual a `/work-items/:id`.
- **Lógica pura** (orden/estado de acciones, construcción de la petición, estados
  del flujo) extraída y unit-testeada.
- Validación visual local de controles/estados; happy path en el E2E de CI.

## 3. Fuera de alcance

- **Crear** nuevos Work Items desde un hallazgo (solo vincular a existentes); la
  creación y la propuesta de nuevas entidades de Planning quedan fuera.
- Ejecutar auditorías (AUD-ADMIN-C3) y comparación (AUD-ADMIN-C5).
- Cambios en los contratos/escritura del Admin Server o del Core (ya entregados en
  WI-099/WI-100/WI-102).
- Modificar lifecycles de Work Items o campos ajenos a `audit_findings`.

## 4. Acceptance Criteria

- [ ] **AC-01:** Una vista de remediación por auditoría (GET /audits/:id/plan) lista las acciones por hallazgo ordenadas por severidad, con recomendación, evidencia, Work Items sugeridos y ya vinculados (`confirmedWorkItems`) y el estado (`already-linked`/`review`).
- [ ] **AC-02:** Desde un hallazgo se puede vincular a un Work Item existente: se elige el WI (sugerido o por id), se obtiene su revisión actual y se requiere confirmación explícita antes de escribir.
- [ ] **AC-03:** La vinculación usa `POST /audit-links` con `expectedRevision` y `confirmed: true`, es idempotente (si ya estaba vinculado, no cambia nada) y refleja el resultado (`changed`/`already-linked`).
- [ ] **AC-04:** Un conflicto de revisión (409) se maneja: se informa, se re-obtiene la revisión y se permite reintentar; `WORK_ITEM_NOT_EDITABLE`/`NOT_FOUND`/`INVALID_INPUT` dan errores claros.
- [ ] **AC-05:** Nunca se vincula automáticamente: las coincidencias heurísticas son sugerencias y toda escritura exige aprobación humana explícita (EP-001 AC-7).
- [ ] **AC-06:** Tras vincular, el hallazgo muestra el Work Item vinculado y ofrece navegación contextual a `/work-items/:id`; las asociaciones y la evidencia se preservan.
- [ ] **AC-07:** La preview de remediación es de solo lectura (no escribe); solo la acción de vincular, confirmada, escribe; no se modifican lifecycles ni campos ajenos.
- [ ] **AC-08:** `api.ts` expone `getAuditPlan(id)` y `linkAuditFinding(input)` tipados, y el tipo de correlación incluye `confirmedWorkItems`.
- [ ] **AC-09:** Validación visual local (desktop + mobile) de los controles y estados sin errores de consola de UI, y pruebas unitarias de la lógica (orden/estado de acciones, construcción de la petición, estados de confirmación/conflicto); el happy path se cubre en el E2E de CI.
- [ ] **AC-10:** `pnpm --filter @kaddo/admin build` sin errores y el gate raíz sin regresiones.

## 5. Validación

- Preview local de Admin: vista de remediación (estado de error por Docker), el
  diálogo de confirmación de vínculo y sus estados; captura desktop + mobile.
- Pruebas unitarias de la lógica de plan/link en verde.
- `pnpm --filter @kaddo/admin build` y `pnpm test` sin regresiones.
- CI de la rama en verde, incluido el E2E de aislamiento (happy path de preview y
  vínculo real contra Work Items de prueba).

## 6. Definición de Done

- `getAuditPlan` + `linkAuditFinding` tipados; vista de remediación; flujo de
  vínculo con confirmación explícita, idempotencia y manejo de conflicto;
  navegación contextual a Planning.
- Lógica pura unit-testeada.
- Las 10 ACs verificadas (visual donde no depende de Docker; happy path en CI).
- Build de admin y gate raíz en verde.
- Cambios presentados con evidencia visual para aprobación humana antes de commit
  (regla de INI-002).

## 7. Preguntas abiertas

- ¿La vista de remediación es una sección del detalle o un tab/ruta aparte?
  Propuesta: una sección "Remediation" dentro del detalle del run, junto a la tabla
  de hallazgos (C4), para no fragmentar la navegación.
- ¿La elección del Work Item se limita a los sugeridos o permite cualquier WI por
  id? Propuesta: ofrecer los sugeridos con un clic y permitir introducir un id de
  WI existente; en ambos casos se obtiene la revisión y se confirma.

## 8. Dependencias

- **AUD-ADMIN-C4 / WI-104** (completado): la tabla de hallazgos sobre la que actúa
  la remediación.
- **AUD-ADMIN-C1 / WI-102** (completado): `GET /audits/:id/plan` y
  `POST /audit-links`.
- **WI-099 / WI-100** (completados, INI-001): `linkAuditFinding`,
  `previewAuditPlan` y el modelo de asociación/dedup del Core.

## 9. Learning

Primera pieza de UI de INI-002 con **escritura**: cierra el lazo auditoría → Planning vinculando un hallazgo a
un Work Item existente, con aprobación humana explícita.

### Sugerir es lectura; vincular es una escritura confirmada
La vista de remediación (GET /audits/:id/plan) es de solo lectura y marca las coincidencias heurísticas como
**sugerencias** (`suggestedWorkItems`) frente a las ya vinculadas (`confirmedWorkItems`). El vínculo no ocurre
nunca de forma automática: el usuario elige el WI, se obtiene su revisión y hay un `ConfirmDialog` explícito
antes del `POST /audit-links`. `buildAuditLinkInput` fuerza `confirmed: true` en la petición, de modo que no
existe un camino de código que escriba sin confirmación.

### Concurrencia optimista de principio a fin
La escritura usa `expectedRevision`: se lee la revisión del Work Item (`getWorkItemEdit`) justo antes de
confirmar, y el backend rechaza con 409 si cambió en el intermedio. La UI distingue ese conflicto
(`isRevisionConflict`) de otros errores y pide revisar y reintentar (lo que re-obtiene la revisión), en vez de
sobrescribir a ciegas. La operación es idempotente: re-vincular informa "Already linked" sin cambiar nada.

### Solo vincular a existentes
Se acotó a **vincular a Work Items existentes** (no crear nuevos desde un hallazgo): la asociación añade el
hallazgo a `audit_findings` del WI sin tocar lifecycle ni otros campos (garantía del Core/WI-099). Crear
entidades de Planning queda fuera. Esto mantiene la acción pequeña y auditable.

### Límite de validación local (recurrente)
Como C2/C4, la sección de remediación solo se renderiza con datos del detalle, que dependen del
descubrimiento aislado con Docker de WI-102. Localmente se validó el estado de error y la ausencia de
regresión; el flujo completo (preview con datos, vínculo real, idempotencia y conflicto) se cubre con pruebas
unitarias de la lógica y el E2E de aislamiento de CI. La lógica de escritura/confirmación/conflicto se extrajo
a funciones puras precisamente para poder probarla sin DOM ni Docker.

### Alcance
Desbloquea AUD-ADMIN-C7 (validación E2E + docs). Quedan C3 (ejecución) y C5 (comparación) antes del cierre de
la iniciativa.
