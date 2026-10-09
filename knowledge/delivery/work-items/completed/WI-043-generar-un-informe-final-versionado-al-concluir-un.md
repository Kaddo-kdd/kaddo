---
type: feature
id: WI-043
title: Generar un informe final versionado al concluir una Proof of Concept
status: completed
work_type: feature
created_at: '2026-10-09'
source:
  type: external
  imported_at: '2026-10-09'
  source_format: markdown-frontmatter
  source_hash: 4399b4c348214258a3c74492ed575cbddfae12ad2c19bb86fc673d61caa1aff7
  inferred: false
generated_by: kaddo-admin
domains:
  - Tech
  - Delivery
affected_modules:
  - core
code:
  - packages/cli/src/core/poc.ts
  - packages/cli/src/core/poc-report.ts
  - packages/cli/src/core/next-step.ts
  - packages/cli/src/core/project-route.ts
  - packages/cli/src/commands/poc.ts
  - packages/cli/src/index.ts
  - packages/mcp/src/server.ts
  - packages/mcp/src/resources.ts
  - packages/cli/src/agents/prompts.ts
  - packages/cli/src/skills/skills.ts
  - packages/cli/tests/poc-mode.test.ts
  - packages/mcp/tests/poc-resource.test.ts
  - README.md
  - apps/docs/src/content/docs/poc-mode.md
  - apps/docs/src/content/docs/es/poc-mode.md
summary: Generar un informe final versionado al concluir una Proof of Concept
original_snapshot:
  title: Generar un informe final versionado al concluir una Proof of Concept
  type: feature
  status: draft
scope_confidence:
  level: high
  reasons:
    - >-
      The POC lifecycle, projections, MCP preview/confirm pattern, and
      report-writing conventions already exist.
refined_by: work-item-refinement (manual)
ready_at: '2026-10-09'
implementation_status: completed
validation_status: passed
verified_at: '2026-10-09'
completed_at: '2026-10-09'
release_version: v3.119.0
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/poc-report.ts
        - packages/cli/src/commands/poc.ts
        - packages/cli/src/core/next-step.ts
        - packages/cli/src/core/project-route.ts
        - packages/mcp/src/server.ts
        - packages/mcp/src/tools.ts
        - packages/mcp/src/resources.ts
        - packages/cli/src/skills/skills.ts
        - README.md
        - apps/docs/src/content/docs/poc-mode.md
        - apps/docs/src/content/docs/es/poc-mode.md
      validations:
        - command: pnpm exec vitest run --config vitest.config.ts packages/cli/tests/poc-report.test.ts packages/cli/tests/poc-mode.test.ts packages/mcp/tests/poc-resource.test.ts
          status: passed
          reason: Focused report, lifecycle, route, and MCP resource tests passed (10/10).
        - command: pnpm --filter @kaddo/cli build && pnpm --filter @kaddo/mcp build && pnpm --filter @kaddo/docs build
          status: passed
          reason: CLI, MCP, and documentation builds passed.
        - command: pnpm agent-plugin:check && pnpm npm-readme:check && git diff --check
          status: passed
          reason: Agent Plugin skill, distributed README, and whitespace checks passed.
---

# Generar un informe final versionado al concluir una Proof of Concept

## Intent

Kaddo ya soporta un modo de proyecto `poc` orientado a:

```text
Problem
↓
Hypothesis
↓
Success Criteria
↓
Minimal Technical Context
↓
Experiment / Work Items
↓
Evidence
↓
Conclusion
```

El artifact canónico:

```text
knowledge/delivery/poc.md
```

permite gestionar el experimento y registrar una conclusión:

```text
validated
rejected
inconclusive
```

Sin embargo, al finalizar una POC existe una necesidad diferente: producir un **informe comunicable y autocontenido** que consolide qué se intentó validar, qué se construyó, qué infraestructura o Project Resources participaron, qué pruebas se ejecutaron, qué evidencia se obtuvo, qué se aprendió y cuál es la recomendación final.

Actualmente esa información puede quedar distribuida entre:

```text
poc.md
Work Items
Implementation Evidence
Verification
Learning
Tech Knowledge
Project Resources
ADRs
arquitectura
infraestructura
mediciones
```

El objetivo de este WI es incorporar un **POC Final Report** opcional y versionado que consolide esa información al terminar el experimento sin convertir el reporte en el source of truth de la POC.

---

# Product Principle

## POC artifact ≠ Final Report

Mantener dos responsabilidades diferentes:

```text
poc.md
→ working artifact
→ define y gobierna el experimento
→ hypothesis
→ criteria
→ evidence references
→ conclusion
```

frente a:

```text
poc-report-v001.md
→ communication artifact
→ snapshot consolidado
→ arquitectura
→ implementación
→ infraestructura
→ pruebas
→ resultados
→ aprendizajes
→ recomendación
```

`poc.md` continúa siendo el artifact canónico de la POC.

El informe final es una **proyección versionada del conocimiento y evidencia disponible en un momento determinado**.

---

# Goal

Cuando una POC alcance una conclusión:

```text
validated
rejected
inconclusive
```

Kaddo debe ofrecer, pero no imponer, la generación de un informe final:

```text
Evidence
↓
Conclusion
↓
POC concluded
↓
Generate final report?
   / \
 Yes  No
  ↓
Final POC Report
```

La POC se considera concluida aunque el usuario seleccione `No`.

El reporte nunca debe convertirse en un gate obligatorio para completar una POC.

---

# 1. Final Report Location

Los informes deben vivir junto al artifact POC:

```text
knowledge/delivery/
├── poc.md
├── poc-report-v001.md
├── poc-report-v002.md
├── poc-report-v003.md
└── work-items/
```

No crear inicialmente una jerarquía adicional de directorios.

---

# 2. Immutable Versioned Reports

Cada generación produce una nueva versión.

Primera generación:

```text
poc-report-v001.md
```

Si posteriormente cambia evidencia relevante y el usuario decide volver a generar:

```text
poc-report-v002.md
```

y así sucesivamente.

No sobrescribir versiones anteriores.

Los informes representan snapshots históricos de la POC.

---

# 3. Report Metadata

Cada report debe incluir metadata suficiente para trazabilidad.

Ejemplo conceptual:

```yaml
---
type: poc-report
report_version: 2
generated_at: 2026-10-09
poc_conclusion: validated
source_fingerprint: <deterministic-hash>
supersedes: poc-report-v001.md

sources:
  poc: knowledge/delivery/poc.md
  work_items:
    - WI-001
    - WI-002
  resources:
    - RES-azure-platform
    - RES-ai-foundry
  knowledge:
    - knowledge/tech/current-state.md
---
```

Los nombres exactos pueden adaptarse a las convenciones de artifacts existentes de Kaddo.

---

# 4. Deterministic Report Context

Core debe construir un contexto de reporte determinístico antes de cualquier síntesis mediante LLM.

Debe considerar únicamente información existente y trazable, incluyendo cuando aplique:

```text
POC artifact
Completed experiment Work Items
Implementation Evidence
Verification
Learning
Relevant Project Resources
Relevant Tech Knowledge
ADRs / technical decisions
Architecture knowledge
Available measurements
```

No leer indiscriminadamente todo el repositorio.

No interpretar resultados ni inventar conclusiones.

---

# 5. Source Selection

El contexto del informe debe ser proporcional.

Como mínimo siempre incluir:

```text
knowledge/delivery/poc.md
```

Cuando exista evidencia relacionada, incluir:

```text
experiment Work Items
their Implementation Evidence
their Verification
their Learning
Resources referenced by those WIs
relevant Tech Knowledge
relevant ADRs
```

Si Kaddo no puede determinar con suficiente certeza que un artifact pertenece al experimento, debe:

```text
mark it as candidate
or
leave it out
```

en lugar de incluirlo como hecho.

La selección final de fuentes debe quedar visible en el report context.

---

# 6. LLM Synthesizes, Core Persists

Mantener el principio existente de Kaddo:

```text
Core
→ gathers facts

LLM
→ synthesizes narrative

Human
→ reviews

Core
→ persists confirmed artifact
```

No:

```text
Core
→ invents narrative conclusions
```

Flujo esperado:

```text
POC Knowledge
+
Evidence
+
Resources
+
Tech Knowledge
+
Decisions
       ↓
PocReportContext
       ↓
LLM
       ↓
Report proposal
       ↓
Human confirmation
       ↓
Core
       ↓
poc-report-v00N.md
```

---

# 7. Explicit Opt-in at POC Completion

Cuando la conclusión deje de estar en:

```text
pending
```

y pase a:

```text
validated
rejected
inconclusive
```

la route / next-step debe reconocer que el experimento terminó.

Debe ofrecer una recomendación opcional equivalente a:

```text
POC concluded: validated.

Generate the final POC report?
```

La respuesta debe poder ser:

```text
Yes
No
```

Seleccionar `No`:

```text
does not reopen the POC
does not block completion
does not create a report
```

---

# 8. CLI Report Flow

Agregar una superficie bajo el dominio POC, conceptualmente:

```bash
kaddo poc report
```

Si la conclusión sigue pendiente:

```text
POC conclusion is still pending.

Record one of:
validated
rejected
inconclusive

before generating a final report.
```

Si la POC está concluida y no existe report:

```text
POC conclusion: validated
Experiments: 3 completed
Evidence: available
Resources: 4 relevant

Generate final POC report?
```

El comando no debe llamar directamente a un proveedor de IA.

Debe preparar el context/handoff necesario para que un agente pueda generar el informe.

---

# 9. Report Freshness

Core debe poder determinar si el último informe todavía representa las fuentes actuales.

Guardar un:

```text
source_fingerprint
```

determinístico calculado sobre las fuentes relevantes utilizadas por el reporte.

Estados derivados:

```text
missing
current
stale
```

Ejemplo:

```text
Final report
v001

Status:
stale

Changes since report:
- POC evidence changed
- WI-003 verification changed
- RES-azure-platform changed
```

No regenerar automáticamente.

---

# 10. Regeneration Flow

Cuando exista un informe y las fuentes hayan cambiado:

```text
Latest report: v001
Changes since report: yes

Generate v002?
```

Si el usuario acepta:

```text
new context
↓
LLM synthesis
↓
human confirmation
↓
poc-report-v002.md
```

`v001` permanece intacto.

Si las fuentes no han cambiado:

```text
Latest report v001 already represents the current evidence.
```

No crear otra versión accidentalmente.

Una regeneración idéntica solo debe permitirse mediante confirmación explícita o una opción equivalente a `--force`, si se considera necesaria durante Handoff.

---

# 11. Canonical Final Report Structure

La documentación de Kaddo debe definir una estructura recomendada y consistente para los informes finales.

La estructura canónica será:

```text
POC Final Report

1. Executive Summary

2. Problem and Objective

3. Hypothesis and Success Criteria

4. Scope, Constraints and Non-goals

5. Technical Approach and Architecture

6. Infrastructure and Project Resources

7. Implementation and Relevant Technical Decisions

8. Experiments and Validation

9. Results and Measurements

10. Cost and Efficiency Analysis

11. Observability and Operational Findings

12. Findings, Learnings, Limitations and Risks

13. Conclusion

14. Recommendation and Next Steps

15. Traceability and Sources
```

---

# 12. Report Section Semantics

## 1. Executive Summary

Debe responder de forma compacta:

```text
What was tested?
Why?
What was the outcome?
What should happen next?
```

Debe incluir el estado:

```text
validated
rejected
inconclusive
```

---

## 2. Problem and Objective

Consolidar:

```text
Problem
Expected Value
Scenario
```

desde `poc.md`.

No inventar business context que no exista.

---

## 3. Hypothesis and Success Criteria

Mostrar:

```text
original hypothesis
success criteria
result for each criterion when evidence exists
```

Distinguir claramente:

```text
passed
failed
not evaluated
unknown
```

---

## 4. Scope, Constraints and Non-goals

Consolidar los límites definidos en la POC para evitar interpretar los resultados más allá del experimento ejecutado.

---

## 5. Technical Approach and Architecture

Describir, cuando exista evidencia:

```text
architecture
components
data/control flow
important technical boundaries
external dependencies
```

Puede incluir Mermaid si el conocimiento existente contiene relaciones suficientes para representarlo.

No inventar componentes para completar un diagrama.

---

## 6. Infrastructure and Project Resources

Cuando aplique, consolidar:

```text
Project Resources involved
provider
resource purpose
environment
access boundaries
infrastructure topology
deployed components
observability components
```

No copiar:

```text
tokens
passwords
private keys
connection strings
secret values
```

Authentication references pueden mencionarse únicamente por nombre cuando aporte contexto.

---

## 7. Implementation and Relevant Technical Decisions

Describir únicamente decisiones relevantes para entender qué se probó.

Ejemplos:

```text
deterministic preprocessing
LLM responsibilities
API boundaries
storage decisions
deployment approach
relevant ADRs
```

No convertir el informe en documentación exhaustiva del código.

---

## 8. Experiments and Validation

Consolidar los experimentos ejecutados:

```text
Work Item / experiment
scenario
expected result
observed result
verification status
evidence
```

Debe distinguir pruebas reales de simulaciones o validaciones parciales.

---

## 9. Results and Measurements

Incluir únicamente mediciones respaldadas por evidencia:

```text
functional results
latency
tokens
throughput
accuracy/agreement
resource consumption
other experiment metrics
```

No producir métricas estimadas como si fueran mediciones reales.

---

## 10. Cost and Efficiency Analysis

Sección opcional.

Incluir cuando existan datos suficientes:

```text
unit cost
token cost
infrastructure cost
comparison with baseline
projected cost
estimated savings
```

Distinguir:

```text
measured
calculated
estimated
projected
```

Si no existe evidencia suficiente, indicar:

```text
Not evaluated in this POC.
```

---

## 11. Observability and Operational Findings

Cuando aplique:

```text
logging
monitoring
Application Insights / equivalent
errors observed
operational constraints
deployment observations
```

No exigir esta sección en POCs donde no sea relevante.

---

## 12. Findings, Learnings, Limitations and Risks

Consolidar:

```text
what worked
what did not work
technical learnings
known limitations
risks discovered
remaining unknowns
```

Debe preservar incertidumbre cuando la evidencia no permita una afirmación fuerte.

---

## 13. Conclusion

Debe reflejar la conclusión canónica de:

```text
knowledge/delivery/poc.md
```

No permitir que el reporte contradiga el estado de la POC.

Valores:

```text
validated
rejected
inconclusive
```

Debe explicar brevemente por qué la evidencia soporta esa conclusión.

---

## 14. Recommendation and Next Steps

Puede proponer:

```text
stop
run another experiment
address a remaining unknown
graduate to standard mode
design an MVP
perform production architecture work
```

Las recomendaciones deben distinguirse de hechos observados.

---

## 15. Traceability and Sources

Cerrar el informe con referencias a sus fuentes.

Ejemplo:

```text
POC
- knowledge/delivery/poc.md

Work Items
- WI-001
- WI-002

Project Resources
- RES-azure-platform
- RES-ai-foundry

Knowledge
- knowledge/tech/current-state.md

Decisions
- ADR-003
```

Esto permite auditar de dónde salió cada parte relevante del reporte.

---

# 13. Missing Sections Must Not Cause Hallucination

La estructura define el orden recomendado, pero no obliga a inventar información.

Para secciones sin evidencia:

```text
Not evaluated
Not applicable
No evidence available
```

son respuestas válidas.

No completar información usando conocimiento general del LLM cuando no está respaldada por el proyecto.

---

# 14. Agent / Skill for Report Generation

Agregar o extender un asset de agente/skill para generar el reporte desde `PocReportContext`.

Responsabilidades:

