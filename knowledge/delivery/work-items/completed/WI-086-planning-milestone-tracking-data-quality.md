---
type: feature
id: WI-086
title: Planning Milestone Tracking & Data Quality
status: completed
work_type: feature
knowledge_level: K3
created_at: '2026-11-16'
domains:
  - Product
  - Tech
  - Delivery
antecedent:
  - WI-076
  - WI-078
  - WI-079
  - WI-081
  - WI-082
  - WI-083
  - WI-085
scope_confidence:
  level: medium
  reasons:
    - >-
      WI-085 entregó navegación por pestañas, selector de milestone en
      Completion Review y listas progresivas; esta iteración debe reutilizarlos.
    - >-
      La validación visual con Wasma mostró que la pestaña Milestones todavía
      enumera todos los exit criteria y no permite consultar su verificación en
      el propio contexto del hito.
    - >-
      WI-085 ya identificó y corrigió en Core la conversión de un mapa YAML a
      '[object Object]', pero el artifact de origen puede continuar conteniendo
      valores no legibles.
    - >-
      Las discrepancias históricas de asociaciones entre Epics y Work Items
      necesitan diagnóstico y explicación, no una reasignación implícita.
surfaces:
  product-ui: affected
  frontend: affected
  backend: reviewed-conditional
  database: not-applicable
  configuration: reviewed-not-affected
  feature-flags: not-applicable
  content-copy: affected
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: affected
  operations-release: reviewed-not-affected
source:
  type: external
  imported_at: '2026-11-16'
  source_format: kaddo-frontmatter
  source_hash: 1ba7a50e85bd68bd5e0abaf3930bc62eb0e83d37096eb3f6ac860c74cf28e840
  inferred: false
generated_by: kaddo-admin
affected_modules:
  - admin
  - docs
summary: >-
  WI-074–083 construyeron el modelo Planning; WI-085 (v3.141.0) incorporó
  navegación por pestañas para Plan, Epic e Initiative; reorganizó Completion
  Review y Manage Milestones; compactó los checks y las listas de colaboración.
  La prueba de uso real corresponde a Wasma, con un P…
telemetry_work_item_id: f1b9d7ea-370b-419c-872d-9d8a1949de4e
original_snapshot:
  title: Planning Milestone Tracking & Data Quality
  description: >-
    WI-074–083 construyeron el modelo Planning; WI-085 (v3.141.0) incorporó
    navegación por pestañas para Plan, Epic e Initiative; reorganizó Completion
    Review y Manage Milestones; compactó los checks y las listas de
    colaboración. La prueba de uso real corresponde a Wasma, con un P…
  type: feature
  status: draft
