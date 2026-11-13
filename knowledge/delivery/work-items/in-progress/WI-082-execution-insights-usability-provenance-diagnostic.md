---
type: feature
id: WI-082
title: Execution Insights Usability & Provenance Diagnostics
status: in-progress
work_type: feature
created_at: '2026-11-11'
source:
  type: external
  imported_at: '2026-11-11'
  source_format: kaddo-frontmatter
  source_hash: 2752fe0fbe533b6328584f8742a640730635c95fa5c6f7c5883910d9b64eaf84
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
  - WI-078
  - WI-079
  - WI-081
scope_confidence:
  level: medium
  reasons:
    - >-
      WI-081 ya entrega la proyección read-only computePlanningInsights y la UI
      PlanningInsights.
    - >-
      El caso real de agent-native muestra una Attention Queue extensa que
      desplaza las secciones principales de Planning.
    - >-
      El detalle actual ofrece navegación al artifact, pero no contextualiza el
      diagnóstico ni orienta hacia la siguiente acción.
    - >-
      El contrato actual de materialized_as acepta un único ID; ciertos valores
      históricos parecen contener varios IDs dentro de una cadena, lo que
      requiere diagnóstico antes de modificar semántica.
    - >-
      El origen exacto y la clasificación correcta de todos los hallazgos solo
      podrán confirmarse durante el diagnóstico empírico.
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
  WI-074 a WI-079 construyeron el modelo opcional de Planning, las operaciones
  de gestión y la verificación de resultados basada en evidencia. WI-081 añadió
  una vista read-only de ejecución en **Planning → Overview**, alimentada por
  `computePlanningInsights()` y `GET /api/v1/adm…
original_snapshot:
  title: Execution Insights Usability & Provenance Diagnostics
  description: >-
    WI-074 a WI-079 construyeron el modelo opcional de Planning, las operaciones
    de gestión y la verificación de resultados basada en evidencia. WI-081
    añadió una vista read-only de ejecución en **Planning → Overview**,
    alimentada por `computePlanningInsights()` y `GET /api/v1/adm…
  type: feature
  status: draft
ready_at: '2026-11-11'
---

# WI-082 — Execution Insights Usability & Provenance Diagnostics

## 1. Context

WI-074 a WI-079 construyeron el modelo opcional de Planning, las operaciones de gestión y la verificación de resultados basada en evidencia. WI-081 añadió una vista read-only de ejecución en **Planning → Overview**, alimentada por `computePlanningInsights()` y `GET /api/v1/admin/planning/insights`.

La validación manual sobre el proyecto **agent-native** reveló una brecha entre corrección técnica y utilidad operativa:

- El Overview muestra **30 Blocking issues**, **1 Outcome needs verification** y **0 Milestones needing review**.
- La sección **Needs attention (31)** ocupa gran parte de la página y desplaza Delivery Plans, Epics e Initiatives fuera de la zona visible.
- La mayoría de las señales visibles se repiten bajo `PROVENANCE` y varias corresponden a una misma Initiative.
- Los IDs permiten acceder al artifact, pero los hallazgos no ofrecen una explicación utilizable sobre su causa, impacto y siguiente paso.
- El mismo Overview muestra **Planning Coverage 41/41** aunque las comprobaciones de integridad indican referencias posiblemente inválidas: la cobertura declarada y los enlaces efectivamente resueltos no son necesariamente equivalentes.

### Evidencia y puntos de partida

- Capturas de validación manual del usuario en Planning Overview de `agent-native` (2026-11-11).
- `packages/admin/src/components/PlanningInsights.tsx`: renderizado de toda la cola y navegación básica.
- `packages/admin/src/routes/Planning.tsx`: `PlanningInsights` aparece antes de los bloques principales.
- `packages/cli/src/core/planning-insights.ts`: proyección y consolidación de señales.
- `packages/cli/src/core/initiative-verification.ts`: `initiativeProvenanceIssues()` verifica cada `materializedAs` por coincidencia exacta con un único Work Item.
- `packages/cli/src/core/initiative.ts`: `materialized_as` se interpreta como string opcional del candidato.

**Importante:** la presencia de valores como `AN-005, AN-006, AN-007` no demuestra por sí sola que cada Work Item exista o que la relación sea correcta. Tampoco demuestra un fallo en la persistencia: puede ser una representación histórica no canónica. La hipótesis se debe verificar con los artifacts reales antes de cambiar contratos.

