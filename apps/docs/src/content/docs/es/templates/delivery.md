---
title: Plantillas de delivery
description: Cómo evoluciona el producto — work items y roadmap.
---

La capa **Delivery** responde *¿cómo lo evolucionamos?* — las unidades del día a día del
loop de Kaddo, bajo `knowledge/delivery/`.

| Plantilla | Propósito | Ruta | Comando | Agente |
|---|---|---|---|---|
| Work Item | Unidad mínima trazable de evolución del producto | `knowledge/delivery/work-items/<state>/` | `kaddo create` | `work-item-agent` |
| Roadmap | Iniciativas + work items candidatos | `knowledge/delivery/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |

## Work Item

La unidad alrededor de la que giran Guard, classify, history y learn. Lleva front matter
de trazabilidad (`id`, `type`, `knowledge_level`, `source`, `domains`, `capabilities`,
`code`). Fase e iniciativa permanecen en front matter como planificación y trazabilidad
funcional; las carpetas representan el estado del lifecycle. Secciones: Problema · Resultado
esperado · Criterios de aceptación · Diseño (opcional) · Riesgos (opcional) · Out of scope ·
Validation · Definition of Done · Aprendizaje.

Los estados oficiales son `draft`, `ready`, `in-progress`, `blocked`, `completed` y `archived`.
Los agentes deben tratar solo `draft`, `ready`, `in-progress` y `blocked` como trabajo activo;
`completed` y `archived` son conocimiento histórico.

> Declara globs `code:` para que Guard relacione los cambios con el work item.

## Roadmap

Iniciativas estructuradas (`RM-001`) y work items candidatos (`WI-CANDIDATE-001`) para
revisión humana — no compromisos. `kaddo create --from roadmap` convierte candidatos en
Work Items reales con trazabilidad `source`.