ready_at: '2026-11-16'
implementation_status: completed
validation_status: passed
released_in: v3.142.0
implementation_evidence:
  repositories:
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/MilestonesTracking.tsx
        - packages/admin/src/components/EvidenceDrawer.tsx
        - packages/admin/src/components/PlanningCompletion.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/e2e/planning-milestone-tracking.spec.ts
        - packages/admin/e2e/planning.spec.ts
        - packages/admin/e2e/fixtures/project/knowledge/delivery/plans/PLAN-001.md
        - packages/admin/e2e/fixtures/project/knowledge/delivery/work-items/ready/WI-060-dedup-provenance.md
      validations:
        - command: CI=1 npx playwright test
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/delivery-planning.md
        - apps/docs/src/content/docs/es/delivery-planning.md
        - knowledge/delivery/dogfooding/wasma-epic-association-reconciliation.md
      validations:
        - command: pnpm -r build
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Se documenta el flujo actual Milestones → Evidence & completion y sus fricciones, con evidencia visual de un Plan con 9 milestones.'
      status: passed
      evidence: 'El checkpoint de Fase 1 (read-only) documentó el flujo actual Milestones (índice plano id/título/criterios) hacia Evidence & completion y sus fricciones; la evidencia visual se obtuvo del Plan de fixture con 9 milestones (RM-01..RM-09).'
      reference: 'packages/admin/src/routes/Planning.tsx'
      method: manual
    - criterion: '**AC-02:** Se confirma qué datos de verificación ya están disponibles en las APIs y componentes actuales; se documentan las fuentes de cada nuevo indicador.'
      status: passed
      evidence: 'Se confirmó que la verificación ya existe en verifyPlan().milestones[].outcome y se documentó la matriz indicador->fuente Core->superficie; cada indicador del índice se lee del evaluador existente, sin dato nuevo.'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-03:** Se presenta y aprueba un wireframe de índice/expansión por milestone y navegación contextual antes de implementar UI.'
      status: passed
      evidence: 'Se presentó y aprobó en el checkpoint un wireframe de índice de milestones con expansión y navegación contextual antes de escribir UI.'
      reference: 'knowledge/delivery/work-items/in-progress/WI-086-planning-milestone-tracking-data-quality.md'
      method: manual
    - criterion: '**AC-04:** Se reproduce y describe la causa de al menos un criterio de origen no textual sin modificar ningún artifact real.'
      status: passed
      evidence: 'El milestone RM-06 del fixture contiene un exit criterion mapeado (no textual); se diagnostica como ilegible sin modificar ningún artifact real del proyecto.'
      reference: 'packages/admin/e2e/fixtures/project/knowledge/delivery/plans/PLAN-001.md'
      method: manual
    - criterion: '**AC-05:** Se documenta la ruta canónica de asociación de Work Items y se reconcilian de forma read-only los IDs de EP-005 y EP-008 con las expectativas previas, sin asumir cuál conteo es correcto.'
      status: passed
      evidence: 'Se documentó la ruta canónica workItemsInEpic (directa union indirecta, deduplicada) y un esqueleto de reconciliación read-only EP-005/EP-008 que no asume cuál conteo es correcto.'
      reference: 'knowledge/delivery/dogfooding/wasma-epic-association-reconciliation.md'
      method: manual
    - criterion: '**AC-06:** Milestones muestra por defecto los hitos como filas compactas con ID, título y verificación `passed/total` basada exclusivamente en el evaluador existente.'
      status: passed
      evidence: 'La pestaña Milestones muestra filas compactas con id, título y passed/total tomado exclusivamente de verifyPlan (evaluador existente).'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-07:** Al seleccionar un milestone se muestran únicamente sus Exit Criteria, estado y evidencia disponible; todos los milestones no quedan expandidos simultáneamente por defecto.'
      status: passed
      evidence: 'La selección expande un solo milestone a la vez; el E2E verifica que abrir otro colapsa el anterior y que no todos quedan expandidos.'
      reference: 'packages/admin/e2e/planning-milestone-tracking.spec.ts'
      method: manual
    - criterion: '**AC-08:** Cada criterio conserva su identidad exacta, el milestone al que pertenece y el estado de evidencia que emite Core.'
      status: passed
      evidence: 'CriterionRow conserva el texto exacto del criterio, el milestone al que pertenece y el estado de evidencia emitido por Core.'
      reference: 'packages/admin/src/components/EvidenceDrawer.tsx'
      method: manual
    - criterion: '**AC-09:** Los estados `failed`, `not-verified`, `manual-review-required`, ambiguous y stale se distinguen de `passed` cuando el evaluador los expone; ninguno se presenta como verificado por error.'
      status: passed
      evidence: 'failed/not-verified/manual-review-required/ambiguous/stale se distinguen de passed (badge needs review y estados por criterio); ninguno se presenta como verificado por error.'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-10:** Un milestone sin criterios no se interpreta como 100 % completo; la interfaz muestra un estado vacío explicativo.'
      status: passed
      evidence: 'Un milestone sin exit criteria muestra ''no exit criteria declared'' y un estado vacío explicativo; nunca 0/0 = completo (E2E AC-10).'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-11:** Las Epics vinculadas al milestone, cuando existen, pueden consultarse desde el contexto correcto sin inventar asociaciones.'
      status: passed
      evidence: 'Las Epics vinculadas (plan.epics[].milestone) se muestran en la fila y como chips navegables, sin inventar asociaciones.'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-12:** Existe una acción funcional desde el criterio hacia el flujo canónico `Record evidence`, con `planId`, `milestoneId` y criterio correctos.'
      status: passed
      evidence: 'Record evidence abre el drawer compartido con planId, milestoneId y criterio correctos (E2E verifica el contexto ''Milestone RM-08 · criterio'').'
      reference: 'packages/admin/src/components/EvidenceDrawer.tsx'
      method: manual
    - criterion: '**AC-13:** Al guardar evidencia válida, el usuario observa el resultado actualizado y puede regresar al mismo hito; el guard de revisión y los errores 409 se conservan.'
      status: passed
      evidence: 'Al guardar, el resultado se actualiza en su lugar y se conserva el hito seleccionado; expectedRevision/409 se preservan (E2E save test).'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-14:** Consultar, expandir o filtrar milestones no modifica Markdown ni registra evidencia por sí mismo.'
      status: passed
      evidence: 'El índice es read-only: consultar, expandir o filtrar no escribe Markdown ni registra evidencia.'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-15:** El diagnóstico de criterios no legibles muestra una advertencia comprensible y, cuando esté disponible con seguridad, la ubicación del campo/índice, sin exponer objetos crudos como texto.'
      status: passed
      evidence: 'El diagnóstico Tier-A nombra el campo (milestones[].exit_criteria) y la cantidad, lo distingue de un not-verified legítimo y nunca expone el objeto crudo.'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-16:** Ningún valor inválido se convierte silenciosamente en criterio válido ni evidencia `passed`; permanecen los tests de parsing seguro de WI-085.'
      status: passed
      evidence: 'Ningún valor inválido se vuelve criterio válido ni evidencia passed; los tests de parsing seguro de WI-085 siguen en verde (sin cambio en Core).'
      reference: 'packages/cli/tests/plan-criteria-parsing.test.ts'
      method: manual
    - criterion: '**AC-17:** La solución no cambia el contrato o resultado del motor de completion WI-078/079 ni introduce un verificador paralelo.'
      status: passed
      evidence: 'Se reutiliza el evaluador verifyPlan y el único drawer/mutación de evidencia; no se cambia el contrato del motor WI-078/079 ni se introduce un verificador paralelo.'
      reference: 'packages/admin/src/components/MilestonesTracking.tsx'
      method: manual
    - criterion: '**AC-18:** Se puede auditar o documentar el conjunto exacto de Work Items de una Epic, con su procedencia `epic` directa o `initiative` indirecta, sin dobles conteos.'
      status: passed
      evidence: 'El conjunto de Work Items de una Epic se audita deduplicado (directa union indirecta); el E2E sobre EP-002 verifica que un WI alcanzable por ambas rutas aparece una sola vez.'
      reference: 'packages/admin/e2e/planning-milestone-tracking.spec.ts'
      method: manual
    - criterion: '**AC-19:** Los Work Items independientes y referencias ambiguas históricas mantienen sus clasificaciones honestas y no se vinculan automáticamente.'
      status: passed
      evidence: 'Los Work Items independientes conservan su clasificación honesta y no se vinculan automáticamente (E2E: un WI independiente no aparece en la Epic).'
      reference: 'packages/admin/e2e/planning-milestone-tracking.spec.ts'
      method: manual
    - criterion: '**AC-20:** El caso real de Wasma genera una lista de hallazgos y correcciones sugeridas para su Etapa B, pero no cambia archivos de Wasma dentro de este WI.'
      status: passed
      evidence: 'El reporte read-only genera hallazgos y correcciones sugeridas para la Etapa B de Wasma sin modificar archivos de Wasma.'
      reference: 'knowledge/delivery/dogfooding/wasma-epic-association-reconciliation.md'
      method: manual
    - criterion: '**AC-21:** La navegación funciona por teclado con nombres accesibles, foco visible y apertura/cierre de detalles sin pérdida inesperada de foco.'
      status: passed
      evidence: 'Navegación por teclado accesible: tabs con flechas/Home/End y filas con aria-expanded; foco gestionado sin pérdidas inesperadas.'
      reference: 'packages/admin/src/components/SectionTabs.tsx'
      method: manual
    - criterion: '**AC-22:** Las pantallas funcionan en 375px y escritorio, dark/light, con estados loading/error/empty y sin overflow horizontal involuntario.'
      status: passed
      evidence: 'E2E a 375px sin overflow horizontal; revisión visual local confirmó escritorio y dark/light.'
      reference: 'packages/admin/e2e/planning-milestone-tracking.spec.ts'
      method: manual
    - criterion: '**AC-23:** Hay pruebas unitarias/integración/E2E del índice, estados, selección, navegación a evidencia, datos no textuales y asociaciones directas/indirectas.'
      status: passed
      evidence: 'Nuevo spec E2E cubre índice, estados, selección, navegación a evidencia, dato no textual y asociaciones directas/indirectas.'
      reference: 'packages/admin/e2e/planning-milestone-tracking.spec.ts'
      method: manual
    - criterion: '**AC-24:** La suite relevante, regresiones de WI-078/079/081/083/085, typecheck y builds pasan sin ocultar fallos con retries o skips.'
      status: passed
      evidence: 'Suite E2E (67) + gate raíz de unit (2196 pass, 1 skip) + pnpm -r build (5 paquetes + docs) en verde, sin retries ni skips que oculten fallos.'
      reference: 'https://github.com/Kaddo-kdd/kaddo/actions/runs/43992635559'
      method: manual
    - criterion: '**AC-25:** La documentación EN/ES y el Learning del WI describen el modelo de verificación, la navegación y las limitaciones de datos históricos.'
      status: passed
      evidence: 'Docs EN/ES describen el modelo de verificación, la navegación y los límites de datos históricos; el Learning §11 lo recoge.'
      reference: 'apps/docs/src/content/docs/delivery-planning.md'
      method: manual
    - criterion: '**AC-26:** Se aprueba la revisión visual local antes de commit/push; Gate A, Gate B y Gate C tienen autorizaciones independientes y el cierre conserva evidencia por AC.'
      status: passed
      evidence: 'Revisión visual local aprobada antes del commit; Gate A, B y C se autorizaron por separado; el cierre conserva evidencia por AC.'
      reference: 'knowledge/delivery/work-items/in-progress/WI-086-planning-milestone-tracking-data-quality.md'
      method: manual
