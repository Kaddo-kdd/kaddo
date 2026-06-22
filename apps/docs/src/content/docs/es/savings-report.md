---
title: Reporte de ahorro
description: Traduce las métricas de impacto de Kaddo en estimaciones aproximadas de tiempo, esfuerzo y valor usando supuestos explícitos y configurables — basado en evidencia, no ROI exacto.
---

`kaddo savings` convierte las [métricas de impacto](/es/impact-report/) en estimaciones
**aproximadas** de tiempo/esfuerzo/valor, para que puedas comunicar el impacto de Kaddo en términos
que stakeholders no técnicos entienden.

```bash
kaddo savings                  # Markdown a stdout (no escribe nada) — scope: all
kaddo report savings           # alias
kaddo savings --json
kaddo savings --scope active
kaddo savings --output .kaddo/reports/savings-report.md
kaddo savings init             # crea un .kaddo/savings.yml editable
```

> **Estimación basada en evidencia, no ROI exacto.** Estas cifras son estimaciones, no ahorro
> contable. Calibra los supuestos con datos reales del equipo.

## Supuestos: `.kaddo/savings.yml`

Estimaciones = métricas + **supuestos explícitos**. Corre `kaddo savings init` para crear un
`.kaddo/savings.yml` editable (usa `--force` para sobrescribir):

```yaml
currency: USD
hourly_cost: 40
assumptions:
  context_preparation_minutes_saved_per_work_item: 30
  rework_hours_avoided_per_resolved_drift: 2
  onboarding_hours_saved_per_new_contributor: 4
  review_minutes_saved_per_work_item_with_ownership: 20
  clarification_minutes_saved_per_ready_work_item: 25
  architecture_discovery_hours_saved_when_graph_good: 3
team:
  expected_new_contributors_per_month: 1
  expected_work_items_per_month: 8
```

Sin el archivo, Kaddo usa defaults conservadores y lo indica.

## Qué estima

| Driver | Fórmula | Origen |
|---|---|---|
| **Context preparation** | Work Items completados × minutos ahorrados | evidencia de impacto |
| **Review effort** | Work Items con ownership × minutos ahorrados | evidencia de impacto |
| **Clarification reduction** | Work Items con criterios de aceptación × minutos ahorrados | evidencia de impacto |
| **Onboarding** | nuevos contribuidores × horas × multiplicador de Context Readiness (Low .25 → Very High 1.0) | evidencia de impacto |
| **Architecture discovery** | horas × multiplicador de calidad del grafo (empty 0 → good 1.0) | evidencia de impacto |
| **Drift prevention** | drift warnings resueltos × `rework_hours_avoided_per_resolved_drift` | [historial de guard](/es/drift-report/) |

Valor estimado = `horas estimadas ahorradas × hourly_cost`, mostrado como **Estimated value** (nunca
"ROI", "profit" ni "ahorro real"). Por defecto **`scope: all`** como `kaddo impact`; `--scope active`
mide solo el contexto activo.

### Historial de guard y drift prevention

Drift prevention refleja el [historial de guard registrado](/es/drift-report/)
(`kaddo guard --record`), con tres estados distintos:

| Estado | Evidencia | Drift prevention |
|---|---|---|
| Sin historial | `Guard history: not available` | *no disponible* |
| Historial, 0 warnings resueltos | `Guard history: available` · `Resolved drift warnings: 0` | disponible, **0 h** ("aún sin warnings resueltos") |
| Historial, warnings resueltos | `Resolved drift warnings: N` | `N × rework_hours_avoided_per_resolved_drift` |

> Un historial de guard disponible con cero warnings resueltos igual cuenta como evidencia
> disponible, pero el ahorro de drift prevention sigue en 0 hasta que se resuelva al menos un warning.

## Qué **no** estima

Sin ROI exacto, sin productividad individual, sin atribución por persona, sin benchmarking entre
equipos, sin tendencias en el tiempo, sin integración con Jira/Linear/GitHub, sin LLM, sin
dashboard. Nunca modifica código ni conocimiento, y no escribe nada salvo con `--output`.

## Confianza

Cada reporte incluye un nivel de confianza: **Low** (impact score &lt; 60 o grafo vacío), **Medium**
(buena evidencia pero supuestos default y/o sin historial de drift resuelto), **High** (evidencia
fuerte + supuestos calibrados en `.kaddo/savings.yml` + warnings de drift resueltos registrados).
Llegar a **High** requiere evidencia real de resolución de drift vía `kaddo guard --record`.

## Por MCP

El [servidor MCP](/es/mcp-server/) lo expone de solo lectura: `kaddo://savings-report` (guardado o
en memoria) y la tool `kaddo_generate_savings_report` (`format` · `scope` · `output`) que escribe
**solo** bajo `.kaddo/reports/`.

## Usarlo con stakeholders

Combínalo con el [Reporte de impacto](/es/impact-report/): impact muestra *qué es verdad* sobre el
conocimiento; savings lo traduce en tiempo y valor *direccional*. Preséntalo siempre como una
estimación a calibrar — esa honestidad es el punto.
