---
title: kaddo init
description: Inicializa Kaddo en el proyecto actual.
---

```bash
kaddo init
```

Crea el árbol de conocimiento `knowledge/` y `.kaddo/config.yml`.

```
knowledge/
  knowledge.md      ← estado actual del producto
  roadmap.md        ← intenciones y prioridades
  work-items/       ← un archivo por work item
.kaddo/
  config.yml        ← configuración del proyecto
```

## Idioma del proyecto

`kaddo init` pregunta el **idioma del proyecto** (`en` o `es`) y lo guarda en `.kaddo/config.yml`:

```yaml
project:
  language: es   # idioma del CONOCIMIENTO del proyecto
```

Define el idioma del **conocimiento** (templates, salidas de agentes, context pack, roadmap,
Work Items, ADRs, capabilities, current-state) — **no** el del CLI. El CLI (comandos, flags,
claves de configuración, prompts y mensajes) siempre está en inglés, y los nombres de archivo se
mantienen estables (`business.md`, `product.md`, `codebase.md`) sin importar el idioma. Por defecto
es `en`; los config antiguos sin `language` asumen inglés.