---

# WI-086 — Planning Milestone Tracking & Data Quality

## 1. Contexto

WI-074–083 construyeron el modelo Planning; WI-085 (v3.141.0) incorporó navegación por pestañas para Plan, Epic e Initiative; reorganizó Completion Review y Manage Milestones; compactó los checks y las listas de colaboración. La prueba de uso real corresponde a Wasma, con un Plan (`PLAN-001`), 9 milestones (`M1`–`M9`), 9 Epics, 9 Initiatives y 79 Work Items.

Observaciones posteriores a WI-085:

- La pestaña **Milestones** de Plan Detail presenta el listado completo de títulos y criterios, sin una síntesis de verificación ni una acción contextual para trabajar en un hito.
- La pestaña **Evidence & completion** ya permite seleccionar un milestone y registrar evidencia, pero requiere cambiar de sección sin llevar el contexto desde Milestones.
- WI-085 corrigió en `parseCriteria` la conversión de objetos YAML arbitrarios en `[object Object]`. Actualmente los elementos no legibles se excluyen de criterios verificables y se contabilizan como `unreadable`; **la fuente histórica no fue reparada**.
- En Wasma aparecen 41 Work Items vinculados y 38 independientes. Se reportaron expectativas previas de 7/11 para EP-005/EP-008, mientras la vista mostró 6/12. Una diferencia de conteos **no prueba por sí misma un defecto de Kaddo**: hay que comparar IDs y rutas canónicas y revisar la etapa B de reconciliación en Wasma.

