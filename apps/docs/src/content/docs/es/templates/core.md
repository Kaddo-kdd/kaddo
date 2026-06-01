---
title: Plantillas core
description: Work item, roadmap, capacidades y knowledge.
---

Las plantillas del día a día del loop de Kaddo.

| Plantilla | Propósito | Ruta | Comando | Agente |
|---|---|---|---|---|
| Work Item | Unidad mínima trazable de evolución del producto | `architecture/work-items/` | `kaddo create` | `work-item-agent` |
| Roadmap | Iniciativas + work items candidatos | `architecture/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |
| Capacidades | Lo que el sistema puede hacer | `architecture/capabilities.md` | — | `capability-agent` |
| Knowledge | Lo que es cierto del producto hoy | `architecture/knowledge.md` | `kaddo init` | — |

## Work Item

La unidad sobre la que giran Guard, classify, history y learn. Lleva front matter para
trazabilidad (`id`, `type`, `knowledge_level`, `source`, `domains`, `capabilities`,
`code`). Secciones: Problema · Resultado esperado · Criterios de aceptación · Diseño
(opcional) · Riesgos (opcional) · Definition of Done · Learning.

> Declara globs en `code:` para que Guard relacione los cambios con el work item.

## Roadmap

Iniciativas estructuradas (`RM-001`) y work items candidatos (`WI-CANDIDATE-001`) para
revisión humana — no compromisos. `kaddo create --from roadmap` convierte candidatos en
Work Items reales con trazabilidad `source`.

## Capacidades

Lista de capacidades orientadas a resultados (`CAP-001`), cada una con evidencia o
marcada como supuesto.

## Knowledge

Creada por `kaddo init`: propósito, resumen de arquitectura, dominios clave y
restricciones activas — se mantiene al día conforme evoluciona el producto.