## 2. Problem

Execution Insights informa muchos hallazgos, pero no distingue adecuadamente el resumen ejecutivo del diagnóstico detallado. El volumen de señales perjudica la jerarquía visual y dificulta descubrir las acciones principales de Planning.

Adicionalmente, una referencia histórica que represente varios Work Items en un campo diseñado para un único ID puede producir un mensaje engañoso de “missing Work Item” para la cadena completa. La visualización de `materialized` tampoco diferencia entre una referencia declarada y una asociación íntegra validada.

**Problema central:** la capa de insights detecta señales, pero todavía no las convierte en información accionable ni explica con suficiente precisión la incertidumbre de algunos datos históricos.

## 3. Expected Outcome

Un usuario podrá abrir Planning Overview, entender sus indicadores y encontrar los bloques principales sin desplazarse por una lista extensa. Cuando exista un hallazgo, podrá explorar los detalles, identificar el artifact responsable, conocer la razón y el impacto, y acceder a una acción de revisión apropiada.

Los diagnósticos de provenance diferenciarán relaciones válidas, referencias inequívocamente rotas y representaciones históricas ambiguas. Kaddo conservará las restricciones del modelo canónico y no considerará resuelto un problema por el simple hecho de reconocer una cadena antigua.

### Success Criteria

- Overview conserva una jerarquía visual usable con múltiples hallazgos.
- Cada hallazgo expone origen, categoría, severidad, diagnóstico comprensible y siguiente paso sin prometer una corrección automática.
- Los indicadores y las cifras de cobertura no presentan como integridad verificada una referencia que solo está declarada.
- Los vínculos realmente rotos no se ocultan ni pierden su carácter bloqueante.
- Se demuestra el comportamiento con fixtures representativos y con revisión visual local antes de integrar.

## 4. Overview Information Architecture

### 4.1 Compact Needs Attention

En **Planning → Overview**, mantener Execution Insights y sus tres dimensiones separadas:

1. Planning Coverage.
2. Delivery Progress.
3. Outcome Verification.

La sección **Needs attention** se convierte en un **resumen compacto**:

- Mostrar inicialmente un máximo de **5 hallazgos o grupos de hallazgos**, priorizados de forma determinista por severidad y relevancia.
- Mostrar el total real de señales y, si se agrupan, indicar explícitamente cuántos artifacts y cuántos hallazgos contienen.
- Evitar listar repetidamente decenas de filas de la misma Initiative sin contexto.
- Ofrecer **View all findings** para abrir la experiencia completa de diagnóstico.
- Mantener accesibles desde el Overview los bloques Delivery Plans, Epics e Initiatives, sin que una cola extensa los empuje a una profundidad excesiva.
- Conservar filtros útiles, pero situar la exploración extensa fuera del resumen compacto.

La implementación concreta del explorador completo (drawer, panel o ruta dedicada) debe presentarse en una **propuesta visual** y validarse antes de codificar. Preferir componentes existentes y evitar una nueva navegación de primer nivel si no es necesaria.

### 4.2 Full Attention Explorer

La vista detallada debe permitir:

- Filtrar por tipo de señal (`dependency`, `incomplete-delivery`, `pending-candidates`, `unverified-outcome`, `provenance`, `declared-risk`).
- Filtrar por tipo de artifact y severidad.
- Agrupar por artifact sin perder los hallazgos individuales.
- Reconocer claramente si algo es bloqueo confirmado, advertencia, dato histórico ambiguo o señal informativa.
- Identificar de dónde proviene cada señal y por qué está presente.
- Abrir el detalle canónico del artifact relevante.
- Mantener un orden estable y conteos coherentes al filtrar o agrupar.

**No** implementar dismiss, resolver, auto-fix ni modificación de estados desde esta vista. Esta fase es de lectura y navegación.

### 4.3 Contextual Guidance

Cada hallazgo debe mostrar información suficiente para orientar una decisión:

| Element | Meaning |
| --- | --- |
| Artifact | ID, tipo y título. |
| Signal | Tipo y severidad, con significado entendible. |
| Diagnostic | Qué se observó, qué se pudo comprobar y qué no. |
| Impact | Consecuencia relevante para Planning/Completion, sin exageraciones. |
| Suggested next step | Revisión concreta, no reparación automática. |
| Action | Navegación a la pantalla pertinente, cuando exista. |

