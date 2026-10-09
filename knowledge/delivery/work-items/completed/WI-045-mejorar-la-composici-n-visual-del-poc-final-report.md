---
type: feature
id: WI-045
title: >-
  Mejorar la composición visual del POC Final Report con tablas, Mermaid y
  trazabilidad portable
status: completed
work_type: feature
created_at: '2026-10-09'
source:
  type: external
  imported_at: '2026-10-09'
  source_format: markdown-frontmatter
  source_hash: 3ab70fdd4b0103d81f9ad052d140eb5c49e0f783630be6684b55555b94deab04
  inferred: false
generated_by: kaddo-admin
domains:
  - Tech
  - Delivery
affected_modules:
  - core
  - admin
code:
  - packages/cli/src/core/poc-report.ts
  - packages/cli/src/skills/skills.ts
  - packages/cli/tests/poc-report.test.ts
  - packages/cli/tests/skills.test.ts
  - packages/admin/src/components/MarkdownRenderer.tsx
  - apps/docs/src/content/docs/poc-mode.md
  - apps/docs/src/content/docs/es/poc-mode.md
summary: >-
  Mejorar la composición visual del POC Final Report con tablas, Mermaid y
  trazabilidad portable
original_snapshot:
  title: >-
    Mejorar la composición visual del POC Final Report con tablas, Mermaid y
    trazabilidad portable
  type: feature
  status: draft
scope_confidence:
  level: high
  reasons:
    - >-
      The report handoff, report-writing skill, Markdown renderer, and EN/ES POC
      docs already exist.
    - >-
      The change is guidance-only and preserves report lifecycle, persistence,
      and Admin rendering contracts.
refined_by: work-item-refinement (manual)
ready_at: '2026-10-09'
implementation_status: completed
validation_status: accepted-with-exceptions
verified_at: '2026-10-09'
completed_at: '2026-10-09'
release_version: v3.121.0
completion_exceptions:
  - id: POC-DOGFOOD-PENDING
    status: accepted
    category: environment
    impact: No persisted report was created from this repository because its canonical POC conclusion remains pending.
    reason: The report lifecycle correctly rejects generation before a validated, rejected, or inconclusive conclusion; creating a report only to satisfy dogfood would violate that contract.
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/poc-report.ts
        - packages/cli/src/skills/skills.ts
        - kaddo-power/skills/poc-report-writing/SKILL.md
        - apps/docs/src/content/docs/poc-mode.md
        - apps/docs/src/content/docs/es/poc-mode.md
        - packages/cli/tests/poc-report.test.ts
        - packages/cli/tests/skills.test.ts
        - packages/admin/tests/markdown-renderer.test.ts
      validations:
        - command: pnpm vitest run packages/cli/tests/poc-report.test.ts packages/cli/tests/skills.test.ts packages/admin/tests/markdown-renderer.test.ts
          status: passed
          reason: Focused contract, skill, and shared-renderer coverage passed (15/15).
        - command: pnpm test -- --reporter=dot
          status: accepted-with-exceptions
          reason: 1907 tests passed; one unrelated admin write test timed out under parallel load and passed in an isolated rerun (6/6).
        - command: pnpm --filter @kaddo/cli build && pnpm --filter @kaddo/admin build && pnpm --filter @kaddo/docs build
          status: passed
          reason: CLI and Admin builds passed; docs generated the POC routes and Mermaid examples successfully.
        - command: pnpm agent-plugin:check && pnpm npm-readme:check && git diff --check
          status: passed
          reason: Generated Kaddo Power skill, distributed README, and whitespace checks passed.
---

# Mejorar la composición visual del POC Final Report con tablas, Mermaid y trazabilidad portable

## Intent

Kaddo ya puede generar informes finales versionados para una Proof of Concept mediante:

```text
POC Knowledge
+
Work Items
+
Evidence
+
Resources
+
Tech Knowledge
↓
PocReportContext
↓
LLM synthesis
↓
Human confirmation
↓
poc-report-v00N.md
```

La capability funciona correctamente, pero el primer uso real evidenció que el contrato actual está demasiado orientado a **qué información debe contener el informe** y no suficientemente a **cómo debe representarse esa información**.

