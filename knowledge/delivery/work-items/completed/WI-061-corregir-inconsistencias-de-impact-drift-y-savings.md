---
type: bugfix
id: WI-061
title: >-
  Corregir inconsistencias de Impact, Drift y Savings Reports y validar los
  contratos de reporting actuales
status: completed
work_type: bugfix
created_at: '2026-10-12'
source:
  type: external
  imported_at: '2026-10-12'
  source_format: markdown-frontmatter
  source_hash: 749e4797d752ffa942532539fc2405167d7d14b79a918798185d21a0011e51d2
  inferred: false
generated_by: kaddo-admin
affected_modules: []
summary: >-
  Corregir inconsistencias de Impact, Drift y Savings Reports y validar los
  contratos de reporting actuales
original_snapshot:
  title: >-
    Corregir inconsistencias de Impact, Drift y Savings Reports y validar los
    contratos de reporting actuales
  type: bugfix
  status: draft
ready_at: '2026-10-12'
completed_at: '2026-10-12'
---

# Corregir inconsistencias de Impact, Drift y Savings Reports y validar los contratos de reporting actuales

## Intent

WI-060 evolucionó los reportes Impact, Drift y Savings hacia un modelo compartido de evidencia, aplicabilidad y estimaciones con periodos diferenciados.

Sin embargo, al ejecutar los reportes sobre el propio proyecto Kaddo se identificaron resultados inconsistentes, indicadores potencialmente engañosos y una discrepancia entre los contratos implementados y el Markdown generado.

Los reportes examinados presentaron:

### Impact Report

```text
Knowledge Impact Score: 112/100
Completed Work Items: 51
Roadmap candidates: 10
Materialized Work Items: 51
Traceability: 57/20
Ownership: 31/51
Graph: 172 nodes, 175 edges
Guard History: not available
Drift prevention: Active
```

### Savings Report

```text
Estimated time saved: 61.46 hours
Estimated value: 2458 USD
Confidence: Medium
Assumptions: defaults
Guard history: not available
```

El total combina componentes históricos y proyecciones mensuales:

```text
Historical estimates:
Context preparation       25.50 h
Review                    10.33 h
Clarification             20.83 h
                         --------
                          56.66 h

Monthly projections:
Onboarding                 3.00 h
Architecture discovery     1.80 h
                         --------
                           4.80 h
```

### Drift Report

```text
No guard history recorded yet.
```

El repositorio ya contiene parte de las correcciones metodológicas de WI-060, pero el output examinado no refleja su contrato actual.

Este WI debe investigar esa discrepancia y corregir los defectos que todavía permanecen.

---

# Goal

Garantizar que los tres reportes:

1. Ejecuten realmente los contratos de reporting vigentes.
2. No produzcan puntuaciones matemáticamente inválidas.
3. No confundan capacidades disponibles con resultados comprobados.
4. Interpreten correctamente trazabilidad y ownership.
5. Mantengan separadas estimaciones históricas y proyecciones.
6. Representen honestamente la ausencia de historial de Drift.
7. Produzcan resultados consistentes desde CLI y MCP.

El objetivo no es introducir nuevas dimensiones de medición, sino hacer confiables las que ya existen.

---

# 1. Verify Runtime and Report Contract

Antes de modificar cálculos, identificar por qué los reportes entregados todavía presentan el formato anterior a WI-060.

Verificar:

```text
Source code
↓
Package build
↓
CLI executable
↓
Report generator
↓
Markdown / JSON output
```

Comparar:

```text
local workspace CLI
installed/global CLI
published CLI, when applicable
MCP package
```

El output esperado de WI-060 debe incluir:

### Impact

```text
Project Context
Evidence and Applicability
Legacy score marked deprecated
```

### Drift

```text
Consistency Evidence
Guard History
```

incluso cuando no existan ejecuciones registradas.

### Savings

```text
Historical Estimate
Monthly Projection
Evidence Classification
Reporting Period
```

Determinar si la discrepancia proviene de:

- un build desactualizado;
- una instalación global anterior;
- una diferencia entre source y dist;
- un paquete publicado distinto del local;
- o un problema real del generador.

