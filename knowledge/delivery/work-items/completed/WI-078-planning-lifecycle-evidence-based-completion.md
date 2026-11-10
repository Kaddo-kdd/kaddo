---
type: feature
id: WI-078
title: Planning Lifecycle & Evidence-Based Completion
status: completed
work_type: feature
created_at: '2026-11-06'
source:
  type: external
  imported_at: '2026-11-06'
  source_format: kaddo-frontmatter
  source_hash: 43c122fe51b2433710aec8dc2a0382c4daff07c188fbe25f3d05bd6b4f16f0ed
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
  - WI-074
  - WI-075
  - WI-076
  - WI-077
scope_confidence:
  level: high
  reasons:
    - >-
      Plans y Epics ya cuentan con modelos canónicos y reglas de lifecycle
      (PLAN_TRANSITIONS/EPIC_TRANSITIONS).
    - >-
      Core ya calcula progreso, relaciones y dependencias
      (computePlanProgress/computeEpicProgress, validatePlanningGraph).
    - >-
      WI-077 incorporó verificación de Work Items basada en evidencia
      (implementation_evidence.ac_verifications) reutilizable como contrato.
    - Admin ya dispone de vistas y gestión de Planning (WI-075/WI-076).
    - >-
      Revisión de contratos confirmada: transiciones y verificación de outcome
      de Plan/Epic son net-new; no existen aún en delivery-planning-write.ts.
summary: >-
  Completar el lifecycle de Delivery Plans y Epics, incorporando verificación de
  resultados y criterios de salida de milestones, evidencia canónica, evaluación
  de completion readiness y cierre mediante aprobación humana, reutilizando Core
  y las capacidades existentes de Planning y verification.
original_snapshot:
  title: Planning Lifecycle & Evidence-Based Completion
  description: 'Kaddo permite estructurar la planificación mediante:'
  type: feature
  status: draft
