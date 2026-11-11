---
type: feature
id: WI-079
title: Initiative Management Completion
status: completed
work_type: feature
created_at: '2026-11-10'
source:
  type: external
  imported_at: '2026-11-10'
  source_format: kaddo-frontmatter
  source_hash: e2c01407272c13d2b7ca486b80aabedd8d13eb645f61c22c07daecdb8fbefcf2
  inferred: false
generated_by: kaddo-admin
knowledge_level: K4
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - cli
  - mcp
  - admin-server
  - admin
  - docs
antecedent:
  - WI-018
  - WI-019
  - WI-020
  - WI-022
  - WI-074
  - WI-076
  - WI-077
  - WI-078
scope_confidence:
  level: high
  reasons:
    - >-
      Core dispone de modelos, lifecycle y operaciones de Initiatives
      (create/update/transition/addCandidate/materializeCandidate/analyze/evaluateInitiativeCompletion).
    - 'CLI y MCP ya permiten crear, consultar y materializar candidatos.'
    - >-
      Admin dispone de Initiative List, Initiative Detail y Planning Context
      (WI-076).
    - >-
      WI-078 incorporó contratos reutilizables de evidencia
      (AcceptanceCriterionEvidence) y cierre gated.
    - >-
      Brechas confirmadas (net-new): updateCandidate/removeCandidate,
      concurrencia en updateInitiative, atomicidad/idempotencia de
      materializeCandidate, completeInitiative canónico y verificación por
      evidencia alineada con WI-078.
summary: >-
  Completar la gestión de Initiatives desde Kaddo Admin: edición estructurada,
  administración de Work Item Candidates, materialización segura, revisión de
  alcance y completion basado en evidencia, con consistencia entre Core, CLI,
  MCP y Admin, preservando trazabilidad de relaciones y manteniendo el cierre
  bajo aprobación humana.
original_snapshot:
  title: Initiative Management Completion
  description: >-
    Las Initiatives representan la capa opcional que conecta la intención del
    producto con el trabajo ejecutable.
  type: feature
  status: draft