No modificar modelos Core para resolver un problema que sea únicamente de ejecución o empaquetado.

---

# 2. Correct Legacy Impact Score

Corregir el cálculo heredado que permite obtener:

```text
Traceability: 57/20
Knowledge Impact Score: 112/100
```

El cálculo actual relaciona:

```text
51 materialized Work Items
10 roadmap candidates
```

aunque no necesariamente pertenecen a la misma población.

No utilizar:

```text
all materialized WIs / roadmap candidates
```

como ratio de materialización sin demostrar su correspondencia.

La corrección debe:

- Utilizar numeradores y denominadores compatibles.
- Respetar el máximo de cada componente.
- Evitar divisiones por cero.
- Mantener el cálculo determinístico.
- Preservar el carácter deprecated del score.

Invariantes:

```text
0 <= component.points <= component.max

0 <= legacy_score <= 100

legacy_score =
sum(component.points)
```

dentro de las reglas de redondeo definidas.

No corregir el problema únicamente aplicando:

```typescript
Math.min(score, 100)
```

Debe corregirse la fórmula y su interpretación.

El score legado no debe utilizarse para calcular Savings Confidence ni atribuir productividad.

---

# 3. Correct Traceability Semantics

Revisar las recomendaciones producidas por Impact.

Actualmente aparecen:

```text
51 Work Items missing source
51 Work Items missing initiative
```

pero estas relaciones no siempre son obligatorias.

## Source / Provenance

Distinguir:

```text
Chat-originated WI
CLI-originated WI
Admin-originated WI
Roadmap-originated WI
External-imported WI
```

Un WI originado directamente en un chat no debe recibir la recomendación:

```text
Add source_id from roadmap
```

si nunca perteneció al roadmap.

Validar provenance conforme al origen real.

Solo generar un gap cuando falte una referencia exigida por ese origen.

## Initiatives

Una Initiative es opcional.

```text
WI without Initiative
≠
invalid WI
```

La métrica puede informar adopción o cobertura de Initiatives, pero no debe recomendar agregar una a todos los WIs históricos.

## Code Ownership

No todos los WIs requieren relacionarse con código fuente.

Ejemplos:

```text
documentation
research
strategy
content
knowledge-only changes
```

La ausencia de `code:` debe interpretarse según el tipo y alcance del WI.

Si no existe información suficiente para determinar aplicabilidad, indicar Unknown en lugar de generar automáticamente una deuda.

---

# 4. Ownership Overlap Semantics

El reporte detectó:

```text
33 ownership overlaps
```

Algunos corresponden a archivos compartidos entre varios Work Items:

```text
packages/admin-server/src/core-adapter.ts
packages/mcp/src/server.ts
packages/cli/src/core/next-step.ts
```

Que dos WIs hayan modificado el mismo archivo no constituye necesariamente un conflicto.

Distinguir:

```text
Shared modification history
```

de:

```text
Conflicting ownership declarations
```

Los overlaps históricos pueden mantenerse como información de trazabilidad.

No presentarlos como problemas de arquitectura o ownership sin evidencia de un conflicto real.

Revisar también que `owned_code_paths` represente correctamente su unidad, evitando confundir declaraciones, coincidencias y rutas únicas.

---

# 5. Correct Knowledge Health Interpretation

El reporte presentó:

```text
Business: Consolidated
Product: Weak
Tech: Structured
Delivery: Traceable

Knowledge Health: 20/20
```

El score heredado está premiando principalmente la presencia de las capas.

Evitar comunicar:

```text
Knowledge Health: perfect
```

cuando una capa aplicable está identificada como Weak.

Si el componente permanece por compatibilidad:

- Explicar qué mide realmente.
- No presentarlo como calidad absoluta.
- Diferenciar presencia y madurez.
- Respetar la aplicabilidad del project.mode.

No introducir en este WI un nuevo score universal de calidad.

---

# 6. Correct Drift Prevention Semantics

Impact mostró:

```text
Drift prevention: Active
```

mientras Drift indicó:

```text
Guard history: not available
```

Estos resultados no deben interpretarse como evidencia de prevención comprobada.

Distinguir:

```text
Capability available
Monitoring recorded
Findings detected
Findings resolved
Prevention effectiveness
```