ready_at: '2026-11-06'
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/delivery-verification.ts
        - packages/cli/src/core/delivery-planning-write.ts
        - packages/cli/src/core/lifecycle.ts
        - packages/cli/src/core.ts
        - packages/cli/src/commands/plan.ts
        - packages/cli/src/commands/verify.ts
        - packages/cli/src/index.ts
        - packages/cli/tests/delivery-verification.test.ts
        - packages/cli/tests/delivery-verification-adjustments.test.ts
        - packages/cli/tests/ac-parser.test.ts
      validations:
        - command: pnpm vitest run packages/cli/tests
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    mcp:
      role: module
      status: completed
      changed_paths:
        - packages/mcp/src/planning.ts
        - packages/mcp/src/server.ts
        - packages/mcp/tests/planning-lifecycle.test.ts
      validations:
        - command: pnpm vitest run packages/mcp/tests/planning-lifecycle.test.ts
          status: passed
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/src/server.ts
        - packages/admin-server/src/contracts/schemas.ts
        - packages/admin-server/tests/planning-lifecycle.test.ts
      validations:
        - command: >-
            pnpm vitest run
            packages/admin-server/tests/planning-lifecycle.test.ts
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/PlanningCompletion.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/planning-completion.spec.ts
        - packages/admin/e2e/fixtures/project/knowledge/delivery/epics/EP-900.md
      validations:
        - command: >-
            pnpm --filter @kaddo/admin exec playwright test planning.spec.ts
            planning-management.spec.ts planning-completion.spec.ts
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/delivery-planning.md
        - apps/docs/src/content/docs/es/delivery-planning.md
      validations:
        - command: documentation review (EN/ES)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Core ejecuta transiciones válidas de Delivery Plans.'
      status: passed
      evidence: >-
        transitionDeliveryPlan applies PLAN_TRANSITIONS and writes status; green
        test.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: '**AC-02:** Core ejecuta transiciones válidas de Epics.'
      status: passed
      evidence: transitionEpic applies EPIC_TRANSITIONS and writes status; green test.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: '**AC-03:** Las transiciones inválidas son rechazadas sin mutaciones.'
      status: passed
      evidence: An invalid transition throws and the artifact is unchanged; green test.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: '**AC-04:** Las escrituras preservan frontmatter, Markdown y relaciones.'
      status: passed
      evidence: >-
        Transitions and milestone edits preserve body, unknown keys and
        relations; green tests.
      reference: packages/cli/tests/delivery-verification-adjustments.test.ts
      method: automated
    - criterion: >-
        **AC-05:** Las transiciones gestionan conflictos de concurrencia y
        evitan escrituras parciales.
      status: passed
      evidence: >-
        A stale expectedRevision raises PlanningConflictError → HTTP 409; writes
        are atomic; green tests (Core + admin-server).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-06:** Los Success Criteria de Epics pueden verificarse
        individualmente.
      status: passed
      evidence: >-
        recordEpicOutcomeVerification verifies one success criterion at a time;
        green test.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-07:** Los Success Criteria de Plans pueden verificarse
        individualmente.
      status: passed
      evidence: >-
        recordPlanOutcomeVerification verifies one Plan success criterion at a
        time; green test.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-08:** La evidencia conserva estado, justificación, referencia y
        método.
      status: passed
      evidence: >-
        Evidence stores status, evidence text, reference, method, verified_at
        and verified_by; asserted in frontmatter.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-09:** La evidencia persiste y se recupera tras recargar el
        artifact.
      status: passed
      evidence: >-
        Evidence persists to the artifact and is re-read on evaluation; asserted
        after reload.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-10:** Cambiar o reordenar criterios no provoca atribuciones
        incorrectas de evidencia.
      status: passed
      evidence: >-
        Editing/reordering a criterion leaves prior evidence stale, never
        reattributed (Scenario E + milestone edit).
      reference: packages/cli/tests/delivery-verification-adjustments.test.ts
      method: automated
    - criterion: >-
        **AC-11:** Un checkbox o un Work Item completado no aprueba
        automáticamente un criterio de resultado.
      status: passed
      evidence: >-
        A completed Work Item does not auto-pass an outcome criterion; it stays
        not-verified (Scenario A/AC-11).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-12:** Los Exit Criteria de milestones admiten verificación
        individual.
      status: passed
      evidence: >-
        Milestone exit criteria are verified individually via
        recordMilestoneExitVerification; green test.
      reference: packages/cli/tests/delivery-verification-adjustments.test.ts
      method: automated
    - criterion: >-
        **AC-13:** El progreso de milestone deriva de sus criterios sin
        introducir lifecycle independiente.
      status: passed
      evidence: >-
        Milestone progress is derived from its criteria; no second lifecycle
        state is persisted.
      reference: packages/cli/tests/delivery-verification-adjustments.test.ts
      method: automated
    - criterion: >-
        **AC-14:** Las evidencias de milestones permanecen asociadas al Plan y
        preservan sus relaciones.
      status: passed
      evidence: >-
        Milestone evidence stays inside the Plan entry and survives title
        edits/reorders; green preservation tests.
      reference: packages/cli/tests/delivery-verification-adjustments.test.ts
      method: automated
    - criterion: >-
        **AC-15:** Una Epic no es Ready si tiene criterios obligatorios
        pendientes o fallidos.
      status: passed
      evidence: >-
        An Epic is not Ready while criteria are pending or failed; green tests
        (Scenario A, AC-18).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-16:** Una Epic no es Ready si existen entregables comprometidos
        incompletos o dependencias bloqueantes.
      status: passed
      evidence: >-
        An Epic is BLOCKED/NEEDS_WORK with a blocking dependency or incomplete
        committed work; green tests.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-17:** Un Plan no es Ready si sus Epics, criterios o milestones
        obligatorios no cumplen las condiciones de cierre.
      status: passed
      evidence: >-
        A Plan is Ready only when its Epics, success criteria and milestone exit
        criteria pass (AC-17, Scenario C).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-18:** La evaluación distingue ausencia de evidencia, evidencia
        insuficiente y fallo comprobado.
      status: passed
      evidence: >-
        Evaluation distinguishes no-evidence, insufficient/unverified and
        comprobado failure; green test (AC-18).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: '**AC-19:** Las evaluaciones devuelven razones y hallazgos verificables.'
      status: passed
      evidence: >-
        evaluate*Completion returns reasons, blockers and warnings; asserted in
        tests.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: '**AC-20:** Completion Readiness no ejecuta transiciones automáticamente.'
      status: passed
      evidence: >-
        A READY_* readiness never transitions; evaluation leaves status
        in-progress (Scenario B, AC-20).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-21:** Completar Plan o Epic exige aprobación humana y registra la
        decisión.
      status: passed
      evidence: >-
        Completion is human-gated (completeEpic/Plan) and records
        completion_decision; green tests (Core + admin-server 409→decision) and
        live Admin run.
      reference: packages/admin-server/tests/planning-lifecycle.test.ts
      method: automated
    - criterion: >-
        **AC-22:** CLI permite consultar y gestionar lifecycle y verification de
        Plans y Epics.
      status: passed
      evidence: >-
        CLI: kaddo plan|epic start / verify --json / evidence / complete
        delegate to Core; smoke-run start→evidence→verify→complete.
      reference: packages/cli/src/commands/plan.ts
      method: manual
    - criterion: '**AC-23:** MCP expone lectura y mutaciones explícitas mediante Core.'
      status: passed
      evidence: >-
        MCP verify/record/transition/complete tools expose reads and explicit
        preview→confirm mutations via Core; green tests.
      reference: packages/mcp/tests/planning-lifecycle.test.ts
      method: automated
    - criterion: >-
        **AC-24:** Admin Server reutiliza Core y mantiene sus controles de
        seguridad.
      status: passed
      evidence: >-
        Admin Server endpoints delegate to Core and keep session +
        same-origin/CSRF; green tests incl. CSRF rejection.
      reference: packages/admin-server/tests/planning-lifecycle.test.ts
      method: automated
    - criterion: '**AC-25:** Admin permite revisar y gestionar completion de Epics.'
      status: passed
      evidence: >-
        Admin Epic Detail shows Completion Review and completes via the
        human-gated dialog; green E2E + live run.
      reference: packages/admin/e2e/planning-completion.spec.ts
      method: manual
    - criterion: >-
        **AC-26:** Admin permite revisar y gestionar completion y milestones de
        Plans.
      status: passed
      evidence: >-
        Admin Plan Detail shows Completion Review with milestone exit-criteria
        verification; endpoints + PlanningCompletion.
      reference: packages/admin/src/components/PlanningCompletion.tsx
      method: manual
    - criterion: >-
        **AC-27:** Las interfaces muestran de forma separada progreso de
        ejecución y cumplimiento de resultados.
      status: passed
      evidence: >-
        Interfaces separate execution progress (Delivery) from outcome
        verification; replaced the structural "Preconditions met".
      reference: packages/admin/src/components/PlanningCompletion.tsx
      method: manual
    - criterion: '**AC-28:** Las interfaces funcionan en Light/Dark y móvil a 375px.'
      status: passed
      evidence: >-
        Completion Review verified in Light/Dark and at 375px mobile (live
        screenshots).
      reference: packages/admin/src/components/PlanningCompletion.tsx
      method: manual
    - criterion: >-
        **AC-29:** Los Work Items, Initiatives y proyectos sin Planning completo
        siguen funcionando.
      status: passed
      evidence: >-
        Epics/Initiatives/projects without full planning still work; standalone
        Epic evaluates and completes (Scenario F, AC-29).
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-30:** No se crean asociaciones, evidencias ni cambios de lifecycle
        implícitos.
      status: passed
      evidence: >-
        No implicit associations, evidence or lifecycle changes; transitions
        refuse →completed, recording requires a declared criterion.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: >-
        **AC-31:** Pruebas unitarias, integración y Admin E2E cubren
        transiciones, verificación, concurrencia y cierre.
      status: passed
      evidence: >-
        Unit, integration and Admin E2E cover transitions, verification,
        concurrency and completion; full suite green.
      reference: packages/cli/tests/delivery-verification.test.ts
      method: automated
    - criterion: '**AC-32:** Documentación EN/ES actualizada y builds/regresión aprobados.'
      status: passed
      evidence: >-
        EN/ES docs updated (delivery-planning.md) and full monorepo build + 2130
        unit tests pass.
      reference: apps/docs/src/content/docs/delivery-planning.md
      method: manual
