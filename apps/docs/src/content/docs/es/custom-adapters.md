---
title: Adapters custom
description: El Adapter Contract que sigue todo adapter de Kaddo, y cómo construir un puente custom entre el conocimiento de Kaddo y cualquier herramienta de IA.
---

Los adapters de Kaddo proyectan el conocimiento de Kaddo al **formato nativo de instrucciones** de
una herramienta de IA. El [adapter de Codex](codex-adapter/) (`AGENTS.md`) es la implementación de
referencia; esta página describe el contrato que sigue todo adapter y cómo construir el tuyo.

Un adapter custom **no** debe duplicar el conocimiento completo del proyecto. Debe crear un puente
compacto entre la herramienta destino y la estructura de conocimiento de Kaddo — referencias y
reglas, no contenido.

## Cuándo crear un adapter custom

Créalo cuando tu herramienta de IA tenga un mecanismo nativo para leer instrucciones desde el
repositorio — por ejemplo `AGENTS.md`, `CLAUDE.md`, un directorio `commands/` o `skills/`, o un
archivo de instrucciones de workspace específico de la herramienta.

## Adapter Contract

Todo adapter de Kaddo debe:

- Indicar que **Kaddo es la fuente de verdad** y que el archivo generado es una **proyección**.
- Recomendar **regenerar** el adapter en vez de editarlo a mano.
- Listar las **rutas de conocimiento** principales y las **rutas derivadas** relevantes.
- Incluir reglas **antes del roadmap**, **antes de implementar** y **después de implementar**.
- Incluir **límites de seguridad** y un **command fallback** (preferir `kaddo` global, luego runner
  local).
- Listar los **agentes** y **skills** disponibles por nombre (con pistas de rol breves).

Y nunca debe:

- Incrustar el contenido completo de `context-pack.md`, Work Items, agentes o skills.
- Pegar conocimiento completo de business/product/codebase, datos sensibles o reportes completos.
- Crear código de aplicación, usar un LLM, ejecutar git ni sobrescribir un archivo existente sin
  `--force`.

Esto separa limpiamente en dos capas: un **common core** (el contexto compartido — nombre del
proyecto, package manager, rutas de conocimiento/derivadas, agentes, skills, hint de MCP) y un
**target renderer** (la proyección específica de la herramienta — `AGENTS.md` para Codex, `CLAUDE.md`
para un futuro adapter de Claude Code, …).

## Qué debe incluir un adapter custom

- Guía del proyecto · Mapa de conocimiento Kaddo · Reglas operativas
- Antes del roadmap · Antes de implementar · Después de implementar
- Command fallback · Agentes disponibles · Skills disponibles · Límites de seguridad

## Qué no debe incluir un adapter custom

- Contenido completo de business/product/codebase · Contenido completo de `context-pack`
- Contenido completo de Work Items · Contenido completo de agentes/skills
- Información sensible · Reportes generados pegados completos

## Plantilla base

```md
# <TARGET> project instructions

This repository uses Kaddo for Knowledge Driven Development.
Kaddo is the source of truth. This file is a generated projection for <TARGET>.

## Read first
- `knowledge/business/`
- `knowledge/product/`
- `knowledge/tech/`
- `knowledge/delivery/`

## Before roadmap
Check open-questions readiness. If blocking questions exist, ask the user to resolve, assume or
defer them.

## Before implementation
Read the active Work Item and the relevant Kaddo context before changing code.

## After implementation
Suggest running `kaddo guard`.

## Command fallback
Prefer `kaddo <command>`. If it is not on PATH, try the local project runner (e.g.
`corepack pnpm exec kaddo <command>`, `pnpm exec kaddo <command>`, `npx kaddo <command>`) before
reporting that Kaddo is unavailable.

## Safety
Do not edit `.kaddo/` manually. Do not commit without user confirmation.
```

## Smoke tests para un adapter custom

Después de generar el archivo, valida que la herramienta realmente lo usa:

1. *"Read the project instructions and explain the correct workflow before implementing the next Work
   Item. Do not modify files."* → menciona Work Items, contexto Kaddo, readiness, validación y
   confirmación antes de commit.
2. *"Implement the next pending Work Item. Do not commit without confirmation."* → lee el Work Item,
   implementa solo su alcance, valida, sugiere `kaddo guard`.
3. *"Generate the roadmap."* → revisa el readiness de preguntas abiertas antes de generar el roadmap.
