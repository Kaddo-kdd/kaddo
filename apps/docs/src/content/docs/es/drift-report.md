---
title: Reporte de drift
description: Persiste un historial determinista de ejecuciones de guard y reporta si el código y el conocimiento se están separando o se mantienen en sincronía con el tiempo.
---

`kaddo guard` detecta posible drift entre código y conocimiento en el momento. Con **`--record`**,
cada ejecución se persiste para que Kaddo pueda responder con el tiempo: cuántas alertas de drift
aparecieron, cuántas se resolvieron, qué áreas son hotspots y si el proyecto está mejorando.

```bash
kaddo guard --record           # corre guard Y lo registra en .kaddo/history/
kaddo drift                    # reporte de tendencias en Markdown (no escribe nada)
kaddo report drift             # alias
kaddo drift --json
kaddo drift --output .kaddo/reports/drift-report.md
```

> Determinista, local y de solo lectura por diseño: sin LLM, sin git, sin bloquear commits, sin
> resolución automática de drift, sin atribución por persona.

## Registrar historial de guard

Por defecto `kaddo guard` no escribe nada. `kaddo guard --record`:

1. Corre Guard normalmente.
2. Agrega una línea JSON a `.kaddo/history/guard-runs.jsonl`.
3. Actualiza `.kaddo/history/guard-summary.json`.
4. Imprime una nota breve "Guard run recorded".

Cada línea registra `run_id`, `generated_at`, `project`, `touched_files`, `matched_artifacts`,
`updated_artifacts`, `warnings` y un `summary` — **nunca autores de git ni datos personales**. Nunca
modifica `src/`, `knowledge/` ni Work Items, no resuelve warnings automáticamente y no ejecuta git.

## Qué significa un drift warning

Un warning es un *posible drift de conocimiento*: una ruta de código tocada matcheó uno o más
artefactos (por sus globs `code:`) que **no** se actualizaron en el mismo cambio. Es un FYI, nunca
un bloqueo.

## Cómo se detecta la resolución

Solo con señales deterministas — sin comparar contenido, sin LLM. El warning de una ruta se marca
**resolved** cuando una ejecución posterior registrada:

1. toca el mismo `code_path`,
2. actualiza uno de los artefactos relacionados, y
3. ya no genera warning para esa ruta.

Si no, queda **open**.

## El reporte

`kaddo drift` lee el historial y reporta: ejecuciones registradas, warnings detectados / abiertos /
resueltos, **resolution rate**, **hotspots** por ruta, threads de warnings abiertos/resueltos, y una
**tendencia** (`improving` / `stable` / `worsening` / `unknown`). Sin historial imprime un mensaje
claro de "no hay historial aún". No escribe nada salvo con `--output` (los reportes viven en
`.kaddo/reports/`).

## Alimenta impact y savings

- [`kaddo impact`](/es/impact-report/) — la sección **Guard Activity** pasa a *disponible* con conteo
  de runs y resolution rate (en vez de "not available").
- [`kaddo savings`](/es/savings-report/) — se activa **Drift Prevention**:
  `resolved drift warnings × rework_hours_avoided_per_resolved_drift` (de `.kaddo/savings.yml` o
  default), sumando a horas/valor estimados. Con resolución registrada + supuestos custom, la
  confianza puede llegar a **High**.

## Por MCP

De solo lectura: los recursos `kaddo://drift-report` y `kaddo://guard-history`, y la tool
`kaddo_generate_drift_report` (escribe solo bajo `.kaddo/reports/`). **Registrar historial no es una
tool MCP** — `guard --record` queda como acción explícita del CLI para que un agente nunca registre
ejecuciones sin intención humana.

## Fuera de alcance

Sin dashboard visual, integración CI/GitHub Actions, Jira/Linear, severidad con IA, drift por autor,
Slack/email, historial remoto ni telemetría externa.