### Implementación existente para reutilizar

- `packages/admin/src/routes/Planning.tsx`: PlanDetail y secciones de navegación.
- `packages/admin/src/components/PlanningCompletion.tsx`: evaluación, selector de milestone y `Record evidence`.
- `packages/admin/src/components/PlanningManage.tsx`: edición enfocada de milestones.
- `packages/admin/src/components/PlanningInsights.tsx`: resumen read-only de milestones y outcomes.
- `packages/cli/src/core/delivery-planning.ts`: `parseCriteria`, `computePlanProgress`, `workItemsInEpic` y relaciones canónicas.
- `packages/cli/src/core/delivery-verification.ts` y `delivery-planning-write.ts`: verificación/evidencia/completion existentes.

## 2. Problema

La información está disponible, pero hay fricción al pasar de observar un milestone a **entender qué criterios faltan, inspeccionar su evidencia y actuar sobre el criterio correcto**. Además, el usuario no dispone de una guía suficientemente específica para investigar entradas YAML ilegibles o diferencias de asociación, lo que puede inducir a reparar datos por intuición o alterar registros históricos sin evidencia.

## 3. Resultado esperado

Una experiencia compacta y orientada a decisiones para cada milestone que responda:

1. ¿Qué debe demostrar este hito?
2. ¿Cuántos de sus Exit Criteria están verificados y cuáles requieren revisión?
3. ¿Dónde puedo consultar/registrar la evidencia del criterio seleccionado?
4. ¿Cuál es el origen de un dato no legible o una asociación no reconocida, sin inventar un resultado?

**Principio rector:** la interfaz presenta y navega; Core determina progreso, evidence/readiness y pertenencia. Markdown sigue siendo la fuente canónica y todo completion requiere decisión humana explícita.

## 4. Alcance

### 4.1 Milestones: índice compacto con progreso verificable

En **Plan Detail → Milestones**:

- Mostrar un índice de hitos con `id`, título, Epics relacionadas cuando estén disponibles y **criterios verificados/total** del motor canónico.
- Indicar `needs review` cuando corresponda, diferenciando `passed`, `failed`, `not-verified`, `manual-review-required`, ambiguos y evidencia obsoleta cuando estén expuestos por la evaluación existente.
- Expandir o seleccionar **un milestone a la vez** para ver sus Exit Criteria, estado y evidencia; no expandir automáticamente los nueve.
- Ofrecer una acción contextual para **revisar o registrar evidencia** de un criterio, reutilizando `PlanningCompletion` y el flujo ya existente. La selección debe conservar `PLAN-001`, `M#` y el criterio exacto.
- El estado mostrado no equivale a un nuevo lifecycle de milestone; no inventar `completed`, porcentajes de trabajo o fechas.
- Contemplar cero milestones, cero criterios, evidencias parciales, stale y errores de evaluación sin mostrar `0/0` como cumplimiento.

### 4.2 Continuidad entre Milestones y Evidence & completion

- Permitir navegación directa al contexto específico de evidencia desde la pestaña Milestones, conservando regreso y selección cuando sea factible con `SectionTabs`/URL hash existentes.
- Conservar filtros y flujos de evidencia de WI-085. Evitar crear un segundo formulario que duplique validación o mutaciones.
- Preservar protección de concurrencia (`expectedRevision` / 409), actualizaciones de query y confirmaciones humanas.

### 4.3 Diagnósticos de criterios de origen no textual

- Determinar con una reproducción sintética y, en lectura local, con Wasma el dato que permanece no legible: campo (`success_criteria` o `milestones[].exit_criteria`), tipo/índice y forma original, cuando pueda inspeccionarse de forma segura.
- Mostrar una advertencia accionable que distinga **origen no interpretable** de un criterio legítimamente `not-verified`.
- Si la interfaz necesita exponer ubicación de origen, proponer un contrato mínimo y tipado para ello; **no cambiar Core/admin-server sin checkpoint técnico y autorización explícita**.
- Mantener el comportamiento seguro añadido en WI-085: ningún objeto arbitrario pasa a ser criterio verificable, sin `[object Object]` y sin reparar automáticamente el Markdown.
- Entregar una recomendación de corrección humana para el artifact de Wasma como **hallazgo separado**, sin editarlo desde este WI.

### 4.4 Diagnóstico read-only de asociaciones

- Para Epics con conteos discutidos, permitir o documentar una inspección basada en IDs y procedencia canónica: asociación directa `work_item.epic` o indirecta `work_item.initiative → initiative.epic`.
- Distinguir Work Items vinculados, independientes y referencias `materialized_as` ambiguas. No inferir una relación desde `source`, títulos, orden de un roadmap ni anotaciones históricas.
- La solución mínima puede ser una vista contextual ligera **o** un procedimiento de inspección documentado, según el resultado del diagnóstico de Fase 1. No crear un segundo motor de conteos.
- Para Wasma, reconciliar en un reporte read-only EP-005 y EP-008: IDs efectivos, IDs esperados, duplicados y justificaciones. No asumir de antemano que 7/11 es más correcto que 6/12.

## 5. Restricciones y no objetivos

- No repetir la implementación de tabs, selector de milestone, `Show more` o parser seguro que ya entregó WI-085.
- No modificar la lógica de readiness, outcomes, Exit Criteria, dependencias, `completePlan`/`completeEpic` ni la regla 1:1 de `materialized_as`.
- No registrar evidencia falsa, convertir `completed` histórico en outcome verificado ni cerrar artifacts automáticamente.
- No modificar los 79 Work Items, el roadmap, milestones ni Initiatives del proyecto Wasma. Su Etapa B de reconciliación es **trabajo separado en ese repositorio**.
- No introducir porcentajes globales ni cambiar denominadores/cobertura establecidos en WI-081/083.
- No introducir una API o contrato nuevo sin demostrar que la API existente resulta insuficiente y recibir autorización específica.
- No copiar datos privados de Wasma a fixtures públicos; usar datos sintéticos.
- Sin refactor general de Admin ni nuevo sistema de design tokens.

## 6. Acceptance Criteria

### Diagnóstico y diseño

