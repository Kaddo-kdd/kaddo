---
id: WI-031
title: 'Resources surfaces — CLI y MCP (list/get, sin secretos)'
type: feature
status: draft
knowledge_level: K3
parent: WI-029
affected_modules:
  - cli
  - mcp
domains:
  - Tech
  - Delivery
code:
  - packages/cli/src/commands/resources.ts
  - packages/cli/src/index.ts
  - packages/mcp/src/**
scope_confidence:
  level: high
  reasons:
    - >-
      Reutiliza el read model de Core (WI-030) y los patrones de comandos (topology/modules) y de
      recursos/tools MCP ya existentes. Solo lectura, determinístico.
refined_by: work-item-refinement (manual)
---

# WI-031 — Resources surfaces (CLI + MCP)

Hijo de [[WI-029]]. Depende de [[WI-030]] (read model). Expone los Project Resources para lectura.

## Intent

Permitir descubrir y consultar Project Resources desde las interfaces de Kaddo, sin exponer secretos
y sin conectarse al recurso.

## Scope

1. **CLI**: `kaddo resources list` (id, title, type, provider, environments) y `kaddo resources get
   <id>` (identity, purpose, environments, interfaces, boundaries, referencias de auth por nombre).
   Patrón de `kaddo topology`/`modules`. `--json` disponible.
2. **MCP**: recurso/tool equivalente que entregue identity/purpose/environment/interfaces/boundaries,
   coherente con los recursos/tools MCP actuales. Read-only; no conecta al recurso.
3. **Secret safety**: ni CLI ni MCP resuelven o exponen valores de credenciales; solo nombres de
   referencia.

## Out of scope

Ejecutar interfaces (CLI/SQL/etc.); conectarse a Supabase/AWS; instalar/descubrir MCP connectors;
refinement/context/handoff; graph/docs; Admin.

## Acceptance criteria

- [ ] AC-01 — CLI list/get: `kaddo resources list|get <id>` devuelven el read model sin secretos.
- [ ] AC-02 — MCP read: un recurso/tool MCP entrega identity/purpose/environment/interfaces/boundaries sin secretos.
- [ ] AC-03 — Consistency: nomenclatura/forma coherente con `topology`/`modules` (CLI) y los recursos MCP actuales.
- [ ] AC-04 — Backward compatible: proyectos sin resources → `list` vacío, sin errores.
- [ ] AC-05 — No execution: ninguna superficie se conecta al recurso descrito.

## Validation

- Con `supabase-main.md` → `kaddo resources list` lo muestra; `get RES-supabase-main` devuelve
  interfaces/boundaries y la referencia `SUPABASE_ACCESS_TOKEN` (nombre, no valor).
- MCP devuelve lo mismo sin secretos.
- Proyecto sin resources → `list` vacío, exit 0.
- Suites CLI + MCP sin regresiones.

## Definition of Done

CLI y MCP exponen resources en lectura, sin secretos ni ejecución; tests; docs mínimas de los comandos
(la doc conceptual va en el hijo graph/docs); Evidence; Verification; Learning.

## Implementation handoff guidance

Mirar `commands/topology.ts`/`modules-*.ts` (CLI) y la capa de recursos/tools de `packages/mcp` para
el patrón. Consumir el read model de WI-030 (`core/resources.ts`); no re-parsear.
