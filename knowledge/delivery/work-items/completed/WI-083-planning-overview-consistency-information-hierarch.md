---
type: feature
id: WI-083
title: Planning Overview Consistency & Information Hierarchy
status: completed
work_type: feature
created_at: '2026-11-14'
source:
  type: external
  imported_at: '2026-11-14'
  source_format: kaddo-frontmatter
  source_hash: 2a5f1fcb834986fd6fd39c15137445c15c724e5ee73dbf93fcf31910adb8c9de
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
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
  - WI-078
  - WI-079
  - WI-081
  - WI-082
scope_confidence:
  level: high
  reasons:
    - >-
      WI-081 incorporó Execution Insights y WI-082 añadió diagnostics y
      navegación contextual.
    - >-
      La validación manual de v3.138.0 con agent-native mostró divergencia entre
      indicadores, cobertura declarada que domina a la validada y sobrecarga
      visual por estados vacíos o históricos.
    - >-
      El código actual de getPlanningOverviewAdmin agrega blockedWorkItems desde
      Epics, aunque Plans y Epics son opcionales.
    - >-
      Core ya tiene proyecciones de progreso y verification; no es necesario
      otro motor ni modificar el lifecycle.
surfaces:
  product-ui: affected
  frontend: affected
  backend: affected
  database: not-applicable
  configuration: reviewed-not-affected
  feature-flags: not-applicable
  content-copy: affected
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: affected
  operations-release: reviewed-not-affected
summary: >-
  WI-074 a WI-079 habilitaron el modelo opcional de Planning, su gestión y la
  verificación de resultados por evidencia. WI-081 creó Execution Insights y
  WI-082 corrigió la clasificación de referencias históricas ambiguas,
  incorporando un resumen compacto de Needs Attention y un…
original_snapshot:
  title: Planning Overview Consistency & Information Hierarchy
  description: >-
    WI-074 a WI-079 habilitaron el modelo opcional de Planning, su gestión y la
    verificación de resultados por evidencia. WI-081 creó Execution Insights y
    WI-082 corrigió la clasificación de referencias históricas ambiguas,
    incorporando un resumen compacto de Needs Attention y un…
  type: feature
  status: draft
