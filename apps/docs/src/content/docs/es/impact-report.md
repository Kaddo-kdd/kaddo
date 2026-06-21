---
title: Reporte de impacto
description: Un reporte determinista y basado en evidencia que hace tangible el impacto de Kaddo — salud del conocimiento, cobertura, trazabilidad, readiness y señales cualitativas.
---

`kaddo report impact` consolida el valor que Kaddo ya produce en un solo reporte legible — para
líderes técnicos, arquitectos, sponsors, equipos de producto y quien evalúe adoptar Kaddo. Responde:
¿qué tan completo está el conocimiento? ¿qué tan conectado está el roadmap con el código? ¿qué tan
listo está el proyecto para ser entendido por humanos e IA? ¿qué tan activo está Guard como
mecanismo de prevención de drift?

```bash
kaddo report impact                  # Markdown a stdout (no escribe nada)
kaddo impact                         # alias
kaddo report impact --json           # JSON estructurado
kaddo report impact --output .kaddo/reports/impact-report.md
kaddo report impact --json --output .kaddo/reports/impact-report.json
```

> **Primero evidencia, estimación después.** Este reporte muestra evidencia — **no** calcula dinero
> ni ROI. Convertir estas métricas en estimaciones de tiempo/esfuerzo/ahorro es un paso posterior
> (VS-062 — Estimated Savings Model).

## Qué mide

| Sección | Muestra |
|---|---|
| **Knowledge Health** | madurez de las capas Business / Product / Tech / Delivery + inventory, context pack, agents, skills |
| **Knowledge Coverage** | Work Items con ownership / source / initiative / criterios de aceptación / Definition of Done / knowledge level |
| **Ownership Coverage** | % de cobertura, paths de código con dueño, globs amplios, superposiciones |
| **Traceability** | candidatos de roadmap → materializados → completados; Work Items conectados a roadmap y código; nodos/edges/calidad/hints del grafo |
| **Context Readiness** | Low / Medium / High / Very High, con las razones detrás |
| **Work Item Readiness** | conteos por estado del ciclo de vida (draft / ready / in-progress / blocked / completed) |
| **Graph Quality** | scope, calidad, nodos, edges, hints, razón |
| **Guard Activity** | señales de drift recientes (por ahora `not available` — Guard aún no persiste historial) |
| **Impact Signals** | niveles cualitativos: reducción de ambigüedad, prevención de drift, onboarding, trazabilidad de delivery, readiness de contexto para IA, readiness de mantenimiento |
| **Suggested Actions** | próximos pasos concretos derivados de las métricas |

Es totalmente **determinista**: se arma a partir de los artefactos existentes, **sin LLM**. Lee
`explain`, los Work Items, el roadmap, el grafo de conocimiento y sus hints, las skills y los agentes.

## Qué **no** mide

Sin dinero, sin ROI, sin productividad individual, sin commits por persona, sin benchmarking contra
otros equipos, sin tendencias históricas, sin integración con Jira/Linear/GitHub, sin interpretación
con LLM, sin dashboard web. Nunca envía nada a ningún lado.

## Scores y señales

Un **Knowledge Impact Score** opcional (0–100) combina seis buckets — Knowledge Health (20),
Knowledge Coverage (20), Ownership (15), Traceability (20), Graph Quality (15), Context Readiness
(10) — con reglas simples y transparentes. Cuando aún no hay Work Items, el score muestra
`not available`.

Las **Impact Signals** son basadas en reglas, p. ej. *AI context readiness = High* cuando existe el
context pack, la calidad del grafo no es `empty`, hay skills instaladas y el delivery es trazable.

## Degradación elegante

El reporte nunca falla por archivos derivados faltantes. Si el grafo no se ha exportado, la sección
Graph Quality muestra *"Graph data not available"* y una Suggested Action apunta a
`kaddo graph export --scope all`. Si todos los Work Items de un proyecto están completados, el grafo
activo está vacío por diseño — el reporte lo dice y sugiere `--scope all`
(ver [Alcances del grafo](/es/knowledge-graph-export/#alcances-del-grafo)).

## Persistencia

Por defecto el comando no escribe nada — imprime a stdout. Solo escribe cuando pasas `--output`. Los
reportes viven en `.kaddo/reports/`.

## Por MCP

El [servidor MCP](/es/mcp-server/) expone el reporte de solo lectura vía el recurso
`kaddo://impact-report` (devuelve un reporte guardado o lo genera en memoria), y la derived tool
`kaddo_generate_impact_report` (`format` · `scope` · `output`) que escribe **solo** bajo
`.kaddo/reports/`.

## Relación con VS-062

Este reporte es la base de evidencia para **VS-062 — Estimated Savings Model**, donde estas métricas
se convertirán en estimaciones de tiempo, esfuerzo y ahorro. Hasta entonces, Kaddo muestra
evidencia, no dinero.
