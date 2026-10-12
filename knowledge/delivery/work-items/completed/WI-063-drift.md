---
type: feature
id: WI-063
title: >-
  Refinar la clasificación de findings y mejorar la presentación compacta de
  Impact y Drift Reports
status: completed
work_type: feature
created_at: '2026-10-12'
source:
  type: external
  imported_at: '2026-10-12'
  source_format: plain-text
  source_hash: ffb22a2555447ecabf98ecf075b09770b052cda6f3c7169a9e35cef210c0f7ff
  inferred: false
generated_by: kaddo-admin
knowledge_level: K2
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - packages/cli/src/core/reporting-evidence.ts
  - packages/cli/src/core/impact-report.ts
  - packages/cli/src/core/drift-report.ts
  - packages/cli/src/core/savings.ts
  - packages/cli/src/core/graph-hints.ts
  - packages/cli/src/core/deprecation.ts
code:
  - packages/cli/src/core/reporting-evidence.ts
  - packages/cli/src/core/impact-report.ts
  - packages/cli/src/core/drift-report.ts
  - packages/cli/src/core/savings.ts
  - packages/cli/src/core/graph-hints.ts
  - packages/cli/src/core/deprecation.ts
  - packages/mcp/src/generate.ts
  - packages/mcp/src/resources.ts
summary: >-
  Refinar la clasificación semántica de findings, prioridades y presentación
  compacta de Impact y Drift sin modificar los artefactos canónicos.
original_snapshot:
  title: >-
    Refinar la clasificación de findings y mejorar la presentación compacta de
    Impact y Drift Reports
  description: >-
    Refinar la clasificación semántica de findings, prioridades y presentación
    compacta de Impact y Drift sin modificar los artefactos canónicos.
ready_at: '2026-10-12'
completed_at: '2026-10-12'
---

# Refinar la clasificación de findings y mejorar la presentación compacta de Impact y Drift Reports

## Intent

WI-060, WI-061 y WI-062 hicieron que los reportes fueran basados en evidencia y accionables. Este
WI refina su clasificación semántica y su presentación compacta: diferencia problemas demostrados,
brechas de cobertura, oportunidades de revisión e historial de drift, sin crear validadores nuevos
ni modificar los artifacts canónicos.

## Context

Drift
Current Guard consistency: unknown
Lifecycle evidence: 23 WIs with validation status

Deprecation consistency:
2 plans passed deterministic target checks

Topology:
7 open hints

Historical trend:
Not available


Savings
Historical estimate: 58.84 h
Monthly projection: 4.8 h
Confidence: Low
Assumptions: defaults

Knowledge Impact Score: 59/100


Estas observaciones se utilizan como referencia de regresión y no deben incorporarse como valores fijos al código.

1. Finding Classification
Refinar la clasificación de findings para distinguir conceptos que actualmente pueden confundirse.
Utilizar cuatro categorías principales:
Classification	Meaning
consistency_violation	Contradicción verificable entre artifacts, relaciones o estados declarados
coverage_gap	Relación o información ausente cuya cobertura puede mejorarse
review_hint	Situación potencialmente válida que requiere revisión humana
historical_drift	Inconsistencia demostrada mediante observaciones comparables a lo largo del tiempo
Ejemplos:
Consistency Violation
A Work Item references a Resource that does not exist.


Cuando la referencia sea obligatoria y pueda verificarse mediante Core.
Coverage Gap
A declared capability has no Work Item relationship.


Si esa relación es opcional, no debe tratarse como inconsistencia.
Review Hint
A Knowledge Capsule exists but is not referenced
by any Work Item.


Esto puede ser válido si la cápsula está disponible para otros flujos.
Historical Drift
Run 1:
Knowledge and source relationship consistent.

Run 2:
Code changed without corresponding knowledge update.

Run 3:
Finding remains unresolved.


Solo debe utilizarse esta clasificación cuando exista evidencia histórica suficiente.
Rules
- No clasificar automáticamente todos los Graph hints como drift.
- No equiparar ausencia de relación opcional con inconsistencia.
- Conservar el finding original y su fuente.
- Las clasificaciones deben ser determinísticas.
- No inferir fallos operativos a partir de conocimiento declarativo.
- No introducir una nueva clasificación historical_drift sin respaldo del historial.
- Los consumidores deben poder diferenciar clasificación, prioridad y estado de resolución.