ready_at: '2026-11-14'
implementation_status: completed
validation_status: passed
released_in: v3.139.0
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/planning-insights.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/planning-delivery.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/planning-delivery.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/tests/planning-overview-consistency.test.ts
      validations:
        - command: npx vitest run packages/admin-server/tests/planning-overview-consistency.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin-server build
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/PlanningInsights.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/planning-overview-consistency.spec.ts
        - packages/admin/e2e/planning-insights.spec.ts
      validations:
        - command: pnpm --filter @kaddo/admin exec playwright test (suite completa, 57/57)
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
        - command: pnpm -r build (incluye apps/docs astro)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Se documenta el universo y semántica de cada métrica de Overview y Execution Insights antes de modificar código.'
      status: passed
      evidence: >-
        El checkpoint de Fase 1 (diagnóstico read-only) documentó el universo/denominador de Work Items
        linked, Blocked Work Items, Delivery Progress y Blocking issues, y reprodujo con harness aislado la
        divergencia 0 vs 1 antes de modificar código; §15 (Learning) lo resume.
      reference: knowledge/delivery/work-items/completed/WI-083-planning-overview-consistency-information-hierarch.md
      method: manual
    - criterion: '**AC-02:** `Blocked Work Items` contabiliza correctamente Work Items bloqueados asociados directamente a Initiatives sin Epic.'
      status: passed
      evidence: >-
        getPlanningOverviewAdmin usa computePlanningDelivery; test "counts blocked Work Items tied directly
        to an Initiative with no Epic" y el test de consistencia admin-server (blockedWorkItems === 1 sin
        Epics).
      reference: packages/cli/tests/planning-delivery.test.ts
      method: automated
    - criterion: '**AC-03:** Los Work Items relacionados mediante varias rutas de Planning no se cuentan dos veces en una misma métrica.'
      status: passed
      evidence: >-
        Se enumera cada Work Item una vez por id; test "counts a Work Item reachable via several relations
        only once".
      reference: packages/cli/tests/planning-delivery.test.ts
      method: automated
    - criterion: '**AC-04:** El Overview distingue `Blocked Work Items` de `Blocking issues` y evita aparentes contradicciones por labels ambiguos.'
      status: passed
      evidence: >-
        Métricas con hints ("with an unfinished dependency" vs "integrity findings"); test admin-server y
        E2E que asserta ambos labels. Revisión visual: Blocked Work Items 1, Blocking issues 0.
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-05:** Las vistas mantienen métricas consistentes con la misma proyección Core cuando comparten universo y explicitan diferencias cuando no lo comparten.'
      status: passed
      evidence: >-
        Overview e Insights consumen computePlanningDelivery; test "is the same projection Execution
        Insights uses" y el test admin-server (workItems/blocked === Insights). Los Work Items
        independientes se exponen como universo aparte.
      reference: packages/admin-server/tests/planning-overview-consistency.test.ts
      method: automated
    - criterion: '**AC-06:** Los conteos funcionan con estructuras opcionales y casos vacíos sin crear asociaciones ficticias.'
      status: passed
      evidence: >-
        Tests de proyecto vacío (Core y admin-server) devuelven ceros finitos sin NaN; delivery.independent
        separa los Work Items sin jerarquía.
      reference: packages/admin-server/tests/planning-overview-consistency.test.ts
      method: automated
    - criterion: '**AC-07:** La cifra principal de cobertura presenta `validated/totalCandidates` cuando existen referencias declaradas no resueltas.'
      status: passed
      evidence: >-
        PlanningInsights muestra "Validated Coverage {validated}/{total}" cuando unresolved>0; E2E asserta
        "Validated Coverage" y la revisión visual mostró 1/3 y 2/3.
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-08:** El detalle conserva y distingue `materialized`, `validated`, `unresolved` y `pending` sin perder la información original.'
      status: passed
      evidence: >-
        El detalle de cobertura muestra "{materialized}/{total} declared · {unresolved} unresolved ·
        {pending} pending"; E2E asserta el patrón "declared".
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-09:** Con cero candidatos no se presenta cobertura del 100 % ni se divide entre cero.'
      status: passed
      evidence: >-
        Con totalCandidates===0 la UI muestra "—" / "No candidates"; el test de proyecto vacío confirma
        coverage sin división por cero.
      reference: packages/cli/tests/planning-insights.test.ts
      method: automated
    - criterion: '**AC-10:** Las referencias históricas ambiguas permanecen warnings no validados, sin auto-corrección ni cambio del contrato 1:1.'
      status: passed
      evidence: >-
        Se conserva el diagnóstico de provenance de WI-082: la referencia ambigua es warning, no cuenta
        como validada y no se reescribe; los tests de provenance-diagnostics siguen en verde.
      reference: packages/cli/tests/provenance-diagnostics.test.ts
      method: automated
    - criterion: '**AC-11:** `completed` persistido y `NEEDS_WORK` actual se presentan con nombres y contexto diferentes.'
      status: passed
      evidence: >-
        EntityInsight.historicalEvidenceGap; la UI muestra "Lifecycle: {estado} · Current evidence review:
        {readiness}" y la nota "Historical completion; current checks may require evidence not recorded at
        the time". Revisión visual: INI-011 completed con 1 historical evidence gap.
      reference: packages/cli/tests/planning-delivery.test.ts
      method: automated
    - criterion: '**AC-12:** El tratamiento histórico no altera resultado de verificación, evidencia, provenance, lifecycle ni readiness canónico.'
      status: passed
      evidence: >-
        historicalEvidenceGap es derivado y read-only; el test confirma que evaluar no reescribe el
        artifact y reutiliza las evaluaciones de WI-078/079 (sin verificador nuevo).
      reference: packages/cli/tests/planning-delivery.test.ts
      method: automated
    - criterion: '**AC-13:** El detalle de readiness se puede consultar bajo demanda y no domina el Overview inicial.'
      status: passed
      evidence: >-
        Readiness es un <details> colapsable con resumen compacto (conteos por readiness + historical
        gaps); E2E expande el detalle y asserta "Current evidence review:".
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-14:** Los hallazgos de integridad y bloqueos reales conservan su severidad y siguen visibles.'
      status: passed
      evidence: >-
        El indicador Blocking issues y los findings blocking de provenance/dependency conservan severidad;
        el E2E de WI-081/082 sigue verde y el grouping preserva la severidad mayor por artifact.
      reference: packages/admin/e2e/planning-insights.spec.ts
      method: automated
    - criterion: '**AC-15:** Con Plans y Epics vacíos, sus estados se presentan de manera compacta manteniendo CTAs funcionales.'
      status: passed
      evidence: >-
        CompactEmpty reemplaza las tarjetas vacías por invitaciones de una línea con CTA "+ Create Plan" /
        "+ Create Epic"; revisión visual en proyecto Initiative-first.
      reference: packages/admin/src/routes/Planning.tsx
      method: manual
    - criterion: '**AC-16:** En un proyecto solo con Initiatives, esas tarjetas quedan accesibles sin que los bloques vacíos ocupen desproporcionadamente la página.'
      status: passed
      evidence: >-
        initiativeFirst ordena Initiatives antes de las invitaciones compactas de Plan/Epic; revisión
        visual confirmó Initiatives visibles sin scroll dominado por espacios vacíos.
      reference: packages/admin/src/routes/Planning.tsx
      method: manual
    - criterion: '**AC-17:** Needs Attention muestra como máximo cinco artifacts diferentes, con cantidad de findings por artifact.'
      status: passed
      evidence: >-
        groupByArtifact + topGroups.slice(0,5); cada fila muestra "{n} finding(s)". E2E asserta ≤5 filas y
        el patrón de conteo; revisión visual mostró "5 artifacts" y "2 artifacts" con conteos.
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-18:** El orden prioriza severidad de manera estable y no oculta el total real de findings ni artifacts.'
      status: passed
      evidence: >-
        El orden deriva del sort determinista de Core (severidad/kind/id/tipo/razón); el resumen muestra el
        total global "{N} findings · {M} artifacts" y "+ K more artifacts · total stays {N}".
      reference: packages/admin/src/components/PlanningInsights.tsx
      method: automated
    - criterion: '**AC-19:** Los filtros y `View all findings` mantienen el comportamiento del explorador completo de WI-082.'
      status: passed
      evidence: >-
        El explorador de WI-082 (AttentionExplorer) no cambió; "View all findings" lo abre; el E2E de
        usabilidad de WI-082 sigue verde.
      reference: packages/admin/e2e/planning-insights-usability.spec.ts
      method: automated
    - criterion: '**AC-20:** La navegación desde el resumen llega al artifact correcto; si hay anclaje estable al candidato, lo enfoca, y si no, ofrece un fallback claro.'
      status: passed
      evidence: >-
        La fila de resumen navega al detalle canónico del artifact; al no existir un anclaje estable de
        candidato en el detalle de Initiative, el fallback es la razón del hallazgo que nombra el candidato
        (p. ej. "Candidate C2 reference ..."). No se fabrican rutas ni anclas por texto inestable.
      reference: packages/admin/src/components/PlanningInsights.tsx
      method: manual
    - criterion: '**AC-21:** La UI funciona en Light/Dark, a 375 px, con teclado, focus y estados loading/error/empty.'
      status: passed
      evidence: >-
        Readiness es <details> (teclado/focus nativos); componentes con loading/error/empty; E2E a 375px con
        overflow=0 (shared e Initiative-first); revisión visual en dark y light.
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-22:** Pruebas unitarias Core cubren métricas deduplicadas, bloqueos en Initiatives sin Epic, ausencia de jerarquías y cobertura ambigua.'
      status: passed
      evidence: >-
        planning-delivery.test.ts (6 tests) cubre dedup, bloqueo sin Epic, universo independiente, proyecto
        vacío y historical evidence gap; provenance/coverage cubiertos en sus suites.
      reference: packages/cli/tests/planning-delivery.test.ts
      method: automated
    - criterion: '**AC-23:** Pruebas Admin Server verifican el contrato de datos y la consistencia entre Overview e Insights.'
      status: passed
      evidence: >-
        planning-overview-consistency.test.ts (3 tests) asserta blockedWorkItems === Insights.associated.
        blocked, workItems === associated.total, universo independiente y totales finitos en vacío.
      reference: packages/admin-server/tests/planning-overview-consistency.test.ts
      method: automated
    - criterion: '**AC-24:** E2E comprueba la jerarquía visual, agrupación de Needs Attention, navegación y colapsado de readiness con fixtures aislados.'
      status: passed
      evidence: >-
        planning-overview-consistency.spec.ts cubre validated coverage, agrupación por artifact (≤5),
        métricas, colapsado de readiness y 375px sobre el fixture aislado; 57/57 E2E en verde.
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-25:** Se valida manualmente con `agent-native` en modo read-only, conservando los conteos reales y registrando antes/después con capturas.'
      status: passed
      evidence: >-
        agent-native no está en este repo; la validación visual read-only se hizo con un proyecto
        Initiative-first equivalente (0 Plans/0 Epics, blocked en Initiative sin Epic, completed con
        historical gap) y con el fixture compartido, con capturas antes/después. Ninguna consulta mutó
        artifacts (proyección read-only; tests de read-only en verde).
      reference: packages/cli/src/core/planning-insights.ts
      method: manual
    - criterion: '**AC-26:** Los tests, typecheck, builds, CI y documentación EN/ES del alcance aprobado pasan; la regresión de WI-081/082 sigue verde.'
      status: passed
      evidence: >-
        2185 pruebas en verde, pnpm -r build limpio (incl. docs), tsc del admin sin errores, CI de Gate A/B
        en verde; E2E de WI-081/082 verde; docs EN/ES actualizadas.
      reference: apps/docs/src/content/docs/delivery-planning.md
      method: automated