Como resultado, un reporte con buen contenido puede terminar siendo visualmente plano:

```text
headings
+
paragraphs
+
bullets
+
occasional table
```

incluso cuando la evidencia disponible se presta naturalmente para:

```text
comparison tables
status matrices
architecture diagrams
resource inventories
experiment matrices
risk matrices
prioritized recommendations
```

El objetivo de este WI es mejorar el contrato de generación del POC Final Report para que el agente seleccione una representación adecuada según el tipo de información, usando Markdown tables y Mermaid cuando mejoren la comprensión, sin inventar datos ni generar elementos visuales artificiales.

---

# Goal

Evolucionar la generación desde:

```text
Knowledge + Evidence
        ↓
Narrative synthesis
        ↓
POC Final Report
```

hacia:

```text
Knowledge + Evidence
        ↓
Identify information type
        ↓
Choose representation
   ┌────────┼─────────┐
   ↓        ↓         ↓
 prose    table    Mermaid
   └────────┼─────────┘
            ↓
    POC Final Report
```

manteniendo las 15 secciones canónicas existentes.

---

# Current Behavior

La capability actual ya dispone de:

```text
packages/cli/src/core/poc-report.ts
→ deterministic source selection
→ source fingerprint
→ missing/current/stale
→ versioned persistence
→ report handoff

poc-report-writing skill
→ report synthesis guidance

kaddo poc report
→ prepares the report context

MCP
→ agent-driven report flow

Admin
→ renders persisted report through MarkdownRenderer
```

El Admin ya utiliza el renderer Markdown compartido, por lo que tablas y bloques Mermaid pueden aprovechar la infraestructura de presentación existente.

El problema principal se encuentra en el contrato entregado al agente generador.

Actualmente el handoff indica:

```text
Use the 15 canonical sections.
```

pero no define suficientemente cuándo utilizar:

```text
prose
tables
Mermaid
```

---

# Target Behavior

El reporte debe conservar las 15 secciones actuales, pero cada sección debe escoger la representación que mejor comunique la evidencia existente.

Ejemplo esperado:

```text
POC Final Report

Executive Summary
→ snapshot table + short narrative

Hypothesis / Success Criteria
→ evaluation matrix

Architecture
→ Mermaid + explanation

Infrastructure
→ resource table

Experiments
→ validation matrix

Results
→ measurement tables

Cost
→ comparison table

Findings / Risks
→ structured matrix

Recommendations
→ prioritized table

Traceability
→ relative repository links
```

No todas las POCs deben contener todos estos elementos.

La selección depende de la evidencia disponible.

---

# 1. Visual & Structured Representation Rules

Extender `poc-report-writing` con reglas explícitas de representación.

El agente debe preferir Markdown tables cuando exista información estructurada comparable, por ejemplo:

```text
success criteria and outcomes
infrastructure resources
Project Resources
experiments
validations
measurements
costs
risks
limitations
recommendations
traceability
```

Debe preferir Mermaid cuando existan relaciones o flujos suficientemente soportados, por ejemplo:

```text
architecture
request/data flow
infrastructure topology
component relationships
resource relationships
experiment flow
```

Debe usar prosa para:

```text
context
interpretation
explanation
findings
conclusion
recommendations that need rationale
```

---

# 2. Representation Must Be Evidence-driven

No introducir requisitos artificiales como:

```text
minimum 5 tables
minimum 2 diagrams
```

La regla es:

```text
structured comparable evidence
→ table when it improves comprehension

grounded relationships / flow
→ Mermaid when it improves comprehension

narrative interpretation
→ prose
```

Si la evidencia no soporta una tabla o diagrama útil:

```text
do not generate it
```

Nunca inventar entidades, relaciones, métricas o estados únicamente para completar una representación visual.

---

# 3. Executive Summary Snapshot

Cuando existan datos suficientes, la sección `Executive Summary` debe comenzar con un snapshot compacto.

Ejemplo:

