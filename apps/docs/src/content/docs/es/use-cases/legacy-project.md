---
title: Proyecto legacy
description: Entiende un sistema frágil antes de cambiarlo, lleva ese conocimiento a la implementación y verifica contra él.
---

**Cuándo usar esto:** mantienes un sistema legacy donde el conocimiento vive en la cabeza de
las personas, los cambios son riesgosos y necesitas entender antes de tocar nada.

El principio guía para proyectos legacy es **entender antes de cambiar** — y luego
**llevar ese entendimiento a través de cada cambio.**

## Flujo de trabajo

### Fase 1 — Entender

```bash
kaddo init          # estado: legacy, tamaño de equipo, estructura
kaddo scan          # inventario técnico determinístico → .kaddo/scan.json
kaddo context       # context pack para el LLM → .kaddo/context-pack.md
kaddo add agents    # instala los agent prompt packs
kaddo understand    # plan guiado de handoff CLI → LLM
```

En tu LLM, usa **legacy-agent** PRIMERO — lee señales del scan, System Graph y conocimiento
existente para producir riesgos estructurados (RISK-xxx), incógnitas (UNK-xxx) y candidatos
de modernización (MOD-xxx). Luego usa **architecture-agent**, **capability-agent** y
**roadmap-agent** (que consulta explícitamente riesgos e incógnitas legacy).

### Fase 2 — Planificar

```bash
kaddo create --from roadmap   # Work Items pequeños y de bajo riesgo desde el roadmap
kaddo owners suggest          # declara el ownership (code:) en cada Work Item
```

Refina cada Work Item con el **work-item-agent** — referencia riesgos e incógnitas legacy
relevantes por identificador (ej. `legacy_risks: [RISK-001, RISK-003]`) sin copiar todo el
análisis legacy. Luego marca como ready:

```bash
kaddo ready WI-001            # draft/ → ready/
```

### Fase 3 — Implementar con contexto legacy

El **Implementation Handoff** incluye automáticamente contexto legacy relevante (riesgos,
incógnitas, candidatos de modernización) para las áreas que se van a modificar. Usa la skill
**legacy-risk-assessment** para evaluar qué riesgos necesitan atención antes o después de
implementar.

```bash
# Implementación → Evidencia → Verificación
kaddo verify WI-001           # recolectar evidencia, verificar ACs, capturar aprendizajes
kaddo guard                   # legacy-aware: marca cambios en áreas de riesgo
```

Guard detecta cuando los archivos tocados cruzan con riesgos legacy conocidos y los muestra
como contexto adicional — nunca bloquea un cambio, pero asegura que el equipo está al tanto.

### Fase 4 — Aprender

```bash
kaddo learn WI-001            # capturar aprendizajes, actualizar conocimiento legacy
```

Los aprendizajes de la implementación pueden actualizar `knowledge/legacy/risks.md` — un
riesgo confirmado, mitigado o reclasificado durante la implementación retroalimenta la base
de conocimiento para futuros Work Items.

## CLI vs LLM

- **CLI (determinístico):** `scan` inventaría el stack; `create` materializa Work Items;
  `ready` controla la transición de lifecycle; `verify` recolecta evidencia y verifica ACs;
  `guard` detecta deriva e intersecciones de riesgos legacy; `owners suggest` y `guard`
  conectan el conocimiento al código frágil.
- **LLM (interpretación):** el legacy-agent produce riesgos e incógnitas estructurados; el
  work-item-agent referencia hallazgos legacy relevantes durante el refinamiento; el
  implementation-agent recibe contexto legacy vía handoff; la skill legacy-risk-assessment
  evalúa intersecciones de riesgo.

Kaddo **no** entiende un sistema legacy automáticamente. Estructura señales y guía a tu LLM —
el humano mantiene el control de cada cambio.

## Eficiencia de contexto

En un proyecto legacy, explorar es costoso porque una suposición equivocada puede ser peligrosa.
Kaddo reduce ese costo haciendo explícitos riesgos, incógnitas, ownership y arquitectura actual
antes de implementar. Los hallazgos legacy viajan a través del lifecycle con identificadores
estables (RISK-xxx, UNK-xxx, MOD-xxx) — los agentes los referencian sin duplicar contenido,
manteniendo las ventanas de contexto eficientes.

## Artefactos esperados

```txt
knowledge/legacy/risks.md                     # RISK-xxx riesgos estructurados
knowledge/legacy/unknowns.md                  # UNK-xxx incógnitas conocidas
knowledge/legacy/modernization-candidates.md  # MOD-xxx candidatos
knowledge/tech/current-state.md
knowledge/product/capabilities.md
knowledge/delivery/roadmap.md
knowledge/delivery/work-items/draft/*.md      # → ready/ → in-progress/ → completed/
```

## Recursos MCP

El conocimiento legacy también está disponible vía MCP para agentes conectados por el protocolo:

- `kaddo://legacy-risks` — riesgos conocidos
- `kaddo://legacy-unknowns` — incógnitas conocidas
- `kaddo://modernization-candidates` — candidatos de modernización

## Siguientes pasos

Prefiere Work Items pequeños, captura las incógnitas a medida que aprendes y declara ownership
primero en las zonas más riesgosas para que `kaddo guard` marque los cambios que puedan
necesitar revisión de conocimiento. Mira el [Flujo completo](/es/use-cases/full-workflow/).

> ¿No sabes qué ejecutar en algún punto? `kaddo understand` responde *"¿Qué debería hacer ahora?"*
> a partir del estado real del proyecto.

Míralo en acción: el repo de demo [**Old Orders**](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/legacy-project),
o explora todos los [Ejemplos](/es/examples/).