Ejemplos de etiquetas útiles: **Review Initiative**, **Review Work Item**, **Review outcome evidence**, **Inspect reference**. Si no existe una acción soportada, mostrar un mensaje de revisión manual en lugar de un botón que no haga nada.

La guía debe construirse a partir de categorías deterministas de Core; la UI no debe inferir reglas de negocio nuevas a partir de texto libre. Si se necesita información estructurada adicional, extender el contrato de manera compatible.

## 5. Provenance Diagnostics & Historical Compatibility

### 5.1 Diagnose Before Changing Semantics

Primero inspeccionar ejemplos reales de `agent-native` y fixtures equivalentes, incluyendo la señal observada:

```yaml
materialized_as: AN-005, AN-006, AN-007
```

El contrato actual admite **un único Work Item ID** en `materialized_as`. La secuencia anterior se presenta como **ejemplo observado a investigar**, no como formato oficialmente válido.

Para cada caso, comprobar:

1. El valor literal y su procedencia histórica.
2. Si se trata de un ID único, una referencia compuesta, una anotación o un formato no soportado.
3. La existencia real de cada Work Item al que parece referirse.
4. La consistencia de `initiative`, `source_id`, `source_initiative` y relaciones pertinentes cuando esos metadatos existan.
5. El efecto de la clasificación sobre Planning Coverage, Attention Queue y Completion Readiness.

### 5.2 Conservative Diagnostic Categories

Definir, o reutilizar si ya existen, categorías estructuradas que permitan distinguir al menos:

- **valid_single_reference**: una referencia canónica inequívoca que resuelve correctamente.
- **missing_reference**: un ID canónico inequívoco que no existe.
- **association_mismatch**: el Work Item existe, pero contradice una relación exigida.
- **ambiguous_legacy_reference**: texto histórico que parece contener varias referencias o un formato no canónico, cuya semántica no se puede asumir.
- **unresolved_reference**: formato incompleto o imposible de validar sin intervención.

Los nombres son orientativos: seguir las convenciones actuales de Core y evitar introducir una taxonomía excesiva. Lo esencial es **no clasificar una cadena ambigua como si fuera un único ID inequívocamente inexistente**.

### 5.3 Canonical Semantics and Readiness

- Conservar `materialized_as` de cardinalidad 1:1 para nuevas materializaciones, salvo decisión de diseño explícita y separada; **no ampliar el contrato silenciosamente a 1:N**.
- No dividir, reescribir, inferir asociaciones ni migrar Markdown histórico automáticamente.
- No suprimir controles de integridad para disminuir artificialmente la cantidad de bloqueos.
- Mantener `BLOCKED` cuando exista un defecto de integridad confirmado; las referencias ambiguas no podrán habilitar `READY_TO_COMPLETE` solo porque se reconozca su forma.
- Antes de cambiar el tratamiento de una ambigüedad en Completion Readiness, presentar una tabla de casos y obtener aprobación humana sobre la política conservadora propuesta.
- Preservar el uso del motor de verificación por evidencia de WI-078/WI-079; no crear otro evaluador.

### 5.4 Honest Coverage

`Planning Coverage` debe conservar la distinción entre candidatos declarados y relaciones comprobadas.

- Investigar por qué el Overview muestra 41/41 materializados mientras se informan múltiples problemas de provenance.
- Si hay referencias declaradas pero no verificadas, la UI debe expresarlo sin llamar a todas “verificadas”.
- Preferir una **extensión aditiva** del contrato para exponer `declared/materialized`, `validated`, `unresolved` o equivalentes, si se necesitan; evitar romper clientes que consumen el campo actual.
- Mantener el denominador y la semántica de métricas documentados, sin porcentajes engañosos.
- Las cifras agregadas deben ser consistentes con los diagnósticos individuales y conservar la deduplicación de Work Items de WI-081.

## 6. UX, Quality & Compatibility

- Respetar el design system de Kaddo, Light/Dark y viewport de 375 px.
- Soportar teclado, foco visible, etiquetas accesibles y cierre del explorador completo con retorno del foco.
- Estados de loading, empty, error y filtros sin coincidencias.
- Evitar scroll horizontal y el crecimiento descontrolado del Overview con datasets grandes.
- No alterar Plans, Epics, Initiatives ni Work Items por abrir o filtrar insights.
- No crear requisitos para que existan Plans o Epics; Planning continúa siendo opcional.
- Mantener los endpoints actuales y consumidores existentes; agregar contratos solo si resulta estrictamente necesario.
- No introducir sistemas nuevos de permisos, gestión de tickets, notificaciones o priorización automática.