ready_at: '2026-11-10'
implementation_status: completed
validation_status: passed
released_in: v3.136.0
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/initiative-verification.ts
        - packages/cli/src/core/initiative-write.ts
        - packages/cli/src/core/initiative-analysis.ts
        - packages/cli/src/core.ts
        - packages/cli/src/commands/initiative.ts
        - packages/cli/tests/initiative-management.test.ts
        - packages/cli/tests/initiative.test.ts
        - packages/cli/tests/initiative-analysis.test.ts
      validations:
        - command: >-
            pnpm vitest run packages/cli/tests/initiative-management.test.ts
            packages/cli/tests/initiative.test.ts
            packages/cli/tests/initiative-analysis.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    mcp:
      role: module
      status: completed
      changed_paths:
        - packages/mcp/src/initiatives.ts
        - packages/mcp/src/server.ts
        - packages/mcp/tests/initiative.test.ts
      validations:
        - command: pnpm vitest run packages/mcp/tests/initiative.test.ts
          status: passed
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/src/server.ts
        - packages/admin-server/src/contracts/schemas.ts
        - packages/admin-server/tests/initiative-management.test.ts
      validations:
        - command: >-
            pnpm vitest run
            packages/admin-server/tests/initiative-management.test.ts
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/InitiativeCompletion.tsx
        - packages/admin/src/components/InitiativeCandidates.tsx
        - packages/admin/src/routes/InitiativeDetail.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/initiative-management.spec.ts
        - packages/admin/e2e/fixtures/project/knowledge/delivery/initiatives/INI-900.md
        - >-
          packages/admin/e2e/fixtures/project/knowledge/delivery/work-items/completed/WI-900-sso-delivery.md
      validations:
        - command: >-
            pnpm --filter @kaddo/admin exec playwright test
            initiative-management.spec.ts collaboration.spec.ts planning.spec.ts
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/initiatives.md
        - apps/docs/src/content/docs/es/initiatives.md
      validations:
        - command: documentation review (EN/ES)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Admin permite crear Initiatives con atributos de planificación relevantes.'
      status: passed
      evidence: >-
        createInitiativeAdmin + POST /initiatives con InitiativeCreateSchema
        (title, domains, horizon, priority); capacidad conservada de WI-022.
      reference: packages/admin-server/src/core-adapter.ts
      method: manual
    - criterion: '**AC-02:** Admin permite editar metadatos y secciones de intención sin destruir contenido existente.'
      status: passed
      evidence: >-
        updateInitiativeAdmin acepta sections (edición estructurada) + diálogo
        Edit initiative; test edita título y sección Goal preservando el resto.
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-03:** Se preservan IDs, provenance, relaciones y campos desconocidos.'
      status: passed
      evidence: >-
        El test de edición conserva la sección Success Criteria y el título; el
        test D4/D5 de Core conserva custom_field y secciones no tocadas.
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-04:** La edición rechaza revisiones obsoletas y no sobrescribe cambios concurrentes.'
      status: passed
      evidence: >-
        expectedRevision en updateInitiative; endpoint PUT devuelve 409
        INITIATIVE_CONFLICT ante un formulario obsoleto (test dedicado).
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-05:** Owners, Contributors y asociaciones con Epics reutilizan los mecanismos existentes.'
      status: passed
      evidence: >-
        AssignmentDialog e InitiativePlanningContext (WI-074/WI-076) reutilizados
        sin cambios; e2e de colaboración edita asignaciones de la Initiative.
      reference: packages/admin/src/routes/InitiativeDetail.tsx
      method: manual
    - criterion: '**AC-06:** Admin presenta candidatos pendientes y materializados con su información relevante.'
      status: passed
      evidence: >-
        InitiativeCandidates lista cada candidate con id, título, tipo/valor y
        enlace al Work Item materializado o estado pendiente.
      reference: packages/admin/src/components/InitiativeCandidates.tsx
      method: manual
    - criterion: '**AC-07:** Admin permite crear candidatos mediante Core.'
      status: passed
      evidence: >-
        addInitiativeCandidateAdmin + POST /candidates delega en Core addCandidate
        (preview/confirm en MCP); addCandidate cubierto por tests de Core.
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-08:** Admin permite editar candidatos pendientes sin cambiar su identidad.'
      status: passed
      evidence: >-
        PUT /candidates/:id (updateCandidate) conserva el id; test de endpoint
        verifica id estable tras editar título y expected value.
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-09:** El retiro de un candidato pendiente exige confirmación y conserva la justificación.'
      status: passed
      evidence: >-
        DELETE /candidates/:id exige reason (400 sin justificación); el motivo
        queda en removed_candidates (test de endpoint + D2 de Core).
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-10:** No es posible eliminar o alterar silenciosamente la asociación de un candidato materializado.'
      status: passed
      evidence: >-
        updateCandidate/removeCandidate rechazan un candidate materializado
        (test D2 "cannot edit or remove a materialized candidate").
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-11:** Los identificadores de candidatos permanecen únicos dentro de la Initiative.'
      status: passed
      evidence: >-
        nextCandidateId considera candidates vivos y removed_candidates; test D1
        "never reuses a candidate id after a removal".
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-12:** Admin permite previsualizar la materialización antes de confirmarla.'
      status: passed
      evidence: >-
        MaterializeDialog muestra el efecto (crea un Work Item draft asociado,
        idempotente) antes de "Confirm & materialize".
      reference: packages/admin/src/components/InitiativeCandidates.tsx
      method: manual
    - criterion: '**AC-13:** La materialización crea un único Work Item en `draft`.'
      status: passed
      evidence: >-
        materializeCandidate crea un WI draft con status draft; test verifica un
        único archivo en work-items/draft (wiCount === 1).
      reference: packages/cli/tests/initiative.test.ts
      method: automated
    - criterion: '**AC-14:** El Work Item conserva Initiative, Candidate ID y Source Signals.'
      status: passed
      evidence: >-
        El WI materializado lleva initiative, source=initiative y source_id del
        candidate; test asserts initiative/source/source_id.
      reference: packages/cli/tests/initiative.test.ts
      method: automated
    - criterion: '**AC-15:** La Initiative registra correctamente `materialized_as`.'
      status: passed
      evidence: >-
        setCandidateMaterialized escribe materialized_as; test asserts
        cand.materializedAs === WI id tras materializar.
      reference: packages/cli/tests/initiative.test.ts
      method: automated
    - criterion: '**AC-16:** Fallos parciales y operaciones concurrentes no dejan referencias inconsistentes.'
      status: passed
      evidence: >-
        Recuperación por provenance cuando falta el puntero (test D3 partial
        failure) y rechazo de expectedRevision obsoleto en materialize.
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-17:** La repetición de una materialización no crea Work Items duplicados.'
      status: passed
      evidence: >-
        materializeCandidate es idempotente (alreadyMaterialized=true, mismo
        workItemId); endpoint de materialize verifica no duplicación.
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-18:** La UI permite navegar al Work Item materializado y actualiza Planning Coverage.'
      status: passed
      evidence: >-
        MaterializeDialog ofrece "Open WI" y onDone invalida la Initiative,
        refrescando Planning Coverage.
      reference: packages/admin/src/components/InitiativeCandidates.tsx
      method: manual
    - criterion: '**AC-19:** Admin distingue Planning Coverage, Delivery Progress y Outcome Verification.'
      status: passed
      evidence: >-
        InitiativeCompletion separa Delivery y Outcome criteria verified; sección
        Progress separa coverage y delivery; test GET /completion.
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-20:** El análisis muestra candidatos pendientes, trabajo incompleto y dependencias relevantes.'
      status: passed
      evidence: >-
        analyzeInitiative emite findings (pending-candidates, incomplete-delivery,
        uncovered); InitiativeCompletion muestra reasons/blockers.
      reference: packages/cli/tests/initiative-analysis.test.ts
      method: automated
    - criterion: '**AC-21:** Los Success Criteria pueden verificarse con evidencia estructurada reutilizando los contratos existentes.'
      status: passed
      evidence: >-
        initiativeOutcomeVerification reutiliza buildOutcomeVerification de WI-078;
        POST /evidence registra evidencia por criterio (test).
      reference: packages/admin-server/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-22:** Checkboxes, actividad Git o Work Items completados no aprueban automáticamente resultados.'
      status: passed
      evidence: >-
        Un checkbox no es evidencia (Scenario J: criterios not-verified); delivery
        completo con outcome sin verificar permanece en NEEDS_WORK.
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-23:** La evidencia permanece asociada al criterio correcto y detecta duplicados o cambios que la vuelvan obsoleta.'
      status: passed
      evidence: >-
        recordInitiativeOutcomeVerification rechaza criterios no declarados;
        buildOutcomeVerification marca ambiguous (duplicados) y stale (editados).
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-24:** Core evalúa conservadoramente el completion de Initiatives.'
      status: passed
      evidence: >-
        evaluateInitiativeCompletion bloquea por unverified/failed/ambiguous,
        pending candidates, delivery incompleto y provenance rota (Scenario G).
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-25:** Una actualización genérica de estado no puede eludir el mecanismo canónico de completion.'
      status: passed
      evidence: >-
        transitionInitiative rechaza -> completed; completeInitiative es la única
        ruta (Scenario I + test de initiative.test + endpoint complete).
      reference: packages/cli/tests/initiative.test.ts
      method: automated
    - criterion: '**AC-26:** Admin presenta Completion Review con razones y bloqueos.'
      status: passed
      evidence: >-
        InitiativeCompletion muestra readiness, blockers, provenanceIssues,
        pendingCandidates, reasons y warnings.
      reference: packages/admin/src/components/InitiativeCompletion.tsx
      method: manual
    - criterion: '**AC-27:** El cierre exige confirmación humana explícita y registra la decisión.'
      status: passed
      evidence: >-
        completeInitiative registra completion_decision (readiness, decided_by);
        Scenario I verifica la decisión tras registrar evidencia.
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-28:** La evaluación no cambia automáticamente el estado ni el de sus Work Items, Epic o Plan.'
      status: passed
      evidence: >-
        evaluateInitiativeCompletion es read-only; test "never transitions the
        initiative (reports only)".
      reference: packages/cli/tests/initiative-analysis.test.ts
      method: automated
    - criterion: '**AC-29:** CLI, MCP y Admin utilizan la misma lógica canónica de Core.'
      status: passed
      evidence: >-
        CLI, tools MCP y adaptadores de admin-server delegan en las mismas
        funciones de Core; suites de MCP y admin-server en verde.
      reference: packages/mcp/tests/initiative.test.ts
      method: automated
    - criterion: '**AC-30:** Initiatives históricas y Work Items independientes mantienen compatibilidad sin migración obligatoria.'
      status: passed
      evidence: >-
        Scenario J lee una Initiative histórica (checkbox) sin crash; WI
        independientes y suites previas sin regresión (2160 tests en verde).
      reference: packages/cli/tests/initiative-management.test.ts
      method: automated
    - criterion: '**AC-31:** Las pruebas unitarias, de integración y E2E cubren creación, edición, concurrencia, materialización, verificación y cierre.'
      status: passed
      evidence: >-
        Tests de Core/CLI/MCP/admin-server + E2E initiative-management.spec.ts
        (edit -> remove -> NEEDS_WORK -> evidence -> READY -> complete).
      reference: packages/admin/e2e/initiative-management.spec.ts
      method: automated
    - criterion: '**AC-32:** Admin funciona correctamente en Light/Dark y móvil a 375px; builds y documentación EN/ES aprobados.'
      status: passed
      evidence: >-
        E2E de colaboración valida la Initiative a 375px en light y dark; builds
        de cli/mcp/admin-server/admin en verde; docs EN/ES actualizadas.
      reference: packages/admin/e2e/collaboration.spec.ts
      method: manual
