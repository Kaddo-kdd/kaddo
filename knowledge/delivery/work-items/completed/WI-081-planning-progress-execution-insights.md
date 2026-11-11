---
type: feature
id: WI-081
title: Planning Progress & Execution Insights
status: completed
work_type: feature
created_at: '2026-11-11'
source:
  type: external
  imported_at: '2026-11-11'
  source_format: kaddo-frontmatter
  source_hash: f8df64fe2e4f28be28092d81edeb4bf1afdf23dfc108af805fdc7881218c5d4d
  inferred: false
generated_by: kaddo-admin
knowledge_level: K4
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - cli
  - admin-server
  - admin
  - docs
antecedent:
  - WI-074
  - WI-075
  - WI-076
  - WI-077
  - WI-078
  - WI-079
  - WI-080
scope_confidence:
  level: high
  reasons:
    - >-
      Core ya calcula progreso (computePlanProgress/computeEpicProgress/
      computeInitiativeProgress) y readiness/outcome por evidencia
      (evaluatePlanCompletion/evaluateEpicCompletion/evaluateInitiativeCompletion).
    - >-
      validatePlanningGraph ya emite findings deterministas
      (invalid_reference/dependency_cycle/pending_dependency/duplicate_milestone).
    - >-
      Admin ya tiene Planning Explorer y el endpoint /api/v1/admin/planning; la
      vista es read-only y reutiliza detalles existentes.
    - >-
      WI-078/WI-079 fijaron el contrato de verificación por evidencia; esta
      entrega lo agrega, sin crear un verificador paralelo.
summary: >-
  Añadir a Planning Overview de Kaddo Admin una vista read-only de ejecución y
  decisiones que consolide, reutilizando Core, Planning Coverage, Delivery
  Progress y Outcome Verification por separado, una Attention Queue de findings
  canónicos con origen/razón/navegación, e insights de milestones/outcome. Sin
  inventar métricas, sin doble conteo, sin verificador nuevo; Markdown canónico
  y Planning opcional.
original_snapshot:
  title: Planning Progress & Execution Insights
  description: >-
    WI-074 a WI-079 establecieron un modelo opcional de Planning (Delivery
    Plans, Epics, Initiatives y Work Items), gestión visual, trazabilidad y
    completion verificado mediante evidencia. WI-080 estabilizó el escenario E2E
    de integración externa y dejó la suite completa en verde.
  type: feature
  status: draft