released_in: v3.135.0
completed_at: '2026-11-10'
---

# WI-078 — Planning Lifecycle & Evidence-Based Completion

## 1. Context

Kaddo permite estructurar la planificación mediante:

```text
Roadmap
  └── Delivery Plan
       └── Milestone
            └── Epic
                 └── Initiative
                      └── Work Item
```

Los Work Items, Initiatives, Epics y Delivery Plans pueden existir independientemente cuando el proyecto no necesita toda la jerarquía.

Las entregas anteriores incorporaron:

- WI-074: modelos canónicos de Delivery Plans y Epics.
- WI-075: Unified Planning Explorer.
- WI-076: creación, edición y administración visual de Planning.
- WI-077: asignaciones, colaboración Git y verificación de Work Items basada en evidencia.

Actualmente, Planning diferencia:

1. **Planning Coverage:** alcance planificado y materializado.
2. **Delivery Progress:** estado de los Work Items.
3. **Completion Readiness:** condiciones previas para completar un resultado.

Sin embargo, la verificación de resultados de Epics y Plans todavía es limitada.

Las estructuras `PLAN_TRANSITIONS` y `EPIC_TRANSITIONS` están definidas, pero no existe un flujo completo que permita aplicar esas transiciones y cerrar entidades mediante evidencia verificable.

## 2. Problem

Hoy Kaddo puede identificar que todos los Work Items relacionados con una Epic están completados.

Sin embargo, esto no demuestra necesariamente que se consiguió el resultado esperado.

Ejemplo:

**Epic: Implementar autenticación empresarial**

- 8/8 Work Items completados.
- Implementación desplegada.
- Tests aprobados.
- Criterio de éxito: soportar SSO corporativo.
- Criterio de éxito: superar revisión de seguridad.

Aunque todos los Work Items estén completados, no existe necesariamente evidencia de que SSO funciona o de que la revisión de seguridad fue aprobada.

El sistema puede mostrar que se cumplieron las condiciones de ejecución, pero no debe confundirlas con el cumplimiento del resultado.

**Problema central:** Kaddo necesita distinguir trabajo terminado de resultado alcanzado.

## 3. Expected Outcome

El usuario podrá:

1. Iniciar, consultar y gestionar el lifecycle de Plans y Epics.
2. Registrar evidencia verificable para sus Success Criteria.
3. Evaluar Exit Criteria de milestones.
4. Identificar condiciones pendientes para completar una Epic o Plan.
5. Distinguir Delivery Progress de Outcome Verification.
6. Revisar dependencias, trabajo pendiente y evidencia insuficiente.
7. Aprobar explícitamente el cierre de una Epic o Plan.
8. Consultar posteriormente qué evidencias justificaron ese cierre.
9. Utilizar estas capacidades desde CLI, MCP y Admin.
10. Mantener los artifacts Markdown como fuente canónica de verdad.

Ninguna operación debe completar automáticamente una entidad por tener todos sus Work Items terminados.

---

## 4. Planning Lifecycle Management

### 4.1 Delivery Plan Lifecycle

Conservar los estados existentes:

```text
draft
  ├── in-progress
  │    ├── completed
  │    └── cancelled
  └── cancelled
```

Implementar operaciones canónicas para ejecutar estas transiciones.

Condiciones:

- Validar estado inicial y destino.
- Rechazar transiciones inválidas.
- Conservar el ID y las relaciones existentes.
- Preservar frontmatter y Markdown no relacionado con la operación.
- No modificar automáticamente las Epics asociadas.
- No ejecutar transiciones por cambios derivados del progreso.
- Exigir aprobación humana antes de completar.

### 4.2 Epic Lifecycle

Conservar los estados existentes:

```text
planned
  ├── in-progress
  │    ├── completed
  │    └── cancelled
  └── cancelled
```

La transición a `completed` debe estar condicionada a una evaluación de cumplimiento y una decisión humana.

Una Epic puede existir sin Delivery Plan.

Las transiciones no deben depender de tener una estructura jerárquica completa.

### 4.3 Core Operations

Incorporar operaciones equivalentes a:

```typescript
transitionDeliveryPlan()
transitionEpic()

verifyPlanOutcome()
verifyEpicOutcome()

evaluatePlanCompletion()
evaluateEpicCompletion()
```

Los nombres son orientativos y deben adaptarse a las convenciones actuales de Core.

Las operaciones de evaluación deben ser puras o read-only y no modificar artifacts.

Las operaciones de transición deben escribir exclusivamente mediante Core, con protección de concurrencia y confirmación en las interfaces.

---

## 5. Evidence-Based Outcome Verification

### 5.1 Success Criteria

Permitir registrar evidencia individual sobre los criterios de éxito de:

- Delivery Plans.
- Epics.

La verificación debe mantener la separación entre:

**Declared Success Criterion**

Qué resultado se espera alcanzar.

**Verification Evidence**

Qué pruebas, entregables, decisiones o resultados demuestran su cumplimiento.

**Verification Decision**

Si la evidencia es suficiente para considerar alcanzado el criterio.

### 5.2 Evidence Contract

Proponer un contrato compatible con el mecanismo de `implementation_evidence.ac_verifications` introducido anteriormente.

Cada verificación debe permitir registrar:

| Campo | Descripción |
|---|---|
| Criterion | Identificador o referencia al criterio canónico |
| Status | passed / failed / not-verified / manual-review-required |
| Evidence | Explicación concreta del resultado observado |
| Reference | Archivo, test, artifact, ADR, reporte u otra referencia comprobable |
| Method | automated / manual |
| Verified at | Fecha de verificación |
| Verified by | Responsable de la evaluación, cuando se declare |

La estructura definitiva debe reutilizar los contratos existentes y evitar duplicar mecanismos de verificación.

La identidad de los criterios debe ser estable frente a cambios de orden. Si se edita o elimina un criterio, su evidencia previa no debe reasignarse silenciosamente a otro.

No utilizar únicamente checkboxes como evidencia suficiente.

### 5.3 Evidence Sources

Admitir referencias a evidencias existentes, por ejemplo:

- Work Items completados.
- Resultados de pruebas.
- Documentos o artifacts del proyecto.
- ADR.
- Reportes.
- Validaciones de seguridad.
- Revisiones manuales registradas.

La existencia de un Work Item completado no convierte automáticamente un criterio de resultado en `passed`.

Una referencia documental no debe aprobarse simplemente por existir: debe registrar qué demuestra y cómo fue evaluada.

Las referencias Git de WI-077 pueden utilizarse como contexto, pero actividad Git no equivale a cumplimiento del resultado.

---

## 6. Milestone Exit Criteria Verification

Los milestones permanecen definidos dentro del Delivery Plan.

No crear artifacts independientes ni un lifecycle para cada milestone.

Incorporar verificación de los `exit_criteria` existentes.

Ejemplo:

```yaml
milestones:
  - id: RM-01
    title: Architecture Foundation
    exit_criteria:
      - Architecture baseline approved
      - Critical technical decisions documented
      - Initial implementation validated
```

Para cada criterio de salida se debe poder registrar evidencia y estado de verificación.

### Reglas

- Un milestone no se considera satisfecho solamente porque las Epics relacionadas estén completadas.
- Sus criterios de salida deben evaluarse individualmente.
- Los criterios pendientes o fallidos deben reflejarse en Completion Readiness del Plan.
- La evaluación no cambia el lifecycle de las Epics.
- Los criterios de salida existentes deben permanecer en su ubicación canónica.
- Si no existen milestones, no se deben inventar verificaciones o imponer hitos ficticios.

La UI podrá representar el cumplimiento de cada milestone mediante estados derivados de sus criterios, sin persistir un segundo estado de lifecycle.

---

## 7. Completion Readiness

### 7.1 Epic Completion

La evaluación debe considerar:

- Existencia de un resultado esperado y criterios de éxito verificables.
- Estado de los Work Items asociados directamente o mediante Initiatives.
- Estado y alcance comprometido de las Initiatives relacionadas.
- Dependencias entre Epics.
- Success Criteria y su evidencia.
- Hallazgos bloqueantes.
- Excepciones explícitamente aprobadas, cuando exista un mecanismo canónico aplicable.

La evaluación debe rechazar falsos positivos en casos como:

- No existen entregables verificables.
- No existen criterios de éxito.
- Todos los Work Items están completados, pero hay criterios sin verificar.
- Hay dependencias bloqueantes.
- Existen evidencias obsoletas, contradictorias o incompletas.