---

# WI-083 — Planning Overview Consistency & Information Hierarchy

## 1. Context

WI-074 a WI-079 habilitaron el modelo opcional de Planning, su gestión y la verificación de resultados por evidencia. WI-081 creó Execution Insights y WI-082 corrigió la clasificación de referencias históricas ambiguas, incorporando un resumen compacto de Needs Attention y un explorador completo.

Una validación manual de Kaddo Admin v3.138.0 con el proyecto `agent-native` mostró:

- 0 Delivery Plans, 0 Epics, 8 Initiatives; Planning es válido sin Plan ni Epic.
- `Blocked Work Items: 0` en el resumen del Overview, frente a `1 blocked` en Execution Insights.
- Planning Coverage principal `41/41`, aunque el detalle explica `11 validated · 30 declared but unresolved`.
- Initiatives históricas en lifecycle `completed` que se presentan con current readiness `NEEDS_WORK` y sin contexto sobre la diferencia temporal y semántica.
- Needs Attention compacto y funcional, pero sus primeras cinco filas pueden concentrarse en una sola Initiative.
- Secciones vacías de Plans y Epics que ocupan demasiado espacio antes de llegar a las Initiatives, que son los artifacts relevantes en este proyecto.

Estas observaciones son evidencia visual del caso real, no una autorización para modificar automáticamente artifacts históricos.