- [ ] **AC-01:** Se documenta el flujo actual Milestones → Evidence & completion y sus fricciones, con evidencia visual de un Plan con 9 milestones.
- [ ] **AC-02:** Se confirma qué datos de verificación ya están disponibles en las APIs y componentes actuales; se documentan las fuentes de cada nuevo indicador.
- [ ] **AC-03:** Se presenta y aprueba un wireframe de índice/expansión por milestone y navegación contextual antes de implementar UI.
- [ ] **AC-04:** Se reproduce y describe la causa de al menos un criterio de origen no textual sin modificar ningún artifact real.
- [ ] **AC-05:** Se documenta la ruta canónica de asociación de Work Items y se reconcilian de forma read-only los IDs de EP-005 y EP-008 con las expectativas previas, sin asumir cuál conteo es correcto.

### Milestones y seguimiento

- [ ] **AC-06:** Milestones muestra por defecto los hitos como filas compactas con ID, título y verificación `passed/total` basada exclusivamente en el evaluador existente.
- [ ] **AC-07:** Al seleccionar un milestone se muestran únicamente sus Exit Criteria, estado y evidencia disponible; todos los milestones no quedan expandidos simultáneamente por defecto.
- [ ] **AC-08:** Cada criterio conserva su identidad exacta, el milestone al que pertenece y el estado de evidencia que emite Core.
- [ ] **AC-09:** Los estados `failed`, `not-verified`, `manual-review-required`, ambiguous y stale se distinguen de `passed` cuando el evaluador los expone; ninguno se presenta como verificado por error.
- [ ] **AC-10:** Un milestone sin criterios no se interpreta como 100 % completo; la interfaz muestra un estado vacío explicativo.
- [ ] **AC-11:** Las Epics vinculadas al milestone, cuando existen, pueden consultarse desde el contexto correcto sin inventar asociaciones.
- [ ] **AC-12:** Existe una acción funcional desde el criterio hacia el flujo canónico `Record evidence`, con `planId`, `milestoneId` y criterio correctos.
- [ ] **AC-13:** Al guardar evidencia válida, el usuario observa el resultado actualizado y puede regresar al mismo hito; el guard de revisión y los errores 409 se conservan.
- [ ] **AC-14:** Consultar, expandir o filtrar milestones no modifica Markdown ni registra evidencia por sí mismo.

### Integridad y trazabilidad

- [ ] **AC-15:** El diagnóstico de criterios no legibles muestra una advertencia comprensible y, cuando esté disponible con seguridad, la ubicación del campo/índice, sin exponer objetos crudos como texto.
- [ ] **AC-16:** Ningún valor inválido se convierte silenciosamente en criterio válido ni evidencia `passed`; permanecen los tests de parsing seguro de WI-085.
- [ ] **AC-17:** La solución no cambia el contrato o resultado del motor de completion WI-078/079 ni introduce un verificador paralelo.
- [ ] **AC-18:** Se puede auditar o documentar el conjunto exacto de Work Items de una Epic, con su procedencia `epic` directa o `initiative` indirecta, sin dobles conteos.
- [ ] **AC-19:** Los Work Items independientes y referencias ambiguas históricas mantienen sus clasificaciones honestas y no se vinculan automáticamente.
- [ ] **AC-20:** El caso real de Wasma genera una lista de hallazgos y correcciones sugeridas para su Etapa B, pero no cambia archivos de Wasma dentro de este WI.

### Calidad y cierre

- [ ] **AC-21:** La navegación funciona por teclado con nombres accesibles, foco visible y apertura/cierre de detalles sin pérdida inesperada de foco.
- [ ] **AC-22:** Las pantallas funcionan en 375px y escritorio, dark/light, con estados loading/error/empty y sin overflow horizontal involuntario.
- [ ] **AC-23:** Hay pruebas unitarias/integración/E2E del índice, estados, selección, navegación a evidencia, datos no textuales y asociaciones directas/indirectas.
- [ ] **AC-24:** La suite relevante, regresiones de WI-078/079/081/083/085, typecheck y builds pasan sin ocultar fallos con retries o skips.
- [ ] **AC-25:** La documentación EN/ES y el Learning del WI describen el modelo de verificación, la navegación y las limitaciones de datos históricos.
- [ ] **AC-26:** Se aprueba la revisión visual local antes de commit/push; Gate A, Gate B y Gate C tienen autorizaciones independientes y el cierre conserva evidencia por AC.

## 7. Escenarios de validación