ready_at: '2026-11-11'
implementation_status: completed
validation_status: passed
released_in: v3.137.0
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/planning-insights.ts
        - packages/cli/src/core/delivery-planning.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/planning-insights.test.ts
      validations:
        - command: pnpm vitest run packages/cli/tests/planning-insights.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/src/server.ts
        - packages/admin-server/tests/planning-insights.test.ts
      validations:
        - command: >-
            pnpm vitest run packages/admin-server/tests/planning-insights.test.ts
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/PlanningInsights.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/planning-insights.spec.ts
      validations:
        - command: >-
            pnpm --filter @kaddo/admin exec playwright test (suite completa, 53/53)
          status: passed
        - command: pnpm --filter @kaddo/admin exec tsc -b
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/delivery-planning.md
        - apps/docs/src/content/docs/es/delivery-planning.md
      validations:
        - command: pnpm --filter ./apps/docs build
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Existe un inventario documentado de métricas/señales, sus funciones canónicas y su interpretación.'
      status: passed
      evidence: >-
        §6.5 del WI tabula cada indicador con su función Core de origen
        (computeX Progress, evaluateX Completion, validatePlanningGraph, etc.).
      reference: knowledge/delivery/work-items/completed/WI-081-planning-progress-execution-insights.md
      method: manual
    - criterion: '**AC-02:** Planning Coverage, Delivery Progress y Outcome Verification aparecen separados; no existe porcentaje global engañoso.'
      status: passed
      evidence: >-
        PlanningInsights expone coverage/delivery/outcome como estructuras
        distintas; test "keeps coverage, delivery and outcome separate".
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-03:** Los totales de Work Items no presentan doble conteo por asociaciones múltiples dentro del mismo universo.'
      status: passed
      evidence: >-
        Se enumera cada WI una vez (discoverWorkItems) y se clasifica; test
        "dedupes a Work Item shared by Initiative and Epic".
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-04:** La ausencia de datos se comunica sin inventar ceros, cumplimiento, riesgos ni fechas.'
      status: passed
      evidence: >-
        Proyecto vacío devuelve ceros sin NaN; la UI muestra "—"/"no data" cuando
        el denominador es cero (test empty project + componente).
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-05:** La vista admite Plans/Epics/Initiatives opcionales y Work Items independientes sin relaciones ficticias.'
      status: passed
      evidence: >-
        delivery.independent separa los WI sin jerarquía; test valida WI
        independiente contado aparte, no forzado.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-06:** Toda agregación o clasificación nueva se implementa en Core y Admin no duplica reglas de dominio.'
      status: passed
      evidence: >-
        La agregación vive en planning-insights.ts (Core); el adaptador solo
        delega (getPlanningInsightsAdmin), sin reglas en adapter/UI/SQL.
      reference: packages/cli/src/core/planning-insights.ts
      method: automated
    - criterion: '**AC-07:** Overview muestra una síntesis legible de bloqueos, resultados pendientes de verificación y milestones que requieren revisión.'
      status: passed
      evidence: >-
        Tres indicadores (blocking/outcome/milestones) en el Overview; E2E asserta
        su presencia.
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-08:** La vista presenta cobertura de candidatos y entrega de Work Items, con universos y denominadores claros.'
      status: passed
      evidence: >-
        Coverage (materialized/total) y Delivery (completed/total, blocked,
        independent) con denominadores explícitos; test del endpoint.
      reference: packages/admin-server/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-09:** Los estados de outcome muestran passed/failed/not-verified/manual-review y situaciones ambiguas/obsoletas donde existan.'
      status: passed
      evidence: >-
        OutcomeRollup lleva passed/failed/notVerified/manualReview/ambiguous/stale;
        la UI los muestra por separado.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-10:** Completion readiness se representa sin confundirlo con lifecycle `completed` ni con autorización humana.'
      status: passed
      evidence: >-
        La tabla Readiness muestra READY_*/NEEDS_WORK/BLOCKED distinto del status;
        E2E asserta la nota "not the same as a completed lifecycle status".
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-11:** Needs attention recoge hallazgos canónicos de dependencias, trabajo incompleto, cobertura y verificación pendiente.'
      status: passed
      evidence: >-
        La Attention Queue se deriva de validatePlanningGraph + evaluaciones por
        entidad; test "surfaces structured attention signals".
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-12:** Cada señal conserva artifact origen, tipo, explicación y enlace de navegación cuando existe destino.'
      status: passed
      evidence: >-
        AttentionItem lleva type/severity/artifactId/artifactKind/title/reason/link;
        test asserta artifactId y link.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-13:** Señales duplicadas por la misma causa se consolidan sin perder hallazgos diferentes.'
      status: passed
      evidence: >-
        Consolidación por clave (type|artifactId|reason) con Set; se conservan
        razones distintas y el orden es determinista.
      reference: packages/cli/src/core/planning-insights.ts
      method: automated
    - criterion: '**AC-14:** Los filtros por tipo de señal y tipo de artifact funcionan sin alterar los datos.'
      status: passed
      evidence: >-
        E2E filtra por "dependency" y vuelve a "all"; el filtrado es solo de vista
        (useMemo), sin mutación.
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-15:** Riesgos declarados y bloqueos detectados son conceptos separados; no hay scores de riesgo inventados.'
      status: passed
      evidence: >-
        Los riesgos declarados son tipo "declared-risk" (info), separados de los
        blockers; test asserta la categoría. Sin score de riesgo.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-16:** Milestones exponen criterios de salida y evidencia actual sin inferir aprobación desde delivery o checkboxes.'
      status: passed
      evidence: >-
        MilestoneInsight usa planMilestoneVerifications (contrato WI-078); test y
        E2E confirman RM-08 needsReview sin inferir del Epic.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-17:** La navegación desde insights lleva correctamente a los detalles canónicos existentes.'
      status: passed
      evidence: >-
        E2E hace clic en PLAN-001 y aterriza en /planning/plans/PLAN-001; links
        por kind (plan/epic/initiative/work-item).
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-18:** Consultar, filtrar o navegar por insights no escribe Markdown ni cambia lifecycle de ninguna entidad.'
      status: passed
      evidence: >-
        La proyección es pura (read-only); tests de Core y admin-server comparan
        hashes antes/después y no cambian.
      reference: packages/admin-server/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-19:** Los cálculos respetan el motor de verificación WI-078/WI-079 sin crear un verificador paralelo.'
      status: passed
      evidence: >-
        El outcome/readiness viene de evaluatePlan/Epic/InitiativeCompletion; no
        se reimplementa verificación.
      reference: packages/cli/src/core/planning-insights.ts
      method: automated
    - criterion: '**AC-20:** El endpoint conserva las medidas existentes de seguridad y la interfaz maneja errores, loading y empty states.'
      status: passed
      evidence: >-
        La ruta usa coreRoute (sesión/same-origin existentes); el componente
        maneja loading/error/empty.
      reference: packages/admin-server/src/server.ts
      method: manual
    - criterion: '**AC-21:** La UI resulta usable en Light/Dark, navegación por teclado y viewport de 375px.'
      status: passed
      evidence: >-
        Estilos con CSS vars (Light/Dark); E2E a 375px sin overflow horizontal;
        controles nativos (select/button) accesibles por teclado.
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-22:** Pruebas unitarias de Core cubren deduplicación, casos vacíos, jerarquía parcial, bloqueos y evidencia stale/ambiguous.'
      status: passed
      evidence: '6 tests de Core: empty, dedup, separación de dimensiones, señales, milestones, read-only.'
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-23:** Pruebas de Admin Server confirman exactitud de la proyección y ausencia de mutaciones.'
      status: passed
      evidence: >-
        3 tests: proyección con dimensiones separadas, no-mutación de artifacts, y
        no shadowing de la ruta de detalle.
      reference: packages/admin-server/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-24:** Pruebas E2E aisladas cubren Overview, Needs attention, filtros, milestones, navegación y responsive.'
      status: passed
      evidence: >-
        planning-insights.spec cubre indicadores, dimensiones, filtros, milestones,
        navegación y 375px; suite E2E completa 53/53.
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-25:** Tests relevantes, suite de regresión, typecheck y builds pasan; cualquier fallo ajeno se registra explícitamente, sin ocultarlo con retries.'
      status: passed
      evidence: >-
        2169 tests (176 files) en verde; tsc -b de admin limpio; builds OK. Sin
        fallos ajenos; el flaky histórico de integrations quedó resuelto en WI-080.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-26:** Documentación EN/ES y `kaddo verify WI-081` presentan evidencia por AC, con los gates independientes respetados.'
      status: passed
      evidence: >-
        delivery-planning.md EN/ES documentan Execution Insights; kaddo verify
        WI-081 -> READY (26/26); gates A/B/C con autorización humana independiente.
      reference: apps/docs/src/content/docs/delivery-planning.md
      method: manual