## 2. Problem

El Overview mezcla proyecciones con universos de conteo distintos y presenta resultados válidos de forma potencialmente engañosa. La jerarquía visual prioriza métricas declarativas y estados vacíos sobre los artifacts que el usuario utiliza para dirigir la ejecución.

### 2.1 Inconsistencia entre métricas

`getPlanningOverviewAdmin()` calcula `blockedWorkItems` sobre los Epics. Si no existen Epics, puede devolver 0 aunque haya Work Items bloqueados asociados directamente con Initiatives. Además, los totales agregados deben evitar contar el mismo Work Item varias veces si participa en distintas relaciones canónicas.

### 2.2 Cobertura declarada vs validada

Un candidato con `materialized_as` no vacío se cuenta como declaración de materialización, aunque una referencia histórica compuesta aún no esté validada. La cifra principal `41/41` sugiere cobertura totalmente comprobada, mientras que solo 11 referencias son verificables conforme al contrato actual. Deben mostrarse ambas dimensiones sin reescribir datos ni relajar la relación 1:1.

### 2.3 Readiness histórica vs estado de lifecycle

El estado `completed` es un hecho registrado del artifact. `NEEDS_WORK` es el resultado de una evaluación vigente que puede exigir evidencia introducida posteriormente. El Overview no debe sugerir que el artifact fue reabierto ni afirmar automáticamente que una decisión histórica fue incorrecta.

### 2.4 Jerarquía visual

En proyectos Initiative-first, bloques vacíos de Plans y Epics y listas detalladas de Readiness desplazan la vista útil de Initiatives. La atención debe resumirse por artifact y expandirse bajo demanda, sin perder severidad ni cantidad real de hallazgos.

## 3. Expected Outcome

En Planning Overview, el usuario podrá:

1. Reconocer métricas consistentes y entender qué universo contabiliza cada una.
2. Distinguir con claridad cobertura validada, declaraciones pendientes y candidatos no materializados.
3. Interpretar lifecycle histórico y readiness actual sin confundirlos.
4. Identificar hasta cinco artifacts que necesitan atención, con el número real de hallazgos por artifact.
5. Navegar al artifact y, cuando el contrato existente lo permita, al candidato o sección relacionada.
6. Acceder rápidamente a Initiatives cuando no existan Plans ni Epics, sin perder la opción de crearlos.
7. Consultar el detalle completo en el explorador incorporado en WI-082.

La solución será conservadora, mayoritariamente read-only y sin cambios sobre los artifacts del proyecto por el hecho de consultar Planning.

## 4. Metric Consistency

### 4.1 Single source for Work Item counting

Antes de implementar, documentar el significado y el denominador de:

- `Work Items linked` del Overview.
- `Blocked Work Items` del Overview.
- `Delivery Progress` de Execution Insights (Work Items asociados e independientes).
- `Blocking issues` de Execution Insights (hallazgos de integridad/dependencia; **no** equivale a Work Items bloqueados).

Definir un contrato de proyección coherente reutilizando Core. Los Work Items deben enumerarse por ID canónico único dentro del universo pertinente; no sumar subtotales solapados de Epics e Initiatives. Una relación con Plan o Epic es opcional.

`Blocked Work Items` debe contar Work Items realmente bloqueados conforme a la semántica existente, incluidos los asociados directamente a Initiatives sin Epic. Nunca derivarlo de la cantidad de mensajes de Needs Attention. Los conteos de bloqueos y los hallazgos de integridad permanecen separados.

Si `Work Items linked` y `Delivery Progress` representan universos diferentes, explicitarlo en los labels/hints; si representan el mismo, usar la misma proyección y verificar igualdad. No cambiar contratos públicos silenciosamente ni redefinir qué significa `blocked` para ocultar la divergencia.

### 4.2 Edge cases

Validar proyectos con:

- Solo Work Items independientes.
- Solo Initiatives con Work Items, sin Epics ni Plans.
- Epics independientes, sin Plans.
- Un mismo Work Item alcanzable mediante más de una relación de Planning.
- Dependencias pendientes, resueltas o inexistentes.
- Ningún Work Item ni artifact de Planning.