### 7.2 Plan Completion

Además de las condiciones anteriores, un Plan debe evaluar:

- Epics asociadas y su estado.
- Dependencias entre elementos.
- Success Criteria del Plan.
- Exit Criteria de sus milestones.
- Evidencia suficiente del resultado global.
- Existencia de trabajo comprometido todavía pendiente.

Una Epic completada es una señal relevante, no una aprobación automática del Plan.

### 7.3 Completion Decision

Reutilizar, cuando sea compatible, las categorías de evaluación de Kaddo:

```text
READY_TO_COMPLETE
READY_WITH_EXCEPTIONS
NEEDS_WORK
BLOCKED
```

La evaluación debe mostrar las razones y evidencias correspondientes.

La condición `READY_TO_COMPLETE` no ejecuta una transición.

El cierre sigue siendo una acción humana explícita.

Una excepción aceptada debe conservar su motivo y autorización; no puede utilizarse para ocultar criterios fallidos.

### 7.4 Evidence Freshness

Si después de una verificación cambian los criterios, dependencias o relaciones que sustentan una decisión, Kaddo debe identificar la evidencia potencialmente obsoleta.

No reutilizar silenciosamente una aprobación anterior para un alcance nuevo.

Las entidades históricamente completadas no deben reabrirse automáticamente; los cambios posteriores se reportarán como hallazgos o drift.

---

## 8. Admin Experience

Incorporar las capacidades dentro del Planning existente.

### 8.1 Epic Detail

Agregar:

**Lifecycle Actions**

Mostrar las transiciones válidas según el estado actual.

**Outcome Verification**

Mostrar criterios, estado, evidencia y referencias.

**Completion Review**

Mostrar:

- Resultado esperado.
- Delivery Progress.
- Planning Coverage.
- Criterios de éxito.
- Dependencias.
- Hallazgos.
- Excepciones.
- Completion Readiness.

Incorporar la acción **Complete Epic**, con confirmación humana y bloqueo cuando corresponda.

### 8.2 Plan Detail

Agregar:

**Lifecycle Actions**

Iniciar y completar el Plan mediante Core.

**Milestone Verification**

Visualizar criterios de salida y registrar evidencia.

**Outcome Verification**

Evaluar los Success Criteria del Plan.

**Completion Review**

Presentar una vista consolidada del cumplimiento de Epics, milestones, dependencias y resultado global.

### 8.3 Diseño de interacción

Reutilizar los componentes y estilos existentes de Kaddo.

Requisitos:

- Light/Dark.
- Responsive a 375px.
- Navegación por teclado.
- Confirmación explícita.
- Estados de carga, error y conflicto.
- Referencias de evidencia navegables cuando corresponda.
- Revisión y cancelación sin escritura.
- Actualización de las vistas tras una operación exitosa.

No crear un módulo paralelo a Planning.

---

## 9. CLI & MCP

### 9.1 CLI

Extender los comandos de `plan` y `epic` con operaciones de lifecycle y verification.

Superficie propuesta:

```bash
kaddo plan start PLAN-001
kaddo plan verify PLAN-001 --json
kaddo plan complete PLAN-001

kaddo epic start EP-001
kaddo epic verify EP-001 --json
kaddo epic complete EP-001
```

Los comandos existentes de creación, lectura y progreso deben mantenerse compatibles.

Los comandos de verificación en modo JSON deben ser read-only.

Si hace falta registrar evidencia desde CLI, exponer una operación explícita y separada de `verify`, utilizando Core.

### 9.2 MCP

Incorporar herramientas para:

- Consultar readiness.
- Consultar evidencia.
- Registrar verificaciones.
- Solicitar transiciones.
- Revisar y confirmar completion.

Seguir el patrón `preview → confirm` de Kaddo.

Ningún agente debe cerrar una Epic o Plan silenciosamente.

### 9.3 Admin Server

Exponer las operaciones anteriores mediante contratos validados.

Mantener controles existentes de sesión, CSRF, rutas e identificadores.

Los endpoints no deben escribir Markdown directamente: deben delegar en Core.

---

## 10. Acceptance Criteria

### Lifecycle

- [ ] **AC-01:** Core ejecuta transiciones válidas de Delivery Plans.
- [ ] **AC-02:** Core ejecuta transiciones válidas de Epics.
- [ ] **AC-03:** Las transiciones inválidas son rechazadas sin mutaciones.
- [ ] **AC-04:** Las escrituras preservan frontmatter, Markdown y relaciones.
- [ ] **AC-05:** Las transiciones gestionan conflictos de concurrencia y evitan escrituras parciales.

### Outcome Verification

- [ ] **AC-06:** Los Success Criteria de Epics pueden verificarse individualmente.
- [ ] **AC-07:** Los Success Criteria de Plans pueden verificarse individualmente.
- [ ] **AC-08:** La evidencia conserva estado, justificación, referencia y método.
- [ ] **AC-09:** La evidencia persiste y se recupera tras recargar el artifact.
- [ ] **AC-10:** Cambiar o reordenar criterios no provoca atribuciones incorrectas de evidencia.
- [ ] **AC-11:** Un checkbox o un Work Item completado no aprueba automáticamente un criterio de resultado.

### Milestones