2. Finding Priority
Revisar la asignación actual de prioridad.
Actualmente los siete Graph hints aparecen con:
priority: medium


Sin embargo, no todos representan riesgos equivalentes.
Definir una política determinística:
High
→ verified inconsistency affecting a required
  relationship or critical lifecycle condition

Medium
→ actionable gap requiring review with
  demonstrated relevance

Low
→ non-blocking improvement or optional coverage gap

Unknown
→ insufficient evidence to assess priority


No asignar High solo porque el finding pertenece a una categoría.
La clasificación y la prioridad deben ser independientes.
Ejemplo:
classification: coverage_gap
priority: low
source: graph-hints
affected: "Capability Domains"


La prioridad exacta debe derivarse de las reglas y evidencias disponibles.
No asignar automáticamente una prioridad baja a todos los Graph hints sin evaluar el tipo de relación.

3. Graph Hint Interpretation
Impact y Drift deben reutilizar los mismos hints generados por Core, pero representarlos de manera semánticamente correcta.
Ejemplos actuales:
Capability Domains
Capability Gaps
Domain: CLI & System Context
Domain: Agent Skills & Workflows
Domain: Project Infrastructure
Roadmap Candidate Signals
kaddo-telemetry Knowledge Capsule


Para una capability sin WI relacionado:
Classification:
Coverage Gap / Review Hint

Finding:
Capability has no declared Work Item relationship.

Impact:
Relationship coverage is incomplete or requires review.

Suggested action:
Review whether the capability should be connected
to existing Work Items.


No afirmar:
Knowledge drift detected.


La existencia de una capability sin WI puede ser legítima.
Para una Knowledge Capsule sin referencias:
Classification:
Review Hint

Finding:
Capsule has no declared Work Item consumers.

Suggested action:
Confirm whether this capsule is intended for
direct contextual use or Work Item relationships.


No obligar a crear relaciones artificiales para eliminar warnings.

4. Deprecation Consistency Semantics
El Drift Report actualmente puede mostrar:
2 plans passed deterministic target consistency checks


Aunque un Deprecation Plan pueda encontrarse en:
status: draft
targets: []


No considerar automáticamente que un plan sin targets superó una validación efectiva de sus targets.
Distinguir:
Plans discovered
Plans without targets
Plans with targets evaluated
Plans with structural findings
Plans without structural findings


Ejemplo:
Deprecation Consistency

Plans discovered: 2
Plans awaiting target refinement: 1
Plans evaluated: 1
Structural findings: 0


Los valores son ilustrativos.
Rules
Un plan con:
targets: []


debe interpretarse como:
Target consistency: Not Evaluated
Reason: No targets defined.


No como:
Target consistency: Passed


Un plan con targets válidos puede mostrarse como:
Structural consistency: Passed


si realmente se ejecutaron las verificaciones aplicables.
Preservar:
Structural consistency
≠
Operational removal verification


No afirmar que un target fue retirado de producción únicamente porque sus estados declarados son consistentes.

5. Lifecycle Consistency: Completed vs Pending
Impact identificó:
Completed Work Items: 53

Validation passed: 22
Validation pending: 1
Validation not recorded: 30


Agregar una revisión contextual para WIs completados cuyo estado de validación persistido indique una verificación pendiente o fallida.
Ejemplo:
WI-XXX

Lifecycle:
Completed

Validation:
Pending

Classification:
Review Hint

Suggested action:
Review the validation evidence and confirm
whether the completed state is consistent
with the Work Item completion contract.


Antes de clasificarlo como inconsistencia, consultar las reglas reales de completion en Core.
Si el lifecycle permite completar un WI con validación pendiente bajo condiciones explícitas, respetar esa excepción.
Reglas:
- completed + pending requiere revisión contextual.
- completed + failed debe evaluarse según el contrato de completion.
- completed + not recorded no equivale automáticamente a fallo.
- No modificar automáticamente el estado de ningún WI.
- No reabrir Work Items históricos desde el reporte.

6. Compact Impact Report
Actualmente Impact tiene aproximadamente 300 líneas.
Una parte considerable corresponde a:
Shared code-path history


