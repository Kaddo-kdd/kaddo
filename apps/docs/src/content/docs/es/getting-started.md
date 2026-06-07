---
title: Primeros pasos
description: Instala Kaddo e inicialízalo en tu proyecto.
---

## Instalación

```bash
npx @kaddo/cli init
```

O instala globalmente:

```bash
npm install -g @kaddo/cli
kaddo --help
```

## Inicializar

```bash
kaddo init
```

Crea:

```
knowledge/
  knowledge.md      ← estado actual del producto
  roadmap.md        ← intenciones y prioridades
  work-items/       ← un archivo por work item
.kaddo/
  config.yml        ← configuración del proyecto
```

## Idioma del conocimiento vs idioma del CLI

`kaddo init` pregunta un **idioma del proyecto** (`en` o `es`). Define el idioma del
**conocimiento** únicamente — templates, salidas de agentes, context pack, roadmap, Work Items,
ADRs, capabilities y current-state. Por defecto es inglés.

El **CLI siempre está en inglés**: comandos, flags, claves de configuración, prompts interactivos y
mensajes no cambian. Los nombres de archivo también se mantienen estables (`business.md`,
`product.md`, `codebase.md`) sin importar el idioma.

```yaml
project:
  language: es   # el conocimiento se escribe en español; el CLI sigue en inglés
```

A cada agente se le indica escribir el conocimiento generado en el idioma configurado (y nunca
traducir código, nombres de archivo, comandos ni claves de config). `explain`, `context` y
`understand` reportan el idioma activo del proyecto.

## El flujo completo

```bash
kaddo init          # estado: new | pre-ai | legacy, tamaño de equipo, estructura
kaddo bootstrap     # proyectos nuevos: base de conocimiento inicial (Business → Product → Tech → Delivery)
kaddo scan          # inventario técnico determinístico → .kaddo/scan.json
kaddo context       # context pack para el LLM → .kaddo/context-pack.md
kaddo add agents    # instala los agent prompt packs
kaddo understand    # plan guiado de handoff CLI → LLM
```

Luego usa tu LLM (Claude, ChatGPT, Cursor, Copilot, Windsurf…) con el context pack
generado y los agentes de Kaddo para crear capacidades, arquitectura y un roadmap. El CLI
nunca llama a un LLM — prepara el contexto; tu LLM hace la interpretación.

> ¿Una idea nueva fuera del roadmap en cualquier momento? Captúrala con el
> [`backlog-agent`](/es/modules/agents/) — convierte texto libre, viñetas o notas en un draft de
> Work Item o un candidato de roadmap, y te devuelve la decisión del siguiente paso.

De vuelta en el CLI, convierte el entendimiento en evolución del código:

```bash
kaddo create --from roadmap   # convierte un candidato del roadmap en un Work Item
kaddo owners suggest          # declara el ownership (code:) en el Work Item
kaddo guard                   # detecta posible deriva antes de hacer commit
kaddo explain                 # resume lo que Kaddo sabe actualmente
```

## ¿Qué comando y cuándo?

Cada comando responde una pregunta. Si alguna vez no sabes qué sigue, ejecuta
**`kaddo understand`** — responde *"¿Qué debería hacer ahora?"* a partir del estado real del
proyecto.

| Quieres… | Ejecuta | Obtienes |
|---|---|---|
| Iniciar un proyecto | `kaddo init` | `.kaddo/config.yml` |
| Crear la base de conocimiento | `kaddo bootstrap` | `knowledge/**` |
| Ver la realidad técnica | `kaddo scan` | `scan.json` · inventory |
| Empaquetar contexto para un LLM | `kaddo context` | `context-pack.md` |
| Saber qué hacer ahora | `kaddo understand` | fase + recomendación |
| Ver qué sabe Kaddo | `kaddo explain` | resumen del proyecto |
| Materializar un ítem del roadmap | `kaddo create --from roadmap` | un Work Item |
| Conectar conocimiento con código | `kaddo owners suggest` | globs `code:` |
| Detectar drift | `kaddo guard` | avisos de drift |

`scan`, `context`, `explain` y `understand` terminan con un pie **Question answered / Suggested
next**, para que el siguiente paso esté siempre a la vista. La tabla completa está en el
[Resumen de comandos](/es/commands/overview/).

Mira la página de [Flujo de trabajo](/es/workflow/) para el reparto CLI vs LLM y cómo
Kaddo apoya proyectos nuevos, pre-IA y legacy.
