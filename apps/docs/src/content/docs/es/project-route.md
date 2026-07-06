---
title: Ruta del Proyecto
description: Mapa visual del progreso del ciclo de vida del proyecto.
---

La **Ruta del Proyecto** es un mapa de progreso determinístico que muestra dónde se encuentra
tu proyecto en su ciclo de vida — qué pasos están completados, cuál es el actual y qué viene después.

## Cómo funciona

Kaddo clasifica tu proyecto como **new**, **pre-ai** o **legacy** (según `project.state`
en `.kaddo/config.yml`) y construye una ruta de pasos ordenados. Cada paso se evalúa contra
el estado real del proyecto: presencia de config, baseline de scan, calidad de artefactos de
conocimiento, Work Items, ADRs, adaptadores e historial de guard.

## Estados de los pasos

| Marcador | Estado    | Significado                                     |
|----------|-----------|-------------------------------------------------|
| `[x]`   | done      | Paso completado con evidencia                    |
| `[>]`   | current   | El paso en el que deberías trabajar ahora        |
| `[ ]`   | pending   | Aún no alcanzable                                |
| `[~]`   | warning   | Existe pero necesita atención (ej. calidad débil)|
| `[!]`   | blocked   | No puede continuar hasta resolver una dependencia|
| `[-]`   | skipped   | Omitido intencionalmente                         |
| `[o]`   | optional  | No requerido para el progreso                    |

## Dónde aparece

- **`kaddo explain`** — checklist completo en la salida de Explain.
- **`kaddo context`** — resumen compacto en el context pack.
- **`kaddo understand`** — resumen compacto en el handoff de understand.
- **Recurso MCP** — `kaddo://project-route` devuelve la ruta completa como JSON.

## Modelo JSON

```json
{
  "type": "pre-ai",
  "currentStep": "define-business",
  "completed": 2,
  "total": 15,
  "progressPercent": 13,
  "steps": [
    {
      "id": "enable-kaddo",
      "label": "Enable Kaddo",
      "status": "done",
      "evidence": [".kaddo/config.yml"]
    }
  ]
}
```

Cada paso puede incluir campos `evidence`, `reason`, `command`, `agent` y `skill`
para guiarte hacia su completación.

## Definiciones de rutas

- **New** (12 pasos): init → business → product → capabilities → architecture → decisions → work source → materialize → refine → ownership → prepare → guard.
- **Pre-AI** (15 pasos): agrega scan, resolve ADRs y capture learning.
- **Legacy** (15 pasos): agrega identify legacy modules e identify operational risks.