- [ ] **AC-12:** Los Exit Criteria de milestones admiten verificación individual.
- [ ] **AC-13:** El progreso de milestone deriva de sus criterios sin introducir lifecycle independiente.
- [ ] **AC-14:** Las evidencias de milestones permanecen asociadas al Plan y preservan sus relaciones.

### Completion Readiness

- [ ] **AC-15:** Una Epic no es Ready si tiene criterios obligatorios pendientes o fallidos.
- [ ] **AC-16:** Una Epic no es Ready si existen entregables comprometidos incompletos o dependencias bloqueantes.
- [ ] **AC-17:** Un Plan no es Ready si sus Epics, criterios o milestones obligatorios no cumplen las condiciones de cierre.
- [ ] **AC-18:** La evaluación distingue ausencia de evidencia, evidencia insuficiente y fallo comprobado.
- [ ] **AC-19:** Las evaluaciones devuelven razones y hallazgos verificables.
- [ ] **AC-20:** Completion Readiness no ejecuta transiciones automáticamente.
- [ ] **AC-21:** Completar Plan o Epic exige aprobación humana y registra la decisión.

### Interfaces

- [ ] **AC-22:** CLI permite consultar y gestionar lifecycle y verification de Plans y Epics.
- [ ] **AC-23:** MCP expone lectura y mutaciones explícitas mediante Core.
- [ ] **AC-24:** Admin Server reutiliza Core y mantiene sus controles de seguridad.
- [ ] **AC-25:** Admin permite revisar y gestionar completion de Epics.
- [ ] **AC-26:** Admin permite revisar y gestionar completion y milestones de Plans.
- [ ] **AC-27:** Las interfaces muestran de forma separada progreso de ejecución y cumplimiento de resultados.
- [ ] **AC-28:** Las interfaces funcionan en Light/Dark y móvil a 375px.

### Quality & Compatibility

- [ ] **AC-29:** Los Work Items, Initiatives y proyectos sin Planning completo siguen funcionando.
- [ ] **AC-30:** No se crean asociaciones, evidencias ni cambios de lifecycle implícitos.
- [ ] **AC-31:** Pruebas unitarias, integración y Admin E2E cubren transiciones, verificación, concurrencia y cierre.
- [ ] **AC-32:** Documentación EN/ES actualizada y builds/regresión aprobados.

---

## 11. Constraints

- Core es la fuente única de lógica de negocio.
- Los artifacts Markdown siguen siendo canónicos.
- No duplicar las relaciones entre Plan, Epic, Initiative y Work Item.
- Mantener las reglas existentes de lifecycle.
- Conservar el modelo opcional de Planning.
- No introducir estados de lifecycle para milestones.
- No utilizar Git para inferir cumplimiento de resultados.
- No crear un segundo motor de verificación paralelo al existente.
- No completar ninguna entidad sin confirmación humana.
- No ejecutar operaciones Git automáticamente.

## 12. Non-goals

Esta entrega no contempla:

- Gestión visual integral de candidatos de Initiatives (prevista para WI-079).
- Dashboard ejecutivo de ejecución y riesgos (previsto para WI-080).
- Integraciones bidireccionales con Jira, Linear o Azure DevOps.
- Cálculo de cronogramas o estimación automática de fechas.
- Gantt, asignación de capacidad o seguimiento de presupuesto.
- Inferencia de resultados por agentes de IA.
- Aprobaciones automáticas basadas en actividad Git.
- Cambios al lifecycle de Work Items.
- Un sistema independiente de aprobación organizacional o permisos por rol.

## 13. Validation Strategy

Crear un proyecto temporal con:

```text
PLAN-001
  ├── RM-01 — Foundation
  │    └── EP-001 — Architecture
  │         └── INI-001
  │              ├── WI-001 (completed)
  │              └── WI-002 (completed)
  └── RM-02 — Launch
       └── EP-002 — Release
            └── INI-002
                 ├── WI-003 (completed)
                 └── WI-004 (in-progress)
```

Validar al menos estos escenarios:

**Scenario A — Work completed, outcome pending**

Todos los Work Items de EP-001 están terminados, pero uno de sus Success Criteria no tiene evidencia.

Resultado esperado: `NEEDS_WORK`.

**Scenario B — Epic verified**

Todos los entregables están completos y los criterios tienen evidencia aprobada.

Resultado esperado: `READY_TO_COMPLETE`, sin transición automática.

**Scenario C — Plan blocked**

Una Epic y un milestone permanecen pendientes.

Resultado esperado: el Plan no está listo para completarse.

**Scenario D — Human-approved completion**

Una Epic está verificada y recibe aprobación explícita.

Resultado esperado: lifecycle actualizado, evidencia y decisión preservadas, sin modificar otros artifacts.

**Scenario E — Stale evidence**

Un criterio se modifica después de una verificación.

Resultado esperado: la evidencia anterior no aprueba silenciosamente el criterio modificado.

**Scenario F — Compatibility**

Una Epic sin Plan y una Initiative sin Epic operan normalmente.

Resultado esperado: ninguna de las nuevas validaciones exige una jerarquía completa.

Usar fixtures aislados, sin modificar artifacts reales del repositorio.

## 14. Definition of Done

WI-078 estará listo cuando:

- Los 32 Acceptance Criteria estén evaluados con evidencia.
- Plans y Epics cuenten con un lifecycle operativo.
- Los Success Criteria y Exit Criteria se verifiquen con evidencia persistente.
- Completion Readiness no produzca falsos positivos.
- El cierre permanezca bajo aprobación humana.
- CLI, MCP y Admin compartan la misma lógica de Core.
- Existan pruebas E2E del ciclo completo.
- Los builds y la regresión del monorepo aprueben.
- La documentación EN/ES esté actualizada.
- `kaddo verify WI-078` reporte evidencia y readiness coherentes.
- La entrega sea revisada antes de cualquier commit o release.

## 15. Implementation Approach

Seguir este orden:

1. **Core:** contratos de verificación, evaluación de resultados y transiciones.
2. **CLI/MCP:** exponer las operaciones existentes y nuevas mediante adaptadores.
3. **Admin Server:** integrar los contratos y controles de seguridad.
4. **Admin:** implementar Outcome Verification y Completion Review.
5. **E2E:** validar el ciclo completo mediante fixtures.
6. **Documentation:** actualizar las guías EN/ES.
7. **Closure Readiness:** consolidar los AC, resultados y evidencias.

Antes de implementar, revisar las abstracciones existentes de WI-077 para reutilizar sus capacidades de evidencia y verificación cuando sean aplicables.

## 15b. Refinement Notes — Core contract review & evidence design

Verificado contra el estado actual del repo (v3.134.0, tras WI-077):

**Ya existe (reutilizar):**

- `PLAN_TRANSITIONS` / `EPIC_TRANSITIONS` (`delivery-planning.ts`) — mapas de transición válidos, sin
  función que los aplique todavía.
- `transitionInitiative(dir, id, to)` (`initiative-write.ts`) — patrón de transición a copiar (valida
  transición, escribe `status` + `completed_at`, preserva body/claves desconocidas).
- `AcceptanceCriterionEvidence` (`lifecycle.ts`): `{ criterion, status (passed|failed|not-verified|
  manual-review-required), evidence?, reference?, method? (automated|manual) }` — contrato de evidencia
  de WI-077. **Se reutiliza; se extiende solo con `verified_at?` y `verified_by?`** (aditivo), sin crear
  un segundo motor (Constraint §11).
- `evaluateCompletion` + categorías `READY_TO_COMPLETE | READY_WITH_EXCEPTIONS | NEEDS_WORK | BLOCKED`
  (`implementation-evidence.ts`) — lógica de decisión a imitar para Plan/Epic.
- `computeEpicProgress` / `computePlanProgress` / `readinessOf` / `validatePlanningGraph` — progreso,
  dependencias y hallazgos. La evaluación nueva los consume; no los reemplaza.
- `revisionOf` + `PlanningConflictError` + `UpdateOptions.expectedRevision` — concurrencia (AC-05).

**Net-new (no existe en Core):** transición y verificación de outcome de Plan/Epic.

**Diseño de evidencia (canónico, Markdown):**

- Epic/Plan frontmatter: `outcome_verifications: AcceptanceCriterionEvidence[]`, **indexado por el
  texto normalizado del criterio** (`success_criteria`), no por posición. Reordenar no reatribuye
  (AC-10); editar/eliminar un criterio deja su evidencia huérfana → marcada *stale*, nunca reasignada
  en silencio (AC-10, §7.4, Scenario E).
- Milestones: evidencia dentro de la entrada del milestone en el Plan
  (`milestones[i].exit_verifications: AcceptanceCriterionEvidence[]`), indexada por texto del
  `exit_criteria`. Permanece en el Plan, sin lifecycle propio (AC-13/AC-14, §6).
- Cierre: `completion_decision: { readiness, decided_at, decided_by?, reasons[], exceptions? }` se
  escribe al completar; preserva qué evidencias lo justificaron (Expected Outcome §3.8, AC-21).

**Evaluación (read-only, pura) — `delivery-verification.ts`:**

- `evaluateEpicCompletion(dir, epic)` / `evaluatePlanCompletion(dir, plan)` → `{ readiness, reasons,
  blockers, warnings, criteria: {criterion, status, hasEvidence}[], milestones?, staleEvidence[] }`.
- Conservadora: sin outcome/criterios → `NEEDS_WORK`/`BLOCKED`, nunca `READY` (AC-11, AC-15/18, Risk
  "falsos positivos"). WIs completos es señal, no aprobación. Distingue sin-evidencia / insuficiente /
  fallo comprobado (AC-18). Nunca transiciona (AC-20).

**Escrituras (Core, concurrencia) — `delivery-planning-write.ts`:**

- `transitionDeliveryPlan` / `transitionEpic` (valida mapa, `completed_at`, `expectedRevision`).
- `recordEpicOutcomeVerification` / `recordPlanOutcomeVerification` / `recordMilestoneExitVerification`
  (upsert por criterio).
- `completeEpic` / `completePlan` — exigen evaluación `READY_*`, transicionan a `completed` y registran
  `completion_decision` (aprobación humana = la llamada explícita; AC-20/AC-21).