## 7. Acceptance Criteria

### Overview & Visual Hierarchy

- **AC-01:** Planning Overview muestra un resumen de Needs Attention con un máximo de cinco hallazgos o grupos iniciales, independientemente del volumen total.
- **AC-02:** Los bloques Delivery Plans, Epics e Initiatives siguen siendo descubribles y útiles sin recorrer toda la cola de alertas.
- **AC-03:** Los tres indicadores y las tres dimensiones de WI-081 permanecen independientes y semánticamente correctos.
- **AC-04:** El resumen diferencia claramente total de hallazgos, total de artifacts afectados y cantidad visible cuando aplique.
- **AC-05:** Existe una acción funcional para abrir la exploración completa y regresar al Overview sin perder contexto innecesariamente.

### Actionable Findings

- **AC-06:** El explorador permite filtrar por tipo de señal, tipo de artifact y severidad.
- **AC-07:** Los hallazgos pueden agruparse por artifact preservando cada motivo individual y sin alterar sus conteos.
- **AC-08:** Cada hallazgo presenta origen, descripción comprensible, severidad, impacto y siguiente acción recomendada.
- **AC-09:** La navegación contextual abre el artifact correcto; no existen acciones de UI aparentes sin comportamiento real.
- **AC-10:** La cola mantiene orden determinista y estados vacíos/errores comprensibles, incluso con muchas señales.

### Provenance & Integrity

- **AC-11:** Se documenta la causa raíz, con evidencia, de los mensajes de provenance observados en `agent-native`.
- **AC-12:** Core diferencia una referencia canónica inequívoca faltante de una referencia histórica ambigua o no canónica.
- **AC-13:** Las relaciones 1:1 válidas siguen comprobándose correctamente; las referencias genuinamente rotas siguen señalándose.
- **AC-14:** Los valores históricos ambiguos se diagnostican sin reescribir artifacts, inventar Work Items ni inferir asociaciones.
- **AC-15:** Una ambigüedad no habilita completion ni pasa a validada por un cambio cosmético de severidad; las políticas de readiness requieren aprobación explícita.
- **AC-16:** El Overview explica la diferencia entre materialización declarada y relaciones realmente verificadas cuando ambas cifras difieran.
- **AC-17:** La proyección conserva compatibilidad con los consumidores existentes y no duplica Work Items ni verificaciones.

### Safety & Regression

- **AC-18:** Todos los insights y filtros son read-only y no alteran artifacts canónicos, evidencia ni lifecycle.
- **AC-19:** No se introduce auto-fix, dismiss silencioso, migración masiva ni un nuevo verificador de resultados.
- **AC-20:** Las Initiatives sin Epic y los Work Items independientes siguen funcionando correctamente.
- **AC-21:** Los hallazgos existentes de dependencias, evidencia y riesgos continúan presentes y su semántica no se degrada.

### Validation & Delivery

- **AC-22:** Pruebas unitarias de Core cubren referencia válida, faltante, mismatch, ambigüedad histórica y efectos en agregados/readiness.
- **AC-23:** Pruebas de integración/Admin y E2E cubren cola extensa, filtros, agrupación, navegación, empty/error y límites del Overview.
- **AC-24:** Validación visual local a resolución de escritorio y 375px, en Light/Dark, confirma legibilidad, jerarquía, interacción y ausencia de overflow.
- **AC-25:** Builds, typecheck y suites relevantes pasan sin retries/skips añadidos ni regresiones; las decisiones y límites quedan documentados en inglés y español.
- **AC-26:** El WI registra evidencia por AC y se somete a Gate A, B y C independientes, sin commit/push/bump/tag/publicación/cierre antes de la autorización correspondiente.

## 8. Validation Scenarios

### A — High-volume attention queue

Dado un proyecto con 30 o más señales de distintas clases y artifacts, abrir Overview.

**Expected:** la cola inicial ocupa un espacio acotado, los bloques principales permanecen visibles/accesibles y View all permite consultar los hallazgos restantes.

### B — Grouping and filtering

Filtrar señales de `provenance` y agrupar por Initiative.

**Expected:** se muestra el número de hallazgos por artifact, con todos los motivos y severidades disponibles en el explorador completo; el conteo de señales no se confunde con el número de artifacts.

### C — Valid canonical reference

Un candidato tiene `materialized_as: AN-005` y un Work Item existente con relaciones coherentes.

