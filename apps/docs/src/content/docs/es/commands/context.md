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

## Handoff según el estado

Los agentes recomendados se adaptan al estado del proyecto definido en `kaddo init`:

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