con numerosas entradas históricas.
Mejorar la presentación Markdown por defecto para priorizar información útil.
Estructura objetivo:
Executive Summary
    ↓
Key Findings
    ↓
Delivery Evidence
    ↓
Knowledge / Graph Status
    ↓
Suggested Actions
    ↓
Historical Summary


Las secciones detalladas existentes pueden conservarse después del resumen o exponerse mediante una opción explícita de detalle.
Shared Code-path History
En el reporte compacto:
Shared Code-path History

37 shared path declarations detected.

These are historical relationships, not
necessarily ownership conflicts.


Agregar, cuando corresponda, un resumen de las áreas más involucradas.
El inventario completo debe seguir disponible para investigación.
Preferir reutilizar formatos o flags existentes. Si no existe una forma de consultar el detalle Markdown, incorporar una opción compatible como:
kaddo impact --details


sin modificar el comportamiento JSON detallado.
No introducir paginación ni almacenamiento adicional.

7. Compact Actionable Findings
Evitar repetir recomendaciones equivalentes.
Ejemplo actual:
Add code ownership to WI-006.
Add code ownership to WI-061.

...

Add code ownership to WI-006, WI-061.


Consolidar:
Missing Code Ownership

Affected Work Items:
WI-006, WI-061

Suggested action:
Review and add relevant code ownership declarations.


El objetivo es evitar duplicación sin perder trazabilidad.
Agrupar findings por:
classification
category
source
suggested action


cuando corresponda.
Mantener identificadores de artifacts concretos.
No eliminar findings distintos únicamente porque comparten texto.

8. Drift: Current Findings Presentation
Drift debe separar claramente:
Current Consistency Violations

Coverage Gaps

Review Hints

Historical Drift


Las secciones sin resultados pueden presentar un resumen breve o no renderizarse si no aportan información.
Ejemplo:
Current Findings

Consistency Violations: 0
Coverage Gaps: 6
Review Hints: 1

Historical Drift:
Not available — no Guard history recorded.


Los valores son ilustrativos.
No mostrar:
Project is drift-free.


solo porque no existen inconsistencias detectadas.
Una ausencia de findings únicamente significa que las verificaciones ejecutadas no encontraron resultados en su cobertura.
Mantener una explicación de las fuentes evaluadas.

9. Savings Legacy Score
Savings todavía muestra:
Knowledge Impact Score: 59/100


Pero Impact ya lo identifica como:
Legacy Knowledge Impact Score
Deprecated


Alinear ambos reportes.
Opción recomendada:
Legacy Knowledge Impact Score:
59/100 (deprecated; informational only)


Si el score no participa en ninguna decisión o cálculo vigente, puede omitirse del resumen principal.
Conservar el campo histórico en JSON cuando sea necesario por compatibilidad, documentándolo como deprecated.
No volver a utilizarlo para determinar Savings Confidence.
Este WI no modifica las fórmulas de estimación.

10. Cross-report Consistency
Los tres reportes deben mantener la misma interpretación de la evidencia.
Ejemplo:
Impact

Graph hints:
7

Classification:
6 coverage gaps
1 review hint


Drift

Current findings:
6 coverage gaps
1 review hint

Historical drift:
Unknown


Savings

No savings calculated from Graph hints.


Los datos deben provenir de los mismos contratos Core.
Evitar duplicar reglas de clasificación dentro de los renderizadores de cada reporte.

11. Documentation
Actualizar:
- Impact Report EN/ES.
- Drift Report EN/ES.
- Savings Report EN/ES.
Explicar:
- Diferencia entre drift e inconsistencia.
- Diferencia entre coverage gap y review hint.
- Criterios para asignar prioridad.
- Limitaciones de validaciones estructurales.
- Comportamiento de deprecaciones sin targets.
- Lifecycle completion vs validation.
- Modo compacto y acceso a detalles.
- Estado deprecated del legacy score.
Mantener consistencia entre documentación, CLI y MCP.