Ejemplo:

```text
Guard capability: Available
Guard history: Not recorded
Drift prevention evidence: Unknown
```

La existencia de code ownership no demuestra que se haya evitado drift.

No afirmar reducción de inconsistencias sin observaciones o evidencia suficiente.

---

# 7. Drift Report Without History

Cuando no exista:

```text
.kaddo/history/guard-runs.jsonl
```

el reporte debe continuar mostrando la consistencia actual que sí pueda evaluarse mediante reglas determinísticas.

Ejemplo:

```text
Consistency Evidence

Guard History       Unknown
Lifecycle Evidence  Observed / Unknown
Deprecations        Derived / Not Applicable
Topology            Derived / Unknown
```

Y después:

```text
Historical Drift Trend
Not Available

No recorded Guard runs.
```

No interpretar la ausencia de historia como:

```text
0 drift
```

ni como:

```text
clean project
```

Mantener la recomendación para empezar a registrar ejecuciones:

```bash
kaddo guard --record
```

pero sin duplicar instrucciones innecesariamente.

No crear historial sintético para llenar el reporte.

---

# 8. Savings Period Separation

Validar la separación implementada por WI-060.

Con el conjunto de datos original:

```text
Historical estimate:
56.66 h

Monthly projection:
4.80 h
```

Estos valores corresponden únicamente al fixture del reporte anterior y no deben convertirse en constantes del producto.

No presentar:

```text
Total: 61.46 hours saved
```

porque combina horizontes diferentes.

La salida debe distinguir:

```text
Historical estimated hours
Monthly projected hours
```

y sus valores monetarios correspondientes.

Mantener:

```text
Estimated
```

como clasificación, incluso cuando los Work Items utilizados como base sean hechos observados.

No afirmar:

```text
USD 2458 saved
```

como ahorro comprobado.

---

# 9. Savings Confidence

Revisar la confianza cuando se utilizan:

```text
default assumptions
partial graph
no Guard history
no calibrated baseline
```

Los defaults:

```yaml
hourly_cost: 40
context_preparation_minutes_saved_per_work_item: 30
review_minutes_saved_per_work_item_with_ownership: 20
clarification_minutes_saved_per_ready_work_item: 25
```

son supuestos ilustrativos.

No deben convertirse en evidencia de ahorro real.

La confianza debe explicarse mediante:

```text
evidence availability
assumption calibration
baseline provenance
reporting horizon
known limitations
```

Con assumptions por defecto, el reporte debe evitar afirmar una confianza alta.

Verificar que `calibrated_at` por sí solo no sea tratado como demostración suficiente de calibración si no existe sustento documentado.

---

# 10. Cross-report Consistency

Validar que los reportes representen la misma información de forma coherente.

Ejemplos:

```text
Impact:
Guard history unavailable

Drift:
Historical trend unknown

Savings:
Drift prevention estimate unavailable
```

y:

```text
Impact:
Legacy score deprecated

Savings:
Legacy score not used for confidence
```

No calcular el mismo concepto mediante definiciones contradictorias en cada reporte.

Reutilizar `reporting-evidence.ts` y los contratos compartidos existentes.

---

# 11. Regression Fixtures

Agregar tests que reproduzcan los datos reportados en el dogfooding de Kaddo.

Fixture principal:

```text
Project: standard
Work Items: 51
Completed: 51
Roadmap candidates: 10
Ownership: 31/51
Acceptance Criteria: 50/51
Graph quality: partial
Graph nodes: 172
Graph edges: 175
Guard history: unavailable
```

Validaciones esperadas:

```text
Score <= 100
Traceability <= 20
No false missing initiative gaps
No false missing roadmap source gaps
No proven drift prevention claim
Period-separated savings
Guard trend unknown
```

Agregar fixtures pequeños para:

```text
POC without Business/Product
Standard without Initiatives
WI created from chat
Documentation-only WI
Shared code files across historical WIs
Empty Guard history
```

No depender de editar los 51 Work Items reales para que los tests pasen.

---

# 12. Documentation

Actualizar cuando corresponda:

