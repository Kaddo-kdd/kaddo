---
title: Resumen de comandos
description: La superficie de la CLI de Kaddo.
---

Estos comandos se agrupan en los cuatro [momentos de operación](/es/operating-moments/) de Kaddo —
**Base → Definición → Proyección → Ejecución** — que explican *cuándo* se usa cada uno.

## Matriz de responsabilidades de comandos

Cada comando responde una pregunta y tiene un siguiente paso claro:

| Comando | Pregunta que responde | Siguiente sugerido |
|---|---|---|
| `kaddo init` | ¿Cómo inicio un proyecto Kaddo? | `kaddo bootstrap` |
| `kaddo bootstrap` | ¿Qué conocimiento mínimo debe existir? | `kaddo add agents`, luego `kaddo context` |
| `kaddo scan` | ¿Qué señales técnicas hay en el repositorio? | `kaddo explain` o `kaddo context` |
| `kaddo context` | ¿Qué le doy a un LLM? | Usar el agente recomendado (`kaddo understand`) |
| `kaddo understand` | ¿Qué debería hacer ahora? | Ejecutar la acción recomendada |
| `kaddo explain` | ¿Qué sabe Kaddo? | `kaddo understand` |
| `kaddo create --from roadmap` | ¿Cómo se vuelven Work Items los candidatos? | Refinar con el work-item-agent |
| `kaddo owners suggest` | ¿Quién es dueño de este código? | `kaddo guard` |
| `kaddo guard` | ¿El conocimiento se está desincronizando del código? | Actualizar el conocimiento afectado |
| `kaddo add agents` | ¿Qué agentes hay disponibles? | `kaddo understand` |
| `kaddo capsule export` | ¿Cómo comparto este proyecto como contexto externo? | refinar con el capsule-agent y compartir |
| `kaddo capsule add <path>` | ¿Cómo consumo otro sistema como contexto externo? | `kaddo context` (External Knowledge) |
| `kaddo graph export` | ¿Cómo está conectado el conocimiento del proyecto? | abre `.kaddo/graph.mmd` o corre `kaddo explain` |

> `scan`, `context`, `explain` y `understand` también imprimen esto — un pie **Question answered /
> Suggested next** — al final de su salida, para que el siguiente paso esté siempre a la vista.

## Flujos recomendados

**Proyecto nuevo**

```text
init → bootstrap → add agents → context → business-agent → product-agent →
codebase-agent → roadmap-agent → create --from roadmap → work-item-agent →
implementation-agent
```

**Desarrollo activo**

```text
implementation-agent → scan → owners suggest → guard → explain
```

**Perdido / con dudas** — ejecuta `kaddo understand`. Siempre responde *"¿Qué debería hacer
ahora?"* a partir del estado real del conocimiento.

Comandos en orden del flujo de trabajo:

| Comando | Qué hace |
|---|---|
| `kaddo init` | Inicializa Kaddo en el proyecto actual |
| `kaddo bootstrap` | Construye la base de conocimiento inicial de un proyecto nuevo (Business → Product → Tech → Delivery) |
| `kaddo scan` | Detecta el stack del proyecto y sugiere dominios |
| `kaddo context` | Genera un context pack para entregar a un agente LLM |
| `kaddo add agents` | Instala los agent prompt packs para tu chat LLM |
| `kaddo understand` | Guía el handoff CLI → LLM con un plan de agentes según el estado |
| `kaddo create <type>` / `--from roadmap` | Crea un Work Item (feature, bugfix, hotfix, spike, chore) |
| `kaddo owners suggest` | Asistente para declarar propiedad `code:` en artefactos |
| `kaddo guard` | Revisa si el código modificado tiene artefactos relacionados sin actualizar |
| `kaddo explain` | Resume lo que Kaddo sabe actualmente del proyecto |

## scan · context · explain · understand

Estos cuatro se confunden fácilmente. Cada uno tiene un propósito, input, output y la pregunta que
responde:

| Comando | Propósito | Input | Output | Responde |
|---|---|---|---|---|
| `scan` | Detectar señales técnicas | el repositorio | `.kaddo/scan.json`, `knowledge/inventory.md` | "¿De qué está hecho este código?" |
| `context` | Empaquetar conocimiento para un LLM | conocimiento + scan | `.kaddo/context-pack.md` / `.json` | "¿Qué necesita saber el agente?" |
| `explain` | Resumir lo que Kaddo sabe | conocimiento | `.kaddo/explain.md` / `.json` | "¿Qué sabe Kaddo?" |
| `understand` | Construir el handoff CLI → agente | conocimiento + scan | `.kaddo/understand.md` + recomendación | "¿Qué debería hacer ahora?" |

- **scan** detecta; no interpreta arquitectura, no crea roadmap ni llama a un LLM. Ejecútalo tras
  cambios técnicos importantes o luego de implementar un Work Item.
- **context** consolida Business → Product → Tech → Delivery + ownership + roadmap + Work Items en
  un pack. No recomienda ni analiza. Ejecútalo antes de usar cualquier agente.
- **explain** reporta madurez y cobertura. No recomienda agentes ni construye contexto para el LLM.
- **understand** decide el siguiente paso a partir del estado **real** del conocimiento (roadmap,
  Work Items, ownership) — no solo `project.state` — y recomienda el agente a ejecutar.

**Orden recomendado:** `scan → context → understand` (luego ejecuta el agente recomendado), y
`explain` en cualquier momento para inspeccionar el estado.

Comandos de apoyo:

| Comando | Qué hace |
|---|---|
| `kaddo status` | Muestra el estado actual del Repositorio de Conocimiento |
| `kaddo learn` | Cierra un Work Item y registra lo aprendido |
| `kaddo classify` | Detecta deriva de clasificación en el diff |
| `kaddo history` | Lista Work Items con filtros |
| `kaddo owners` | Lista los dueños de dominio |
| `kaddo module` | Muestra o inicializa el descriptor de módulo multirepo |
| `kaddo capsule export` | Exporta una [Knowledge Capsule](/es/knowledge-capsules/) de este proyecto |
| `kaddo capsule add <path>` | Importa una Knowledge Capsule externa como contexto |
| `kaddo graph export` | Exporta el [grafo de conocimiento](/es/knowledge-graph-export/) + hints |
| `kaddo add <module>` | Instala un módulo opcional |

Los agentes e IDEs también pueden leer este conocimiento directamente mediante el
[servidor MCP](/es/mcp-server/) de solo lectura (`@kaddo/mcp`) — sin copiar y pegar a mano.