## Out of Scope
Este WI no incluye:
- Nuevos motores de validación.
- Nuevos cálculos de Savings.
- Nuevo Impact Score.
- Integración con infraestructura.
- Verificaciones operativas de producción.
- Modificar Controlled Deprecation Core.
- Cambiar reglas del Work Item lifecycle.
- Reabrir Work Items históricos.
- Crear relaciones Graph artificiales.
- Ejecutar Guard automáticamente.
- Agregar dashboards en Admin.
- Crear nuevos artifacts de reporting.
- Implementar almacenamiento adicional.
- Utilizar LLM para clasificar findings.

## Acceptance Criteria
- [x] AC-01 — Finding Classification: Impact y Drift distinguen consistency violations, coverage gaps, review hints y historical drift sin confundirlos.
- [x] AC-02 — Priority Semantics: la prioridad se asigna mediante reglas determinísticas y no por defaults genéricos injustificados.
- [x] AC-03 — Graph Hints: las relaciones opcionales ausentes no se presentan automáticamente como drift o inconsistencias.
- [x] AC-04 — Deprecation Drafts: planes con cero targets aparecen como Not Evaluated para target consistency.
- [x] AC-05 — Deprecation Boundaries: un plan estructuralmente válido no se presenta como operacionalmente retirado.
- [x] AC-06 — Lifecycle Findings: WIs completed con validación pending/failed se revisan según el contrato real de completion, sin clasificarlos automáticamente como inválidos.
- [x] AC-07 — Compact Impact: el reporte Markdown principal prioriza hallazgos actuales y resume el historial compartido de rutas.
- [x] AC-08 — Detail Availability: el inventario completo sigue disponible desde JSON y, cuando corresponda, mediante una opción explícita de detalle Markdown.
- [x] AC-09 — Recommendation Deduplication: las recomendaciones equivalentes se agrupan sin perder identificación de artifacts.
- [x] AC-10 — Drift Sections: Drift separa inconsistencias, brechas, hints e historial, y preserva Unknown cuando faltan observaciones.
- [x] AC-11 — Savings Compatibility: el score legado se identifica como deprecated y no participa en el cálculo de Savings Confidence.
- [x] AC-12 — Cross-report Consistency: Impact y Drift reutilizan la misma clasificación de findings; Savings no atribuye ahorro a hints.
- [x] AC-13 — Regression: tests cubren clasificaciones, prioridades, deprecaciones vacías, validaciones pendientes y modo compacto.
- [x] AC-14 — Documentation: las páginas EN/ES reflejan correctamente los nuevos comportamientos.

## How to test it
Scenario 1 — Kaddo Dogfooding
Datos de referencia:
Work Items: 53
Validation passed: 22
Validation pending: 1
Validation not recorded: 30

Graph hints: 7
Deprecation Plans: 2
Guard history: unavailable


Expected:
- Impact muestra resumen ejecutivo compacto.
- Graph hints se clasifican según su significado.
- Drift no presenta gaps opcionales como drift demostrado.
- Los Deprecation Plans sin targets no se cuentan como planes evaluados.
- El WI con validación pendiente recibe orientación contextual cuando corresponda.
- Savings conserva sus periodos y fórmulas.
Scenario 2 — Empty Deprecation
type: deprecation-plan
status: draft
targets: []


Expected:
Plan discovered: yes
Target consistency evaluated: no
Status: Not Evaluated
Reason: No targets defined


Scenario 3 — Structural Inconsistency
Crear en fixture una referencia obligatoria inválida.
Expected:
Classification: consistency_violation
Evidence: explicit
Suggested action: actionable


No clasificar como historical_drift sin historial.
Scenario 4 — Optional Graph Relationship
Capability sin relación obligatoria con un WI.
Expected:
Classification: coverage_gap / review_hint


No:
Historical drift


Scenario 5 — Completed WI with Pending Validation
WI status: completed
Validation: pending


Expected:
- Consultar las reglas del lifecycle.
- No marcar automáticamente como failed.
- Proporcionar orientación cuando exista una condición que merezca revisión.
Scenario 6 — Compact vs Detailed
Expected:
Default Markdown:
Compact and actionable

Detailed Markdown:
Complete inventory

JSON:
Full structured evidence


Los totales y findings deben ser consistentes entre formatos.
Scenario 7 — Savings Regression
Expected:
Historical estimate:
58.84 h

Monthly projection:
4.8 h

