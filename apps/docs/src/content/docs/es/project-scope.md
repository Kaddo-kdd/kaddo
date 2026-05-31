---
title: Alcance del proyecto
description: Qué hace Kaddo, qué no hace y en qué capas opera.
---

Kaddo es un CLI y toolkit de prompts de agentes open source para construir una capa de
conocimiento viva cerca del código. Esta página explicita su alcance actual.

## Qué hace Kaddo

- Inicializa una estructura de conocimiento del proyecto (`kaddo init`).
- Detecta señales determinísticas del repo (`kaddo scan`).
- Crea context packs para el LLM (`kaddo context`).
- Instala agent prompt packs (`kaddo add agents`).
- Guía el handoff CLI → LLM (`kaddo understand`).
- Crea Work Items desde un roadmap (`kaddo create --from roadmap`).
- Ayuda a declarar el ownership del código (`kaddo owners suggest`).
- Detecta posible deriva del conocimiento (`kaddo guard`).
- Explica el estado del proyecto (`kaddo explain`).

## Qué no hace Kaddo

- **No** llama a un LLM por defecto.
- **No** requiere una API key.
- **No** genera código.
- **No** reemplaza la revisión humana.
- **No** infiere la verdad del negocio automáticamente.
- **No** reemplaza a Jira, Linear ni GitHub Issues.
- **No** entiende sistemas legacy por arte de magia.

## Las dos capas

| Capa | Responsabilidad |
|---|---|
| **CLI (determinístico)** | escanear señales, empaquetar contexto, instalar prompts de agentes, guiar el handoff, crear Work Items, declarar ownership, detectar deriva, explicar el estado |
| **LLM (interpretación)** | extraer capacidades, reconstruir arquitectura, proponer un roadmap, identificar riesgos, redactar artefactos estructurados |

El CLI prepara y guarda el contexto; tu LLM lo interpreta usando los agentes de Kaddo.

## Estados de proyecto soportados

- **new** — empieza con una estructura mínima de conocimiento desde el día uno.
- **pre-IA** — prepara un repo existente para personas y agentes LLM.
- **legacy** — entiende y reduce el riesgo antes de cambiar sistemas frágiles.

Mira las guías por estado: [Proyecto nuevo](/es/use-cases/new-project/),
[Proyecto pre-IA](/es/use-cases/pre-ai-project/), [Proyecto legacy](/es/use-cases/legacy-project/).

## Limitaciones actuales

- Los pasos de interpretación (capacidades, arquitectura, roadmap, análisis legacy) ocurren en
  tu chat LLM usando los agentes de Kaddo — no los produce el CLI.
- La detección de deriva se basa en globs (`code:` vs `git diff`); no hace análisis semántico
  del código.
- La asistencia de ownership actualmente apunta a los Work Items.