---

# WI-081 — Planning Progress & Execution Insights

## 1. Context

WI-074 a WI-079 establecieron un modelo opcional de Planning (Delivery Plans, Epics, Initiatives y Work Items), gestión visual, trazabilidad y completion verificado mediante evidencia. WI-080 estabilizó el escenario E2E de integración externa y dejó la suite completa en verde.

Kaddo Admin cuenta con una vista Planning (`/planning`) con secciones Overview, Delivery Plans, Epics e Initiatives. Core dispone de `computePlanProgress()`, `computeEpicProgress()`, `computeInitiativeProgress()`, `validatePlanningGraph()` y evaluaciones de completion basadas en evidencia. El overview actual presenta conteos y relaciones, pero no una vista única orientada a preguntas de ejecución y decisiones.

La necesidad no es crear otro sistema de gestión de proyectos: es convertir señales canónicas ya existentes en información accionable, conservando su contexto y límites.

## 2. Problem

Quien administra un proyecto debe entrar a distintos detalles para saber:

1. Qué trabajo está bloqueado y por qué.
2. Qué se entregó frente a qué resultados han sido realmente verificados.
3. Qué criterios de éxito o de salida de milestones siguen sin evidencia suficiente.
4. Qué dependencias, relaciones o datos necesitan revisión.
5. A qué artifact debe ir para resolver cada situación.

Una suma de porcentajes o de estados `completed` no responde esas preguntas y puede confundir Delivery Progress con Outcome Verification. La lectura aislada de cada Plan/Epic/Initiative dificulta priorizar conversaciones humanas, especialmente cuando se usan jerarquías opcionales.

## 3. Expected Outcome

En Planning Overview, una persona puede identificar rápidamente el estado de la ejecución, detectar temas que necesitan revisión y abrir el artifact correcto para actuar. La vista presenta datos derivados de Core, con señales explicables y sin alterar archivos canónicos.

La experiencia responde: **¿cómo vamos?, ¿qué necesita atención?, ¿qué resultados hemos demostrado?**

## 4. Principles and Decisions