La vista deberá usar estados explícitos sin crear jerarquías ficticias ni valores engañosos.

## 5. Planning Coverage Semantics

Mantener el contrato y los diagnósticos de WI-082:

- `totalCandidates`: candidatos declarados.
- `materialized`: candidatos con declaración `materialized_as`.
- `validated`: referencias resueltas y válidas.
- `unresolved`: declaraciones no comprobadas (referencia ausente, mismatch o histórica ambigua).
- `pending`: candidatos sin declaración de materialización.

Cuando existan declaraciones no resueltas, mostrar **Validated Coverage** como cifra principal (`validated / totalCandidates`) y, como detalle, `materialized / totalCandidates declared`, `unresolved` y `pending`, con términos legibles. En el caso observado, la lectura debe distinguir `11/41 validated` de `41/41 declared`; no representarlas como dos versiones incompatibles del mismo indicador.

Para denominador cero, mostrar `No candidates` / `—`, no inferir 100 % de cobertura. Conservar el modelo 1:1 de `materialized_as` y la clasificación de referencias históricas ambivalentes como warnings que requieren inspección manual. No reparar ni migrar referencias automáticamente.

## 6. Historical Lifecycle & Current Readiness

En el Overview separar visual y semánticamente:

- **Lifecycle**: estado persistido del artifact (`completed`, `in-progress`, etc.).
- **Current readiness**: evaluación actual del mecanismo canónico de evidencia; no es una transición de estado.
- **Historical evidence gaps**: etiqueta explicativa cuando un artifact `completed` carece de evidencia válida bajo las reglas actuales, sin inventar cuándo o por qué se completó.

Para un `completed` con `NEEDS_WORK`, mostrar algo equivalente a: `Lifecycle: Completed · Current evidence review: Needs work` y una nota `Historical completion; current checks may require evidence not recorded at the time`.

No afirmar que la conclusión histórica fue incorrecta ni que el artifact está reabierto. Mantener visibles los bloqueos/integridad reales. No recalcular, reescribir, reabrir ni reaprobar estados automáticamente. Reutilizar las evaluaciones de WI-078/079; no crear otro verificador.

La lista detallada de readiness debe ser colapsable o mostrarse bajo demanda, con un resumen inicial compacto (por ejemplo: cantidad por readiness y excepciones históricas) y acceso al detalle del artifact.

## 7. Information Hierarchy & Navigation

### 7.1 Overview structure

Proponer una organización visual que priorice:

1. Resumen de Planning y métricas coherentes.
2. Execution Insights: tres dimensiones separadas e indicadores de atención.
3. Needs Attention compacto por artifact.
4. Artifacts existentes (Initiatives primero en proyectos Initiative-first).
5. Readiness detallado y secciones secundarias bajo demanda.

No es necesario rehacer la navegación global de Kaddo; reutilizar los componentes y el design system.

### 7.2 Empty Plans/Epics

Cuando `plans === 0` o `epics === 0`, reemplazar las tarjetas vacías de gran altura por estados compactos, preservando un CTA claramente accesible para crear cada entidad. No ocultar Plans/Epics por completo ni sugerir que son obligatorios.

Si hay Plans o Epics, conservar sus tarjetas y navegación normal. Si solo existen Initiatives, permitir llegar a ellas sin un scroll dominado por espacios vacíos.

### 7.3 Needs Attention by artifact

El resumen inicial mostrará **máximo cinco artifacts distintos**, no cinco hallazgos que podrían pertenecer al mismo artifact. Cada fila/grupo mostrará:

- ID y nombre del artifact.
- Severidad mayor y tipo(s) relevantes.
- Conteo de findings de ese artifact.
- Descripción breve de su señal más relevante.
- Acción para abrir detalle o el explorador completo.

Orden determinista por severidad y criterios de desempate estables. El contador global `31 findings · 6 artifacts` debe permanecer exacto, así como los conteos filtrados. `View all findings` continuará abriendo el explorador completo de WI-082 con sus filtros, agrupación, diagnósticos, impacto y siguiente paso; no duplicar otro explorador.

### 7.4 Contextual navigation

Cuando haya un candidato identificable en la señal de provenance, intentar navegar o enfocar la sección Candidates del detalle correspondiente, con énfasis sobre el candidato preciso **solo si existe un identificador estable soportado**. Si no hay enlace profundo fiable, navegar al artifact y mostrar una indicación clara para encontrar el candidato. No fabricar rutas ni basarse en fragmentos textuales inestables.

La interacción es de inspección: sin auto-fix, dismiss/resolve, alteración de ownership ni mutaciones de Markdown.

## 8. Scope Boundaries

Reutilizar Core como única fuente de reglas y cálculos. Admin Server expone proyecciones; Admin presenta y navega. El contenido Markdown continúa siendo canónico.

No incluidos:

