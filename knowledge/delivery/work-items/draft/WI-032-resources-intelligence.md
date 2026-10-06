---
id: WI-032
title: 'Resources intelligence — refinement, context assembly y Implementation Handoff'
type: feature
status: draft
knowledge_level: K3
parent: WI-029
affected_modules:
  - cli
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/core/context-pack.ts
  - packages/cli/src/core/implementation-handoff.ts
  - knowledge/skills/work-item-refinement/skill.md
  - knowledge/agents/**
scope_confidence:
  level: high
  reasons:
    - >-
      Extiende context-pack e implementation-handoff (puntos existentes) consumiendo las relaciones
      WI↔Resource de WI-030. Proporcional: resuelve solo los resources relacionados.
refined_by: work-item-refinement (manual)
---

# WI-032 — Resources intelligence

Hijo de [[WI-029]]. Depende de [[WI-030]]. Lleva los resources al razonamiento del ciclo.

## Intent

Que refinement considere resources cuando aplica y que el context assembly / Implementation Handoff
incluyan **solo los resources relevantes** al WI (role, purpose, environment, interfaces, boundaries),
informando al agente sin ejecutar nada.

## Scope

1. **Refinement**: actualizar la skill `work-item-refinement` (y agentes relevantes) para preguntar si
   el cambio observa/modifica/valida/despliega sobre un recurso externo conocido. No exigir resources
   para todo WI; no inventar recursos sin respaldo.
2. **Context assembly** (`context-pack.ts`): resolver las relaciones `resources` del WI e inyectar solo
   esos resources (identity/role/purpose/env/interfaces/boundaries), proporcional — nunca el catálogo
   completo.
3. **Implementation Handoff** (`implementation-handoff.ts`): sección "Relevant Resources" con role,
   purpose, interfaces y boundaries. **Informa**, no ejecuta ninguna interfaz; nunca credenciales.

## Out of scope

CLI/MCP read (surfaces); graph/docs/evidence; Admin. Ejecución remota.

## Acceptance criteria

- [ ] AC-01 — Refinement: refinement considera resources cuando el scope lo justifica y no inventa recursos.
- [ ] AC-02 — Context Assembly: el contexto de un WI incluye solo los resources relacionados, no todo el catálogo.
- [ ] AC-03 — Handoff: el Handoff presenta purpose, role, interfaces y boundaries de los resources relevantes.
- [ ] AC-04 — No execution / no secrets: el Handoff no conecta al recurso ni expone valores de credenciales.
- [ ] AC-05 — Proportional: un WI sin resources no agrega ruido al contexto/handoff.

## Validation

- WI con `resources: [{RES-supabase-main, affected}]` → Handoff incluye RES-supabase-main (role,
  purpose, interfaces, boundaries); NO conexión, NO credenciales, NO migración automática.
- WI con dos resources (affected + validation) → Handoff preserva ambos.
- WI sin resources → contexto/handoff sin sección de resources, sin warnings.
- Suite de Core sin regresiones.

## Definition of Done

Refinement considera resources; context/handoff incluyen solo los relevantes con interfaces/boundaries;
sin ejecución ni secretos; tests de context assembly + handoff; Evidence; Verification; Learning.

## Implementation handoff guidance

Consumir el read model de WI-030 y las relaciones del WI. Mirar cómo context-pack/handoff ya inyectan
related_knowledge/affected_modules para seguir el mismo patrón proporcional.
