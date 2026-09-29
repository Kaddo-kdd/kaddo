---
title: Plantillas legacy
description: Riesgos, incógnitas y candidatos de modernización — estructurados para trazabilidad a lo largo del ciclo de vida.
---

Para trabajar con seguridad sobre sistemas legacy. Refina con el `legacy-agent`. Cada hallazgo
usa un identificador estable (RISK-xxx, UNK-xxx, MOD-xxx) que los agentes downstream —
`roadmap-agent`, `work-item-agent`, `implementation-agent` — pueden referenciar a lo largo del
ciclo de vida de Kaddo.

| Plantilla | Propósito | Ruta | Agente |
|---|---|---|---|
| Legacy Risks | Áreas de alto riesgo antes de tocar código | `knowledge/legacy/risks.md` | `legacy-agent` |
| Legacy Unknowns | Lo que aún no se entiende | `knowledge/legacy/unknowns.md` | `legacy-agent` |
| Modernization Candidates | Candidatos de modernización | `knowledge/legacy/modernization-candidates.md` | `legacy-agent` |

## Legacy Risks

Entradas `RISK-001`: área, por qué es riesgoso, radio de impacto (local / módulo /
cross-cutting / system-wide), confianza (alta / media / baja), señales del scan, entidades
del grafo, mitigación.

Estos riesgos son:
- **Referenciados por `roadmap-agent`** al priorizar iniciativas en proyectos legacy.
- **Referenciados por `work-item-agent`** durante el refinamiento (`legacy_risks:` en front matter).
- **Incluidos en el Implementation Handoff** para las áreas que se van a modificar.
- **Detectados por `kaddo guard`** cuando los archivos tocados cruzan con áreas de riesgo.
- **Disponibles vía MCP** como `kaddo://legacy-risks`.

## Legacy Unknowns

Entradas `UNK-001`: pregunta, por qué importa, cómo averiguarlo, riesgos relacionados,
estado de bloqueo. Las incógnitas nunca se convierten en silencio en supuestos.

Disponibles vía MCP como `kaddo://legacy-unknowns`.

## Modernization Candidates

Entradas `MOD-001`: estado actual, estado objetivo, valor, riesgo, knowledge level sugerido,
riesgos e incógnitas relacionados, entidades afectadas del sistema — candidatos para revisión
humana, no compromisos.

Disponibles vía MCP como `kaddo://modernization-candidates`.

## Ciclo de vida legacy-aware

La skill `legacy-risk-assessment` evalúa un cambio planificado contra estos hallazgos.
Ver [Proyecto legacy](/es/use-cases/legacy-project/) para el flujo de trabajo completo.