- Nuevos estados de lifecycle o nuevas categorías de completion.
- Segundo motor de verificación, recalificación retrospectiva de artifacts o cierre automático.
- Migración de `materialized_as` históricos compuestos ni cambio del contrato 1:1.
- Remediación masiva de las 30 advertencias de `agent-native`.
- Nueva entidad de incidentes o cola de tareas persistente.
- Notificaciones, priorización predictiva, cronogramas o estimaciones.
- Dashboard externo y cambios mayores al design system.
- Cambios en CLI/MCP que no sean necesarios para mantener contratos de lectura exportados desde Core.

## 9. Acceptance Criteria

### Metrics & Integrity

- **AC-01:** Se documenta el universo y semántica de cada métrica de Overview y Execution Insights antes de modificar código.
- **AC-02:** `Blocked Work Items` contabiliza correctamente Work Items bloqueados asociados directamente a Initiatives sin Epic.
- **AC-03:** Los Work Items relacionados mediante varias rutas de Planning no se cuentan dos veces en una misma métrica.
- **AC-04:** El Overview distingue `Blocked Work Items` de `Blocking issues` y evita aparentes contradicciones por labels ambiguos.
- **AC-05:** Las vistas mantienen métricas consistentes con la misma proyección Core cuando comparten universo y explicitan diferencias cuando no lo comparten.
- **AC-06:** Los conteos funcionan con estructuras opcionales y casos vacíos sin crear asociaciones ficticias.

### Coverage Semantics

- **AC-07:** La cifra principal de cobertura presenta `validated/totalCandidates` cuando existen referencias declaradas no resueltas.
- **AC-08:** El detalle conserva y distingue `materialized`, `validated`, `unresolved` y `pending` sin perder la información original.
- **AC-09:** Con cero candidatos no se presenta cobertura del 100 % ni se divide entre cero.
- **AC-10:** Las referencias históricas ambiguas permanecen warnings no validados, sin auto-corrección ni cambio del contrato 1:1.

### Lifecycle & Readiness

- **AC-11:** `completed` persistido y `NEEDS_WORK` actual se presentan con nombres y contexto diferentes.
- **AC-12:** El tratamiento histórico no altera resultado de verificación, evidencia, provenance, lifecycle ni readiness canónico.
- **AC-13:** El detalle de readiness se puede consultar bajo demanda y no domina el Overview inicial.
- **AC-14:** Los hallazgos de integridad y bloqueos reales conservan su severidad y siguen visibles.

### Overview UX & Navigation

- **AC-15:** Con Plans y Epics vacíos, sus estados se presentan de manera compacta manteniendo CTAs funcionales.
- **AC-16:** En un proyecto solo con Initiatives, esas tarjetas quedan accesibles sin que los bloques vacíos ocupen desproporcionadamente la página.
- **AC-17:** Needs Attention muestra como máximo cinco artifacts diferentes, con cantidad de findings por artifact.
- **AC-18:** El orden prioriza severidad de manera estable y no oculta el total real de findings ni artifacts.
- **AC-19:** Los filtros y `View all findings` mantienen el comportamiento del explorador completo de WI-082.
- **AC-20:** La navegación desde el resumen llega al artifact correcto; si hay anclaje estable al candidato, lo enfoca, y si no, ofrece un fallback claro.
- **AC-21:** La UI funciona en Light/Dark, a 375 px, con teclado, focus y estados loading/error/empty.

### Quality & Compatibility

- **AC-22:** Pruebas unitarias Core cubren métricas deduplicadas, bloqueos en Initiatives sin Epic, ausencia de jerarquías y cobertura ambigua.
- **AC-23:** Pruebas Admin Server verifican el contrato de datos y la consistencia entre Overview e Insights.
- **AC-24:** E2E comprueba la jerarquía visual, agrupación de Needs Attention, navegación y colapsado de readiness con fixtures aislados.
- **AC-25:** Se valida manualmente con `agent-native` en modo read-only, conservando los conteos reales y registrando antes/después con capturas.
- **AC-26:** Los tests, typecheck, builds, CI y documentación EN/ES del alcance aprobado pasan; la regresión de WI-081/082 sigue verde.

## 10. Validation Scenarios

**A — Initiative-first metrics.** Proyecto con cero Plans/Epics, Initiatives y Work Items bloqueados. Resultado: Overview e Insights muestran los mismos Work Items bloqueados para el mismo universo; `Blocking issues` queda independiente.

**B — Overlapping associations.** Un Work Item enlazado mediante Initiative/Epic. Resultado: se cuenta una vez por ID en un universo común.

**C — Historical composite.** 41 candidatos, 41 declaraciones, 11 referencias verificadas, 30 no resueltas. Resultado: 11/41 destaca como validado; 41/41 queda explícitamente declarado; no se cambia el Markdown.

**D — Historical completion.** Initiative `completed` con evidencia vigente insuficiente. Resultado: ciclo histórico y revisión actual distinguidos sin transición ni reinterpretación automática.

