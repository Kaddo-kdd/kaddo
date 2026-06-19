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
- Work Items contados por estado de lifecycle (`draft`, `ready`, `in-progress`, `blocked`,
  `completed`, `archived`)
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
- Roadmap candidates: 21
- Materialized work items: 5
- Remaining candidates: 16
- Ownership coverage: 1/2 work items

## Suggested Next Steps
1. Use capability-agent to create knowledge/product/capabilities.md.
2. Materialize 16 roadmap candidate(s) with `kaddo create --from roadmap`.
3. Run `kaddo owners suggest` for Work Items without code ownership.
```

`explain` también reporta la distribución **Work Items by Type** (Features / Bugfixes / Hotfixes /
Spikes / Chores), para que el trabajo técnico y de mantenimiento (`chore`) quede visible y
diferenciado de las features entregadas:

```text
## Work Items by Type
- Features: 12
- Chores: 4
- Spikes: 2
- Bugfixes: 1
```

`explain` también advierte **posibles Work Items duplicados** (no bloqueante) — items que comparten
el mismo candidato de origen del roadmap o el mismo título normalizado (lo que detecta duplicados
traducidos como `Initialize TypeScript CLI project` / `Inicializar proyecto TypeScript CLI`).
Revísalos antes de continuar.

Cuando hay un roadmap presente, `explain` distingue los **candidatos del roadmap** (entradas que
propuso el roadmap-agent) de los **Work Items materializados** (creados bajo
`knowledge/delivery/work-items/`). El conteo de *candidatos restantes* es la brecha entre ambos, y
`explain` sugiere materializarlos con `kaddo create --from roadmap`. Los candidatos se leen desde
cualquier [formato de roadmap soportado](/es/commands/create/#formatos-de-roadmap-soportados)
(tabla, viñetas, checklist, iniciativas mixtas o el formato estricto del Kaddo Roadmap Agent).

`explain` tambien agrupa Work Items virtualmente por el front matter `initiative`. Fase e
iniciativa siguen siendo metadata para planificacion y trazabilidad funcional; las carpetas
representan solamente el estado del lifecycle.

## Resumen del grafo de conocimiento

Si corriste [`kaddo graph export`](/es/knowledge-graph-export/), `explain` agrega un bloque
`## Knowledge Graph` con el conteo de nodos/relaciones y la última exportación (también en el JSON
de agente bajo `graph`). `explain` reporta el grafo — nunca lo genera.

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
`installed_modules`, `mapped_modules` y `enabled_plugins`.

## Módulos mapeados (multirepo)

Cuando el proyecto tiene módulos registrados con `kaddo modules map`, `explain` los
reporta — separados de los add-ons instalados con `kaddo add`:

```
## Mapped Modules

- storefront-web — frontend — ../frontend — owner: web-team
- orders-api — backend — ../backend — owner: api-team

## Module Artifact Coverage

- storefront-web: module-design, stack, security, standards
- orders-api: module-design, stack
```

La salida `--for agent` expone un arreglo estructurado `mapped_modules` (con la cobertura
de `artifacts` por módulo), distinto de `installed_modules`.

> `explain` lee los módulos mapeados desde `.kaddo/modules.yml` y los artefactos de
> `knowledge/tech/modules/<id>/` solamente. Nunca escanea los repos secundarios.

## Madurez del conocimiento (reconocimiento semántico)

`explain` reconoce el conocimiento por el **`type` del front-matter**, no por el nombre o la
ruta del archivo — así un `business.md` consolidado (`type: business`) se reconoce aunque no
sea una carpeta de archivos separados, y las `capabilities` se detectan donde sea que viva
un artefacto `type: capabilities`. Cada capa obtiene un estado de madurez:

| Estado | Significado |
|---|---|
| **Missing** | Aún no hay conocimiento para esta capa. |
| **Consolidated** | Existe un archivo consolidado de la capa (`business.md`, `product.md`, `codebase.md`). |
| **Structured** | Existen artefactos especializados (`capabilities`, `current-state`, ADRs). |
| **Partial** (Delivery) | Hay roadmap, pero aún no hay Work Items materializados. |
| **Traceable** (Delivery) | Roadmap + Work Items (y ADRs / ownership). |

Prioridad de descubrimiento: **type del front-matter → convenciones de Kaddo → ruta →
nombre** — nunca al revés. Los Work Items se reconocen por su tipo de work-item bajo
`knowledge/delivery/work-items/` (los ADRs y archivos sin tipo nunca son Work Items).