```markdown
| Aspect | Result |
|---|---|
| POC | Credit Decision Engine |
| Conclusion | VALIDATED |
| Experiments | 3 |
| Success Criteria | 7/7 |
| Platform | Azure |
| Main Resource | Azure AI Foundry |
```

Los campos son derivados de la evidencia real.

No definir una lista fija obligatoria.

Después del snapshot puede incluirse una síntesis narrativa breve.

---

# 4. Success Criteria Matrix

Cuando los Success Criteria puedan relacionarse con evidencia, representarlos como una matriz.

Ejemplo:

```markdown
| Success Criterion | Status | Evidence |
|---|---|---|
| Infrastructure deployed | Passed | Terraform deployment |
| HTTP endpoint available | Passed | E2E verification |
| Three scenarios validated | Passed | 3/3 results |
| Observability available | Passed | Application Insights |
```

Estados permitidos conceptualmente:

```text
passed
failed
not evaluated
unknown
```

No marcar `passed` sin evidencia.

---

# 5. Architecture with Mermaid

En `Technical Approach and Architecture`, cuando existan componentes y relaciones suficientemente respaldadas, generar Mermaid.

Preferir:

```mermaid
flowchart LR
    Client --> API
    API --> Rules
    Rules --> Context
    Context --> AI
    AI --> Result
```

frente a diagramas ASCII como:

```text
[ Client ]
   |
   v
[ API ]
```

La arquitectura debe estar basada únicamente en las fuentes seleccionadas por `PocReportContext`.

Si no existen relaciones suficientes:

```text
use prose or a component table
```

No inventar arquitectura para producir un diagrama.

---

# 6. Infrastructure and Project Resources Table

Cuando exista infraestructura o Project Resources, preferir una representación tabular.

Ejemplo:

```markdown
| Resource | Type / Provider | Purpose | Environment |
|---|---|---|---|
| RES-ai-foundry | Azure AI Foundry | Model inference | poc |
| Function App | Azure Functions | POC execution | poc |
| Application Insights | Azure Monitor | Observability | poc |
```

Los campos disponibles pueden variar según la evidencia.

No mostrar valores secretos ni credenciales.

---

# 7. Experiment and Validation Matrix

Cuando existan múltiples pruebas o Work Items experimentales, consolidarlos mediante tabla.

Ejemplo:

```markdown
| Experiment | Type | Expected | Observed | Status |
|---|---|---|---|---|
| POC-001 | E2E | REJECTED | REJECTED | Passed |
| POC-002 | E2E | REVIEW | REVIEW | Passed |
| POC-003 | E2E | APPROVED | APPROVED | Passed |
```

La matriz debe distinguir claramente:

```text
expected
observed
verification status
```

y no confundir simulaciones con ejecuciones reales.

---

# 8. Results and Cost Representation

Cuando existan measurements:

```text
tokens
latency
throughput
accuracy
agreement
resource usage
cost
```

preferir tablas comparativas.

Ejemplo:

```markdown
| Scenario | Tokens | Latency | Cost |
|---|---:|---:|---:|
| Approved | 843 | 1.8 s | $0.0042 |
| Review | 948 | 2.1 s | $0.0058 |
| Rejected | 949 | 3.8 s | $0.0058 |
```

Mantener la distinción ya definida por la capability:

```text
measured
calculated
estimated
projected
```

No transformar estimaciones en mediciones.

---

# 9. Findings, Limitations and Risks Matrix

Cuando existan varios hallazgos, estructurarlos de forma comparativa.

Ejemplo:

```markdown
| Type | Finding | Impact |
|---|---|---|
| Learning | Deterministic rules reduce LLM workload | High |
| Limitation | Only a subset of rules was evaluated | High |
| Risk | Provider throughput limits | Medium |
```

No forzar una valoración de impacto si las fuentes no la contienen.

En ese caso, omitir esa columna o marcar:

```text
not evaluated
```

---

# 10. Recommendation Matrix

Cuando existan múltiples recomendaciones, preferir una tabla priorizada si la evidencia soporta esa prioridad.

Ejemplo:

