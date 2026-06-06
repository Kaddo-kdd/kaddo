---
title: Proyecto legacy
description: Entiende un sistema frágil antes de cambiarlo y reduce el riesgo con Kaddo.
---

**Cuándo usar esto:** mantienes un sistema legacy donde el conocimiento vive en la cabeza de
las personas, los cambios son riesgosos y necesitas entender antes de tocar nada.

El principio guía para proyectos legacy es **entender antes de cambiar.**

## Flujo de trabajo

```bash
kaddo init          # estado: legacy, tamaño de equipo, estructura
kaddo scan          # inventario técnico determinístico → .kaddo/scan.json
kaddo context       # context pack para el LLM → .kaddo/context-pack.md
kaddo add agents    # instala los agent prompt packs
kaddo understand    # plan guiado de handoff CLI → LLM
# ── en tu LLM, usa PRIMERO el legacy-agent para mapear riesgos, incógnitas y
#    candidatos de modernización, luego architecture-agent, capability-agent y roadmap-agent ──
kaddo create --from roadmap   # Work Items pequeños y de bajo riesgo desde el roadmap
kaddo owners suggest          # declara el ownership (code:) en cada Work Item
kaddo guard                   # detecta posible deriva del conocimiento
kaddo explain                 # resume lo que Kaddo sabe actualmente
```

## CLI vs LLM

- **CLI (determinístico):** `scan` inventaría el stack y expone preguntas abiertas; `create`
  mantiene los Work Items pequeños; `owners suggest` y `guard` conectan el conocimiento al
  código frágil.
- **LLM (interpretación):** el legacy-agent identifica riesgos, incógnitas y candidatos de
  modernización; los demás agentes reconstruyen arquitectura y capacidades y proponen un
  roadmap cuidadoso.

Kaddo **no** entiende un sistema legacy automáticamente. Estructura señales y guía a tu LLM —
el humano mantiene el control de cada cambio.

## Eficiencia de contexto

En un proyecto legacy, explorar es costoso porque una suposición equivocada puede ser peligrosa.
Kaddo reduce ese costo haciendo explícitos riesgos, incógnitas, ownership y arquitectura actual
antes de implementar. Los agentes exploran menos código a ciegas y prestan más atención a las
partes que las personas marcaron como riesgosas.

## Artefactos esperados

```txt
knowledge/legacy/risks.md
knowledge/legacy/unknowns.md
knowledge/legacy/modernization-candidates.md
knowledge/tech/current-state.md
knowledge/product/capabilities.md
knowledge/delivery/roadmap.md
knowledge/delivery/work-items/*.md
```

## Siguientes pasos

Prefiere Work Items pequeños, captura las incógnitas a medida que aprendes y declara ownership
primero en las zonas más riesgosas para que `kaddo guard` marque los cambios que puedan
necesitar revisión de conocimiento. Mira el [Flujo completo](/es/use-cases/full-workflow/).

> ¿No sabes qué ejecutar en algún punto? `kaddo understand` responde *"¿Qué debería hacer ahora?"*
> a partir del estado real del proyecto.

Míralo en acción: el repo de demo [**Old Orders**](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/legacy-project),
o explora todos los [Ejemplos](/es/examples/).
