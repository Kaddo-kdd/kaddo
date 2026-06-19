---
title: kaddo understand
description: Guía el handoff CLI → LLM con un plan de agentes según el estado del proyecto.
---

```bash
kaddo understand
```

Guía el handoff desde la CLI (contexto determinista) hacia tu LLM (interpretación).
Refresca el context pack, recomienda qué agentes usar — y en qué orden — según el estado
de tu proyecto, y escribe una guía reutilizable que puedes reabrir cuando quieras.

Escribe / refresca:

- **`.kaddo/context-pack.md`** y **`.kaddo/context-pack.json`** — la entrada para los agentes.
- **`.kaddo/understand.md`** — la guía paso a paso con el flujo recomendado, las salidas
  esperadas y las instrucciones para copiar/pegar.

## Qué hace

1. Requiere un proyecto inicializado (`kaddo init`).
2. Verifica el baseline de scan (`.kaddo/scan.json`) — avisa pero continúa si falta.
3. Genera / refresca el context pack (reutiliza `kaddo context`).
4. Construye un plan de agentes según el estado y marca los agentes que aún no están
   instalados (`kaddo add agents`).
5. Imprime un resumen conciso en la terminal y escribe `.kaddo/understand.md`.

## Determinista, sin LLM

`kaddo understand` **no** llama a un LLM, no ejecuta agentes ni autogenera artifacts de
arquitectura. Prepara el contexto y te dice exactamente qué agente ejecutar a continuación.
Tú mantienes el control de la interpretación.

## Flujo de agentes según el estado

## Recomendaciones según el estado real

`understand` recomienda el siguiente paso a partir del estado **real** del conocimiento — capas,
roadmap, Work Items y ownership — no solo del `project.state` definido en `kaddo init`. Reporta la
**fase** actual, la **razón**, los agentes recomendados y un **siguiente paso** concreto:

```text
Current phase: Active Delivery
Reason:
  - Roadmap available
  - 1 materialized work item(s)
  - ready: 1
  - Ownership coverage 100%
Recommended: implementation-agent
Next step: Start WI-014 — Create task (ready → in-progress)
```

Las fases se derivan de lo que realmente existe:

| Fase | Cuándo |
|---|---|
| Discovery | faltan capas base (business / product / codebase) |
| Planning | existe conocimiento base, aún no hay roadmap |
| Delivery Preparation | existe roadmap, aún no hay Work Items |
| Active Delivery | hay Work Items activos (draft / ready / in-progress / blocked) |
| Maintenance | Work Items completados y roadmap mayormente materializado |

Así, una vez que existen roadmap y Work Items, `understand` deja de recomendar el roadmap-agent y te
apunta al trabajo que realmente necesita atención.

El flujo basado en estado todavía guía las fases tempranas:

| Estado | Flujo recomendado |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

Cada paso se mapea a una salida esperada, por ejemplo:

- `capability-agent` → `knowledge/product/capabilities.md`
- `architecture-agent` → `knowledge/tech/current-state.md`
- `roadmap-agent` → `knowledge/delivery/roadmap.md`
- `legacy-agent` → `knowledge/legacy/risks.md`

## Candidatos del roadmap → Work Items materializados

Cuando existe un roadmap pero sus candidatos aún no son Work Items, `understand` lo señala y
recomienda materializarlos:

```text
The roadmap has 16 unmaterialized Work Item candidate(s) (21 candidate(s), 5 materialized).
  → Run `kaddo create --from roadmap`, or use the work-item-agent to
    materialize them into knowledge/delivery/work-items/.
```

Los candidatos se detectan desde cualquier
[formato de roadmap soportado](/es/commands/create/#formatos-de-roadmap-soportados). Un candidato
del roadmap se convierte en un Work Item real solo cuando lo creas — `understand` mantiene ese
límite explícito para que nada se trate silenciosamente como trabajo en curso.

## Trabajo activo

`understand` razona sobre el lifecycle de Work Items y muestra el workspace activo actual:
`draft`, `ready`, `in-progress` y `blocked`. Recomienda continuar un item en progreso,
empezar uno ready, refinar un draft o resolver bloqueos. `completed` y `archived` quedan como
conocimiento historico.

## Hints del grafo durante Active Delivery

Si el proyecto está en la fase **Active Delivery** y
[`kaddo graph export`](/es/knowledge-graph-export/) reportó hints que afectan Work Items
**activos**, `understand` recomienda revisarlos antes de seguir con la implementación y sugiere el
`graph-agent`. El aviso solo aparece cuando los hints tocan trabajo activo — si no, no estorba.

## Funciona aunque falte contexto

Si falta el baseline de scan o algunos agentes, el comando igual produce un plan y te indica
el próximo paso concreto (ejecutar `kaddo scan` o `kaddo add agents`).

## scan vs context vs understand

- **`scan`** recolecta señales técnicas deterministas.
- **`context`** empaqueta esas señales (más conocimiento y work items) en un pack listo para el LLM.
- **`understand`** lo integra todo: refresca el pack y te dice qué agente ejecutar a
  continuación, en qué orden, según el estado de tu proyecto.
