---
id: WI-034
title: 'Resources Admin — relaciones WI → Resource en el detalle'
type: feature
status: draft
knowledge_level: K3
parent: WI-029
affected_modules:
  - admin
  - admin-server
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/core/work-items.ts
  - packages/admin-server/src/contracts/schemas.ts
  - packages/admin/src/lib/api.ts
  - packages/admin/src/routes/WorkItemDetail.tsx
scope_confidence:
  level: high
  reasons:
    - >-
      Reutiliza el patrón del detalle del WI (decisions/related-knowledge/initiative navegable de
      WI-025): nueva sección "Resources" con rol, navegable a la definición del recurso.
refined_by: work-item-refinement (manual)
---

# WI-034 — Resources Admin

Hijo de [[WI-029]]. Depende de [[WI-030]] (el WorkItemDetail ya expone `resources`). Lo hace visible.

## Intent

Que desde el detalle de un Work Item en el Admin se vean los Project Resources relacionados y su rol, y
que el recurso sea navegable a su definición cuando sea posible. No es un portal operacional.

## Scope

1. **Contract/API**: propagar `resources: [{id, role, title?}]` del `WorkItemDetail` de Core por el
   schema del admin-server y el tipo del cliente.
2. **Admin UI**: sección "Resources" en `WorkItemDetail.tsx` con id, rol y (si existe) título,
   navegable a la definición del recurso (vista de knowledge del recurso o su artifact), reutilizando
   el patrón de decisions/related-knowledge/initiative.
3. **Read-only**: sin ejecutar acciones contra el recurso.

## Out of scope

Core/model (WI-030); CLI/MCP (WI-031); intelligence (WI-032); graph/docs (WI-033). Portal operacional,
ejecución, credenciales.

## Acceptance criteria

- [ ] AC-01 — Visible: el detalle del WI muestra sus resources con el rol.
- [ ] AC-02 — Navigable: cuando el recurso existe, es navegable a su definición.
- [ ] AC-03 — Contract: el admin-server entrega `resources` y el cliente lo tipa.
- [ ] AC-04 — Read-only: ninguna acción contra el recurso desde el Admin.
- [ ] AC-05 — Backward compatible: WIs sin resources no muestran la sección ni rompen el detalle.

## Validation

- WI con RES-supabase-main (affected) + RES-aws-platform (validation) → el detalle muestra ambos con su
  rol; RES-supabase-main navega a su definición.
- WI sin resources → sin sección "Resources", detalle intacto.
- Build/typecheck del admin verdes; verificación visual en navegador.

## Definition of Done

El detalle del WI en Admin muestra WI → Resource con rol, navegable; contract + cliente tipados;
read-only; backward-compatible; tests (core/adapter) + verificación visual; Evidence; Verification;
Learning.

## Implementation handoff guidance

Reutilizar exactamente el patrón del enlace navegable de Initiative (WI-025) y las secciones de
decisions/related-knowledge en `WorkItemDetail.tsx`. Decidir en Handoff el destino de navegación del
recurso (vista de knowledge del artifact del recurso).
