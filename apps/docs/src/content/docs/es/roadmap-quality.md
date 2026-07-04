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

## Dos niveles: iniciativas vs Work Item candidates

Un roadmap tiene **dos** niveles distintos, y Kaddo los cuenta por separado (VS-077.1) para que los
números dejen de ser ambiguos:

| Nivel | Qué es | Encabezado |
|---|---|---|
| Iniciativas de roadmap | agrupaciones estratégicas, calificadas por fundamento | `### RM-001` |
| Work Item candidates | ítems materializables dentro de una iniciativa | `- WI-CANDIDATE-001: …` |

`kaddo explain` muestra un bloque **Roadmap Status** que los mantiene separados:

```txt
## Roadmap Status
- Initiatives: 3
- Work Item candidates: 7
- Materialized Work Items: 0
- Remaining Work Item candidates: 7
```

Y **Roadmap Quality** califica cada nivel por su cuenta:

```txt
## Roadmap Quality
Initiatives:
- Candidates evaluated: 3
- Grounded: 0/3
- With related domain: 0/3
- With related capability: 3/3
- With source signals: 0/3

Work Item Candidates:
- Candidates: 7
- With source initiative: 7/7
- With related domain: 7/7
- With related capability: 7/7
```

## Qué hace que una iniciativa esté fundamentada

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

El resumen `roadmapQuality` tiene dos sub-objetos — `initiatives` (con `total`, `grounded`, los conteos
por campo y `needs_refinement`) y `work_item_candidates` (con `total`, `with_source_initiative`,
`with_related_domain`, `with_related_capability`). Cuando todas las iniciativas están fundamentadas,
`understand` sugiere materializar candidatos con `kaddo create --from roadmap`; cuando algunas necesitan
refinamiento recomienda el **roadmap-agent**. Cuando los Work Item candidates tienen buena metadata,
`explain` imprime `Work Item candidate quality: good.`

Esto es determinista y de solo lectura: la CLI nunca inventa dominios ni capacidades, nunca llama a un
LLM y nunca ejecuta git.

## Sobre MCP

Los agentes pueden consultar el fundamento directamente vía el recurso de solo lectura
`kaddo://roadmap-quality`, que devuelve el objeto de dos niveles (`initiatives` +
`work_item_candidates`). Los candidatos materializables se exponen de solo lectura vía
`kaddo://work-item-candidates`. La CLI y MCP comparten las mismas fuentes `buildRoadmapQuality(dir)` y
`parseRoadmapCandidates`, así que ambos recursos son deterministas y nunca escriben nada.

## Metadata que se lleva a los Work Items

Cuando materializas un candidato con `kaddo create --from roadmap`, el front matter del nuevo Work Item
preserva **y normaliza** la trazabilidad (VS-078):

```yaml
source: roadmap
source_roadmap_initiative: RM-001
source_work_item_candidate: WI-CANDIDATE-001
source_initiative_title: "Estabilización y Despliegue de Suscripciones PRO"
related_domain: "Billing & Subscriptions"
domains:
  - "Billing & Subscriptions"
related_capabilities:
  - "Payment Webhook Processing"
  - "Trial Management"
expected_value: "Reduces payment activation risk"
risks:
  - "Medium"
dependencies:
  - "Edge Function deploy"
source_signals:
  - "Capability Gap: webhook hardening"
decision_candidates:
  - "INTERNAL_CRON_SECRET"
related_decisions: []
```

**Reglas de normalización:** `domains` se rellena desde `related_domain` (nunca queda vacío cuando
existe un related domain), y las cadenas de capacidades separadas por comas se dividen en una lista real
— una capacidad por ítem, nunca un solo string `"a, b, c"`. El cuerpo del Work Item obtiene un bloque
**Source** mejorado (iniciativa + Work Item candidate + dominio/capacidades) y una sección **Context
From Roadmap** con expected value, risks, dependencies y source signals. Cuando el roadmap no tiene
source signals dice `**Source signals:** _Not provided in roadmap._` en vez de inventarlas. Si el
candidato depende de un decision candidate técnico sin ADR, el cuerpo lleva un warning y el front matter
registra `decision_candidates` + `related_decisions: []`.

Así la línea **capacidad → iniciativa de roadmap → Work Item candidate → Work Item** queda rastreable de
punta a punta. Los campos solo se escriben cuando el candidato los llevaba — Kaddo nunca inventa
valores.

## El roadmap-agent

El `roadmap-agent` produce candidatos fundamentados en `knowledge/delivery/roadmap.md`. Cada iniciativa
`### RM-xxx` lleva **Related domain**, **Related capabilities**, **Source signals**,
**Problem / opportunity**, **Expected value**, **Risks**, **Dependencies**, una lista de **Suggested
Work Items** y una nota **Not now** — más una sección `## Not Now` y reglas de fundamento. El agente
**sugiere** Work Items pero nunca los materializa: nunca crea archivos bajo
`knowledge/delivery/work-items/`. Los candidatos son candidatos, no decisiones, y el agente nunca
escribe código ni ejecuta git.