```text
read provided report context
preserve terminology
synthesize, not invent
distinguish measured vs estimated
respect secret-safety
follow canonical report structure
include traceability
```

El agente no debe:

```text
scan the full repository arbitrarily
infer missing test results
invent architecture
invent costs
change the POC conclusion
write secrets
```

---

# 15. MCP Support

Agregar superficies MCP equivalentes para:

```text
prepare POC report context
inspect latest report/status
persist a confirmed generated report
```

El patrón debe seguir:

```text
prepare
↓
LLM synthesis
↓
preview
↓
human confirmation
↓
persist
```

La mutación no debe ocurrir silenciosamente.

Puede exponerse además el último report mediante un resource read-only equivalente a:

```text
kaddo://poc-report
```

El naming exacto queda para Handoff.

---

# 16. Report Is Optional in the Route

Extender la route POC:

```text
Hypothesis
↓
Success Criteria
↓
Technical Context
↓
Resources
↓
Experiment
↓
Evidence
↓
Conclusion
↓
Final Report (optional)
```

El paso:

```text
Final Report
```

debe aparecer como:

```text
optional
```

cuando la conclusión ya está registrada.

No incluirlo en el porcentaje obligatorio de finalización de la POC.

---

# 17. Documentation

Actualizar la documentación EN/ES de POC mode.

Debe incluir explícitamente:

```text
What the Final POC Report is
Difference between poc.md and the report
When it can be generated
Why generation is optional
Location
Versioning
Freshness / stale reports
How to regenerate
LLM + human confirmation flow
Secret-safety
Canonical report structure
Graduation to standard mode
```

La documentación debe mostrar completa la estructura definida en este WI:

```text
1. Executive Summary
2. Problem and Objective
3. Hypothesis and Success Criteria
4. Scope, Constraints and Non-goals
5. Technical Approach and Architecture
6. Infrastructure and Project Resources
7. Implementation and Relevant Technical Decisions
8. Experiments and Validation
9. Results and Measurements
10. Cost and Efficiency Analysis
11. Observability and Operational Findings
12. Findings, Learnings, Limitations and Risks
13. Conclusion
14. Recommendation and Next Steps
15. Traceability and Sources
```

Esta estructura forma parte del contrato documental de la capability y no debe quedar únicamente embebida en un prompt de agente.

---

# Out of Scope

Este WI no incluye:

```text
generar PDF o DOCX del informe;
publicar automáticamente el informe fuera del repositorio;
enviar el informe por email;
dashboards de resultados;
ejecutar nuevamente los experimentos;
medir automáticamente costos cloud;
consultar proveedores externos para completar datos faltantes;
ejecutar Project Resources;
cambiar automáticamente project.mode a standard;
hacer obligatorio el reporte para cerrar una POC;
sobrescribir reportes anteriores;
guardar secretos o datos sensibles en el reporte;
usar información externa no presente en el contexto sin indicarlo.
```

---

## Acceptance Criteria

- [x] **AC-01 — Report Artifact:** una POC concluida puede producir `knowledge/delivery/poc-report-v001.md`.
- [x] **AC-02 — Optional:** el informe es opcional y su ausencia no bloquea la conclusión de la POC.
- [x] **AC-03 — Versioning:** nuevas generaciones crean `v002`, `v003`, etc., sin sobrescribir versiones anteriores.
- [x] **AC-04 — Source Fingerprint:** cada report registra un fingerprint determinístico de las fuentes utilizadas.
- [x] **AC-05 — Freshness:** Core puede distinguir report `missing`, `current` y `stale`.
- [x] **AC-06 — No Auto-generation:** cambios de Knowledge/Evidence no generan informes automáticamente.
- [x] **AC-07 — Completion Prompt:** después de registrar una conclusión, el flujo ofrece generar el informe final.
- [x] **AC-08 — Deterministic Context:** Core construye un PocReportContext trazable sin interpretar ni inventar resultados.
- [x] **AC-09 — LLM Boundary:** la narrativa es sintetizada por un agente/LLM y Core solo persiste el resultado confirmado.
- [x] **AC-10 — Evidence Grounding:** resultados, métricas, costos y conclusiones solo aparecen como hechos cuando están respaldados por las fuentes del reporte.
- [x] **AC-11 — Secret Safety:** context, MCP y artifact final no exponen valores secretos.
- [x] **AC-12 — Canonical Conclusion:** el report no puede contradecir la conclusión registrada en `poc.md`.
- [x] **AC-13 — MCP:** un agente puede preparar el contexto y persistir un report mediante preview + confirmación humana.
- [x] **AC-14 — Optional Route Step:** Project Route representa Final Report como paso opcional posterior a Conclusion.
- [x] **AC-15 — Documentation:** docs EN/ES explican flujo, versionado, freshness y contienen la estructura completa de 15 secciones del informe.
- [x] **AC-16 — Backward Compatibility:** POCs existentes sin reports continúan funcionando sin migración.