**Expected:** no se reporta referencia rota.

### D — Missing canonical reference

Un candidato apunta a un ID canónico inequívoco que no existe.

**Expected:** se reporta como problema de integridad real; readiness sigue siendo conservador.

### E — Historical ambiguous reference

Un candidato conserva `materialized_as: AN-005, AN-006, AN-007`.

**Expected:** el diagnóstico indica formato ambiguo/no canónico, no afirma que exista un Work Item con el ID literal completo, no transforma el campo automáticamente y no lo trata como validado.

### F — Mismatched association

El Work Item referenciado existe, pero su asociación a Initiative contradice la relación requerida.

**Expected:** el hallazgo conserva su carácter de integridad y conduce al artifact correspondiente.

### G — Honest coverage

Una Initiative tiene candidatos con referencias declaradas pero no verificadas.

**Expected:** la UI no utiliza 100 % de materialización declarada para afirmar que todo está íntegro; las métricas quedan explicadas y son consistentes con Core.

### H — Navigation and contextual action

Seleccionar una señal desde la lista completa.

**Expected:** se identifica claramente qué revisar y se navega al detalle correcto o se muestra una acción manual honesta si no existe navegación contextual soportada.

### I — Empty, optional planning and large data

Probar proyectos sin Plans/Epics, sin hallazgos, sin Initiatives y con numerosas señales, más viewport móvil.

**Expected:** no se inventan relaciones, no hay errores visuales o scroll horizontal, y los estados vacíos resultan comprensibles.

### J — Read-only regression

Abrir, filtrar, agrupar y navegar sin operaciones de edición.

**Expected:** ninguna operación altera Markdown, evidencia, IDs ni lifecycle.

## 9. Implementation Approach

### Phase 1 — Diagnosis & Decision Checkpoint

1. Reproducir la experiencia reportada en `agent-native` sin modificar sus artifacts.
2. Auditar los diagnósticos de provenance con una muestra representativa y fixtures aislados.
3. Determinar si las referencias compuestas se deben a formato histórico, parseo, datos realmente faltantes o una mezcla.
4. Elaborar una matriz caso → señal actual → diagnóstico correcto → impacto en readiness/coverage.
5. Presentar **antes de modificar Core** las decisiones sobre clasificación, compatibilidad y tratamiento de referencias ambiguas.
6. Diseñar y presentar un wireframe/estructura concreta del Overview compacto y el explorador completo.

**Checkpoint requerido:** aprobación humana de las decisiones que afecten semántica canónica, readiness o cardinalidad, y del enfoque visual antes de implementarlo. No suponer aprobación por la existencia de este WI.

### Phase 2 — Core and Projection

1. Ampliar de forma acotada los diagnósticos de provenance existentes si la evidencia justifica el cambio.
2. Mantener las reglas 1:1 de materialización y los controles de completion; no migrar Markdown histórico.
3. Incorporar datos estructurados de diagnóstico, severidad y navegación donde realmente se necesiten.
4. Revisar el contrato de cobertura para que una referencia declarada no se presente como vínculo validado.
5. Probar deduplicación, compatibilidad y clasificación determinista de señales.

### Phase 3 — Admin Experience

1. Construir el resumen compacto de Needs Attention en Overview.
2. Integrar exploración completa con filtros, agrupación y navegación real.
3. Incorporar causa, impacto y próximo paso basado en diagnósticos de Core.
4. Preservar la visibilidad de Delivery Plans, Epics e Initiatives.
5. Reutilizar componentes existentes y evitar rediseñar Planning Explorer completo.

### Phase 4 — Validation, Visual Review and Documentation

1. Ejecutar pruebas de Core, Admin Server y E2E; incluir fixtures históricos y una cola de 30+ señales.
2. Ejecutar regresión y verificar builds/typecheck.
3. Mostrar la experiencia **corriendo localmente** con ejemplos representativos en escritorio y 375px, Light/Dark.
4. Comparar before/after en jerarquía, tamaño de la cola y posibilidad real de resolver una duda desde los hallazgos.
5. Actualizar documentación EN/ES y documentar las decisiones adoptadas.
6. Consolidar evidencias de los 26 Acceptance Criteria.

**Stop obligatorio:** no hacer commit ni push antes de que el responsable humano visualice el resultado local y autorice expresamente Gate A.

### Phase 5 — Integration, Publication and Canonical Closure

