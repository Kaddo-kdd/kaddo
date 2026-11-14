---
type: feature
id: WI-083
title: Planning Overview Consistency & Information Hierarchy
status: in-progress
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

*Pendiente de registrar tras implementación y validación.*
