---
title: kaddo context
description: Genera un paquete de contexto para entregar a un agente LLM.
---

```bash
kaddo context
```

Arma un paquete de contexto listo para entregar a un chat LLM (Claude, ChatGPT, Cursor,
Copilot, Windsurf…). Lee los artifacts existentes de Kaddo y escribe dos archivos:

- **`.kaddo/context-pack.md`** — markdown compacto y legible para pegar en el chat.
- **`.kaddo/context-pack.json`** — datos estructurados para tooling y automatizaciones futuras.

## Entradas

El comando lee (todo es opcional salvo la config):

```
.kaddo/config.yml          # requerido — ejecuta `kaddo init` primero
.kaddo/scan.json           # baseline técnico
.kaddo/modules.yml         # módulos multirepo mapeados (si hay)
knowledge/inventory.md  # inventario técnico
knowledge/knowledge.md  # conocimiento actual
knowledge/delivery/roadmap.md    # roadmap
knowledge/delivery/work-items/   # metadata de work items (solo front matter)
```

Si falta algún archivo, el comando igual se ejecuta — esas secciones se marcan en
**Missing Context** para que el LLM sepa qué falta.

Por defecto, el context pack incluye solo Work Items activos: `draft`, `ready`,
`in-progress` y `blocked`. `completed` y `archived` son conocimiento historico y se excluyen
para que el trabajo antiguo no domine el handoff al LLM.

## External Knowledge

Si importaste [Knowledge Capsules](/es/knowledge-capsules/) (`kaddo capsule add`), el pack agrega
una sección `## External Knowledge` que resume cada sistema externo (propósito · capacidades ·
contratos · owner · riesgos) — contexto mínimo de sistemas que no mapeas como multirepo.

## Candidatos del roadmap vs materializados

Cuando existe `knowledge/delivery/roadmap.md`, la sección `## Roadmap` reporta **candidatos**
(parseados desde cualquier
[formato de roadmap soportado](/es/commands/create/#formatos-de-roadmap-soportados)), **work items
materializados** y **candidatos restantes**. El JSON expone un objeto `roadmap` (`present`,
`candidates`, `materialized`, `remaining`) para que el agente sepa qué candidatos siguen
esperando convertirse en Work Items.

## Módulos mapeados (multirepo)

Si el proyecto tiene módulos registrados con `kaddo modules map`, el pack agrega una
sección `## Mapped Modules` (y un arreglo `mappedModules` en el JSON) con el tipo, ruta
del repo, owner, capacidades y qué artefactos de `knowledge/tech/modules/<id>/` existen.
Kaddo lee `.kaddo/modules.yml` y los artefactos del módulo solamente — **nunca escanea
los repositorios secundarios**.

## Determinista, sin LLM

`kaddo context` **no** llama a un LLM, no requiere API key y no interpreta tu sistema.
Ensambla metadata y resúmenes — nunca el código fuente completo. La interpretación es
tarea del agente.

## Reglas operativas (al inicio del pack)

El pack empieza con un bloque de **Operating Rules** que el agente que implementa debe
seguir — para que un coding assistant al que se lo pegues no commitee por su cuenta. En
particular: **nunca `git commit`, `push` ni `merge` sin confirmación humana explícita**,
crear una rama antes de implementar un Work Item, y correr `kaddo scan` / `owners suggest` /
`guard` tras cambios significativos. El CLI de Kaddo nunca corre git.

## Fase actual

El pack abre con un bloque **Current Phase** derivado del estado real del conocimiento (capas,
roadmap, Work Items, ownership) — Discovery / Planning / Delivery Preparation / Active Delivery /
Maintenance — con la razón y el siguiente agente recomendado. Así el agente que lee el pack ve qué
hacer según la realidad, no solo `project.state`:

```text
## Current Phase
Phase: Active Delivery
Reason:
- Roadmap available
- 1 materialized work item(s)
Recommended next: implementation-agent
Next step: Start WI-014 — Create task (ready → in-progress)
```

El **Recommended Agent Handoff** y las **Instructions for the LLM** también se basan en esta fase
real (VS-052) — no en `project.state` — para que el pack nunca recomiende agentes de etapa
temprana si el proyecto ya está en Active Delivery. Las instrucciones al LLM cambian por fase (p.
ej. Active Delivery / ready → "usa el implementation-agent, sugiere solo el nombre de rama, no
ejecutes git"; Active Delivery / draft → "refina los Work Items draft, no implementes salvo que se
pida explícitamente").

## Handoff según el estado

El conjunto basado en estado sigue sembrando las fases tempranas; las recomendaciones se adaptan al
estado del proyecto definido en `kaddo init`:

| Estado | Handoff recomendado |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent |

## scan vs context vs understand

- **`scan`** recolecta señales técnicas deterministas.
- **`context`** empaqueta esas señales (más conocimiento y work items) en un pack listo para el LLM.
- **`understand`** lo integra todo: refresca el pack y te dice qué agente ejecutar a
  continuación, en qué orden, según el estado de tu proyecto.

## Flags

```bash
kaddo context                    # escribe .md y .json
kaddo context --format markdown  # solo el pack markdown
kaddo context --format json      # solo el pack JSON
```
