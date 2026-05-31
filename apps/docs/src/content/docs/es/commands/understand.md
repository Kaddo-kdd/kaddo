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

El flujo recomendado se adapta al estado del proyecto definido en `kaddo init`:

| Estado | Flujo recomendado |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

Cada paso se mapea a una salida esperada, por ejemplo:

- `capability-agent` → `architecture/capabilities.md`
- `architecture-agent` → `architecture/current-state.md`
- `roadmap-agent` → `architecture/roadmap.md`
- `legacy-agent` → `architecture/legacy/risks.md`

## Funciona aunque falte contexto

Si falta el baseline de scan o algunos agentes, el comando igual produce un plan y te indica
el próximo paso concreto (ejecutar `kaddo scan` o `kaddo add agents`).

## scan vs context vs understand

- **`scan`** recolecta señales técnicas deterministas.
- **`context`** empaqueta esas señales (más conocimiento y work items) en un pack listo para el LLM.
- **`understand`** lo integra todo: refresca el pack y te dice qué agente ejecutar a
  continuación, en qué orden, según el estado de tu proyecto.
