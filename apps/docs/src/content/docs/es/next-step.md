---
title: Siguiente paso según el estado
description: Kaddo recomienda el siguiente paso de delivery según el estado real del trabajo — draft, ready, in-progress, ownership, ADRs y adapters — no solo según si el roadmap todavía tiene candidatos.
---

Kaddo tiene una única respuesta determinista a "¿qué hago ahora?" — compartida por `kaddo explain`,
`kaddo context` y `kaddo understand` para que nunca se contradigan. Desde VS-079 esa respuesta es
**sensible al estado**: mira el estado más urgente del delivery actual, no solo si el roadmap todavía
tiene candidatos pendientes.

Antes de VS-079, un proyecto con un Work Item draft y seis candidatos de roadmap restantes seguía
recibiendo "materializa el primer Work Item" — aunque ya existía un Work Item. Ahora Kaddo te lleva por
el flujo real: refinar el draft, completar ownership, materializar ADRs, preparar un adapter y luego
implementar.

## La escalera de decisión

Kaddo evalúa el siguiente paso en orden de prioridad:

1. Conocimiento fundacional faltante (business / product / tech)
2. Preguntas abiertas bloqueantes
3. No hay roadmap → **roadmap-agent**
4. El roadmap tiene candidatos pero **no hay Work Items** → `kaddo create --from roadmap`
5. Work Item **ready** + sin adapter → instalar un adapter (`kaddo adapters list`)
6. Work Item **ready** + adapter → **implementation-agent**
7. Work Item **in-progress** → `kaddo guard`
8. Work Item **draft** → **work-item-agent** (nunca "crear el primer Work Item")
9. Work Item **blocked** → resolver el bloqueo con el work-item-agent
10. Solo trabajo completed/archived → materializar candidatos restantes o planear la próxima iniciativa

La regla central: **Kaddo recomienda el siguiente paso según el estado real del delivery, no solo según
la existencia de candidatos de roadmap pendientes.**

## Recomendaciones primaria + secundarias

La recomendación es un objeto con `id`, `phase`, `label`, `reason` y opcionalmente `command`, `agent` y
`skill`. Las preocupaciones paralelas se exponen como recomendaciones **secundarias** que no reemplazan
a la primaria:

- **Ownership** — cuando la cobertura de ownership es menor al 100%, aparece `kaddo owners suggest`.
- **ADRs** — cuando hay decision candidates técnicos y ningún ADR aceptado, se sugiere la skill
  `adr-writing` (`kaddo adr`) antes de implementar Work Items técnicos relacionados. Advierte; nunca
  bloquea la creación de Work Items.
- **Candidatos restantes** — una vez que existe al menos un Work Item, los candidatos de roadmap
  restantes pasan a ser una sugerencia *secundaria* de "materializar más tarde" en vez del paso
  primario.

`kaddo explain` los renderiza como una lista numerada **Suggested Next Steps**, encabezada por la
primaria:

```txt
## Suggested Next Steps
1. Refine the existing draft Work Item with the work-item-agent.
2. Run `kaddo owners suggest` for Work Items without code ownership.
3. Use the adr-writing skill (`kaddo adr`) to materialize decision candidates into ADRs.
4. Later, materialize the remaining 6 Work Item candidate(s) with `kaddo create --from roadmap`.
```

## En el context pack

`kaddo context` lleva un snapshot `deliveryState` y la `nextStepRecommendation` calculada:

```json
{
  "deliveryState": {
    "phase": "Active Delivery",
    "draft_work_items": 1,
    "ready_work_items": 0,
    "ownership_coverage": "0/1",
    "remaining_work_item_candidates": 6
  },
  "nextStepRecommendation": {
    "id": "refine-work-item",
    "agent": "work-item-agent",
    "skill": "work-item-refinement"
  }
}
```

El pack en markdown agrega una sección **Delivery State** y **Next Step Recommendation** con los mismos
datos.

## Sobre MCP

Los agentes pueden leer la recomendación directamente vía el recurso de solo lectura
`kaddo://next-step`, que devuelve `{ nextStepRecommendation, deliveryState }` — el mismo objeto que
calcula la CLI, desde la fuente compartida `resolveNextStep(dir)`. Determinista y de solo lectura.

## Qué nunca hace

La recomendación es solo guía. Kaddo nunca crea ni refina Work Items automáticamente, nunca marca un
Work Item como ready, nunca crea ADRs, nunca instala adapters, nunca llama a un LLM y nunca ejecuta git.
El roadmap nunca se bloquea.