| Escenario | Preparación | Resultado esperado |
|---|---|---|
| A — Plan grande | 9 milestones y criterios heterogéneos | Índice compacto, solo el seleccionado expandido y contexto visible |
| B — Criterios mixtos | Passed, failed, not-verified, manual-review, stale/ambiguous | Conteos y etiquetas consistentes con Core |
| C — Evidence context | Seleccionar M7 y un criterio | Abre registro de evidencia para M7, no para el Plan global u otro hito |
| D — Concurrencia | Revisiones simultáneas | 409 visible, sin pérdida silenciosa ni aprobación indebida |
| E — Cero criterios | Milestone sin exit criteria | Sin porcentaje ficticio ni auto-completion |
| F — Dato ilegible | Lista YAML con mapa no interpretable | Ubicación/contexto o diagnóstico útil; nunca `[object Object]` |
| G — Relaciones | WI por `epic`, WI por `initiative`, WI sin vínculo | IDs deduplicados; los independientes siguen independientes |
| H — Wasma | EP-005/EP-008, 41 vinculados/38 independientes reportados | Reconciliación de IDs read-only; sin modificación del repositorio |
| I — Accesibilidad | Teclado, 375px, dark/light | Navegación y foco accesibles, sin overflow |
| J — Regresión | Flujos existentes WI-078/079/085 | Evidencia, gates y completion sin cambios |

## 8. Enfoque de implementación

### Fase 1 — Diagnóstico read-only y checkpoint de diseño

1. Confirmar contratos actuales de `SectionTabs`, `PlanningCompletion`, `PlanDetail`, `getPlanDetail` y `verifyPlan`.
2. Reproducir la experiencia de nueve milestones y las anomalías de criterios/relaciones.
3. Entregar la matriz *indicador → fuente Core → superficie UI*, wireframe, estrategia de navegación y reconciliación read-only.
4. Documentar decisiones D1–D5: representación de estados, expansión/selección, navegación a evidencia, diagnóstico del origen y necesidad real de cambios en Core/admin-server.
5. **Detenerse para aprobación humana antes de cualquier cambio de código.** Si el diseño requiere ampliar alcance en Core o servidor, pedir aprobación específica.

### Fase 2 — Seguimiento compacto de milestones

- Implementar índice y expansión/selección de un hito en Plan Detail → Milestones.
- Reutilizar la evaluación y el formulario de evidencia existentes; conservar estado de selección y foco al cambiar de sección.
- Enlazar Epics relacionadas sin crear asociaciones nuevas.

### Fase 3 — Diagnóstico de calidad y trazabilidad

- Añadir únicamente las pistas de error/ubicación aprobadas para criterios no textuales.
- Incorporar o documentar el mecanismo mínimo de inspección de asociaciones canónicas.
- Emitir el informe read-only de diferencias de Wasma para su Etapa B; no ejecutar reconciliaciones.

### Fase 4 — Pruebas y revisión visual

- Tests dirigidos en Core/Admin según superficie realmente cambiada, pruebas E2E sin retries y `pnpm -r build`.
- Validar proyecto vacío, Plan sin hitos y Plan grande con 9 hitos, 9 Epics, 9 Initiatives y 79 WI sintéticos.
- Revisar escritorio, 375px, light/dark y teclado; mostrar capturas/diff de trabajo local.
- **Retener commit/push hasta la aprobación explícita del resultado visible.**

### Fase 5 — Entrega controlada

- **Gate A — Integración:** tras aprobación explícita, commits de implementación y seguimiento, push y CI satisfactoria.
- **Gate B — Publicación:** decidir con autorización independiente si corresponde bump/tag/npm/GitHub Release; publicar solo sobre HEAD validado con pruebas y provenance según el proceso existente.
- **Gate C — Cierre:** registrar evidencia de los 26 AC, ejecutar `kaddo verify WI-086`, Learning en español, `released_in` solo si efectivamente hay release, mover al directorio canónico `completed/`, commit/push y CI de cierre.

## 9. Definition of Done

- La navegación desde milestone a evidencia es útil y directa, sin cargar listas extensas.
- El progreso se muestra como verificación por Exit Criteria, no como estado de avance inventado.
- Los casos de integridad se explican sin reinterpretar ni editar conocimiento histórico.
- Las pruebas funcionales y de regresión están en verde; revisión local aprobada.
- Gates cerrados con evidencia y autorizaciones separadas.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Volver a implementar comportamiento ya cubierto por WI-085 | Inventario previo y cambios mínimos por archivo/componente |
| Un porcentaje de verificación interpretado como progreso de entrega | Presentar `criterios verificados/total` y texto explicativo |
| Duplicar el formulario de evidencia o saltarse concurrency guard | Reutilizar `PlanningCompletion`/API, tests 409 y revisión explícita |
| Dar por válidos criterios YAML arbitrarios | Conservar `parseCriteria`; advertencia de origen no textual sin auto-repair |
| Confundir matriz histórica con asociación canónica | Comparar IDs y procedencia; no asumir conteos ni escribir Wasma |
| Aumentar scope a cambios de Core/servidor por inercia | Checkpoint con aprobación específica, sin cambiar contrato de completion |
| Fugas de información de Wasma en fixtures | Fixtures sintéticos; revisión manual del proyecto real sin copiar conocimiento |