**Interfaces:** CLI `plan|epic start|verify --json|complete` + registro de evidencia separado; MCP
preview→confirm; Admin Server contratos validados sobre Core Adapter; Admin: Outcome Verification +
Completion Review en Epic/Plan Detail, separando Progress / Verification / Completion (AC-27).

## 16. Risks

**Duplicación de mecanismos de evidencia**

Mitigación: reutilizar los contratos actuales de Core y extenderlos únicamente cuando sea necesario.

**Falsos positivos de completion**

Mitigación: evaluación conservadora ante ausencia de criterios, evidencia o entregables.

**Inconsistencia entre niveles de Planning**

Mitigación: derivar relaciones desde sus referencias canónicas; no persistir relaciones duplicadas.

**Evidencia desactualizada**

Mitigación: asociar verificaciones a criterios identificables y detectar cambios posteriores.

**Complejidad de la UI**

Mitigación: reutilizar componentes de Planning y mantener claramente separados Progress, Verification y Completion Review.

## 17. Commit & Release Gate

Antes de cualquier implementación:

- Revisar el alcance.
- Confirmar los contratos existentes de Core.
- Identificar posibles incompatibilidades.
- Preparar el plan de trabajo.

Durante la implementación:

- Probar localmente cada cambio.
- Validar Admin visualmente.
- Registrar evidencia.
- No realizar commits prematuros.

**No ejecutar commit, push, tag, bump, release ni cierre del Work Item sin autorización explícita.**

## 18. Learning

_Pendiente de completar después de la implementación y validación._

## Learning

Capturado al cerrar WI-078 (liberado en v3.135.0).

- **Delivery Progress ≠ Outcome Verification.** Que todos los Work Items estén completos ("trabajo
  terminado") no demuestra que se alcanzó el resultado esperado. WI-078 separó explícitamente el
  progreso de ejecución (Delivery) de la verificación del resultado (Outcome), y la readiness canónica
  (`evaluate*Completion`) pasó a ser la fuente de verdad del cierre, reemplazando la señal estructural
  `meetsCompletionPreconditions`. **Por qué:** mezclarlas producía falsos "listo" cuando faltaba
  evidencia del resultado.

- **El resultado se verifica por criterio, con evidencia concreta, no con checkboxes.** Cada Success
  Criterion (y cada Exit Criterion de milestone) registra `status`/`evidence`/`reference`/`method`/
  `verified_at`/`verified_by`, reutilizando `AcceptanceCriterionEvidence` (de WI-077) sin crear un
  segundo motor de verificación. Un criterio `passed` sólo cuenta si tiene evidencia y referencia
  reales; un Work Item completado nunca aprueba automáticamente un criterio de resultado.

- **Modificar milestones no puede destruir evidencia en silencio.** `normalizeMilestones` fusiona sobre
  la entrada existente (preserva `exit_verifications` y claves desconocidas); editar el título o
  reordenar conserva la evidencia; eliminar un milestone con evidencia exige `allowMilestoneEvidenceLoss`,
  y la UI de Admin ni siquiera envía ese flag, por lo que falla en vez de borrar. La cascada correcta en
  datos necesita además una barrera explícita de autorización.

- **Identidad de criterios estable: contra duplicados y evidencia obsoleta.** La evidencia se indexa por
  el texto normalizado del criterio dentro de su ámbito (Epic/Plan/Milestone). Dos criterios con texto
  colisionante no comparten evidencia (se rechaza el registro y se marcan ambiguos); editar un criterio
  deja su evidencia previa *stale* (visible, nunca reatribuida ni dada por aprobada).

- **Readiness ≠ autorización humana.** `READY_TO_COMPLETE`/`READY_WITH_EXCEPTIONS` jamás transiciona por
  sí solo. Completar es una acción humana explícita (`completeEpic`/`completeDeliveryPlan`) que relee el
  estado, reevalúa en el momento, comprueba la revisión y registra `completion_decision`. En MCP se
  documentó que `confirm: true` es un paso de confirmación, no prueba de aprobación humana. Una excepción
  aceptada exime un criterio concreto con motivo, pero nunca una dependencia bloqueante, trabajo
  incompleto, ausencia de entregables ni un error de integridad.

- **Integración Core → CLI/MCP/Admin sobre un único contrato.** La lógica de negocio vive sólo en Core;
  CLI (`plan|epic start/verify/evidence/complete`), MCP (preview→confirm) y Admin (Completion Review) son
  superficies delgadas que delegan. Un mismo artifact Markdown canónico es leído y escrito por las tres
  interfaces — verificado en vivo: Admin escribió `outcome_verifications` + `completion_decision` y
  `kaddo epic verify` los leyó.

### Correcciones de pre-release

- El parser de `kaddo verify` ahora reconoce AC agrupados en subsecciones (continúa dentro de
  encabezados más profundos y se detiene en uno del mismo nivel o superior), sin aplanar los encabezados
  de WI-078. Añadidas pruebas focalizadas del parser.
- Se endureció el aislamiento del E2E de Planning (fixture dedicado `INI-053` para la mutación de
  colaboración; aserciones con `.first()`).

### Deuda independiente

- `integrations.spec:17` (flujo de importación de Work Items externos) es intermitentemente inestable,
  **preexistente** y ajeno a WI-078 (el diff no toca archivos de integraciones); queda documentado como
  deuda independiente y no se ocultó con retries.