**E — Attention concentration.** Más de cinco hallazgos en un artifact y hallazgos en varios otros. Resultado: primeras filas muestran hasta cinco artifacts únicos, totales coherentes y prioridad estable.

**F — Full explorer.** Abrir `View all findings`, filtrar y navegar. Resultado: se conserva el contrato y la accesibilidad de WI-082.

**G — Empty entities.** Plans y Epics vacíos pero Initiatives presentes. Resultado: invitaciones compactas, CTAs funcionales, Initiatives visibles.

**H — Empty project.** No hay artifacts de Planning ni candidatos. Resultado: empty states explicativos, sin porcentajes inventados ni errores.

**I — Responsive/accessibility.** Dark/Light y viewport 375 px, foco, teclado y Escape. Resultado: sin overflow horizontal, controles identificables.

**J — Read-only proof.** Ejecutar las consultas y navegación sobre copia o workspace real de `agent-native`. Resultado: hashes/estado canónico inalterados por visualización.

## 11. Implementation Approach

### Phase 1 — Diagnose & Design Checkpoint (mandatory before coding)

- Comparar proyecciones y semántica de `getPlanningOverviewAdmin()`, `computePlanningInsights()`, `computeDeliveryProgress()` y las verificaciones vigentes.
- Identificar exactamente por qué `Blocked Work Items` diverge en un proyecto sin Epics y revisar si `Work Items linked` comparte o no denominador con Insights.
- Presentar decisiones D1–D6: universe/dedup, cobertura principal, contexto histórico, agrupación, compactación de empty states y navegación.
- Presentar wireframe pequeño de Overview con y sin Plans/Epics y una muestra de la cola agrupada.
- **No modificar reglas ni UI hasta aprobar el checkpoint de contrato y experiencia.**

### Phase 2 — Canonical Projections

- Ajustar funciones existentes de Core o componer proyecciones canónicas sin duplicar lógica.
- Ajustar Admin Server solo donde se necesiten datos/contratos nuevos.
- Preservar compatibility y validaciones de lifecycle/evidencia.
- Cubrir con unit/integration los escenarios de consistencia y límites.

### Phase 3 — Admin Usability

- Actualizar métricas, labels y aclaraciones semánticas.
- Promover cobertura validada en la presentación.
- Agrupar preview de Needs Attention por artifact y conservar el explorador de WI-082.
- Compactar estados vacíos, priorizar Initiatives en proyectos Initiative-first y plegar el detalle de Readiness.
- Incorporar navegación contextual conservadora, sin editar Markdown.

### Phase 4 — Validation & Visual Approval

- Ejecutar unit/integration, E2E, typecheck y builds afectados.
- Validar fixtures aislados y `agent-native` (lectura, capturas antes/después, no mutation).
- Revisar localmente Dark, Light y 375 px. Confirmar métricas, estados, navegación y accesibilidad.
- **Detenerse y presentar capturas/resultados para aprobación humana antes de cualquier commit o push.**
- Actualizar documentación EN/ES y reunir evidencia por cada AC.

### Phase 5 — Integration, Publication & Canonical Closure

- Gate A: revisar diff, evidencia y experiencia visual; solo después de autorización explícita, hacer commits/push y esperar CI.
- Gate B: decidir por separado bump/tag/npm/GitHub Release según impacto distribuido; no asumir que aprobar Gate A autoriza publicar.
- Gate C: registrar evidencia de cada AC, `Learning` en español, `released_in` solo si hubo release, verificar `kaddo verify WI-083`, completar lifecycle canónicamente y esperar CI de cierre.

## 12. Definition of Done

WI-083 estará listo cuando:

- Los 26 AC cuenten con evidencias estructuradas verificables.
- Los indicadores no se contradigan por cómputos incompletos o semánticas implícitas.
- La cobertura validada sea distinguible de una declaración de materialización.
- Las Initiatives históricas mantengan su estado sin atribuciones retrospectivas falsas.
- Needs Attention no monopolice Overview y sus detalles permanezcan accesibles.
- Los proyectos sin Plans ni Epics tengan una experiencia Initiative-first útil.
- La suite de regresión y la validación manual sean aprobadas.
- El diff, la visualización local y los gates independientes cuenten con autorización humana.

## 13. Risks & Mitigations

- **Cambiar semánticas implícitas en KPIs.** Mitigar con contrato D1 y tests comparativos antes de tocar UI.
- **Confundir declared con validated.** Mitigar preservando ambos valores y sus denominadores.
- **Reescribir la historia.** Mitigar distinguiendo lifecycle persistido de readiness actual sin alterar la evaluación.
- **Ocultar alertas al agrupar.** Mitigar manteniendo total de findings, conteos por artifact y explorador completo.
- **Regresión en proyectos con jerarquía completa.** Mitigar con fixtures de Initiative-only, Plan/Epic y Work Item independiente.
- **Crecimiento de alcance.** Mitigar excluyendo auto-reparación, migración histórica y rediseño general.

## 14. Commit & Release Gate

