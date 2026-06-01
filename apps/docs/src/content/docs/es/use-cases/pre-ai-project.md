---
title: Proyecto pre-IA
description: Prepara un repo existente que no fue diseñado para el desarrollo asistido por IA.
---

**Cuándo usar esto:** tienes una base de código funcional que nunca se preparó para el
desarrollo asistido por IA. El conocimiento existe, pero está disperso y sin estructurar para
personas o agentes LLM.

## Flujo de trabajo

```bash
kaddo init          # estado: pre-ai, tamaño de equipo, estructura
kaddo scan          # inventario técnico determinístico → .kaddo/scan.json
kaddo context       # context pack para el LLM → .kaddo/context-pack.md
kaddo add agents    # instala los agent prompt packs
kaddo understand    # plan guiado de handoff CLI → LLM
# ── en tu LLM, usa capability-agent, architecture-agent y roadmap-agent para redactar
#    capacidades, el baseline de arquitectura y un roadmap ──
kaddo create --from roadmap   # convierte un candidato del roadmap en un Work Item
kaddo owners suggest          # declara el ownership (code:) en el Work Item
kaddo guard                   # detecta posible deriva del conocimiento
kaddo explain                 # resume lo que Kaddo sabe actualmente
```

## CLI vs LLM

- **CLI (determinístico):** `scan` construye un inventario técnico; `context` lo empaqueta;
  `create`, `owners suggest`, `guard` y `explain` mantienen el conocimiento conectado al código.
- **LLM (interpretación):** el capability-agent extrae capacidades de negocio, el
  architecture-agent reconstruye la arquitectura actual y el roadmap-agent propone un roadmap
  priorizado — todo desde el context pack, no desde suposiciones.

`kaddo scan` detecta señales y hace preguntas de confirmación; nunca afirma entender tus
capacidades de negocio. Esa interpretación ocurre en el LLM.

## Artefactos esperados

```txt
.kaddo/scan.json
architecture/inventory.md
architecture/capabilities.md
architecture/current-state.md
architecture/roadmap.md
architecture/work-items/*.md
.kaddo/explain.md
```

## Siguientes pasos

Empieza por las capacidades de mayor valor, declara ownership en los artefactos que mapean a
código real y deja que `kaddo guard` te avise cuando los cambios se alejen del conocimiento
documentado. Mira el [Flujo completo](/es/use-cases/full-workflow/).

Míralo en acción: el repo de demo [**Loyalty Lite**](https://github.com/judlup/kaddo/tree/main/examples/pre-ai-project)
(incluye una demo de drift con Guard), o explora todos los [Ejemplos](/es/examples/).