---

# Validation

## First Report

POC:

```text
Conclusion: validated
```

Ejecutar el flujo de report.

Expected:

```text
Generate final POC report?
→ Yes

knowledge/delivery/poc-report-v001.md
```

con metadata:

```text
report_version: 1
poc_conclusion: validated
source_fingerprint: ...
```

---

## Decline Report

POC concluida:

```text
Generate final POC report?
→ No
```

Expected:

```text
POC remains completed
no report created
route shows report as optional
```

---

## New Evidence

Con:

```text
poc-report-v001.md
```

modificar evidencia relevante.

Expected:

```text
report status: stale
```

pero:

```text
no v002 automatically created
```

Al solicitar nuevamente el report:

```text
Changes since v001 detected.

Generate v002?
```

Expected:

```text
poc-report-v001.md preserved
poc-report-v002.md created
```

---

## No Changes

Con report actual:

```text
status: current
```

solicitar generación.

Expected:

```text
The current POC report already represents the latest evidence.
```

No crear una nueva versión por defecto.

---

## Evidence Grounding

Si no existen costos:

Expected report:

```text
## Cost and Efficiency Analysis

Not evaluated in this POC.
```

No generar estimaciones arbitrarias.

---

## Secret Safety

Resource:

```text
authentication ref: AZURE_AI_API_KEY
```

Expected:

```text
AZURE_AI_API_KEY
```

puede aparecer como referencia si es relevante.

El valor del secreto:

```text
must never appear
```

---

# Definition of Done

El WI está completo cuando:

- una POC concluida ofrece generar un informe final opcional;
- el reporte vive junto a `poc.md`;
- los reportes son versionados e inmutables;
- las modificaciones posteriores producen estado `stale`, no regeneración automática;
- una nueva versión se crea únicamente por decisión explícita;
- Core ensambla un contexto trazable;
- el LLM sintetiza y el humano confirma;
- el informe consolida POC, Tech, Resources, WIs, Evidence, Verification, Learning y Decisions cuando sean relevantes;
- costos y métricas no se inventan;
- la conclusión coincide con `poc.md`;
- MCP soporta el flujo agent-driven;
- Route representa el informe como opcional;
- versiones anteriores permanecen disponibles;
- secret-safety se conserva;
- tests cubren versioning, fingerprint, stale/current/missing, conclusión pendiente y confirmación;
- docs EN/ES contienen la estructura canónica completa del informe;
- una POC real se utiliza como dogfood para producir `poc-report-v001.md`.

---

# Implementation Handoff Guidance

Partir de la capability POC existente.

Puntos actuales relevantes:

```text
packages/cli/src/core/poc.ts
→ POC_ARTIFACT_PATH
→ PocSummary
→ conclusion parsing

packages/cli/src/core/next-step.ts
→ poc-evaluate
→ poc-complete

packages/cli/src/core/project-route.ts
→ POC route
→ conclusion evaluation

packages/mcp/src/resources.ts
→ kaddo://poc

knowledge/delivery/poc.md
→ canonical experiment artifact

Work Items
→ Implementation Evidence
→ Verification
→ Learning

Project Resources
→ technical external dependencies
```

