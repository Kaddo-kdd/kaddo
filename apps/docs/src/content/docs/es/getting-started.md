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
architecture/
  knowledge.md      ← estado actual del producto
  roadmap.md        ← intenciones y prioridades
  work-items/       ← un archivo por work item
.kaddo/
  config.yml        ← configuración del proyecto
```

## El flujo completo

```bash
kaddo init          # estado: new | pre-ai | legacy, tamaño de equipo, estructura
kaddo scan          # inventario técnico determinístico → .kaddo/scan.json
kaddo context       # context pack para el LLM → .kaddo/context-pack.md
kaddo add agents    # instala los agent prompt packs
kaddo understand    # plan guiado de handoff CLI → LLM
```

Luego usa tu LLM (Claude, ChatGPT, Cursor, Copilot, Windsurf…) con el context pack
generado y los agentes de Kaddo para crear capacidades, arquitectura y un roadmap. El CLI
nunca llama a un LLM — prepara el contexto; tu LLM hace la interpretación.

De vuelta en el CLI, convierte el entendimiento en evolución del código:

```bash
kaddo create --from roadmap   # convierte un candidato del roadmap en un Work Item
kaddo owners suggest          # declara el ownership (code:) en el Work Item
kaddo guard                   # detecta posible deriva antes de hacer commit
kaddo explain                 # resume lo que Kaddo sabe actualmente
```

Mira la página de [Flujo de trabajo](/es/workflow/) para el reparto CLI vs LLM y cómo
Kaddo apoya proyectos nuevos, pre-IA y legacy.