1. **Core owns interpretation.** Las reglas de cálculo, deduplicación, relaciones y severidad viven en Core; Admin Server expone proyecciones y Admin UI presenta.
2. **Markdown remains canonical.** No almacenar snapshots ejecutivos como nueva fuente de verdad.
3. **Separate three dimensions.** Planning Coverage, Delivery Progress y Outcome Verification no se combinan en un porcentaje ni en una puntuación única.
4. **Read-only insights.** Consultar no crea, modifica, completa ni reordena artifacts.
5. **Explain each signal.** Todo hallazgo muestra tipo, origen, razón y destino navegable cuando corresponda.
6. **Planning stays optional.** Initiatives independientes y Work Items sin Initiative/Epic/Plan siguen siendo válidos.
7. **No inferred completion.** Estado de Work Items, checkboxes y señales Git no sustituyen verificación de resultados ni aprobación humana.
8. **No invented time or risk.** Sin timestamps o estimaciones explícitos no calcular retrasos ni pronósticos. Riesgos declarados se diferencian de bloqueos detectados.

## 5. Scope

### 5.1 Execution Overview

Extender la pestaña **Overview** de `/planning`; no crear una aplicación o dashboard paralelo.

Mostrar una síntesis compacta con tres indicadores centrales (cuando existan datos):

- **Blocking issues:** Work Items bloqueados, dependencias incumplidas e inconsistencias bloqueantes; no sumar incidencias diferentes como si fueran entidades homogéneas.
- **Outcome needs verification:** criterios declarados todavía sin evidencia aprobatoria válida, diferenciando failed / not-verified / manual-review / ambiguous cuando aplique.
- **Milestones needing review:** milestones con exit criteria pendientes, fallidos o ambiguos, cuando existan; jamás inferir que están completos por el estado del Epic.

Acompañar estas señales con información contextual:

- Plans / Epics / Initiatives por estado canónico.
- Planning Coverage: candidatos totales, materializados y pendientes.
- Delivery Progress: Work Items vinculados, completados, en curso y bloqueados.
- Outcome Verification: passed, failed, not verified, manual review y evidence stale/ambiguous donde corresponda.

Los contadores deben declarar claramente su universo y su denominador. Si un Work Item pertenece a varias vistas jerárquicas, deduplicarlo por identidad dentro del mismo total; no sumar sin control todos los subtotales. Si hay Work Items independientes, identificarlos por separado, sin obligarlos a entrar en una jerarquía ficticia.

No presentar un porcentaje global de proyecto, KPI único de salud ni tasas inventadas cuando el denominador sea cero.

### 5.2 Attention Queue

Añadir un listado de **Needs attention** con señales determinísticas, reutilizando evaluaciones y findings de Core:

- Dependencias pendientes, inválidas o cíclicas.
- Work Items bloqueados o trabajo comprometido sin completar.
- Candidatos de Initiatives pendientes de materializar, como señal de cobertura y no como bloqueo universal de ejecución.
- Success Criteria o exit criteria sin evidencia válida o con evidencia fallida/ambigua/obsoleta.
- Inconsistencias de asociaciones y provenance cuando Core las detecte.
- Riesgos explícitamente declarados (en una categoría separada de los blockers derivados).

Cada entrada debe incluir: tipo y severidad/familia de señal, artifact ID y tipo, título, razón concreta y enlace al detalle. Los hallazgos repetidos sobre la misma causa y artifact se deben consolidar sin borrar explicaciones distintas.

Filtros de primera versión: **tipo de señal** y **tipo de artifact**; opcionalmente estado o Plan si el API existente lo facilita. Orden determinista, sin algoritmo de priorización automática ni scores opacos. No agregar operaciones de resolución en línea.

### 5.3 Milestone & Outcome Insights

Para cada Plan con milestones, presentar una lectura compacta de:

- Milestone, Plan propietario y número de Epics asociados.
- Exit criteria declarados y su estado de verificación real, reutilizando los contratos de WI-078.
- Inconsistencias de relación y dependencias que impacten su interpretación.
- Navegación directa al detalle del Plan/milestone existente, sin inventar una entidad milestone autónoma.

En Plan, Epic e Initiative diferenciar **delivery completed** de **outcome verified** y de **completion readiness**. `READY_TO_COMPLETE` significa que puede solicitarse aprobación humana, no que la entidad ya esté cerrada. `READY_WITH_EXCEPTIONS` conserva las razones y excepciones; `NEEDS_WORK` y `BLOCKED` no se traducen en alertas arbitrarias.

