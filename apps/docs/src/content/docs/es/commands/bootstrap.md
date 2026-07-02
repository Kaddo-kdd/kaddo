---
title: kaddo bootstrap
description: Crea el baseline estructural de conocimiento para cualquier proyecto — new, pre-ai o legacy — según project.state.
---

```bash
kaddo bootstrap
```

`kaddo bootstrap` crea el **baseline estructural de conocimiento** que Kaddo espera. No es
"bootstrap de proyecto nuevo" — es **bootstrap del baseline de conocimiento** y aplica a cualquier
tipo de proyecto. Lo que cambia según `project.state` es el **contenido y la orientación** de las
plantillas, no si bootstrap aplica:

| Estado | Orientación |
|---|---|
| `new` | intención — visión de producto, capacidades planeadas, dirección técnica inicial |
| `pre-ai` | descubrimiento — estado actual, capacidades observadas, supuestos, preguntas abiertas |
| `legacy` | riesgo — restricciones, criticidad, dependencias, deuda técnica, modernización |

`bootstrap` es determinista: nunca usa un LLM, nunca genera código, nunca decide la arquitectura,
nunca instala agents/skills, y nunca ejecuta scan/context/git. Escribe plantillas iniciales (con
placeholders, supuestos y preguntas `[open]`) que luego refinás con agentes.

## Qué crea

El baseline común (archivos + directorios), con contenido según el estado:

```txt
knowledge/business/business.md
knowledge/product/product.md
knowledge/product/capabilities.md
knowledge/tech/codebase.md
knowledge/tech/current-state.md
knowledge/tech/decisions/
knowledge/delivery/roadmap.md
knowledge/delivery/work-items/
```

Cada archivo generado lleva `project_state:` en su front matter. Las plantillas `pre-ai` y `legacy`
agregan secciones de descubrimiento/riesgo (p. ej. *Observed technical signals*, *Risks of
interpretation*, *Critical dependencies*, *Modernization notes*).

### Descubrimiento de capacidades existentes (pre-ai / legacy)

Para proyectos existentes, `knowledge/product/capabilities.md` se genera como un **inventario de
capacidades con evidencia**, no una lista de deseos. El `capability-agent` lo completa según el
estado:

- **new** → *Planned Capability Definition* (capacidades `[planned]`).
- **pre-ai** → *Existing Capability Discovery* — un mapa `## Capability Domains` donde las capacidades
  se agrupan por **dominio funcional** (`### Domain: <nombre>` con Purpose + Evidence summary), y cada
  `#### Capability:` lleva `Status` (`implemented`/`partial`/`inferred`/`risky`/`deprecated`/`unknown`)
  con **evidencia** (rutas, endpoints, tablas, funciones), más `## Capability Gaps` y
  `## Roadmap Candidate Signals` (cada uno nombrando su `Domain` + `Related capability`).
- **legacy** → *Legacy Capability Discovery* — el mismo mapa de dominios más `Criticality`,
  `Change risk`, `Operational dependency` y `Modernization notes` por dominio/capacidad.

Los dominios se agrupan por responsabilidad funcional (Loyalty, Billing & Subscriptions, …) —
**nunca** por carpeta técnica (`src/components`, `src/app/api`).

Luego el `roadmap-agent` trata `capabilities.md` como su **fuente principal** de roadmap candidates
(capacidades parciales, gaps, candidate signals, capacidades riesgosas) y no construye roadmap desde
un placeholder. El agente nunca inventa evidencia — sin evidencia es `inferred` o `unknown`.

## Comportamiento

- Requiere `kaddo init` primero.
- **Mensajes según el estado** — ya no aparece el warning "this project is not marked as new" en
  `pre-ai`/`legacy`.
- **Nunca sobrescribe** archivos existentes — se reportan como omitidos. Un `knowledge/knowledge.md`,
  `roadmap.md` o `work-items/` existente se conserva.
- **Idempotente** — volver a correrlo no escribe nada nuevo.
- **No** instala agents ni skills — eso sigue en `kaddo add agents` / `kaddo add skills`.

## Dónde encaja

```txt
kaddo init → kaddo bootstrap → kaddo add agents → kaddo add skills → …
```

[`kaddo explain`](explain/) reporta `bootstrap-incomplete` y recomienda `kaddo bootstrap` hasta que el
baseline exista; después avanza a `agents-missing` / `skills-missing`. `kaddo understand` también
recomienda `kaddo bootstrap` primero cuando el baseline está incompleto — los agentes no tienen
archivos destino que refinar hasta que exista.

## Siguientes pasos

```bash
kaddo add agents     # instala los prompt packs de agentes
kaddo add skills     # instala skills reutilizables
kaddo scan           # (pre-ai/legacy) captura señales determinísticas del código
kaddo understand     # handoff guiado
```

Kaddo prepara la estructura; tu LLM y tu equipo aportan el contenido. Kaddo nunca inventa hechos de
negocio ni escribe código.
