---
type: feature
id: WI-062
title: >-
  Hacer accionables los reportes Impact, Drift y Savings mediante evidencia
  priorizada y recomendaciones contextualizadas
status: completed
work_type: feature
created_at: '2026-10-12'
source:
  type: external
  imported_at: '2026-10-12'
  source_format: markdown-frontmatter
  source_hash: c73e3ca08760389329f11acedfdc03e3e9e7a18cc4badfd563caf7938f63954d
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains:
  - reporting
affected_modules:
  - packages/cli/src/core/reporting-evidence.ts
  - packages/cli/src/core/impact-report.ts
  - packages/cli/src/core/drift-report.ts
  - packages/cli/src/core/savings.ts
  - packages/cli/src/core/graph-hints.ts
code:
  - packages/cli/src/core/reporting-evidence.ts
  - packages/cli/src/core/impact-report.ts
  - packages/cli/src/core/drift-report.ts
  - packages/cli/src/core/savings.ts
  - packages/cli/src/core/graph-hints.ts
  - packages/mcp/src/generate.ts
  - packages/mcp/src/resources.ts
summary: >-
  Kaddo dispone de Impact, Drift y Savings Reports, recientemente evolucionados
  mediante WI-060 y WI-061.
original_snapshot:
  title: >-
    Hacer accionables los reportes Impact, Drift y Savings mediante evidencia
    priorizada y recomendaciones contextualizadas
  description: >-
    Kaddo dispone de Impact, Drift y Savings Reports, recientemente
    evolucionados mediante WI-060 y WI-061.
  type: feature
  status: draft
ready_at: '2026-10-12'
completed_at: '2026-10-12'
---

# Hacer accionables los reportes Impact, Drift y Savings mediante evidencia priorizada y recomendaciones contextualizadas

## Intent

Kaddo dispone de Impact, Drift y Savings Reports, recientemente evolucionados mediante WI-060 y WI-061.

Estos ajustes mejoraron la integridad de los cálculos, la clasificación de evidencia, la aplicabilidad de las métricas y la separación entre estimaciones históricas y proyecciones.

Sin embargo, el dogfooding sobre Kaddo muestra una oportunidad adicional: los reportes ya describen el estado del proyecto, pero todavía no ayudan suficientemente a identificar qué debería atenderse primero.

El objetivo de este WI es mejorar la capacidad de los reportes para convertir evidencia existente en hallazgos concretos, priorizados y accionables.

No se busca aumentar artificialmente la cantidad de métricas ni introducir nuevos modelos de scoring.

---

## Context

Los últimos reportes generados sobre Kaddo muestran:

### Impact Report

- 52 Work Items completados.
- 22 Work Items con `validation_status: passed`.
- 31/52 Work Items con code ownership.
- Knowledge Health: Product = Weak.
- Graph Quality: partial.
- 7 Graph hints abiertos.
- 30 Work Items históricos sin Definition of Done detectada.
- 9 Work Items sin sección de validación detectada.
- Reporte Markdown de aproximadamente 442 líneas.

### Drift Report

- Guard History: no disponible.
- 23 Work Items con algún estado de validación registrado.
- 2 Deprecation Plans con validaciones determinísticas de targets sin findings.
- 7 Graph hints abiertos.
- Historical Drift Trend: Not Available.

### Savings Report

- Historical estimate: 57.58 h.
- Monthly projection: 4.8 h.
- Confidence: Low.
- Assumptions: defaults, sin calibración.

Los resultados son metodológicamente más coherentes, pero todavía presentan limitaciones de accionabilidad.

Por ejemplo:

