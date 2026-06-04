---
title: Proyecto nuevo
description: Usa Kaddo para empezar un proyecto nuevo con conocimiento estructurado desde el día uno.
---

**Cuándo usar esto:** estás empezando un proyecto desde cero y quieres evitar decisiones
dispersas desde el día uno — una capa de conocimiento ligera que crece con el código.

## Flujo de trabajo

```bash
kaddo init          # estado: new, tamaño de equipo, estructura
kaddo bootstrap     # base de conocimiento inicial: Business → Product → Tech → Delivery
kaddo context       # context pack para el LLM → .kaddo/context-pack.md
kaddo add agents    # instala los agent prompt packs
kaddo understand    # plan guiado de handoff CLI → LLM
# ── en tu LLM, usa business-agent + bootstrap-agent para refinar la base de conocimiento,
#    luego roadmap-agent y architecture-agent para redactar el roadmap y la arquitectura ──
kaddo create --from roadmap   # convierte un candidato del roadmap en un Work Item
kaddo owners suggest          # declara el ownership (code:) en el Work Item
kaddo guard                   # detecta posible deriva del conocimiento
kaddo explain                 # resume lo que Kaddo sabe actualmente
```

En un repo recién creado puedes omitir `kaddo scan` (todavía hay poco código que detectar) y
empezar desde el roadmap. Ejecuta `scan` más tarde cuando el código crezca.

## CLI vs LLM

- **CLI (determinístico):** `init`, `context`, `add agents`, `understand`, `create`,
  `owners suggest`, `guard`, `explain`.
- **LLM (interpretación):** usa el roadmap-agent y el architecture-agent en tu chat para
  formar el primer roadmap y la arquitectura prevista a partir del context pack.

Kaddo nunca llama a un LLM — prepara el contexto; tu LLM hace el pensamiento.

## Artefactos esperados

```txt
.kaddo/config.yml
.kaddo/context-pack.md
.kaddo/understand.md
knowledge/delivery/roadmap.md
knowledge/tech/current-state.md
knowledge/delivery/work-items/*.md
.kaddo/explain.md
```

## Siguientes pasos

Sigue creando Work Items desde el roadmap, declara ownership a medida que llega el código y
ejecuta `kaddo guard` antes de los commits para que el conocimiento siga conectado al código.
Mira el [Flujo completo](/es/use-cases/full-workflow/).

Míralo en acción: el repo de demo [**Task Pilot**](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/new-project),
o explora todos los [Ejemplos](/es/examples/).