```text
apps/docs/src/content/docs/impact-report.md
apps/docs/src/content/docs/drift-report.md
apps/docs/src/content/docs/savings-report.md
```

y sus versiones en español.

Aclarar:

- Legacy score deprecated.
- Meaning of ownership coverage.
- Optional Initiative semantics.
- Provenance vs roadmap source.
- Guard availability vs observed prevention.
- Historical drift vs current consistency.
- Historical savings estimates vs monthly projections.
- Confidence and default assumptions.

Evitar volver a documentar todo WI-060; concentrarse en las correcciones y su interpretación.

---

# Out of Scope

Este WI no incluye:

- Nuevo sistema de reporting.
- Nuevo score de productividad.
- Reemplazar WI-060.
- Nuevos dashboards de Admin.
- Persistencia adicional.
- LLM para generar métricas.
- ROI contable.
- Integración con herramientas de time tracking.
- Medición automática del tiempo real ahorrado.
- Modificar masivamente Work Items históricos.
- Crear Initiatives retroactivamente.
- Inventar Guard History.
- Cambiar los contratos principales de POC o Controlled Deprecation.
- Publicar un release sin validación de los resultados.

---

# Acceptance Criteria

- [x] **AC-01 — Runtime:** se identifica y resuelve la discrepancia entre source, build y outputs ejecutados, o se documenta un problema de instalación externo al repositorio.
- [x] **AC-02 — Score:** el cálculo legacy no supera los máximos de sus componentes ni 100 puntos y utiliza denominadores compatibles.
- [x] **AC-03 — Provenance:** Work Items originados en chat, CLI o Admin no reciben falsos gaps de roadmap.
- [x] **AC-04 — Optional Capabilities:** la ausencia de Initiatives y ownership no aplicable no produce deuda artificial.
- [x] **AC-05 — Ownership:** los overlaps históricos no se clasifican automáticamente como conflictos.
- [x] **AC-06 — Knowledge Semantics:** presencia de artifacts y madurez del conocimiento se distinguen claramente.
- [x] **AC-07 — Drift Semantics:** disponibilidad de Guard, historial y prevención demostrada se representan como conceptos diferentes.
- [x] **AC-08 — No History:** Drift muestra evidencia actual disponible y tendencia desconocida cuando no existe historial.
- [x] **AC-09 — Savings:** estimaciones históricas y proyecciones mensuales permanecen separadas; los defaults no se presentan como ahorro comprobado.
- [x] **AC-10 — Cross-report Consistency:** Impact, Drift y Savings utilizan interpretaciones coherentes del mismo contexto y evidencia.
- [x] **AC-11 — Regression:** tests reproducen el escenario de 51 WIs y detectan las regresiones observadas.
- [x] **AC-12 — Compatibility:** las interfaces CLI/MCP y los contratos JSON mantienen compatibilidad o documentan explícitamente cualquier cambio.
- [x] **AC-13 — Documentation:** docs EN/ES reflejan las correcciones metodológicas.

---

# Validation

## Step 1 — Runtime verification

Desde el monorepo:

```bash
pnpm --filter @kaddo/cli build

node packages/cli/dist/index.js --version
node packages/cli/dist/index.js impact
node packages/cli/dist/index.js drift
node packages/cli/dist/index.js savings
```

Comparar con el CLI instalado y la publicación disponible.

## Step 2 — Impact regression

Usar fixture:

```text
51 Work Items
10 roadmap candidates
31 ownership declarations
```

Expected:

```text
No score above maximum
No 57/20 traceability
No false source gaps
No mandatory initiative gaps
```

## Step 3 — Drift without history

Eliminar únicamente el historial del fixture de prueba.

Expected:

```text
Guard history: unavailable
Historical trend: unknown
Current consistency: shown when derivable
```

## Step 4 — Savings regression

Usar las assumptions y datos del reporte original.

Expected:

```text
Historical estimate: 56.66 h
Monthly projection: 4.80 h
```

No:

```text
Single combined total: 61.46 h
```

Verificar también que la salida no afirme que las horas o el dinero se ahorraron realmente.

## Step 5 — End-to-end

Generar los tres reportes mediante:

```text
CLI
MCP
```

Comprobar consistencia entre:

```text
Markdown
JSON
```