### 5.4 Decision Navigation & UX

- Reutilizar los detalles existentes de Plan, Epic, Initiative y Work Item.
- Navegación desde una señal al artifact donde existe el problema, con contexto del hallazgo cuando sea posible.
- Estados de carga, error, vacío y sin datos verificables claramente diferenciados.
- Mantener compatibilidad Light/Dark, teclado y pantalla móvil de 375px.
- Evitar tablas extensas o visualizaciones decorativas que oculten la explicación.
- Una vista de resumen ligera, con detalle progresivo bajo demanda.

## 6. Core and API Design

### 6.1 Core

Antes de codificar, elaborar un inventario de contratos actuales y un mapa de procedencia de cada indicador. Reutilizar:

- `computePlanProgress()` y `computeEpicProgress()`.
- `computeInitiativeProgress()` y análisis de Initiatives.
- `validatePlanningGraph()`.
- Verificaciones de outcome/completion de Plans, Epics, Milestones e Initiatives.
- Resolución existente de relaciones y Work Items asociados.

Cuando se requiera agregación nueva, ofrecer una **proyección de lectura en Core** con tipos explícitos para métricas, attention items y provenance de la señal. No reimplementar reglas en `core-adapter.ts`, frontend o consultas SQL.

La agregación debe ser determinista ante reordenamientos de artifacts, tolerar relaciones opcionales, prevenir doble conteo y diferenciar `0` de dato no disponible. Documentar los límites de los conteos y la cobertura.

### 6.2 Admin Server

Extender el endpoint actual `/api/v1/admin/planning` o añadir una ruta read-only específica de insights solo si la carga/costo o el contrato justifican separarla. Mantener sesión, seguridad y serialización existentes.

Evitar cálculos costosos por cada render, así como lecturas repetidas innecesarias de los mismos artifacts. Medir el coste de la proyección con fixture representativo; no agregar caché persistente sin evidencia de necesidad.

### 6.3 Admin UI

Ampliar `packages/admin/src/routes/Planning.tsx`, `packages/admin/src/lib/api.ts` y componentes reutilizables cuando corresponda. No rediseñar el Planning Explorer ni reemplazar pantallas de detalle.

### 6.4 CLI/MCP

No añadir comandos o herramientas nuevos por defecto. Si se necesita exponer la proyección en otra interfaz, justificarlo durante refinement y mantener a Core como fuente de verdad; ello no autoriza aumentar alcance automáticamente.

## 6.5 Refinement Notes — Inventario de contratos y decisiones de procedencia (D1–D9)

Inventario canónico reutilizado (origen de cada indicador; **sin reimplementar reglas**):

| Indicador | Función(es) Core | Tipo |
|---|---|---|
| Planning Coverage | `computeInitiativeProgress().planning` (totalCandidates/materialized/remaining) | progreso |
| Delivery Progress | `computePlanProgress().delivery`, `computeEpicProgress().delivery`, `computeInitiativeProgress().delivery` (total + byState + blocked) | progreso |
| Outcome Verification | `evaluatePlanCompletion`/`evaluateEpicCompletion`/`evaluateInitiativeCompletion` → `OutcomeVerification` (total/passed/failed/notVerified/manualReview/ambiguous/stale) | evidencia (WI-078/079) |
| Completion readiness | las mismas evaluaciones → `READY_TO_COMPLETE`/`READY_WITH_EXCEPTIONS`/`NEEDS_WORK`/`BLOCKED` | evidencia |
| Milestones / exit criteria | `planMilestoneVerifications` / `evaluatePlanCompletion().milestones` | evidencia |
| Findings de grafo | `validatePlanningGraph` (`invalid_reference`/`dependency_cycle`/`pending_dependency`/`duplicate_milestone`) | determinista |
| Provenance de Initiatives | `evaluateInitiativeCompletion().provenanceIssues`, `.pendingCandidates` | determinista |

Decisiones sometidas a aprobación humana (cambian semántica/contratos):