Agregar encima:

```text
POC concluded
      ↓
Report Context Builder
      ↓
source selection
      ↓
source fingerprint
      ↓
LLM report handoff
      ↓
human review
      ↓
Core persistence
      ↓
poc-report-v00N.md
```

No mezclar la implementación del reporte con el lifecycle canónico de `poc.md`.

El report debe ser una **derived projection**, igual que otros handoffs/projections de Kaddo:

```text
Sources of truth
      ↓
Derived POC Report
```

y nunca:

```text
POC Report
      ↓
becomes source of truth
```

La capability debe optimizar un caso práctico:

> Al terminar una POC, poder entregar a otra persona un único documento que explique qué se quiso comprobar, qué se construyó, cómo se desplegó, qué se probó, qué ocurrió, cuánto costó cuando se midió, qué se aprendió y qué se recomienda hacer después; preservando al mismo tiempo la trazabilidad hacia la evidencia original.

## Refinement

### Current behavior verified

- `packages/cli/src/core/poc.ts` owns the canonical `poc.md` path, template, and a small parsed
  `PocSummary`; it currently exposes only the conclusion and definition completeness needed by
  the POC route.
- Once a conclusion is recorded, `resolveNextStep()` returns `poc-complete` and the POC route
  ends at `poc-evaluate`; neither projection models a final report or its optionality.
- CLI report commands are registered centrally in `packages/cli/src/index.ts`. There is no POC
  report command or report-context builder today.
- MCP resources expose `kaddo://poc`, while MCP mutations already follow a preview followed by an
  explicit `confirm=true` persistence pattern. This is the correct boundary for persisting a
  human-approved report.
- The repository contains Project Resources and the standard Work Item lifecycle, but no derived
  POC-report artifact, report fingerprint, report-status projection, or report-generation agent
  asset.

### Target journey

1. A user completes an experiment and records `validated`, `rejected`, or `inconclusive` in
   `knowledge/delivery/poc.md`.
2. Route and next-step show **Final Report** as optional, never as a completion gate.
3. `kaddo poc report` (or the matching MCP prepare surface) builds a deterministic,
   source-attributed `PocReportContext`. A pending conclusion returns a clear no-write response.
4. A report agent uses only that context to prepare a proposal with the 15 canonical sections;
   the user reviews it.
5. The MCP/CLI persistence surface previews the next immutable filename and writes it only after
   explicit human confirmation. The first report is `poc-report-v001.md`.
6. The report status is `missing`, `current`, or `stale`. Changes to selected sources never write
   a report automatically. A stale report may produce the next version; an identical regeneration
   requires an explicit force/confirmation path.

### Technical approach

1. Add a focused `poc-report` Core module beside `poc.ts`. It will discover reports in
   `knowledge/delivery/`, parse safe report metadata, select a bounded traceable source set, build
   a stable sorted fingerprint from paths and contents, and derive `missing/current/stale` plus
   changed-source labels. Keep the report context separate from `PocSummary` so the lifecycle
   artifact remains small and canonical.
2. Select `poc.md` unconditionally. Include completed experiment Work Items and their local
   evidence/verification/learning only when they can be attributed by direct links or stable IDs;
   include referenced Resources, Tech knowledge, and ADRs only when their relationship is
   explicit. Unknown candidates remain candidates or are omitted. Do not scan arbitrary source
   code or all repository knowledge.
3. Add `kaddo poc report` as a no-provider handoff/status command. It will reject pending POCs,
   print report status plus the source selection, and produce the context an installed report
   agent needs. Persisting a proposed Markdown report remains a separate explicit confirmation
   action and validates filename/version, frontmatter, canonical conclusion, and secret safety.
4. Extend the POC route and `resolveNextStep()` with an optional post-conclusion report step. It
   must not alter required route completion counts or replace the existing standard-mode
   graduation recommendation.
5. Add MCP surfaces for report context/status, preview/persist-confirmed report, and a read-only
   `kaddo://poc-report` resource. Follow the existing preview/confirm contract: no silent writes,
   no provider invocation, and no secret value exposure.