## 11. Learning

Entregado en v3.142.0 (Admin + docs; sin cambio en Core/admin-server).

### Causa raíz de la fricción

Tras WI-085 la verificación por hito ya existía en el evaluador canónico
(`verifyPlan → EntityEvaluation.milestones[].outcome`), pero solo se exponía en la pestaña **Evidence &
completion**. La pestaña **Milestones** de Plan Detail seguía siendo un listado plano de id/título/criterios,
sin síntesis de verificación ni acción contextual: para entender qué faltaba en un hito, inspeccionar su
evidencia y actuar había que cambiar de sección perdiendo el contexto. El dato no faltaba; faltaba
**presentarlo donde se decide**.

### Decisiones aprobadas (checkpoint de Fase 1)

- **D1 — Representación de estado:** mostrar `verificados/total` del evaluador existente (nunca un % de
  avance), estados tal como los emite Core y `needs review`; cero criterios = estado vacío explícito, nunca
  `0/0` = completo.
- **D2 — Expansión:** índice compacto con **un** hito expandido a la vez; nunca los nueve.
- **D3 — Navegación a evidencia:** se **extrajo** `EvidenceDrawer` + `CriterionRow` a un módulo compartido;
  la acción por criterio abre ese único drawer con plan+milestone+criterio y conserva `expectedRevision`/409,
  más un enlace a Evidence & completion por el hash de sección existente. Sin segundo formulario.
- **D4 — Diagnóstico de ilegibles:** se eligió **Tier A** (sin cambio en Core): advertencia accionable que
  nombra el campo y la cantidad y lo distingue de un `not-verified` legítimo, usando los contadores
  `unreadableExitCriteria` ya disponibles.
- **D5 — Procedencia de asociaciones:** se eligió **procedimiento documentado** (sin cambio en Core):
  docs EN/ES de la resolución canónica (directa ∪ indirecta, deduplicada) más un reporte read-only de
  reconciliación EP-005/EP-008 para la Etapa B de Wasma.

Ambas decisiones de ampliación de alcance (D4 Tier B y D5 opción con badge en UI) habrían tocado
Core/admin-server; se descartaron por decisión humana explícita, manteniendo `affected_modules: [admin, docs]`.

### Cambios reales

`MilestonesTracking.tsx` (índice nuevo), `EvidenceDrawer.tsx` (drawer + fila de criterio compartidos),
`PlanningCompletion.tsx` (consume lo compartido, sin duplicar), `Planning.tsx` (pestaña Milestones usa el
índice), docs EN/ES, reporte de reconciliación de Wasma, y fixtures/E2E (Plan de 9 hitos heterogéneos y WI
de deduplicación).

### Evidencia de pruebas y revisión visual

Suite E2E 67/67, gate raíz de unit 2196 pass / 1 skip, `pnpm -r build` (5 paquetes + docs) en verde, sin
retries ni skips. Revisión visual local aprobada: índice compacto, diagnóstico Tier-A en RM-06, dark mode y
375px sin overflow.

### Límites honestos del diagnóstico

- El diagnóstico Tier-A nombra el campo y la cantidad de elementos ilegibles, no su índice exacto (eso
  habría requerido cambio en Core, no autorizado).
- La reconciliación EP-005/EP-008 se entrega como procedimiento + esqueleto: los ids reales se completan
  ejecutándolo localmente contra Wasma, ya que ese repositorio no es accesible desde aquí y no se copian
  datos privados a fixtures públicos.

### Acciones pendientes en Wasma (Etapa B, separada)

Reparar en el Markdown de origen los exit/success criteria no textuales (mapas YAML) y corregir, con
evidencia, las asociaciones `epic:`/`initiative:` mal declaradas si la reconciliación las revela. Kaddo
diagnostica; no reescribe conocimiento histórico.

### Prevención de recurrencia

La verificación por hito se lee siempre del evaluador canónico (una sola fuente); el drawer/mutación de
evidencia es único y compartido, de modo que una futura superficie no puede divergir ni duplicar validación.
El índice es read-only por contrato (consultar/expandir/filtrar nunca escribe).