---

# WI-079 — Initiative Management Completion

## 1. Context

Las Initiatives representan la capa opcional que conecta la intención del producto con el trabajo ejecutable.

```text
Product Intent
    ↓
Initiative
    ↓
Work Item Candidates
    ↓
Work Items
    ↓
Verification
    ↓
Completion Review
```

En proyectos que requieren mayor coordinación, una Initiative puede asociarse a una Epic y, de manera derivada, a un Delivery Plan.

El modelo es opcional: un Work Item puede existir sin Initiative y una Initiative puede existir sin Epic.

Kaddo ya dispone de capacidades en Core (createInitiative, updateInitiative, transitionInitiative, addCandidate, materializeCandidate, addExternalLink, computeInitiativeProgress, analyzeInitiative, evaluateInitiativeCompletion), CLI/MCP (creación, consulta, materialización, análisis, completion) y Admin (listado, creación básica, detalles, owners/contributors, asociación con Epics, candidatos y Work Items, hallazgos y readiness, colaboración Git).

Estas capacidades todavía no ofrecen una experiencia completa y coherente de gestión de Initiatives.

WI-078 estableció principios que también deben respetarse aquí:

1. Delivery Progress no equivale a Outcome Verification.
2. El cumplimiento requiere evidencia verificable.
3. Readiness no representa autorización humana.
4. Las operaciones deben preservar la fuente canónica.
5. Los cambios de lifecycle requieren controles explícitos.

## 2. Problem