6. Add a report-generation agent/skill (or extend the established POC asset if one exists) with
   the canonical 15-section structure, explicit evidence grounding, measured/calculated/estimated
   labeling, and the prohibition on repository-wide exploration or conclusions that contradict
   `poc.md`.
7. Update README and EN/ES POC documentation with the distinction between working artifact and
   report projection, optional flow, versioning, freshness, regeneration, human confirmation,
   secret safety, graduation guidance, and every canonical report section.

### Design decisions

- **Authority:** `poc.md` remains the only POC lifecycle source of truth. The report is an
  immutable communication snapshot and cannot change a POC conclusion.
- **Fingerprint:** fingerprint the exact normalized source manifest used for a report, sorted by
  project-relative path and content digest. This makes freshness reproducible and makes omitted
  sources visible rather than implicitly assumed.
- **Versioning:** derive the next three-digit version from existing valid report filenames and
  refuse overwrite. `supersedes` points only to the immediately prior valid report.
- **LLM boundary:** Core gathers, fingerprints, validates, and persists. The LLM only receives
  the bounded context and synthesizes a proposed narrative. A human confirmation is mandatory
  before persistence.
- **Secret safety:** contexts and persistence operate on repository artifacts and existing
  resource references only. They must exclude secret values, credential material, private keys,
  and connection strings; a secret reference name may remain when it is already safely recorded.
- **No artificial data:** absent evidence renders an explicit empty-state statement such as
  `Not evaluated in this POC.` rather than a fabricated metric, cost, architecture, or test result.

### Affected and reviewed areas

Affected: POC Core parsing and new report projection, CLI command registration and POC command,
route/next-step projection, MCP tools/resources, agent and skill catalogs, focused CLI/MCP tests,
README, and EN/ES POC docs.

Reviewed, not expected to change: `poc.md` lifecycle semantics, Work Item state transitions,
Project Resource execution, external providers, automatic cloud-cost collection, Admin UI/API,
standard-mode bootstrap, and PDF/DOCX or email publication.

### Validation plan

- First report: fixture with a concluded POC builds a deterministic context, previews
  `poc-report-v001.md`, then persists only after confirmation with version, conclusion,
  fingerprint, and source manifest metadata.
- Pending and decline: a pending conclusion produces no proposal/write; declining confirmation
  leaves the concluded POC unchanged with no report.
- Versioning/freshness: write v001, change a selected evidence source, assert `stale` and no
  automatic v002; confirmed regeneration writes v002 and preserves v001. With unchanged sources,
  assert `current` and require explicit force/confirmation before any duplicate version.
- Attribution: verify unrelated Work Items, Tech artifacts, ADRs, and resources are not silently
  selected; directly referenced sources are listed in the context and report traceability.
- Grounding and safety: fixtures without cost/metrics use the prescribed empty states; resource
  secret reference names may appear but credential values never enter context, preview, resource,
  or persisted report.
- Projection/MCP: assert the route shows Final Report as optional after conclusion, next-step
  recommends it without blocking completion, `kaddo://poc-report` is read-only, and MCP persistence
  is preview-first.
- Regression: run focused CLI/MCP tests, CLI/MCP/docs builds, `pnpm npm-readme:check`,
  `pnpm agent-plugin:check`, and `git diff --check`.

### Implementation handoff

Start with deterministic Core source selection, report discovery/versioning, and fingerprint tests.
Then add the CLI and MCP handoff/persistence surfaces, followed by route, agent/skill, and docs
projections. Keep report synthesis provider-neutral and do not make the report a POC-completion
requirement. Before implementation, inspect actual Work Item evidence/verification/Learning
formats and Project Resource/ADR references so attribution uses established Kaddo relationships
rather than filename guesses.

## Learning

The report must remain a derived projection: a deterministic source manifest and fingerprint let
Kaddo expose freshness without allowing an LLM, a route projection, or a communication artifact
to become the source of truth for the experiment.
