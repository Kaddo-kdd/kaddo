---
title: Habilidades
description: Definiciones de capacidades reutilizables y versionables que estandarizan cómo los agentes hacen bien lo común — sin añadir permisos ni automatización.
---

Las habilidades (skills) son **definiciones de capacidades reutilizables**. Estandarizan *cómo*
hacer bien algo común — escribir un ADR, refinar un Work Item, proponer ownership — para que los
agentes dejen de repetir las mismas instrucciones y produzcan salidas consistentes.

```text
Agents orchestrate.   ← rol y momento del flujo
Skills standardize.   ← el "cómo hacerlo bien" reutilizable
Knowledge grounds.    ← el contexto real del proyecto
MCP exposes.          ← agentes/IDEs pueden leer ambos
```

> **Una skill no decide qué hacer — define cómo hacerlo bien.** Las skills nunca ejecutan nada:
> sin git, sin LLM, sin cambios de archivos. Son instrucciones reutilizables que un agente aplica.

## Agents vs skills

| | Agent | Skill |
|---|---|---|
| Define | el rol + momento del flujo | una capacidad reutilizable |
| Ejemplo | `work-item-agent` | `work-item-refinement` |
| Decide | *qué* hacer | *cómo* hacer bien una cosa |
| Lo reusan | — | muchos agentes |

Un agente usa varias skills — p. ej. `work-item-agent` aplica `work-item-refinement` y
`ownership-suggestion`.

## Instalación

```bash
kaddo add skills                      # conjunto recomendado (delivery + tech)
kaddo add skills --all                # todas las skills
kaddo add skills --group delivery     # un grupo
kaddo add skills --group tech
kaddo add skills --group integration
```

Las skills se instalan en `knowledge/skills/<id>/skill.md`. Los archivos existentes nunca se
sobrescriben.

## Las skills iniciales

| Skill | Grupo | Estandariza | Aplica a |
|---|---|---|---|
| `work-item-refinement` | delivery | problema · alcance · aceptación · validación · DoD | work-item / backlog / roadmap agents |
| `implementation-planning` | delivery | alcance · archivos · riesgos · pasos · criterios de parada | implementation / work-item agents |
| `learning-capture` | delivery | qué cambió · qué se aprendió · conocimiento a actualizar | implementation / guard / architecture agents |
| `adr-writing` | tech | contexto · decisión · alternativas · paths gobernados | decision / architecture / implementation agents |
| `ownership-suggestion` | tech | globs `code:` precisos | ownership / work-item / graph agents |
| `graph-metadata-review` | tech | hints → `capabilities`/`decisions`/`code`/`capsules` | graph / ownership / work-item agents |
| `capsule-writing` | integration | propósito · contratos · riesgos · sin secretos/código | capsule / architecture / product agents |

Cada `skill.md` tiene front matter estándar (`type: skill`, `id`, `title`, `version`, `group`,
`applies_to`) y secciones: Purpose · When to use · Inputs · Output · Rules · Quality checklist ·
Example output.

## Cómo los agentes referencian skills

Los prompts de agentes instalados incluyen una sección **Reusable Skills** con las skills que deben
aplicar. Por ejemplo el prompt del `graph-agent` apunta a `graph-metadata-review`, y el
`work-item-agent` a `work-item-refinement` y `ownership-suggestion`.

## En el CLI

- `kaddo context` lista los ids de skills disponibles en `## Skills` (un resumen — nunca el
  contenido completo).
- `kaddo explain` reporta `Skills installed: N` con conteos por grupo.
- `kaddo understand` recomienda skills para los agentes que recomienda.

## Por MCP

El [servidor MCP](/es/mcp-server/) expone las skills de solo lectura: el resource `kaddo://skills`
las lista, `kaddo://skills/<id>` devuelve una, las tools `kaddo_list_skills` / `kaddo_get_skill` las
consultan, y cada skill está además disponible como prompt reutilizable.

## Fuera de alcance

Sin ejecución de skills, sin auto-aplicar, sin edición automática de artefactos, sin workflow
engine, sin orquestación multiagente. Las skills añaden consistencia, no permisos.
