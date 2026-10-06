---
id: WI-033
title: 'Resources graph, docs, project description y evidence'
type: feature
status: draft
knowledge_level: K3
parent: WI-029
affected_modules:
  - cli
  - docs
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/core/graph.ts
  - packages/cli/src/core/implementation-evidence.ts
  - apps/docs/src/content/docs/**
  - knowledge/tech/**
scope_confidence:
  level: high
  reasons:
    - >-
      GraphNodeType/GraphEdgeType son uniones extensibles; agregar project-resource y las aristas es
      aditivo. Docs y evidence siguen patrones existentes.
refined_by: work-item-refinement (manual)
---

# WI-033 — Resources graph, docs & project description

Hijo de [[WI-029]]. Depende de [[WI-030]] (modelo). Hace observable y documentado el conocimiento.

## Intent

Representar Project Resources en el Knowledge Graph y en la descripción técnica del proyecto, permitir
que Evidence referencie validaciones contra recursos, y documentar el concepto EN/ES.

## Scope

1. **Graph** (`graph.ts`): nodo `project-resource`; aristas desde WIs según rol — `affects`,
   `uses`, `validates_with`, `delivers_through` — con provenance desde el WI; `depends_on` de módulo→
   recurso cuando haya evidencia en Knowledge. No inferir relaciones sin evidencia.
2. **Project description**: `codebase.md`/`current-state.md` pueden listar recursos en una sección
   "External Resources" (breve, con ids), sin duplicar la definición (que vive en
   `knowledge/tech/resources/`).
3. **Evidence** (`implementation-evidence.ts`): la evidencia puede referenciar validaciones realizadas
   sobre un recurso (p. ej. "migration aplicada en development", "schema verificado") sin persistir
   contenidos/credenciales/dumps sensibles.
4. **Docs EN/ES**: página(s) que expliquen Resource vs Access Interface, relación con WIs y la frontera
   de seguridad (nunca secretos). Registrar en el sidebar.
5. **Dogfooding E2E**: un recurso real del propio Kaddo (si aplica) + un WI que lo referencie, para
   validar el flujo de punta a punta.

## Out of scope

Core/model (WI-030); CLI/MCP (WI-031); refinement/context/handoff (WI-032); Admin (WI-034). Ejecución
remota, monitoreo, dashboards.

## Acceptance criteria

- [ ] AC-01 — Graph node: Project Resource es nodo del Graph.
- [ ] AC-02 — Graph edges: los roles del WI producen `affects`/`uses`/`validates_with`/`delivers_through` con provenance.
- [ ] AC-03 — Module depends_on: `module → resource` se representa solo cuando hay evidencia.
- [ ] AC-04 — Project description: current-state/codebase pueden referenciar recursos sin duplicar la definición.
- [ ] AC-05 — Evidence: la evidencia referencia validaciones sobre recursos sin datos sensibles.
- [ ] AC-06 — Docs: docs EN/ES explican Resource vs Access Interface, relación con WIs y security boundary.
- [ ] AC-07 — Backward compatible: proyectos sin resources → grafo/evidence/docs sin cambios obligatorios.

## Validation

- `WI-xxx → RES-supabase-main` (role affected) → grafo `WI-xxx --affects--> RES-supabase-main` con
  provenance desde el WI.
- Dos roles distintos → dos aristas independientes.
- Evidence con "✓ migration aplicada en development" → se persiste la descripción, no el contenido.
- Docs EN/ES construyen (apps/docs build verde) y aparecen en el sidebar.
- Proyecto sin resources → grafo igual que hoy.

## Definition of Done

Graph representa Resource y sus relaciones; current-state/codebase pueden referenciarlos; Evidence puede
referenciar validaciones sin datos sensibles; docs EN/ES; dogfooding E2E; tests de graph; Evidence;
Verification; Learning.

## Implementation handoff guidance

Extender las uniones `GraphNodeType`/`GraphEdgeType` y `buildGraph` (consumiendo las relaciones de
WI-030). Para docs, seguir el patrón de páginas existentes (mermaid-knowledge/telemetry) y registrar en
`astro.config.mjs`.
