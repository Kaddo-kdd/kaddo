---
id: WI-038
title: 'MCP/LLM resource ingestion — create/update/delete con preview+confirm y candidate discovery'
type: feature
status: draft
knowledge_level: K3
parent: WI-035
affected_modules: [mcp, cli]
domains: [Tech, Delivery]
code:
  - packages/mcp/src/tools.ts
  - packages/mcp/src/server.ts
  - knowledge/agents/tech/architecture-agent.md
scope_confidence:
  level: high
  reasons:
    - Espeja el patrón confirm/preview de markWorkItemReady/importWorkItemTool; consume el contrato Core (WI-036).
refined_by: work-item-refinement (manual)
---

# WI-038 — MCP / LLM resource ingestion

Hijo de [[WI-035]]. Depende de [[WI-036]]. Permite que un agente proponga mutaciones con preview + confirmación humana.

## Scope
1. Tools MCP `kaddo_create_resource` / `kaddo_update_resource` / `kaddo_delete_resource` con el patrón: `confirm` ausente/false → **preview** (qué se escribiría/borraría, referencias); `confirm=true` → aplica vía Core. Nunca inferir consentimiento.
2. Mantener `kaddo_list_resources`/`kaddo_get_resource`.
3. **Candidate discovery guidance** (agente tech): a partir de architecture/current-state/codebase/stack/module context, el agente propone recursos **candidatos**; discovery ≠ creación; no inventar por nombres ambiguos.

## Out of scope
CLI (WI-037); Admin (WI-039); graph/docs (WI-040). Conectarse al recurso; ejecutar nada.

## Acceptance criteria
- [ ] AC-01 — Preview sin confirm: las tools devuelven un preview y NO escriben.
- [ ] AC-02 — Apply con confirm: `confirm=true` persiste vía Core (sin secretos).
- [ ] AC-03 — Delete safety: delete sin confirm muestra referencias; con confirm borra solo el recurso.
- [ ] AC-04 — Candidate discovery: guía para proponer candidatos sin materializarlos.
- [ ] AC-05 — Secret safety: ninguna tool acepta/expone valores de credenciales.

## Validation
- Intención natural → propuesta estructurada → `kaddo_create_resource` sin confirm → preview; con confirm → recurso canónico.
- `kaddo_delete_resource` sin confirm → referencias; con confirm → borra.
- Un valor secreto en la propuesta nunca se persiste ni se devuelve.

## Definition of Done
MCP ofrece create/update/delete con preview+confirm; candidate discovery documentado para el agente; sin secretos; tests MCP; Evidence; Verification; Learning.

## Implementation handoff guidance
Reutilizar `guarded`/`toolText`/`ok`/`fail` y el patrón de `markWorkItemReady` (confirm). Consumir `resource-write.ts` (WI-036).