y verificar que no existan campos históricos engañosos presentados como indicadores vigentes.

---

# Definition of Done

El WI se considera completo cuando:

- Los tres reportes utilizan el build correcto.
- El score heredado es matemáticamente válido.
- No aparecen gaps artificiales para capabilities opcionales.
- Source y provenance se interpretan según el origen real.
- Los overlaps históricos no se confunden con conflictos.
- Guard disponible no se interpreta como prevención demostrada.
- Drift sin historial conserva las observaciones actuales disponibles.
- Savings separa periodos y mantiene las estimaciones correctamente clasificadas.
- CLI/MCP producen resultados compatibles.
- Los tests reproducen los problemas identificados.
- La documentación EN/ES está actualizada.
- El dogfooding se ejecuta nuevamente sobre Kaddo.
- Se registra Implementation Evidence con los resultados antes y después.

---

# Implementation Handoff Guidance

Este WI es un hardening de WI-060.

Puntos principales:

```text
packages/cli/src/core/reporting-evidence.ts

packages/cli/src/core/impact-report.ts

packages/cli/src/core/drift-report.ts

packages/cli/src/core/savings.ts

packages/cli/src/core/guard-history.ts
```

Tests relevantes:

```text
packages/cli/tests/impact-report.test.ts
packages/cli/tests/savings.test.ts
packages/cli/tests/guard-history.test.ts
```

Revisar primero el contrato ya implementado antes de crear nuevos modelos.

Mantener:

```text
Reporting Evidence
       ↓
Impact + Drift
       ↓
Savings
```

No crear un sistema paralelo.

## Expected Outcome

Antes:

```text
Impact
→ 112/100
→ false optional gaps

Drift
→ no history, limited explanation

Savings
→ 61.46 h combined
→ defaults shown with Medium confidence
```

Después:

```text
Impact
→ valid legacy score
→ accurate applicability
→ meaningful gaps

Drift
→ current evidence
→ historical trend only when observed

Savings
→ historical estimates
→ monthly projections
→ clear confidence and limitations
```

Principio rector:

> Una métrica debe ser matemáticamente válida, semánticamente correcta y estar respaldada por evidencia. Si alguna de estas condiciones falla, Kaddo debe corregirla o declararla como no disponible, nunca presentar una precisión que no puede justificar.

## Implementation Evidence

- Runtime: el código fuente, el build local de CLI `3.124.1` y el build local de MCP `3.124.1`
  generan el contrato vigente. El paquete resuelto mediante `npx @kaddo/mcp` seguía en `3.121.0`;
  se documentó como discrepancia externa de publicación y el MCP de desarrollo quedó configurado
  contra `packages/mcp/dist/index.js` del workspace.
- Impact: el score legacy suma componentes ya acotados; la trazabilidad usa candidatos de roadmap
  únicos conectados explícitamente, no todos los Work Items. Provenance no-roadmap, initiatives
  opcionales, trabajo sin código aplicable y paths históricos compartidos ya no producen deuda
  artificial.
- Drift: sin historial conserva `Consistency Evidence` y muestra `Historical Drift Trend` como no
  disponible; la prevención en Impact es `Unknown` hasta existir evidencia de warnings resueltos.
- Savings: `totals.observed_history_estimate` y `totals.monthly_projection` se mantienen separados;
  el campo legacy `total` conserva solo el valor histórico por compatibilidad.

## Validation Results

- `pnpm --filter @kaddo/cli exec vitest run tests/impact-report.test.ts tests/savings.test.ts tests/guard-history.test.ts` — 31 passed.
- `pnpm exec vitest run --config vitest.config.ts packages/mcp/tests/impact-report.test.ts packages/mcp/tests/drift-report.test.ts packages/mcp/tests/savings-report.test.ts` — 13 passed.
- `pnpm --filter @kaddo/cli build` y `pnpm --filter @kaddo/mcp build` — passed.
- Dogfooding local: `impact`, `drift` y `savings` generados bajo `.kaddo/reports/`; Impact: 59/100,
  prevención `Unknown`; Drift: tendencia histórica no disponible; Savings: 57.08 h histórico y
  4.8 h mensual, sin total combinado.