Un usuario puede crear una Initiative desde Admin, pero necesita CLI, MCP o editar Markdown para: editar el objetivo y atributos, crear Work Item Candidates, modificar candidatos pendientes, materializar candidatos, gestionar el alcance comprometido, revisar evidencia de resultados y ejecutar un completion review consistente con WI-078.

Además, la materialización de candidatos realiza cambios sobre dos artifacts (el Work Item creado y la Initiative de origen) y necesita garantías de consistencia para evitar referencias incompletas o duplicados.

La transición a `completed` no debe poder eludir los controles de readiness mediante una actualización genérica de estado.

**Problema central:** la planificación de una Initiative existe, pero su gestión integral todavía está fragmentada entre interfaces y operaciones con distintas garantías de seguridad.

## 3. Expected Outcome

El usuario podrá gestionar una Initiative de principio a fin desde Admin: crear, editar atributos e intención, administrar el alcance mediante Work Item Candidates, revisar y ajustar candidatos pendientes, materializar candidatos en Work Items, consultar ejecución y relaciones, identificar brechas entre alcance/ejecución/resultados, registrar o consultar evidencia, revisar condiciones de completion y aprobar explícitamente su cierre. Estas operaciones deben permanecer coherentes mediante Core, CLI, MCP y Admin.

## 4. Initiative Management

### 4.1 Initiative Creation

Mantener la creación desde Admin y mejorar el formulario inicial.

Campos: Title (Yes), Goal/Expected Outcome (Recommended), Horizon, Priority, Knowledge Level, Domains, Related Capabilities, Owners, Contributors, Related Epic (No).

El ID se genera mediante Core. No permitir modificar manualmente el ID ni la ruta del artifact. La Initiative debe crearse con el estado inicial del contrato canónico (`planned`). Conservar el contenido estándar de su plantilla. No exigir completar toda la información para poder crear una Initiative.

### 4.2 Initiative Editing

Incorporar en Initiative Detail **Edit Initiative**, permitiendo modificar Title, Goal/Expected Outcome, Expected Value, Scope, Out of Scope, Success Criteria, Horizon, Priority, Knowledge Level, Domains, Related Capabilities.

Owners, Contributors y asociación con Epic ya tienen componentes propios; reutilizarlos sin duplicar su lógica. Para secciones Markdown existentes, usar edición estructurada que preserve los demás bloques. No reemplazar completamente el Markdown a partir de un formulario parcial. Conservar metadatos desconocidos y procedencia (`source`, `source_id`).

### 4.3 Consistency and Concurrency

Incorporar protección de concurrencia en las escrituras de Initiatives, siguiendo el mecanismo de revisión de Planning. Rechazar formularios obsoletos; proteger cambios simultáneos desde CLI/MCP/Admin/manual; mostrar conflicto de revisión y opción de recargar; no sobrescribir campos desconocidos; no modificar el lifecycle durante una edición de metadatos.

## 5. Work Item Candidate Management

### 5.1 Candidate List

Convertir la sección de Candidates en administrable. Mostrar Candidate ID, Title, Type, Suggested Knowledge Level, Expected Value, Source Signals, Dependencies, estado derivado de materialización y Work Item asociado. Distinguir Pending vs Materialized. No introducir un lifecycle adicional para Candidates.

### 5.2 Create Candidate

Incorporar **+ Add Candidate**. Campos: Title (Yes), Type, Suggested Knowledge Level, Expected Value, Notes, Source Signals, Dependencies (No). Reutilizar `addCandidate()`. Core genera un identificador único dentro de la Initiative; no reutilizar accidentalmente un id tras eliminar o reorganizar candidatos. No materializar automáticamente al crear.

### 5.3 Edit Candidate

Permitir modificar candidatos no materializados. Preservar ID, Source Signals, provenance, relaciones y campos desconocidos. No permitir cambiar un candidato materializado de forma que contradiga el Work Item creado; esa modificación debe hacerse sobre el Work Item o mediante una operación explícita de conciliación futura.

### 5.4 Remove Pending Candidate

Permitir retirar un candidato pendiente mediante una operación explícita. Antes de confirmar, mostrar el candidato, el efecto sobre Planning Coverage y la consecuencia sobre Completion Readiness. Registrar una justificación en el artifact canónico para trazabilidad. No eliminar silenciosamente un candidato materializado. No modificar ni eliminar Work Items. No introducir estados nuevos de candidato para soportar esta acción.

## 6. Candidate Materialization

### 6.1 Materialize Candidate

Incorporar **Materialize as Work Item**: identificar el candidato pendiente, presentar preview, solicitar confirmación, crear un Work Item en `draft`, asociarlo a la Initiative, preservar `source_initiative`/`source_id`/Source Signals, actualizar `materialized_as`, refrescar Planning Coverage y permitir navegar al Work Item. No iniciar ni completar el Work Item automáticamente.

### 6.2 Atomicity and Idempotency