- **D1 — Deduplicación de Work Items (AC-03).** Los totales de WI se calculan sobre identidades **distintas** (por `id`, case-insensitive) en la unión de asociaciones (Initiative y/o Epic/Plan). Un WI visible en varias jerarquías cuenta **una vez** por universo. Los WI independientes (sin Initiative/Epic/Plan) se reportan en una categoría separada, nunca forzados a una jerarquía.
- **D2 — Tres dimensiones separadas (AC-02).** Coverage, Delivery y Outcome son estructuras distintas; **no** se combinan en un porcentaje/score. Denominador 0 → `null` ("sin datos"), nunca 0% ni 100% (AC-04).
- **D3 — Roll-up de Outcome.** Se **suman** los `OutcomeVerification` por entidad (Plans+Epics+Initiatives); los criterios pertenecen a su entidad (no se deduplican criterios entre entidades). El indicador "Outcome needs verification" = entidades/criterios con `failed`/`not-verified`/`manual-review`/`ambiguous` (stale se marca como advertencia aparte).
- **D4 — Taxonomía y consolidación de la Attention Queue (AC-11/13).** Tipos de señal: `dependency` (invalid/cycle/pending), `incomplete-delivery`, `pending-candidates` (señal de cobertura, **no** bloqueo universal), `unverified-outcome` (failed/not-verified/manual/ambiguous/stale), `provenance`, `declared-risk`. Orden **determinista** (sin scoring). Se consolidan señales con mismo `(tipo, artifact, causa)` conservando razones distintas.
- **D5 — Readiness ≠ completed (AC-10).** La readiness se muestra distinta del lifecycle `status`; `READY_TO_COMPLETE` significa "puede pedirse aprobación humana", no cerrado.
- **D6 — Riesgos declarados vs bloqueos detectados (AC-15).** Los riesgos declarados (frontmatter `risks` de la entidad) forman una categoría separada; **sin** scores de riesgo inventados.
- **D7 — Milestones reutilizan WI-078 (AC-16/19).** El estado de exit criteria viene de `planMilestoneVerifications`; **nunca** se infiere completitud de milestone desde el estado del Epic ni de checkboxes.
- **D8 — Superficie/endpoint (AC-06, §6.2).** La agregación nueva vive en Core (`planningInsights(dir)`). Admin Server la expone en una **ruta read-only separada** `GET /api/v1/admin/planning/insights` (no se infla el payload del overview existente, que ya usa el Explorer; insights es más costoso porque lee evidencia de cada entidad). Reutiliza sesión/seguridad/serialización actuales.
- **D9 — Sin CLI/MCP nuevos (§6.4).** Alcance: **Core (`cli` pkg) + admin-server + Admin UI + docs**. La Admin UI extiende la pestaña Overview de `/planning` (no una pantalla paralela).

## 7. Acceptance Criteria

### Integrity & Meaning

- **AC-01:** Existe un inventario documentado de métricas/señales, sus funciones canónicas y su interpretación.
- **AC-02:** Planning Coverage, Delivery Progress y Outcome Verification aparecen separados; no existe porcentaje global engañoso.
- **AC-03:** Los totales de Work Items no presentan doble conteo por asociaciones múltiples dentro del mismo universo.
- **AC-04:** La ausencia de datos se comunica sin inventar ceros, cumplimiento, riesgos ni fechas.
- **AC-05:** La vista admite Plans/Epics/Initiatives opcionales y Work Items independientes sin relaciones ficticias.
- **AC-06:** Toda agregación o clasificación nueva se implementa en Core y Admin no duplica reglas de dominio.

### Execution Overview

- **AC-07:** Overview muestra una síntesis legible de bloqueos, resultados pendientes de verificación y milestones que requieren revisión.
- **AC-08:** La vista presenta cobertura de candidatos y entrega de Work Items, con universos y denominadores claros.
- **AC-09:** Los estados de outcome muestran passed/failed/not-verified/manual-review y situaciones ambiguas/obsoletas donde existan.
- **AC-10:** Completion readiness se representa sin confundirlo con lifecycle `completed` ni con autorización humana.

### Attention & Milestones

- **AC-11:** Needs attention recoge hallazgos canónicos de dependencias, trabajo incompleto, cobertura y verificación pendiente.
- **AC-12:** Cada señal conserva artifact origen, tipo, explicación y enlace de navegación cuando existe destino.
- **AC-13:** Señales duplicadas por la misma causa se consolidan sin perder hallazgos diferentes.
- **AC-14:** Los filtros por tipo de señal y tipo de artifact funcionan sin alterar los datos.
- **AC-15:** Riesgos declarados y bloqueos detectados son conceptos separados; no hay scores de riesgo inventados.
- **AC-16:** Milestones exponen criterios de salida y evidencia actual sin inferir aprobación desde delivery o checkboxes.
- **AC-17:** La navegación desde insights lleva correctamente a los detalles canónicos existentes.

### Safety & Compatibility