Legacy Impact Score:
Deprecated


No modificar estimaciones o confianza como consecuencia exclusiva de cambios en la presentación de findings.

## Definition of Done
El WI está completo cuando:
- Los findings representan correctamente su significado.
- La prioridad refleja evidencia y reglas explícitas.
- Los Graph hints opcionales no se comunican como drift demostrado.
- Las deprecaciones sin targets no se consideran evaluadas.
- Lifecycle completion y validation permanecen diferenciados.
- Impact puede consultarse de forma compacta sin perder detalle.
- Drift presenta los resultados por categoría.
- Las recomendaciones repetidas están consolidadas.
- Savings mantiene consistencia con la deprecación del legacy score.
- CLI y MCP conservan compatibilidad.
- Existen pruebas de regresión para los escenarios descritos.
- Docs EN/ES están actualizadas.
- Se ejecuta dogfooding de los tres reportes sobre Kaddo.
- Se registra Implementation Evidence.

## Implementation Handoff Guidance
Partir de las implementaciones existentes de WI-060, WI-061 y WI-062.
Puntos principales de inspección:
packages/cli/src/core/reporting-evidence.ts
packages/cli/src/core/reporting-findings.ts
packages/cli/src/core/impact-report.ts
packages/cli/src/core/drift-report.ts
packages/cli/src/core/savings.ts
packages/cli/src/core/graph-hints.ts
packages/cli/src/core/deprecation.ts


Comprobar los nombres reales de los módulos compartidos antes de modificarlos.
Reutilizar:
Core validators
Graph hints
Guard history
Work Item lifecycle
Deprecation Target validation


No crear un sistema paralelo de análisis.
Arquitectura objetivo:
                  CANONICAL KNOWLEDGE
                         |
                         v
               KADDO CORE VALIDATORS
                         |
                         v
                  RAW FINDINGS
                         |
                         v
             SEMANTIC CLASSIFICATION
                         |
                +--------+--------+
                |                 |
                v                 v
            IMPACT              DRIFT
                |                 |
                v                 v
          Actionability       Consistency
                |                 |
                +--------+--------+
                         |
                         v
              COMPACT PRESENTATION
                         |
                         v
              CLI / MCP / JSON / MD


No avanzar directamente a la implementación sin revisar los contratos actuales y confirmar qué hallazgos ya cuentan con una categoría semántica reutilizable.

## Expected Outcome
Antes:
Graph hint
→ Medium priority
→ Consistency finding
→ Review relationship


Después:
Graph hint
→ Inspect evidence
→ Determine classification
→ Assign justified priority
→ Suggest contextual action


Y:
Deprecation Plan with zero targets


pasa de:
Passed structural checks


a:
Not Evaluated — no targets available


Mientras que Impact pasa de un documento dominado por inventarios históricos a un reporte cuya primera lectura permite comprender:
What is known?
What needs attention?
Why?
What should happen next?


## Guiding Principle
Kaddo debe diferenciar un problema demostrado, una brecha de cobertura y una oportunidad de revisión. Las métricas deben orientar decisiones sin exagerar riesgos ni presentar relaciones opcionales como errores del sistema.

## Implementation Evidence

- Se añadió un contrato compartido de clasificación y estado de resolución para los findings;
  Impact y Drift reutilizan la semántica de los Graph Hints sin crear validadores paralelos.
- Impact ahora muestra el inventario Markdown compacto por defecto y expone `kaddo impact --details`
  para los artefactos y rutas compartidas completos; el JSON conserva el detalle estructurado.
- Drift separa consistency violations, coverage gaps, review hints e historical drift, y distingue
  planes de deprecation sin targets como `not_evaluated`.
- Savings etiqueta el score heredado como deprecated e informativo, sin usarlo para la confianza.

## Validation Results

- Builds: `pnpm --filter @kaddo/cli build` y `pnpm --filter @kaddo/mcp build` successful.
- CLI: `impact-report`, `savings` y `guard-history` — 37 tests passed.
- MCP: Impact, Drift y Savings reports — 13 tests passed.
- Dogfooding: se regeneraron Impact (compacto y `--details`), Drift y Savings para Kaddo;
  las salidas muestran clasificación, límites estructurales y el score legado correctamente.