La materialización modifica dos artifacts. Core debe garantizar que un fallo no deje un estado parcialmente aplicado. Validar: el candidato sigue pendiente; el Work Item ID generado está disponible; la Initiative no cambió desde el preview; no existe una materialización previa válida. Si la escritura falla, preservar o restaurar un estado consistente. Repetir una operación ya aplicada no debe crear otro Work Item. Rechazar operaciones concurrentes sobre el mismo candidato. No usar únicamente una comprobación previa del ID como protección contra concurrencia.

### 6.3 Provenance

La relación debe seguir siendo canónica (`initiative`, `source: initiative`, `source_id`, `source_initiative` en el Work Item; `materialized_as` en el candidato). La lectura debe detectar relaciones rotas (candidato apunta a un Work Item inexistente; Work Item apunta a otra Initiative; identificador duplicado o conflictivo) y nunca corregirlas silenciosamente.

## 7. Initiative Analysis & Scope Review

La sección Analysis debe mostrar separadamente Planning Coverage (total/materializados/pendientes), Delivery Progress (asociados/completed/in-progress/blocked/remaining), Outcome Verification (success criteria/evidencias/pendientes/hallazgos) y Dependencies (declaradas/válidas o faltantes/bloqueos). Reutilizar `analyzeInitiative()` y las consultas existentes. No generar candidatos automáticamente desde un análisis; las sugerencias de agentes requieren revisión y aprobación antes de materializarse.

## 8. Evidence-Based Initiative Completion

### 8.1 Completion Consistency

Alinear el completion de Initiatives con WI-078. Hoy `transitionInitiative()` permite `→ completed` según la tabla de estados. Debe impedirse que una actualización genérica evite los controles. Incorporar una ruta canónica de cierre (`evaluateInitiativeCompletion()`, `completeInitiative()`). Conservar las transiciones existentes; las genéricas no deben ejecutar `→ completed`; la finalización pasa por el mecanismo explícito.

### 8.2 Success Criteria Verification

Alinear la evaluación con la verificación basada en evidencia de WI-078, reutilizando sus contratos. Cada Success Criterion comprometido debe evaluarse individualmente; la evidencia conserva estado/justificación/referencia/método; un checkbox no es evidencia suficiente; un Work Item completado no aprueba automáticamente un criterio; los criterios duplicados no comparten evidencia; los cambios de criterio invalidan aprobaciones obsoletas; la evidencia persiste en el artifact canónico. Evitar un mecanismo de verificación paralelo. Mantener compatibilidad de lectura con Initiatives existentes; no migrar masivamente.

### 8.3 Completion Readiness

Considerar Success Criteria y evidencia, candidatos comprometidos pendientes, Work Items incompletos, ausencia de entregables reales, dependencias bloqueantes e inconsistencias de procedencia. Modelo conservador: no Ready sin criterios verificables o sin entregables reales. Reutilizar las categorías de WI-078 (`READY_TO_COMPLETE`, `READY_WITH_EXCEPTIONS`, `NEEDS_WORK`, `BLOCKED`). No introducir categorías nuevas sin justificación.

### 8.4 Completion Review

Incorporar en Admin **Review Completion** presentando Goal, Expected Value, Scope, Delivery Progress, Success Criteria, Evidencia, Candidatos pendientes, Dependencias, Hallazgos bloqueantes y Completion Readiness. La acción **Complete Initiative** debe: releer el artifact canónico, evaluar readiness vigente, comprobar la revisión actual, exigir una decisión explícita del usuario, registrar la decisión y su justificación, ejecutar la transición válida y preservar evidencia/relaciones/provenance. No cerrar automáticamente porque todos los Work Items estén terminados. El atributo MCP `confirm: true` no constituye por sí mismo evidencia de aprobación humana. No incorporar un sistema nuevo de identidad o permisos.

## 9. Admin Experience

### 9.1 Initiatives List

Conservar la sección existente dentro de Planning. Mejorar la creación y permitir identificar Status, Horizon, Priority, Owners, Planning Coverage, Delivery Progress y Completion Readiness. Presentación compacta, sin duplicar la vista ejecutiva de WI-080.

### 9.2 Initiative Detail

Organizar las acciones alrededor del flujo de gestión: Overview (Goal & Expected Value, Scope, Edit Initiative), Planning Context, Responsibility & Collaboration, Candidates (Add, Edit, Remove pending, Materialize), Work Items, Progress & Analysis, Outcome Verification, Completion Review. No es obligatorio implementar como pestañas; pueden ser bloques. Priorizar navegación clara; evitar reconstruir toda la interfaz.

### 9.3 UX Requirements

Light/Dark; responsive a 375px; navegación por teclado; formularios con validación; confirmaciones explícitas en operaciones de impacto; estados de carga/error/éxito; manejo de conflictos de revisión; navegación a Work Items materializados; refresh de Planning tras cada cambio. Reutilizar el design system y los componentes existentes.

## 10. Core, CLI, MCP & Admin Server

### 10.1 Core

Reutilizar las operaciones existentes. Extenderlas solo cuando sea necesario para: actualización segura de Candidates, retiro explícito de candidatos pendientes, concurrencia y consistencia en la materialización, verification de resultados de Initiatives y completion canónico. Los nombres deben seguir las convenciones de Core.

### 10.2 CLI