- **AC-18:** Consultar, filtrar o navegar por insights no escribe Markdown ni cambia lifecycle de ninguna entidad.
- **AC-19:** Los cálculos respetan el motor de verificación WI-078/WI-079 sin crear un verificador paralelo.
- **AC-20:** El endpoint conserva las medidas existentes de seguridad y la interfaz maneja errores, loading y empty states.
- **AC-21:** La UI resulta usable en Light/Dark, navegación por teclado y viewport de 375px.

### Quality & Delivery

- **AC-22:** Pruebas unitarias de Core cubren deduplicación, casos vacíos, jerarquía parcial, bloqueos y evidencia stale/ambiguous.
- **AC-23:** Pruebas de Admin Server confirman exactitud de la proyección y ausencia de mutaciones.
- **AC-24:** Pruebas E2E aisladas cubren Overview, Needs attention, filtros, milestones, navegación y responsive.
- **AC-25:** Tests relevantes, suite de regresión, typecheck y builds pasan; cualquier fallo ajeno se registra explícitamente, sin ocultarlo con retries.
- **AC-26:** Documentación EN/ES y `kaddo verify WI-081` presentan evidencia por AC, con los gates independientes respetados.

## 8. Validation Scenarios

**A — Empty project:** no Plans, Epics ni Initiatives; Overview útil, sin divisiones por cero ni falsos blockers.

**B — Optional hierarchy:** Initiative sin Epic y Work Item independiente; ambos son válidos y se muestran sin asociación forzada.

**C — Double counting:** un Work Item visible desde Initiative y Epic/Plan se cuenta una sola vez en totales del mismo universo.

**D — Delivery vs outcome:** todos los Work Items completos, criterio de éxito sin evidencia; progreso de entrega completo, outcome pendiente y sin completion automático.

**E — Missing evidence:** exit criterion de milestone sin verificación; se indica pendiente, no completado.

**F — Blocked dependency:** referencia incumplida o cíclica produce una señal con artifact y motivo correctos.

**G — Ambiguous or stale evidence:** no atribuir evidencia antigua a un criterio distinto ni marcarlo como passed.

**H — Navigation:** seleccionar un hallazgo abre el detalle correcto.

**I — Read-only:** consultar y filtrar no cambia hashes de artifacts canónicos.

**J — UX/compatibility:** estados vacío/error/loading; móvil 375px, teclado, Light/Dark.

## 9. Non-goals

- Jira, Linear, Azure DevOps o sincronización bidireccional.
- Priorización, asignación, recomendaciones o materialización automática mediante IA.
- Planificación de capacidad, presupuestos, estimaciones, sprints o fechas pronosticadas.
- Histórico de tendencias, series temporales o snapshots persistentes.
- Nuevo modelo de riesgos, scoring global o semáforos no trazables.
- Nuevos lifecycle states, permisos o aprobadores.
- Nueva entidad milestone; migración masiva de artifacts.
- Nuevo motor de outcome verification.
- Reescritura de Planning Explorer, CLI o MCP.

## 10. Implementation Approach

### Phase 1 — Contract review & metric provenance

Revisar los modelos y definir universos, deduplicación, indicadores, señales, casos vacíos y límites. Antes de implementar, someter a aprobación humana cualquier decisión que cambie semántica de métricas o contratos canónicos.

### Phase 2 — Core read-only insights

Crear solamente las proyecciones nuevas necesarias, combinando computaciones existentes sin mutaciones. Añadir tests de integridad, jerarquías parciales y verificación stale/ambiguous.

### Phase 3 — Admin Server

Exponer las proyecciones mediante contratos validados y seguridad existente. Medir lecturas repetidas y garantizar consistencia de resultados.

### Phase 4 — Admin UI

Evolucionar Overview con los tres indicadores principales, listado Needs attention, milestones y navegación. Priorizar claridad de lectura, no densidad de widgets.

### Phase 5 — E2E, regression & documentation

Fixtures temporales, escenarios A–J, pruebas Light/Dark y 375px, build y regresión, documentación EN/ES, evidencia por AC y `kaddo verify WI-081`.

## 11. Definition of Done

- Los 26 Acceptance Criteria se evalúan con evidencia y referencias concretas.
- Vista útil y explicable para progreso, outcomes, dependencias y milestones.
- Sin mutaciones durante consultas, sin doble conteo y sin métricas fabricadas.
- Core como fuente de interpretación y Markdown como fuente canónica.
- Compatibilidad con jerarquías opcionales y flujos de WI-078/WI-079.
- Pruebas y documentación validadas; revisión humana antes de integrar, publicar o cerrar.
- Learning en español al cierre.