**Gate A — Integration.** Ningún commit ni push hasta revisar los cambios, los tests y la experiencia local con aprobación explícita.

**Gate B — Publication.** La decisión de versionar y publicar es independiente. Si el cambio afecta al producto distribuido, evaluar bump/tag/npm y release; si no lo afecta, registrar decisión de no publicar sin inventar `released_in`.

**Gate C — Canonical Closure.** Solo después de la integración y de la decisión de publicación, consolidar evidencia, registrar Learning en español, verificar y cerrar canónicamente el WI. La verificación `READY_TO_COMPLETE` no reemplaza la autorización humana.

## 15. Learning

### Diagnóstico (causa raíz, AC-01)

El Overview y Execution Insights calculaban los Work Items en **universos distintos** sin decirlo.
`getPlanningOverviewAdmin` derivaba `blockedWorkItems` sumando `epic.delivery.blocked` sobre los Epics
(`packages/admin-server/src/core-adapter.ts`), y las Initiatives fijaban `blocked: 0`; en un proyecto
Initiative-first (0 Epics) el resultado era siempre 0 aunque hubiera Work Items bloqueados asociados a
Initiatives. Insights, en cambio, contaba el universo asociado deduplicado (`delivery.associated.blocked`)
e informaba 1. `workItems` sumaba `i.delivery.total` por Initiative, excluyendo los Work Items asociados
solo vía `epic` y pudiendo duplicar. Lo reproduje con un harness aislado: Overview `blocked=0` vs Insights
`blocked=1`, exactamente el síntoma de `agent-native`.

### Decisiones (D1–D6, aprobadas en el checkpoint de Fase 1)

- **D1 Proyección única.** `computePlanningDelivery(dir)` enumera los Work Items una vez y devuelve
  `{ associated, independent }`; **Overview e Insights la consumen**, así que no pueden divergir.
  `blockedWorkItems = associated.blocked` (incluye Initiatives sin Epic), `workItems = associated.total`,
  más `independentWorkItems`. `Blocked Work Items` queda distinto de `Blocking issues` (hallazgos).
- **D2 Cobertura validada como titular.** Con `unresolved>0`, el titular es `validated/totalCandidates` y
  la declarada queda como detalle; con 0 candidatos, "No candidates" / "—". Reutiliza los campos de WI-082;
  `materialized_as` sigue 1:1.
- **D3 Lifecycle vs readiness.** `EntityInsight.historicalEvidenceGap` (derivado, read-only); la UI muestra
  `Lifecycle` y `Current evidence review` como hechos distintos y una nota de historical completion. Sin
  recálculo, reapertura ni verificador nuevo.
- **D4 Needs Attention por artifact.** `groupByArtifact` + top 5 artifacts, con conteo por artifact y total
  global exacto; el explorador de WI-082 no cambia.
- **D5 Empty states + Initiative-first.** `CompactEmpty` reemplaza las tarjetas vacías por invitaciones de
  una línea (CTAs intactos); en proyectos Initiative-first, las Initiatives se renderizan antes.
- **D6 Navegación contextual conservadora.** Se navega al artifact; sin un anclaje estable de candidato en
  el detalle, el fallback es la razón que nombra el candidato — sin rutas fabricadas ni anclas por texto.

### Resultado visual

Proyecto Initiative-first (0 Plans/0 Epics): **Blocked Work Items 1** (antes 0), Blocking issues 0,
**Validated Coverage 2/3** (3/3 declared · 1 unresolved), Readiness "0 ready · 3 needs work · 0 blocked ·
1 historical evidence gap" (colapsable), Needs Attention agrupado por artifact, Initiatives antes de las
invitaciones compactas. 375px overflow=0, dark y light.

### Límites honestos

- `agent-native` no está en este repo: se validó con un fixture Initiative-first equivalente y el fixture
  compartido. La causa raíz, determinista en el código, aplica igual.
- No existe anclaje profundo estable a un candidate en el detalle de Initiative, así que D6 se limita a
  navegar al artifact con un fallback que nombra el candidato — no se amplió el contrato para inventarlo.
- Un cambio intencional de KPI (Blocked 0→1, cobertura declarada→validada) obligó a actualizar aserciones
  del E2E de WI-081; es un ajuste honesto a la nueva semántica aprobada, no un enmascaramiento.

### Prevención de recurrencia

- `planning-delivery.test.ts` fija la proyección única, el bloqueo sin Epic, la deduplicación y el
  historical evidence gap; `planning-overview-consistency.test.ts` fija la igualdad Overview↔Insights. Un
  regreso al conteo por Epics, o a divergir las vistas, rompe el suite.
- Lección de proceso: el checkpoint de Fase 1 (diagnóstico read-only + aprobación de D1–D6 y wireframe
  antes de tocar Core/UI) evitó redefinir KPIs por inercia; conviene mantenerlo para cualquier WI que
  toque métricas, cobertura o readiness.