Conservar los comandos existentes (`kaddo initiative create|update|candidates|materialize|analyze|complete`). Extender solo lo necesario. Evitar introducir varios comandos si puede reutilizarse una superficie existente sin ambigüedad.

### 10.3 MCP

Reutilizar las herramientas actuales (`kaddo_create_initiative`, `kaddo_update_initiative`, `kaddo_add_initiative_candidate`, `kaddo_materialize_initiative_candidate`, `kaddo_analyze_initiative`, `kaddo_complete_initiative`). Añadir o extender solo para operaciones faltantes. Mantener preview/confirm y protección entre preview y aplicación.

### 10.4 Admin Server

Incorporar endpoints para actualizar Initiatives, crear/editar/retirar candidatos, previsualizar y confirmar materialización, consultar verificación de resultados, registrar evidencia, consultar readiness y ejecutar completion explícito. Los endpoints deben validar entrada con los contratos existentes, delegar escrituras en Core, preservar sesión/CSRF/errores seguros, rechazar conflictos de concurrencia y no escribir Markdown directamente.

## 11. Acceptance Criteria

### Initiative Management

- [ ] **AC-01:** Admin permite crear Initiatives con atributos de planificación relevantes.
- [ ] **AC-02:** Admin permite editar metadatos y secciones de intención sin destruir contenido existente.
- [ ] **AC-03:** Se preservan IDs, provenance, relaciones y campos desconocidos.
- [ ] **AC-04:** La edición rechaza revisiones obsoletas y no sobrescribe cambios concurrentes.
- [ ] **AC-05:** Owners, Contributors y asociaciones con Epics reutilizan los mecanismos existentes.

### Candidate Management

- [ ] **AC-06:** Admin presenta candidatos pendientes y materializados con su información relevante.
- [ ] **AC-07:** Admin permite crear candidatos mediante Core.
- [ ] **AC-08:** Admin permite editar candidatos pendientes sin cambiar su identidad.
- [ ] **AC-09:** El retiro de un candidato pendiente exige confirmación y conserva la justificación.
- [ ] **AC-10:** No es posible eliminar o alterar silenciosamente la asociación de un candidato materializado.
- [ ] **AC-11:** Los identificadores de candidatos permanecen únicos dentro de la Initiative.

### Materialization

- [ ] **AC-12:** Admin permite previsualizar la materialización antes de confirmarla.
- [ ] **AC-13:** La materialización crea un único Work Item en `draft`.
- [ ] **AC-14:** El Work Item conserva Initiative, Candidate ID y Source Signals.
- [ ] **AC-15:** La Initiative registra correctamente `materialized_as`.
- [ ] **AC-16:** Fallos parciales y operaciones concurrentes no dejan referencias inconsistentes.
- [ ] **AC-17:** La repetición de una materialización no crea Work Items duplicados.
- [ ] **AC-18:** La UI permite navegar al Work Item materializado y actualiza Planning Coverage.

### Analysis & Verification

- [ ] **AC-19:** Admin distingue Planning Coverage, Delivery Progress y Outcome Verification.
- [ ] **AC-20:** El análisis muestra candidatos pendientes, trabajo incompleto y dependencias relevantes.
- [ ] **AC-21:** Los Success Criteria pueden verificarse con evidencia estructurada reutilizando los contratos existentes.
- [ ] **AC-22:** Checkboxes, actividad Git o Work Items completados no aprueban automáticamente resultados.
- [ ] **AC-23:** La evidencia permanece asociada al criterio correcto y detecta duplicados o cambios que la vuelvan obsoleta.

### Completion

- [ ] **AC-24:** Core evalúa conservadoramente el completion de Initiatives.
- [ ] **AC-25:** Una actualización genérica de estado no puede eludir el mecanismo canónico de completion.
- [ ] **AC-26:** Admin presenta Completion Review con razones y bloqueos.
- [ ] **AC-27:** El cierre exige confirmación humana explícita y registra la decisión.
- [ ] **AC-28:** La evaluación no cambia automáticamente el estado ni el de sus Work Items, Epic o Plan.

### Quality & Compatibility

- [ ] **AC-29:** CLI, MCP y Admin utilizan la misma lógica canónica de Core.
- [ ] **AC-30:** Initiatives históricas y Work Items independientes mantienen compatibilidad sin migración obligatoria.
- [ ] **AC-31:** Las pruebas unitarias, de integración y E2E cubren creación, edición, concurrencia, materialización, verificación y cierre.
- [ ] **AC-32:** Admin funciona correctamente en Light/Dark y móvil a 375px; builds y documentación EN/ES aprobados.

## 12. Validation Scenarios

