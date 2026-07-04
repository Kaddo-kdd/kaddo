---
title: Calidad del roadmap
description: Kaddo califica qué tan bien fundamentado está cada candidato del roadmap en un dominio de capacidad, una capacidad relacionada y una señal de origen — para que las prioridades sean rastreables al conocimiento real del proyecto en vez de ideas inventadas.
---

Un candidato del roadmap no debería ser una idea que sale de la nada. Todo candidato debería ser
**rastreable** a algo que Kaddo ya sabe del sistema: un dominio de capacidad, una capacidad relacionada
y una señal de origen (un capability gap, una pregunta abierta, un drift, un decision candidate). Kaddo
califica ese fundamento y lo expone — sin bloquear el roadmap (VS-077).

El fundamento es **guía de calidad, no una puerta rígida**. Aún puedes escribir candidatos simples;
Kaddo solo te dice cuáles están fundamentados y cuáles necesitan refinamiento.

## Qué hace que un candidato esté fundamentado

Un candidato del roadmap (un encabezado `### RM-xxx` en `knowledge/delivery/roadmap.md`) está
**fundamentado** cuando lleva los tres:

| Campo | Significado |
|---|---|
| Related domain | el dominio de capacidad al que pertenece el candidato |
| Related capabilities | una o más capacidades que toca |
| Source signals | la razón rastreable — capability gap, pregunta abierta, drift, decision candidate |

El parser es tolerante al formato: acepta tanto viñetas `- Related domain:` como campos inline
`**Related domain:**`, y cada campo puede llevar un valor inline o una lista de sub-viñetas indentada.

## Estado de calidad del roadmap

Kaddo calcula un resumen `roadmap_quality` a partir de los candidatos:

```bash
kaddo explain          # muestra una sección ## Roadmap Quality
kaddo context          # lleva el mismo resumen al context pack
kaddo understand       # sugiere fundamentar o create --from roadmap
```

El resumen cuenta `candidates`, `grounded`, `with_related_domain`, `with_related_capability`,
`with_source_signals`, y marca `needs_refinement` cuando al menos un candidato no está fundamentado.
Cuando todos los candidatos están fundamentados, `understand` sugiere materializarlos con
`kaddo create --from roadmap`; cuando algunos necesitan refinamiento recomienda el **roadmap-agent**
para agregar el dominio / la capacidad / las señales de origen faltantes.

Esto es determinista y de solo lectura: la CLI nunca inventa dominios ni capacidades, nunca llama a un
LLM y nunca ejecuta git.

## Sobre MCP

Los agentes pueden consultar el fundamento directamente vía el recurso de solo lectura
`kaddo://roadmap-quality`, que devuelve el mismo objeto que el bloque `## Roadmap Quality`
(`candidates`, `grounded`, los conteos por campo, `needs_refinement` e `items`). La CLI y MCP comparten
la misma fuente `buildRoadmapQuality(dir)`, así que el recurso es determinista y nunca escribe nada.

## Metadata que se lleva a los Work Items

Cuando materializas un candidato fundamentado con `kaddo create --from roadmap`, el front matter del
nuevo Work Item preserva la trazabilidad:

```yaml
source_roadmap_candidate: RM-001
related_domain: "Billing & Subscriptions"
related_capability: "Payment Webhook Processing"
related_capabilities: ["Payment Webhook Processing", "Trial Management"]
knowledge_level: K2
expected_value: "Reduces payment activation risk"
risks: "Mercado Pago webhook failures"
dependencies: ["ADR for internal endpoint protection"]
```

Así la línea **capacidad → candidato del roadmap → Work Item** queda rastreable de punta a punta. Los
campos solo se escriben cuando el candidato los llevaba — Kaddo nunca inventa valores.

## El roadmap-agent

El `roadmap-agent` produce candidatos fundamentados en `knowledge/delivery/roadmap.md`. Cada iniciativa
`### RM-xxx` lleva **Related domain**, **Related capabilities**, **Source signals**,
**Problem / opportunity**, **Expected value**, **Risks**, **Dependencies**, una lista de **Suggested
Work Items** y una nota **Not now** — más una sección `## Not Now` y reglas de fundamento. El agente
**sugiere** Work Items pero nunca los materializa: nunca crea archivos bajo
`knowledge/delivery/work-items/`. Los candidatos son candidatos, no decisiones, y el agente nunca
escribe código ni ejecuta git.