```text
Impact:
7 Graph hints open

Drift:
7 topology hints open


No responden directamente:
Which hints?
Why do they matter?
What is affected?
What should be reviewed?


Otro ejemplo:
Impact:
22 verified Work Items
52 completed Work Items


La diferencia es relevante, pero todavía no tiene suficiente protagonismo en el resumen ejecutivo.

## Goal
Evolucionar los reportes para responder:
1. ¿Qué está bien respaldado por evidencia?
2. ¿Qué hallazgos concretos requieren atención?
3. ¿Cuáles son prioritarios y por qué?
4. ¿Qué información falta para evaluar algo?
5. ¿Qué acción específica puede realizarse a continuación?
Mantener la separación:
Evidence
   ↓
Deterministic Findings
   ↓
Applicability
   ↓
Priority
   ↓
Suggested Action
   ↓
Report


Los reportes no deben ejecutar automáticamente las acciones sugeridas.

1. Impact: Prioritize Verified Delivery
Dar mayor protagonismo al estado de verificación del delivery.
Actualmente:
Completed Work Items: 52
Verified Work Items: 22


El reporte debe distinguir:
Completed
Validation passed
Validation failed
Validation pending
Validation not recorded


según los estados realmente soportados por Core.
Mostrar un resumen comparable a:
Delivery Evidence

Completed Work Items: 52
Validation Passed: 22
Completion with passed validation: 42.3%
Validation not confirmed: 30


El ejemplo utiliza la información del dogfooding actual.
No interpretar automáticamente los 30 restantes como:
failed
untested
invalid


La ausencia de un estado persistido no demuestra que una prueba nunca haya ocurrido.
Cuando los estados soportados permitan distinguir otros casos, representarlos sin colapsarlos en una categoría engañosa.
Incluir la cobertura de verificación en el Executive Summary.
No utilizar esta proporción como una medida individual de productividad.

2. Impact: Separate Current Findings from Historical Completeness
Actualmente el reporte lista numerosos Work Items antiguos sin:
Definition of Done
Knowledge Level
Validation section


Estas ausencias no siempre constituyen problemas actuales.
Separar:
Current Actionable Findings


de:
Historical Documentation Completeness


Los hallazgos actuales deben incluir problemas que afecten conocimiento, referencias, trazabilidad o decisiones vigentes.
La completitud documental histórica puede mantenerse como información secundaria.
Ejemplo:
Current Actionable Findings

1. Product knowledge is Weak
2. Seven Graph hints require review
3. Two corrective WIs lack code ownership


Y después:
Historical Documentation

30 completed WIs without a detected DoD section
9 completed WIs without a detected validation section


No generar automáticamente recomendaciones para editar decenas de WIs históricos solo con el objetivo de aumentar una métrica documental.
Mantener el inventario detallado accesible cuando sea necesario.

3. Actionable Findings Contract
Reutilizar el modelo de evidencia compartida introducido en WI-060.
Extenderlo únicamente con la información necesaria para presentar hallazgos accionables.
Contrato conceptual:
finding:
  id: string
  category: knowledge | delivery | topology | consistency
  source: string
  affected_artifacts: []
  priority: high | medium | low | unknown
  evidence: string
  explanation: string
  suggested_action: string


El diseño exacto debe ajustarse a los contratos Core existentes.
Reglas:
- La prioridad debe ser determinística.
- High requiere una condición explícita que justifique atención prioritaria.
- No inferir impacto de negocio sin evidencia.
- Unknown no debe tratarse automáticamente como Low.
- Mantener referencias a artifacts originales.
- Evitar hallazgos duplicados que provienen de la misma causa.
- No generar un segundo sistema independiente de validaciones.
Prioridad y severidad no son necesariamente equivalentes.
Por ejemplo, un finding informativo puede necesitar revisión sin constituir un error bloqueante.

4. Impact: Knowledge Health Recommendations
Cuando una capa aplicable tenga estado:
Weak
Missing


el reporte debe contextualizar el hallazgo.
Ejemplo:
Product Knowledge
Status: Weak

Evidence:
Current knowledge maturity assessment.

Suggested action:
Review Product knowledge coverage and identify the
specific artifacts or relationships preventing a
stronger maturity assessment.


La recomendación debe derivarse de los findings disponibles.
Si Core no dispone de la explicación específica:
Reason: Not Available


No inventar la causa por la que Product fue clasificado como Weak.
No afirmar que la calidad del producto de software es débil: se está evaluando el conocimiento documentado.

5. Impact and Drift: Explain Graph Hints
Actualmente ambos reportes muestran:
Graph hints: 7


Incorporar un resumen de los hints reales generados por Core.
Cada entrada debe incluir, cuando exista:
Hint ID
Category
Affected artifact / node / relation
Explanation
Evidence reference
Suggested action


Ejemplo conceptual:
Graph Hint

Affected:
WI-XXX → Module Y

Finding:
Relationship requires review.

Suggested action:
Inspect the relevant relationship and its source evidence.


No crear nuevos hints exclusivamente para enriquecer la presentación.
Reutilizar la implementación existente de Graph Hints.
Si el Graph tiene siete hints, el reporte debe permitir identificar cuáles son, en lugar de mostrar únicamente el contador.
Evitar presentar todos como errores de alta severidad.

6. Drift: Current Consistency Findings
El Drift Report ya incluye:
Consistency Evidence

Guard
Lifecycle
Deprecations
Topology


Agregar una sección:
Current Consistency Findings


Esta sección debe mostrar findings derivados de verificaciones existentes.
Fuentes candidatas:
- Graph hints.
- Work Item reference validation.
- Project Resource reference validation.
- Deprecation Target validation.
- Lifecycle consistency checks.
Consumir únicamente validaciones realmente disponibles en Core.
No implementar en este WI nuevos motores de validación de Resources o Topology.
Ejemplo:
Current Consistency Findings

| Source | Finding | Affected | Action |
|--------|---------|----------|--------|
| Graph | ... | WI-XXX | Review relationship |
| Resource | ... | RES-XXX | Review reference |


Cuando no existan findings:
No findings detected by the executed consistency checks.


No presentar:
Project is drift-free.


porque la cobertura de estas validaciones es limitada.

7. Drift: Distinguish Structural and Operational Evidence
El reporte actual informa:
2 Deprecation Plans passed deterministic target consistency checks


Aclarar su significado:
Structural consistency: checked
Operational removal: not verified by this check


Una validación de DEP-TGT puede demostrar que sus estados declarados son consistentes.
No demuestra necesariamente:
database object physically removed
production feature disabled
external consumers disconnected


Si existen evidencias operativas adicionales, pueden mostrarse mediante los contratos correspondientes.
No realizar conexiones a infraestructura para complementar el reporte.

8. Drift: Guard History Guidance
Cuando no exista historial registrado:
Guard History: Unknown
Historical Trend: Not Available


mantener el comportamiento actual y hacer más clara la siguiente acción.
Ejemplo:
Start recording Guard runs during relevant delivery checkpoints.

Command:
kaddo guard --record


Explicar que:
1 recorded run
→ observation available

multiple comparable runs
→ historical trend potentially evaluable


No afirmar que una sola ejecución permite medir una tendencia.
No ejecutar automáticamente Guard ni modificar hooks o pipelines como parte de la generación del reporte.
La habilitación de ejecución recurrente podrá abordarse posteriormente como integración operativa independiente.

9. Savings: Actionable Calibration Guidance
El Savings Report ya distingue:
Historical Estimate
Monthly Projection
Confidence
Assumptions Source


Mantener el modelo actual.
Mejorar las recomendaciones cuando:
assumptions_source = default


o cuando los supuestos no estén calibrados.
En lugar de únicamente:
Run kaddo savings init.


explicar qué información necesita el usuario para mejorar la estimación.
Ejemplo:
Calibration Opportunities

Context preparation:
Compare preparation effort on comparable tasks.

Review effort:
Record a baseline for similar reviews.

Clarification:
Estimate effort spent resolving repeated scope questions.

Architecture discovery:
Compare discovery time for similar dependency analyses.


No solicitar ni almacenar datos personales.
No introducir automáticamente ahorros medidos.
La calibración debe seguir siendo explícita y basada en observaciones externas o referencias aportadas por el usuario.
No ampliar en este WI el modelo de cálculo monetario.

10. Report Readability
Impact Report actualmente genera aproximadamente 442 líneas.
Mejorar la jerarquía de presentación para que el lector encuentre rápidamente:
Executive Summary
↓
Key Findings
↓
Delivery Evidence
↓
Knowledge / Topology Status
↓
Recommended Actions
↓
Detailed Inventory


En Markdown:
- Preferir tablas para resúmenes estructurados.
- Agrupar hallazgos por causa y categoría.
- Evitar repetir la misma recomendación en muchos WIs.
- Mantener identificadores y rutas para trazabilidad.
- Conservar los detalles necesarios para investigación.
No ocultar información por una cuota arbitraria de líneas.
No eliminar contenido del JSON únicamente para reducir el Markdown.
Los detalles históricos pueden mantenerse al final del reporte o en una sección claramente diferenciada.

11. Cross-report Consistency
Impact y Drift deben mostrar los Graph hints sin producir dos interpretaciones contradictorias.
Ejemplo:
Impact:
7 Graph hints require review.

Drift:
7 current topology findings.


Ambos consumen la misma fuente.
Savings no debe transformar automáticamente esos siete hints en dinero ahorrado o retrabajo evitado.
Preservar:
Observed
Derived
Estimated
Projected
Unknown
Not Applicable


con la semántica establecida en WI-060.

## Out of Scope
Este WI no incluye:
- Crear nuevos scores.
- Cambiar las fórmulas de Savings.
- Medir tiempos automáticamente.
- Integrar time tracking.
- Agregar dashboards de reporting a Admin.
- Construir un nuevo motor de Graph.
- Crear nuevos validadores de infraestructura.
- Ejecutar Guard automáticamente.
- Cambiar el lifecycle de Work Items.
- Actualizar masivamente WIs históricos.
- Modificar Knowledge para mejorar artificialmente métricas.
- Crear un nuevo sistema de almacenamiento de findings.
- Utilizar LLM para inventar prioridades o interpretaciones.

## Acceptance Criteria
- [x] AC-01 — Verification: Impact muestra en el resumen ejecutivo los WIs completados y los que cuentan con validación aprobada, diferenciando ausencia de evidencia y fallo.
- [x] AC-02 — Prioritized Findings: Impact ofrece hallazgos relevantes con explicación, fuente, prioridad justificable y acción sugerida.
- [x] AC-03 — Historical Noise: las brechas de completitud documental de WIs históricos se presentan por separado y no dominan las recomendaciones principales.
- [x] AC-04 — Knowledge Health: un estado Weak/Missing produce orientación contextual sin atribuir causas no demostradas.
- [x] AC-05 — Graph Hints: Impact y Drift permiten identificar los hints concretos, sus referencias y las acciones de revisión correspondientes.
- [x] AC-06 — Drift Findings: Drift incorpora Current Consistency Findings reutilizando validaciones determinísticas existentes.
- [x] AC-07 — Evidence Boundaries: Drift diferencia consistencia estructural de evidencia operativa, especialmente para Controlled Deprecation.
- [x] AC-08 — No Guard History: Drift conserva la interpretación Unknown/Not Available y ofrece guidance concreto para iniciar el registro sin generar historial artificial.
- [x] AC-09 — Savings Calibration: Savings muestra oportunidades de calibración accionables cuando utiliza supuestos sin calibrar, sin cambiar sus fórmulas ni presentar estimaciones como mediciones.
- [x] AC-10 — Readability: el Markdown prioriza resultados y hallazgos, mantiene trazabilidad hacia artifacts y reduce la repetición de recomendaciones históricas.
- [x] AC-11 — Compatibility: CLI, MCP, Markdown y JSON conservan compatibilidad; los campos nuevos son aditivos o están explícitamente versionados.
- [x] AC-12 — Regression: los tests cubren resultados accionables, aplicabilidad, ausencia de historial, consistencia entre reportes y no duplicación de findings.
- [x] AC-13 — Documentation: la documentación EN/ES de los tres reportes refleja el nuevo enfoque accionable.

## How to test it
Scenario 1 — Kaddo Dogfooding
Datos de referencia:
Completed WIs: 52
Validation passed: 22
Graph hints: 7
Product knowledge: Weak
Guard History: unavailable


Expected:
Executive Summary
→ completed vs verified delivery

Key Findings
→ Product Weak
→ concrete Graph hints

Historical Completeness
→ grouped separately

Drift
→ findings and evidence limitations

Savings
→ calibration guidance


Scenario 2 — No Guard History
Expected:
Historical Trend: Not Available
Current Consistency Findings: available when derivable


No afirmar ausencia de drift.
Scenario 3 — No Graph Hints
Expected:
No findings detected by executed Graph checks


No generar recomendaciones artificiales.
Scenario 4 — Completed WI Without Persisted Verification
Expected:
Completed: yes
Validation passed: not confirmed


No clasificar automáticamente como failed.
Scenario 5 — Savings Defaults
Expected:
Confidence: Low, when supported by current evidence
Assumptions: Uncalibrated
Calibration guidance: available


Sin introducir nuevos cálculos de ahorro.

## Definition of Done
El WI está completo cuando:
- Impact distingue claramente completion y verification.
- Los hallazgos relevantes aparecen antes de los inventarios históricos.
- Los Graph hints pueden identificarse y revisarse.
- Drift muestra findings concretos de consistencia.
- Las validaciones estructurales no se presentan como verificación operativa.
- La ausencia de Guard History se interpreta correctamente.
- Savings orienta sobre cómo calibrar estimaciones.
- Las recomendaciones son específicas, trazables y no repetitivas.
- CLI y MCP mantienen resultados consistentes.
- Los tests cubren los escenarios principales.
- Las páginas de documentación EN/ES están actualizadas.
- El resultado se valida ejecutando los tres reportes sobre Kaddo.

## Implementation Handoff Guidance
Partir de las capacidades introducidas por WI-060 y WI-061.
Puntos principales:
packages/cli/src/core/reporting-evidence.ts
packages/cli/src/core/impact-report.ts
packages/cli/src/core/drift-report.ts
packages/cli/src/core/savings.ts
packages/cli/src/core/graph-hints.ts


Reutilizar validadores existentes.
No agregar un sistema paralelo de findings o evidence.
Arquitectura objetivo:
              CANONICAL KADDO ARTIFACTS
                        │
                        ▼
              Reporting Evidence Context
                        │
              Deterministic Findings
                        │
              Applicability + Priority
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
         IMPACT       DRIFT        SAVINGS
           │            │            │
           ▼            ▼            ▼
        Quality     Consistency   Calibration
        Delivery    Findings      Guidance
           │            │            │
           └────────────┴────────────┘
                        │
                        ▼
               Actionable Reports


Principio rector:
Kaddo no debería limitarse a indicar que existen brechas de conocimiento o inconsistencias. Debe ayudar a comprender cuáles requieren atención, con qué evidencia se detectaron y qué acción es razonable realizar a continuación.

## Implementation Evidence

- Se agregó el contrato aditivo compartido `ReportFinding`, reutilizando Graph Hints en lugar de
  crear otro validador de topología.
- Impact incorpora `delivery_evidence`, `findings`, Key Findings priorizados y un inventario
  separado de Historical Documentation Completeness; la ausencia de validación persistida no se
  interpreta como fallo.
- Drift incorpora `current_consistency_findings` y Structural Consistency Boundaries; los controles
  de targets de deprecation se describen como estructurales, no como remoción operativa comprobada.
- Savings incorpora `calibration_opportunities` para supuestos no calibrados sin modificar fórmulas,
  períodos ni clasificación de estimación.
- Los contratos JSON son aditivos y los recursos/herramientas MCP reutilizan los mismos builders.

## Validation Results

- CLI: `impact-report`, `savings` y `guard-history` — 34 tests passed.
- MCP: Impact, Drift y Savings reports — 13 tests passed.
- Builds: `@kaddo/cli` y `@kaddo/mcp` successful.
- Dogfooding: los tres reportes fueron regenerados para Kaddo; Impact muestra Key Findings y
  Delivery Evidence, Drift muestra hallazgos y límites estructurales, y Savings muestra oportunidades
  de calibración sin convertir estimaciones en mediciones.