- **Scenario A — Initiative creation and editing:** crear y editar Goal/Scope/metadatos. Expected: contenido actualizado sin pérdida de Markdown, provenance ni relaciones.
- **Scenario B — Candidate management:** crear/modificar/consultar candidato. Expected: mismo Candidate ID, información preservada, Planning Coverage coherente.
- **Scenario C — Candidate materialization:** materializar pendiente. Expected: un Work Item `draft`, asociado, con provenance completa.
- **Scenario D — Duplicate materialization:** reintentar el mismo candidato. Expected: rechazo controlado, sin segundo Work Item.
- **Scenario E — Concurrent modification:** modificar tras abrir el formulario. Expected: conflicto explícito, sin sobrescribir.
- **Scenario F — Partial materialization failure:** simular falla entre escrituras. Expected: sin estado parcial; recuperación o rechazo consistente.
- **Scenario G — Completed delivery, incomplete outcome:** todos los WIs completos, un Success Criterion sin evidencia. Expected: no Ready.
- **Scenario H — Human-gated completion:** todo verificado y el usuario confirma. Expected: transición válida, decisión registrada, evidencia preservada.
- **Scenario I — Bypass prevention:** completar vía status genérico o MCP sin autorización humana. Expected: rechazo; requiere el camino canónico.
- **Scenario J — Backward compatibility:** Initiatives antiguas, standalone Work Items, Initiatives sin Epic. Expected: funcionan sin migraciones ni relaciones ficticias.

## 13. Constraints

Core es la única fuente de lógica. Markdown sigue siendo canónico. No duplicar asociaciones Initiative↔Work Items. No convertir Candidates en entidades con lifecycle independiente. No materializar automáticamente. No inferir autorización desde Git o `confirm: true`. No cambiar el lifecycle de otros artifacts como efecto secundario. No crear un segundo motor de verificación. No eliminar evidencia o provenance silenciosamente. Conservar compatibilidad con CLI/MCP. Mantener Planning opcional.

## 14. Non-goals

Dashboard ejecutivo (WI-080); rediseño de Planning Explorer; sync bidireccional con Jira/Linear/Azure; creación automática de candidatos por IA; priorización automática del backlog; capacidad/costos/cronogramas; nuevos estados de Work Items; migración masiva; permisos/roles/aprobadores; cambios funcionales a Plans/Epics; corrección general de la infraestructura E2E ajena a WI-079.

## 15. Implementation Approach

Phase 1 Core (revisar contratos, edición/retiro de candidatos, consistencia/concurrencia de materialización, completion unificado con WI-078, pruebas). **Antes de implementar, presentar las decisiones que afecten identidad, integridad o compatibilidad de artifacts.** Phase 2 CLI & MCP. Phase 3 Admin Server. Phase 4 Admin UI. Phase 5 E2E (escenarios A–J, integridad/provenance, concurrencia, Light/Dark/375px, regresión). Phase 6 Documentation & Verification (EN/ES, límites de aprobación, evidencia por AC, `kaddo verify WI-079`, readiness). Pruebas con proyectos temporales aislados.

## 15b. Refinement Notes — Core contract review & design decisions

Verificado contra el repo en v3.135.0 (tras WI-078). **Reutilizar** `createInitiative`,
`updateInitiative`, `transitionInitiative`, `addCandidate`, `materializeCandidate`, `addExternalLink`,
`computeInitiativeProgress`, `analyzeInitiative`, y de WI-078 `AcceptanceCriterionEvidence`,
`buildOutcomeVerification`, `revisionOf`, `PlanningConflictError`. **Net-new**: edición/retiro de
candidatos, concurrencia, materialización idempotente, `completeInitiative` canónico, verificación por
evidencia. Decisiones que afectan identidad/integridad/compatibilidad (a aprobar antes de implementar):

- **D1 — Identidad de candidatos (AC-11).** `addCandidate` hoy genera `WI-CANDIDATE-NNN` por
  `length+1`, que puede **reusar** un id tras eliminar/reordenar. Cambiar a id monotónico `max(sufijos)+1`
  (como `nextEpicId`). Aditivo: los ids existentes se conservan.

- **D2 — Edición/retiro de candidatos (AC-08/09/10).** `updateCandidate` (solo pendientes; preserva id,
  source_signals, provenance, claves desconocidas) y `removeCandidate` (solo pendientes; registra la
  justificación en un log de frontmatter `removed_candidates: [{id,title,reason,removed_at}]`, clave
  aditiva). Ambos rechazan candidatos materializados.

- **D3 — Materialización idempotente y atómica (AC-16/17, Scenarios D/F).** La clave de idempotencia es
  la **procedencia del Work Item** (`source_initiative`+`source_id`), no solo `materialized_as`. Antes de
  crear: si ya existe un WI con esa procedencia → reparar `materialized_as` si falta y devolverlo (sin
  duplicar); si `materialized_as` apunta a un WI inexistente → error (relación rota, nunca corregir en
  silencio). Aceptar `expectedRevision` de la Initiative (rechazar si cambió desde el preview) y exigir
  candidato pendiente. Orden de escritura con recuperación consistente ante fallo parcial.

- **D4 — Concurrencia (AC-04).** `expectedRevision` (reusar `revisionOf`) en update/candidate/materialize/
  complete; el detalle de Initiative expone `revision`. Conflicto → error tipo `PlanningConflictError`.

- **D5 — Edición estructurada de secciones Markdown (AC-02/03).** `updateInitiative` hoy solo parchea
  frontmatter. Añadir actualización por sección `## Nombre` que reemplaza solo ese bloque y preserva los
  demás + frontmatter desconocido + `source`/`source_id`. Nunca reemplazar el Markdown completo.