```markdown
| Priority | Recommendation | Category |
|---:|---|---|
| 1 | Formalize architecture decision | Architecture |
| 2 | Evaluate asynchronous processing | Scalability |
| 3 | Integrate real source systems | Integration |
```

Si no existe una prioridad sustentada:

```text
do not invent one
```

usar una lista o tabla sin prioridad.

---

# 11. Traceability Must Be Repository-portable

El POC Final Report no debe generar enlaces absolutos locales como:

```text
file:///c:/Users/.../knowledge/delivery/poc.md
```

Preferir paths relativos al artifact:

```markdown
[POC definition](./poc.md)

[WI-001](./work-items/completed/WI-001-....md)

[Current state](../tech/current-state.md)
```

o referencias Markdown equivalentes que funcionen en:

```text
GitHub
Kaddo Admin
local clones
other repository viewers
```

Nunca persistir paths del filesystem personal del usuario.

---

# 12. Canonical Section Representation Guidance

Mantener intactas las 15 secciones, agregando en la documentación una guía de representación recomendada:

| Section | Preferred representation |
|---|---|
| 1. Executive Summary | Snapshot table + short prose |
| 2. Problem and Objective | Prose |
| 3. Hypothesis and Success Criteria | Evaluation matrix |
| 4. Scope, Constraints and Non-goals | Compact bullets or table |
| 5. Technical Approach and Architecture | Mermaid + prose |
| 6. Infrastructure and Project Resources | Table + optional Mermaid |
| 7. Implementation and Technical Decisions | Table or concise prose |
| 8. Experiments and Validation | Validation matrix |
| 9. Results and Measurements | Measurement tables |
| 10. Cost and Efficiency Analysis | Comparison table |
| 11. Observability and Operational Findings | Table or prose |
| 12. Findings, Learnings, Limitations and Risks | Structured matrix |
| 13. Conclusion | Status + concise prose |
| 14. Recommendation and Next Steps | Recommendation matrix |
| 15. Traceability and Sources | Relative-link table/list |

Esta tabla es una guía semántica, no una obligación de generar todos los formatos.

---

# 13. Update Report Handoff

Extender `buildPocReportContext(...).handoff` para indicar explícitamente al agente:

```text
Choose the representation that best communicates each grounded fact.

Prefer:
- Markdown tables for structured comparisons.
- Mermaid for grounded architecture, flows and relationships.
- Prose for explanation and interpretation.

Do not invent data or relationships to create tables or diagrams.
Do not use ASCII diagrams when Mermaid can represent the same grounded flow.
Use repository-relative links in traceability.
```

El handoff continúa siendo determinístico.

Core no decide ni genera el contenido visual; solo comunica las reglas de síntesis.

---

# 14. Update `poc-report-writing` Skill

Actualizar la skill existente para incluir:

```text
representation selection
table guidance
Mermaid guidance
anti-hallucination rules
portable traceability
quality checklist
```

Agregar al Quality Checklist:

```text
- Structured evidence uses tables when clearer than prose.
- Grounded architecture/flows use Mermaid when useful.
- No decorative or unsupported diagrams exist.
- Measurements preserve measured/calculated/estimated/projected semantics.
- Traceability contains repository-portable paths.
- The report is scannable before reading the full narrative.
```

No crear una segunda skill para el mismo propósito.

---

# Documentation

Actualizar la documentación EN/ES del modo POC.

La sección `Final POC report` debe incluir:

1. La estructura canónica existente de 15 secciones.
2. La tabla `Section → Preferred representation`.
3. Ejemplo de Success Criteria matrix.
4. Ejemplo pequeño de arquitectura Mermaid.
5. Ejemplo de Infrastructure / Resources table.
6. Regla de evidence-driven representation.
7. Regla contra diagramas decorativos o información inventada.
8. Requisito de paths relativos para Traceability.

La documentación debe dejar claro:

> Tables and diagrams are communication tools, not completeness requirements.

---

# Out of Scope

Este WI no incluye:

