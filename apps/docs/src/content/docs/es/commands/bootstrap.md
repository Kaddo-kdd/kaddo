---
title: kaddo bootstrap
description: Construye la base de conocimiento inicial de un proyecto nuevo en las capas Negocio → Arquitectura → Codebase → Desarrollo.
---

```bash
kaddo bootstrap
```

Para **proyectos nuevos**, `kaddo bootstrap` convierte una idea inicial en conocimiento
estructurado **antes** de escribir código. Genera la base **mínima** de las cuatro capas
macro del proyecto desde el template registry:

```txt
Business → Product → Tech → Delivery
```

`bootstrap` es determinístico: nunca llama a un LLM, nunca genera código fuente y nunca
decide la arquitectura. Crea **artefactos iniciales** (con `TBD`, supuestos y preguntas
abiertas) que luego refinas con los agentes de bootstrap en tu propio LLM. Genera solo la
base mínima — **Delivery** (roadmap, work items) y las **decisiones** emergen después, vía
agentes y trabajo real.

## Las capas macro

```mermaid
flowchart TD
    A[kaddo init] --> B[kaddo bootstrap]
    B --> C[Business]
    C --> C1[problem · users · value-proposition · constraints · business-rules]
    B --> D[Product]
    D --> D1[product-brief · capabilities]
    B --> E[Tech]
    E --> E1[codebase]
    E1 --> G[kaddo context → agentes → roadmap → create --from roadmap]
    G -.después.-> H[Delivery: roadmap · work-items/]
```

## Qué genera

| Capa | Artefactos |
|---|---|
| **Business** | `knowledge/business/{problem, users, value-proposition, constraints, business-rules}.md` |
| **Product** | `knowledge/product/{product-brief, capabilities}.md` |
| **Tech** | `knowledge/tech/codebase.md` |

**No** genera `knowledge/delivery/roadmap.md`, `knowledge/delivery/work-items/` ni
`knowledge/tech/decisions/` — esos llegan después, vía agentes y evolución del proyecto.

## Comportamiento

- Requiere `kaddo init` primero (si no: `Run 'kaddo init' first.`).
- Orientado a `state: new`. En `pre-ai`/`legacy` avisa y pide confirmación.
- **Nunca sobrescribe** artefactos existentes — se reportan como skipped.
- Todos los artefactos vienen del template registry central.

## Siguientes pasos

```bash
kaddo context        # prepara el context pack para el LLM
kaddo add agents     # instala business-agent, bootstrap-agent, codebase-agent
kaddo understand     # handoff guiado
# refina los artefactos en tu LLM, luego:
kaddo create --from roadmap
```

Los tres agentes de bootstrap — `business-agent`, `bootstrap-agent` y
`codebase-agent` — convierten estos artefactos iniciales en definición real.
Kaddo prepara la estructura; tu LLM y tu equipo aportan el contenido. Kaddo nunca inventa
hechos de negocio ni escribe código.