- **D6 — Verificación por evidencia (AC-21/22/23).** Reutilizar `buildOutcomeVerification` de WI-078. Los
  Success Criteria declarados se leen de la sección `## Success Criteria`; la evidencia se guarda en
  frontmatter `outcome_verifications` (misma forma que Epics/Plans). Sin motor paralelo. Compatibilidad
  de lectura: Initiatives sin evidencia muestran criterios `not-verified`.

- **D7 — Cierre canónico y anti-bypass (AC-24/25, Scenario I).** Hoy `→ completed` se alcanza desde 5
  rutas (CLI complete+genérica, MCP complete+genérica, Admin "Move to"). Hacer que `transitionInitiative`
  **rechace `→ completed`** y enrutar todo el cierre por `completeInitiative(dir, id, decision, opts)`,
  que exige evaluación READY, registra `completion_decision` y comprueba revisión. `evaluateInitiativeCompletion`
  evoluciona a las categorías de WI-078 (`READY_TO_COMPLETE|READY_WITH_EXCEPTIONS|NEEDS_WORK|BLOCKED`);
  se actualizan sus consumidores (CLI/MCP/Admin). **Impacto de compatibilidad:** cambia el retorno de
  `evaluateInitiativeCompletion` y el botón Admin "Move to: completed" pasa por el flujo gated.

## 16. Definition of Done

32 AC evaluados con evidencia; gestión completa de Initiatives y Candidates desde Admin; materialización consistente y segura; relaciones y provenance preservadas; completion con evaluación canónica y aprobación humana; CLI/MCP/Admin comparten reglas de Core; pruebas de integración y E2E del flujo completo; documentación EN/ES; builds y regresión aprobados; sin regresiones en Planning ni Work Items independientes. La aprobación funcional no implica autorización de publicación o cierre.

## 17. Risks

Materialización parcial (mitigación: operación consistente, concurrencia, fallos simulados). Pérdida de provenance (preservación de metadatos, restricciones sobre candidatos materializados). Completion bypass (ruta única, pruebas de bypass CLI/MCP/Admin). Duplicación de verificación (reutilizar estructuras canónicas). Crecimiento del alcance (limitar al ciclo de gestión de la Initiative y sus Candidates).

## 18. Commit & Release Gate

Gate A — Integration; Gate B — Publication; Gate C — Canonical Closure. No ejecutar commit, push, bump, tag, publicación npm ni cierre sin autorización explícita. El artifact WI-079 debe incorporarse al repositorio antes del tag de publicación, aun en `in-progress`, para conservar trazabilidad.

## 19. Learning

Publicado en **v3.136.0**. La gestión completa de Initiatives quedó cerrada reutilizando el contrato de
evidencia de WI-078 (`buildOutcomeVerification`) en lugar de crear un segundo motor de verificación —
Initiatives, Epics y Plans comparten ahora una sola lógica de readiness.

**Qué funcionó bien**

- **Reutilizar el motor de WI-078.** `initiative-verification.ts` solo parsea los Success Criteria del
  cuerpo y delega en `buildOutcomeVerification`; la detección de ambiguos (duplicados) y stale
  (editados) vino gratis. Confirma el principio de "Core es la única fuente de lógica".
- **Integridad por diseño, no por reintentos.** La idempotencia de materialización con recuperación por
  provenance (clave: `source_initiative` + `source_id`) convirtió "fallo parcial" en una operación
  segura de repetir, y un `materialized_as` colgante se reporta como error en vez de recrearse.
- **Anti-bypass en un solo punto.** Hacer que `transitionInitiative(-> completed)` se rechace y que
  `completeInitiative` sea la única ruta cerró las 5 vías previas (CLI/MCP/Admin) con un cambio pequeño.

**Fricciones y decisiones**

- **Un checkbox no es evidencia (AC-22).** El mayor cambio de contrato: Initiatives históricas con
  `- [x]` ahora leen `not-verified`. Se preservó compatibilidad de lectura (Scenario J, sin crash) y no
  se forzó migración; el cierre exige evidencia registrada explícitamente.
- **Alcance de CLI acotado.** Siguiendo §10.2, no se añadieron subcomandos nuevos de CLI: la superficie
  rica de gestión vive en Admin y MCP, y la CLI solo redirigió `complete` al flujo gated. Evita
  ambigüedad y mantiene la CLI estable.
- **Concurrencia donde importa.** Se enhebró `expectedRevision` en la edición de metadatos/secciones
  (el escenario real de "formulario obsoleto", 409 `INITIATIVE_CONFLICT`); las mutaciones de candidate
  se apoyan en las comprobaciones de integridad de Core (idempotencia, guard de materializado).

**Deuda independiente**

- `integrations.spec.ts:17` (import de external work item) es un flaky preexistente, no relacionado con
  WI-079; falla incluso aislado (~30s timeout) y **no** se enmascaró con reintentos. Candidato a su
  propio Work Item de estabilización de E2E.

**Para la próxima**

- El `tsup` de la CLI no emite `.d.ts` para `@kaddo/cli/core`, así que `admin-server` no se puede
  typechequear con `tsc` estricto contra ese import (todo llega como `any`). El gate real es tsup +
  tests. Emitir dts del core sería una mejora transversal de DX.