```text
cambiar las 15 secciones canónicas;
nuevo formato de artifact;
cambiar versioning/fingerprint/freshness;
modificar la conclusión de la POC;
generar imágenes PNG/SVG;
generar PDF/DOCX;
usar servicios externos de diagramación;
introducir charts automáticos;
crear un número obligatorio de tablas;
crear un número obligatorio de diagramas;
modificar MarkdownRenderer;
crear un nuevo renderer en Admin;
rediseñar la UI del Final POC Report;
agregar nuevas fuentes al PocReportContext.
```

---

## Acceptance Criteria

- [x] **AC-01 — Representation Rules:** `poc-report-writing` define reglas explícitas para escoger entre prose, Markdown tables y Mermaid según la evidencia.
- [x] **AC-02 — Evidence Driven:** ninguna tabla o diagrama es obligatorio cuando las fuentes no contienen información suficiente.
- [x] **AC-03 — Architecture:** arquitectura o flujos respaldados pueden representarse con Mermaid y la guidance evita ASCII cuando Mermaid sea una mejor representación.
- [x] **AC-04 — Structured Evidence:** success criteria, resources, experiments, results, costs, risks y recommendations usan tablas cuando exista información comparable que lo justifique.
- [x] **AC-05 — Handoff:** `PocReportContext.handoff` comunica las reglas de representación al agente sin generar contenido narrativo desde Core.
- [x] **AC-06 — Traceability:** el contrato de generación prohíbe paths `file:///` o paths locales absolutos y requiere referencias portables relativas al repositorio.
- [x] **AC-07 — Grounding:** Mermaid y tablas no pueden introducir datos, entidades, relaciones, prioridades o métricas ausentes de las fuentes.
- [x] **AC-08 — Existing Semantics:** measured/calculated/estimated/projected y secret-safety mantienen su semántica actual.
- [x] **AC-09 — Existing Lifecycle:** versioning, immutable reports, source fingerprint y `missing/current/stale` no cambian.
- [x] **AC-10 — Admin Compatibility:** un informe con Markdown tables y Mermaid sigue renderizando mediante el `MarkdownRenderer` existente sin introducir un renderer específico para POC.
- [x] **AC-11 — Documentation:** docs EN/ES incluyen la matriz `Section → Preferred representation` y ejemplos de tabla + Mermaid.
- [ ] **AC-12 — Dogfood:** pendiente hasta que una POC real tenga una conclusión canónica no pendiente; excepción aceptada POC-DOGFOOD-PENDING.

---

# Validation

## Existing POC report

Usar una POC que tenga:

```text
architecture
infrastructure
multiple experiments
measurements
costs
risks
recommendations
```

Generar una nueva versión.

Expected:

```text
Executive Summary
→ snapshot

Success Criteria
→ matrix

Architecture
→ Mermaid

Infrastructure
→ table

Experiments
→ table

Results
→ table

Costs
→ comparison table

Risks
→ matrix

Recommendations
→ structured representation

Traceability
→ relative repository paths
```

solo cuando la evidencia correspondiente exista.

---

## Sparse POC

Usar una POC pequeña con:

```text
hypothesis
1 success criterion
1 spike
no infrastructure
no cost data
```

Expected:

```text
no artificial infrastructure table
no architecture diagram without relationships
no fabricated cost table
```

El reporte puede ser predominantemente narrativo.

---

## Mermaid Grounding

Con fuentes que documenten:

```text
Client
→ API
→ Rules
→ AI Provider
→ Response
```

Expected:

```mermaid
flowchart LR
    Client --> API
    API --> Rules
    Rules --> AI
    AI --> Response
```

No agregar componentes no documentados.

---

## Portable Traceability

Expected:

```markdown
[POC](./poc.md)
[WI-001](./work-items/completed/WI-001-....md)
```

Not expected:

```text
file:///C:/Users/...
/Users/name/repos/...
```

---

# Definition of Done

El WI está completo cuando:

- la skill de POC report selecciona representación además de contenido;
- el report handoff recomienda tablas y Mermaid de forma evidence-driven;
- no existe una cuota artificial de elementos visuales;
- los diagramas están grounded;
- la información comparativa se vuelve escaneable mediante tablas cuando aplica;
- la arquitectura deja de depender de ASCII como representación recomendada;
- Traceability usa paths portables;
- la estructura canónica de 15 secciones permanece intacta;
- versioning/fingerprint/freshness permanecen intactos;
- Admin renderiza el resultado mediante el renderer actual;
- docs EN/ES explican estructura y representación;
- tests cubren guidance y regresión;
- una POC real genera una nueva versión del reporte con composición visual mejorada.

