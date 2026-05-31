---
title: kaddo explain
description: Explica el proyecto actual — qué sabe Kaddo, qué falta y qué hacer a continuación.
---

```bash
kaddo explain                      # explicación del proyecto (legible)
kaddo explain --for human          # igual, explícito
kaddo explain --for agent          # JSON estructurado compacto
kaddo explain --scope payments     # enfocado: limita a un dominio o palabra clave
kaddo explain --type adr           # enfocado: limita a un tipo de artefacto
kaddo explain --since 2026-01-01   # enfocado: limita por fecha de creación
```

## Explicación del proyecto (sin filtros)

Sin filtros, `kaddo explain` resume el **estado actual del proyecto** a partir de
los artefactos que Kaddo ya tiene:

- Metadatos del proyecto (nombre, estado, equipo, estructura)
- Stack detectado (desde `.kaddo/scan.json`)
- Estado del conocimiento (inventory, context pack, capabilities, baseline de
  arquitectura, roadmap, agentes)
- Work items y su estado
- Cobertura de ownership (cuántos work items declaran globs `code:`)
- Conocimiento faltante y **siguientes pasos sugeridos**

También escribe `.kaddo/explain.md` y `.kaddo/explain.json` para reutilizar la
explicación en onboarding, handoff o por agentes. No se llama a ningún LLM — la
salida es totalmente determinista.

```txt
# Project Explanation

## Project
- Name: dotear-web
- State: pre-ai
- Team: indie
- Structure: monorepo

## Detected Stack
- Language: TypeScript
- Framework: Next.js

## Knowledge Status
- Capabilities: missing
- Roadmap: available
- Work items: 2
- Ownership coverage: 1/2 work items

## Suggested Next Steps
1. Use capability-agent to create architecture/capabilities.md.
2. Run `kaddo owners suggest` for Work Items without code ownership.
```

## `context` vs `explain`

- `kaddo context` **prepara la entrada para un agente LLM** (interpretación externa).
- `kaddo explain` **resume lo que Kaddo sabe actualmente** — para personas,
  mantenedores, onboarding, revisión del proyecto o agentes que necesitan el
  estado rápido.

## Modo enfocado

Con `--scope`, `--type` o `--since`, `explain` mantiene su comportamiento
enfocado: explica un subconjunto de artefactos (un dominio, un tipo o cambios
recientes) en vez de todo el proyecto. La salida `--for agent` del modo enfocado
es JSON estructurado con artefactos, dominios, `domain_owners`,
`installed_modules` y `enabled_plugins`.
