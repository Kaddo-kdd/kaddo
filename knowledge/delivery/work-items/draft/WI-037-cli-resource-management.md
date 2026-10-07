---
id: WI-037
title: 'CLI resource management — create (interactivo), update, delete'
type: feature
status: draft
knowledge_level: K3
parent: WI-035
affected_modules: [cli]
domains: [Tech, Delivery]
code:
  - packages/cli/src/commands/resources.ts
  - packages/cli/src/index.ts
scope_confidence:
  level: high
  reasons:
    - Consume el contrato Core (WI-036); el comando resources ya existe con list/get; prompts con utils/ui.ts (patrón de kaddo create).
refined_by: work-item-refinement (manual)
---

# WI-037 — CLI resource management

Hijo de [[WI-035]]. Depende de [[WI-036]] (Core mutations). Expone CRUD desde la CLI.

## Scope
1. `kaddo resources create` interactivo (Minimum Sufficient Knowledge: name/type/provider/scope; luego opcional "add interfaces?"). No un formulario obligatorio.
2. `kaddo resources update <id>` (editar campos; no-lossy vía Core).
3. `kaddo resources delete <id>` → muestra referencias (Core) y pide confirmación (`-y` para automatización).
4. Mantener `list`/`get`.

## Out of scope
MCP/LLM (WI-038); Admin (WI-039); graph/docs (WI-040). Writes propios fuera de Core.

## Acceptance criteria
- [ ] AC-01 — create: crea un recurso canónico vía Core, capturando solo lo mínimo suficiente.
- [ ] AC-02 — update: modifica un recurso existente sin pérdida.
- [ ] AC-03 — delete: muestra referencias y exige confirmación; `--yes` la salta.
- [ ] AC-04 — Consistency: usa las reglas de Core (sin re-validar/escribir por su cuenta); `--json` donde aplique.
- [ ] AC-05 — Backward compatible: list/get siguen igual.

## Validation
- `kaddo resources create` (Supabase Main/database/supabase/system) → archivo canónico; `get` lo devuelve.
- `update` agrega una interfaz sin perder el resto.
- `delete` de un recurso referenciado → preview + confirmación; con `--yes` borra.

## Definition of Done
CLI ofrece create/update/delete usando Core; interactivo y mínimo suficiente; delete con safety; tests de comando; Evidence; Verification; Learning.

## Implementation handoff guidance
Prompts con `utils/ui.ts` (`text`/`select`/`confirm`) como `kaddo create`. Llamar a `resource-write.ts` de WI-036; nunca generar Markdown en el comando.