---

# Implementation Handoff Guidance

Este WI refina WI-043; no debe rediseñar la capability de POC Final Reports.

Puntos de extensión principales:

```text
packages/cli/src/core/poc-report.ts
→ buildPocReportContext().handoff

packages/cli/src/skills/skills.ts
→ poc-report-writing

apps/docs/src/content/docs/poc-mode.md
apps/docs/src/content/docs/es/poc-mode.md
→ report representation guidance

packages/cli/tests/poc-report.test.ts
packages/cli/tests/skills.test.ts
→ contract regression
```

Admin ya consume:

```text
PocFinalReport
↓
MarkdownRenderer
```

por lo que debe revisarse la compatibilidad, pero no crear una segunda solución de rendering.

La mejora esperada es:

```text
BEFORE

Evidence
↓
LLM
↓
15 headings
↓
mostly prose/bullets


AFTER

Evidence
↓
classify information
↓
choose representation
├── prose
├── Markdown table
└── Mermaid
↓
15-section POC Final Report
↓
scannable + traceable + grounded
```

Principio rector:

> **El POC Final Report no solo debe contener la evidencia correcta; debe representarla de la forma que permita entender más rápido qué se probó, qué ocurrió y por qué importa.**

## Learning

The strongest representation contract is selective rather than decorative: Core can keep the
report deterministic by communicating how to choose prose, tables, and Mermaid without deciding
the final narrative. A pending POC is valid evidence that dogfood must wait, not a reason to
persist a synthetic report.

## Refinement

### Current behavior verified

- `buildPocReportContext()` supplies deterministic, bounded sources and a handoff, but only asks
  the report-writing agent to use the 15 canonical sections.
- `poc-report-writing` already protects evidence grounding, canonical conclusions, secret safety,
  and human-confirmed persistence, but does not direct the choice between prose, tables, and
  Mermaid.
- Admin's shared `MarkdownRenderer` already renders GitHub-flavored Markdown tables and
  `mermaid` fenced blocks. The persisted report can therefore use both forms without a POC-only
  renderer or UI change.
- The EN/ES POC docs describe the lifecycle and 15 sections but do not describe evidence-driven
  representation or portable traceability links.

### Target journey

1. Core produces the same bounded report context and explicitly communicates representation rules.
2. The report-writing agent selects prose, a Markdown table, or Mermaid only when the selected
   evidence supports that form.
3. The agent returns the usual human-review proposal; Core persists the same immutable, versioned
   artifact after confirmation.
4. GitHub, local clones, and Kaddo Admin render portable report links, tables, and Mermaid from
   the same Markdown artifact.

### Technical approach

1. Extend the deterministic handoff with concise, non-prescriptive rules for tables, Mermaid,
   prose, no ASCII substitutes, grounding, and repository-relative traceability.
2. Extend the existing `poc-report-writing` skill with section-level representation guidance and
   a quality checklist. Keep every form optional and forbid fabricated rows, relations, priorities,
   or measurements.
3. Extend POC mode docs in English and Spanish with the canonical section-to-representation table,
   compact examples, and the portability rule.
4. Add focused tests for the Core handoff, installed skill content, and the existing Admin renderer
   capabilities. Do not change report persistence, source selection, fingerprints, versioning, or
   Admin layout.

### Validation plan

- Core handoff contains evidence-driven table/Mermaid/prose guidance, prohibits ASCII diagrams
  when Mermaid is appropriate, and requires repository-relative traceability.
- The report-writing skill includes the representation matrix, anti-hallucination rules, portable
  paths, and its quality checklist.
- Admin renderer regression verifies GFM tables and `language-mermaid` use the shared renderer.
- Full suite, workspace build, docs build, skill synchronization check, and `git diff --check`
  remain green.