Aplicar los gates separados descritos en la sección 12. No encadenarlos automáticamente.

## 10. Constraints & Non-goals

### Constraints

- Core es fuente única de lógica y diagnósticos; Admin presenta los resultados.
- Markdown permanece canónico.
- Planning es opcional.
- Conservar verificación de evidencia y completion gated de WI-078/079.
- No convertir señales informativas en bloqueos ni rebajar bloqueos reales para mejorar el dashboard.
- No modificar relaciones históricas sin autorización expresa.
- No suprimir alertas mediante filtros invisibles por defecto que hagan creer que desaparecieron.
- No introducir porcentajes, scores o semáforos de salud no fundamentados.

### Non-goals

- Motor de priorización automática o recomendaciones generadas por IA.
- Auto-fix o reparación masiva de provenance.
- Convertir `materialized_as` de 1:1 a 1:N como parte tácita de esta entrega.
- Nuevos estados de Initiatives, Candidates, Plans, Epics o Work Items.
- Gestión de incidencias o tickets dentro de Needs Attention.
- Nuevo dashboard ejecutivo distinto de Planning Overview.
- Modificaciones de producto a agent-native: se utiliza como caso de validación, no como objetivo de mutación.
- Rediseño de toda la navegación de Kaddo Admin.
- Cambios a integraciones externas, permisos o publicación automática.

## 11. Risks

**Misclassification of historical data.** Un texto compuesto puede ser una anotación o una asociación no canónica. Mitigar con inspección de artifacts, fixtures y diagnóstico conservador.

**Hiding real integrity issues.** Agrupar/colapsar no debe suprimir errores. Mantener conteos y exploración completa, y verificar que `BLOCKED` no se neutralice por presentación.

**Breaking compatibility.** Una revisión de Coverage puede afectar consumidores actuales. Preferir campos aditivos y pruebas de contrato.

**UI growth.** Evitar crear otra superficie compleja o un gestor de issues; priorizar exploración, contexto y navegación, sin mutaciones.

**False perception of resolution.** Un hallazgo que solo conduce al detalle no está resuelto. Separar “Review” de “Fix” y no alterar estados por visitar el artifact.

## 12. Commit & Release Gates

### Gate A — Integration

- Presentar diff acotado, decisiones de contrato, pruebas y builds.
- Mostrar **obligatoriamente** la UI local en escritorio y móvil, Light/Dark, con revisión humana.
- Obtener autorización explícita **antes de commit y push**.
- Tras la autorización, integrar y comprobar CI. El WI debe existir en el repositorio como `in-progress` antes de una eventual publicación.

### Gate B — Publication

- Evaluar el impacto real sobre paquetes distribuidos; en principio hay cambios de producto (Core/Admin), pero **no se autoriza por defecto** bump, tag, npm publish o GitHub Release.
- Presentar la necesidad de release, versión propuesta y CI del commit de integración.
- Publicar únicamente con autorización humana independiente. Si se omite publicación justificadamente, documentar `release_decision` sin inventar `released_in`.

### Gate C — Canonical Closure

- Registrar evidencia concreta y verificable para los 26 AC.
- Ejecutar `kaddo verify WI-082` y resolver blockers sin confundir tests con outcome.
- Registrar Learning en español (diagnóstico, decisiones, resultado visual, límites, prevención de recurrencia).
- Completar lifecycle canónico **solo después** de aprobación humana, preservando provenance y el estado de release real.
- Ejecutar commit/push de cierre y confirmar CI.

**Ningún gate autoriza automáticamente el siguiente.**

## 13. Definition of Done

WI-082 estará listo para cierre cuando:

- Los 26 AC tengan evidencia y la verificación canónica indique readiness apto para completar.
- Overview mantenga una jerarquía útil con una cola grande de hallazgos.
- Needs Attention tenga exploración completa, filtros, agrupación, contexto y navegación funcional.
- Las referencias históricas ambiguas se diagnostiquen sin reinterpretación o migración silenciosa.
- Los defectos de integridad genuinos sigan detectándose y bloqueando completion cuando corresponda.
- Planning Coverage no atribuya integridad verificada a referencias no verificadas.
- Tests, E2E, builds y comprobaciones visuales estén aprobados.
- La experiencia local haya sido presentada y aprobada antes de integrar.
- Docs EN/ES y Learning estén actualizados, con gates registrados individualmente.

## 14. Learning

*Pendiente de registrar después de la implementación y validación.*