## 12. Risks

**Scope creep:** acabar creando un PM suite. Mitigación: cuatro bloques de UI, tres indicadores de atención, read-only.

**Semántica engañosa:** sumar entidades distintas o tratar delivery como outcome. Mitigación: contratos explicados, denominadores y tests de deduplicación.

**Lectura costosa:** múltiples escaneos del mismo árbol por artifact. Mitigación: medición, reutilización de resultados y optimizaciones justificadas.

**Señales sin solución:** alertas sin origen navegable. Mitigación: trazabilidad en contrato y escenarios E2E.

## 13. Commit & Release Gates

**Gate A — Integration.** Revisar diff local, test/build, evidencia, UX y compatibilidad. No realizar commit/push/version bump hasta autorización explícita. Incorporar el Work Item al repositorio antes de tag, si hay release.

**Gate B — Publication.** Tras CI aprobada, decidir explícitamente si el cambio de producto distribuido requiere bump/tag/npm/GitHub Release. No publicar ni crear tag sin autorización separada. Si no corresponde release, documentar `release_decision` y no inventar `released_in`.

**Gate C — Canonical Closure.** Registrar evidencias por los 26 AC, Learning en español, `implementation_status` y `validation_status`; ejecutar `kaddo verify WI-081`, exigir readiness apropiado y aprobación humana; mover al directorio `completed/` mediante el lifecycle canónico y validar la CI final.

## 14. Learning

Publicado en **v3.137.0**. Execution Insights quedó como una capa de lectura que **traduce señales ya
canónicas en decisiones**, sin inventar métricas ni crear un segundo verificador: outcome y readiness
vienen de las evaluaciones de WI-078/WI-079.

**Qué funcionó bien**

- **El diseño fue, sobre todo, agregación.** Core ya calculaba todo (progreso, outcome por evidencia,
  findings de grafo); el WI fue combinarlo con tipos explícitos. El §6.5 (inventario + procedencia por
  indicador) hecho *antes* de codificar evitó reinventar reglas y ancló cada número a su función.
- **Deduplicación por enumeración, no por resta de subtotales (AC-03).** La clave fue enumerar los Work
  Items una sola vez (`discoverWorkItems`) y clasificarlos, en vez de sumar los subtotales de Epic +
  Initiative (que doble-contarían un WI compartido). Hizo el conteo correcto por construcción.
- **Señales estructuradas, no strings.** Derivar la Attention Queue de los campos de las evaluaciones
  (`outcome`, `pendingCandidates`, `provenanceIssues`) y de `validatePlanningGraph`, en lugar de parsear
  los `reasons` de texto, dio tipo/severidad/enlace limpios y consolidación determinista.

**Fricciones y decisiones**

- **Ruta separada vs. engordar el overview (D8).** Insights lee evidencia por entidad (más caro que el
  overview, que ya usa el Explorer), así que se expuso en `/planning/insights` aparte. El §6.2 lo
  permitía por costo; evita penalizar la vista existente.
- **Idioma de las razones.** Las razones de las señales se dejaron en **inglés** para ser coherentes con
  el resto de la UI de Admin (toda en inglés); el WI y este Learning van en español, según la regla del
  proyecto (artefactos de conocimiento en español, código/UI en inglés).

**E2E en suite compartida mutable (lección recurrente)**

- La aserción de `pending-candidates` falló en la suite completa porque un spec serial anterior (el E2E de
  WI-080) **consume** el único candidate pendiente del fixture (lo elimina). Se quitó esa aserción del E2E
  y se dejó cubierta determinísticamente en los tests de Core/admin-server. Regla: en una suite E2E serial
  con fixture mutable, asertar solo sobre hechos que ningún spec previo altera (p. ej. la dependencia
  EP-001→EP-002 o el milestone RM-08), y empujar lo mutable a tests unitarios aislados.

**Infra**

- El primer CI de integración quedó **atascado en `queued`** (0 pasos, fallo del runner de GitHub), no un
  fallo de código; se reprodujeron los 5 pasos localmente en verde y un re-run quedó success. Distinguir
  "run failure sin pasos ejecutados" (infra) de un fallo real de build/test.

**Validación de referencia**

- `pnpm vitest run` → 2169 passed (176 files); E2E completa 53/53; `tsc -b` de admin limpio; docs astro
  build OK. `kaddo verify WI-081` → READY (26/26). CI del release en verde; npm publish con provenance
  (cli + mcp) y GitHub Release v3.137.0.
