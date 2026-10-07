---
id: WI-039
title: 'Admin resource management — sección Resources con CRUD, detalle y multirepo'
type: feature
status: draft
knowledge_level: K3
parent: WI-035
affected_modules: [admin, admin-server]
domains: [Tech, Delivery]
code:
  - packages/admin-server/src/contracts/schemas.ts
  - packages/admin-server/src/core-adapter.ts
  - packages/admin-server/src/server.ts
  - packages/admin/src/routes/
  - packages/admin/src/lib/api.ts
scope_confidence:
  level: high
  reasons:
    - Espeja los writes de WI del Admin (VS-099 WorkItemNew/WorkItemEditor + adapter a Core); consume el contrato Core (WI-036).
refined_by: work-item-refinement (manual)
---

# WI-039 — Admin resource management

Hijo de [[WI-035]]. Depende de [[WI-036]]. Gestión visual completa de recursos en el Admin.

## Scope
1. Sección de primer nivel **"Resources"** en el Admin (nav): list, inspect, create, edit, delete.
2. Resource detail: identity/type/provider/purpose/scope/environments/interfaces/boundaries/auth refs/related modules/related WIs — sin secretos.
3. CRUD vía admin-server → core-adapter → Core (sin schema/validación duplicada en el frontend; delete con confirmación de referencias).
4. **Multirepo**: agrupar por scope (System / por módulo); mostrar recursos compartidos (used by: módulos).

## Out of scope
Core (WI-036); CLI (WI-037); MCP (WI-038); graph/docs (WI-040). Portal operacional, ejecución.

## Acceptance criteria
- [ ] AC-01 — List/inspect: la sección Resources lista y muestra el detalle (sin secretos).
- [ ] AC-02 — Create/edit/delete: CRUD desde el Admin vía Core; delete con confirmación de referencias.
- [ ] AC-03 — Related: el detalle muestra WIs y módulos relacionados.
- [ ] AC-04 — Multirepo: agrupación por scope y recursos compartidos (used by).
- [ ] AC-05 — No duplicated schema: la validación/reglas viven en Core, no en el frontend.
- [ ] AC-06 — Backward compatible: proyectos sin resources muestran la sección vacía sin romper.

## Validation
- Admin → Resources → Create (mismo recurso) → admin-server → Core → artifact.
- Editar/borrar desde Admin; delete muestra referencias.
- Proyecto multirepo: recursos agrupados por scope; compartido muestra "used by".

## Definition of Done
Admin ofrece gestión visual completa (CRUD + detalle + relacionados + multirepo) vía Core; sin secretos; tests (adapter/contrato) + verificación visual; Evidence; Verification; Learning.

## Implementation handoff guidance
Espejar `WorkItemNew`/`WorkItemEditor` + los writes del admin-server (VS-099) y el adapter a Core. Reutilizar el patrón de navegación/secciones del detalle de WI (WI-034).
