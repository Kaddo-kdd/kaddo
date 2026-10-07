---
id: WI-040
title: 'Multirepo graph, docs & dogfooding de la gestión de recursos'
type: feature
status: draft
knowledge_level: K3
parent: WI-035
affected_modules: [cli, docs]
domains: [Tech, Delivery]
code:
  - packages/cli/src/core/graph.ts
  - apps/docs/src/content/docs/project-resources.md
  - apps/docs/src/content/docs/es/project-resources.md
scope_confidence:
  level: high
  reasons:
    - El Graph ya tiene nodo project-resource y aristas WI a resource (WI-033); agregar module a resource es aditivo. Docs amplían la página existente.
refined_by: work-item-refinement (manual)
---

# WI-040 — Multirepo graph, docs & dogfooding

Hijo de [[WI-035]]. Depende de [[WI-036]] (scope/modules). Hace observable y documentada la gestión + multirepo.

## Scope
1. **Graph**: aristas `Module ──depends_on──→ Resource` desde `scope: module/<id>` y `modules: [...]`, con provenance; el Graph distingue ownership/scope de dependencia.
2. **Docs EN/ES**: ampliar la página Project Resources con creación por CLI, LLM/MCP y Admin, scopes multirepo (system/module/shared) y fronteras de seguridad.
3. **Dogfooding**: crear al menos un recurso real por una de las nuevas superficies (CLI/MCP/Admin) en el propio Kaddo y verificar el flujo E2E.

## Out of scope
Core (WI-036); CLI (WI-037); MCP (WI-038); Admin (WI-039).

## Acceptance criteria
- [ ] AC-01 — Graph module edges: `module → resource` aparece con provenance cuando está declarado.
- [ ] AC-02 — Ownership vs dependency: el Graph distingue scope/ownership de depends_on.
- [ ] AC-03 — Docs: EN/ES cubren CRUD por CLI/LLM/MCP/Admin, scopes multirepo y security boundary.
- [ ] AC-04 — Dogfood: un recurso real creado por una nueva superficie, verificado E2E.
- [ ] AC-05 — Backward compatible: proyectos sin scope/modules → grafo/docs sin cambios obligatorios.

## Validation
- Recurso con `modules: [orders-api, billing-worker]` → dos aristas `depends_on` y una definición canónica.
- Docs EN/ES construyen y están en el sidebar.
- Un recurso real creado por `kaddo resources create` (o MCP/Admin) aparece en list/get/graph/Admin.

## Definition of Done
Graph representa module a resource con provenance; docs EN/ES actualizadas; dogfood E2E; tests de graph; Evidence; Verification; Learning.

## Implementation handoff guidance
Extender `buildGraph` consumiendo `scope`/`modules` del read model (WI-036). Docs: ampliar la página existente (no crear otra).
