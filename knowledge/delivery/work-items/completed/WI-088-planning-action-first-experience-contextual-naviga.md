---
type: feature
id: WI-088
title: Planning Action-First Experience & Contextual Navigation
status: completed
work_type: feature
knowledge_level: K3
priority: high
created_at: '2026-11-24'
domains:
  - Delivery
  - Product Experience
antecedent:
  - WI-081
  - WI-082
  - WI-083
  - WI-085
  - WI-086
scope_confidence:
  level: high
  reasons:
    - >-
      La experiencia de Wasma evidencia sobrecarga informativa y falta de
      continuidad al navegar entre entidades relacionadas.
    - >-
      El código actual de Admin renderiza métricas y diagnósticos completos
      antes de facilitar la acción; la navegación a Initiative y Work Item sale
      del árbol visual de Planning.
    - >-
      La mejora puede implementarse principalmente en Admin utilizando datos,
      verificadores y operaciones existentes; cualquier extensión de contrato
      requiere diagnóstico y aprobación por separado.
surfaces:
  product-ui: affected
  frontend: affected
  backend: not-applicable
  database: not-applicable
  configuration: not-applicable
  feature-flags: not-applicable
  content-copy: affected
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: affected
  operations-release: not-applicable
source:
  type: external
  imported_at: '2026-11-24'
  source_format: kaddo-frontmatter
  source_hash: a97ac14423e1a5e08b21c8c0bf83eb377b27dd205b7e2bd12294808d96ec7155
  inferred: false
generated_by: kaddo-admin
affected_modules:
  - admin
  - docs
summary: >-
  Con un proyecto real como Wasma, Planning Overview presenta múltiples
  indicadores redundantes (p. ej. 49 outcomes pendientes, 57 findings, 9
  milestones por revisar, 70/72 Work Items completados, 12/47 referencias
  validadas), listados de advertencias y colecciones de Plans/Epic…
telemetry_work_item_id: 862ebdb2-be59-4542-a255-248a383e7790
original_snapshot:
  title: Planning Action-First Experience & Contextual Navigation
  description: >-
    Con un proyecto real como Wasma, Planning Overview presenta múltiples
    indicadores redundantes (p. ej. 49 outcomes pendientes, 57 findings, 9
    milestones por revisar, 70/72 Work Items completados, 12/47 referencias
    validadas), listados de advertencias y colecciones de Plans/Epic…
  type: feature
  status: draft
ready_at: '2026-11-24'
implementation_status: completed
validation_status: passed
released_in: v3.144.1
implementation_evidence:
  repositories:
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/lib/next-actions.ts
        - packages/admin/src/lib/planning-nav.ts
        - packages/admin/src/components/NextActions.tsx
        - packages/admin/src/components/PlanningBreadcrumb.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/routes/InitiativeDetail.tsx
        - packages/admin/src/routes/WorkItemDetail.tsx
        - packages/admin/src/App.tsx
        - packages/admin/tests/next-actions.test.ts
        - packages/admin/e2e/planning-action-first.spec.ts
      validations:
        - command: CI=1 npx playwright test
          status: passed
        - command: pnpm test
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
        - command: pnpm -r build
          status: passed
  ac_verifications:
    - criterion: '**AC-01.** Planning Overview presenta un resumen breve de estado y un bloque visible de próximas acciones antes de los diagnósticos completos.'
      status: passed
      evidence: 'El Overview encabeza con un resumen de estado compacto y el bloque ''What''s next'' antes de los diagnósticos; verificado por E2E y revisión visual.'
      reference: 'packages/admin/src/components/NextActions.tsx'
      method: manual
    - criterion: '**AC-02.** Por defecto muestra entre **0 y 3 acciones** respaldadas por fuentes canónicas; sin acciones demostrables se usa un empty state honesto.'
      status: passed
      evidence: 'prioritizeActions deriva 0–3 acciones de fuentes canónicas (attention + readiness); sin acciones demostrables se muestra un empty state honesto (test unitario).'
      reference: 'packages/admin/src/lib/next-actions.ts'
      method: manual
    - criterion: '**AC-03.** Cada acción muestra verbo, artefacto de destino, razón verificable y CTA funcional; no hay controles decorativos.'
      status: passed
      evidence: 'Cada acción muestra verbo, artefacto de destino, razón verificable y CTA funcional; no hay controles decorativos.'
      reference: 'packages/admin/src/components/NextActions.tsx'
      method: manual
    - criterion: '**AC-04.** La priorización es determinista, documentada y probada con fixtures: un problema estructural resoluble se distingue de una dependencia pendiente normal.'
      status: passed
      evidence: 'Prioridad determinista y probada con fixtures: un bloqueo estructural (provenance severity blocking) se distingue de una dependencia pendiente normal (contexto).'
      reference: 'packages/admin/tests/next-actions.test.ts'
      method: manual
    - criterion: '**AC-05.** El proyecto Wasma identifica EP-001 como punto de revisión relevante **si sus precondiciones y criterios actuales lo sustentan**; no inventa aprobación humana ya concedida ni presenta un bloqueo normal como error.'
      status: passed
      evidence: 'Una decisión humana solo se emite desde una readiness verificable (READY_* no terminal); EP-001 aparece como revisión solo si sus señales lo sustentan, nunca inventando aprobación ni presentando un bloqueo normal como error.'
      reference: 'packages/admin/src/lib/next-actions.ts'
      method: manual
    - criterion: '**AC-06.** No se duplican en Overview las listas exhaustivas de Plans, Epics e Initiatives que ya tienen vistas propias.'
      status: passed
      evidence: 'El Overview usa un resumen compacto de estructura con enlaces a las vistas; no duplica las listas completas de Plans/Epics/Initiatives (E2E).'
      reference: 'packages/admin/src/routes/Planning.tsx'
      method: manual
    - criterion: '**AC-07.** Los accesos de creación no se repiten de forma competitiva en la misma pantalla; una acción principal clara queda disponible.'
      status: passed
      evidence: 'Una sola acción primaria de creación en el Overview; las creaciones por tipo viven en su pestaña (E2E).'
      reference: 'packages/admin/src/routes/Planning.tsx'
      method: manual
    - criterion: '**AC-08.** La totalidad de findings, datos de progreso, filtros y explicaciones siguen accesibles desde Diagnostics/Insights bajo demanda.'
      status: passed
      evidence: 'La totalidad de findings, progreso, filtros y explorador siguen accesibles bajo Diagnostics on demand (E2E).'
      reference: 'packages/admin/src/components/PlanningInsights.tsx'
      method: manual
    - criterion: '**AC-09.** Las métricas y señales mostradas coinciden con las respuestas canónicas; no se infieren completions ni se silencian findings críticos.'
      status: passed
      evidence: 'Las métricas provienen de la proyección canónica /planning/insights; no se infieren completions ni se silencian findings.'
      reference: 'packages/admin/src/components/PlanningInsights.tsx'
      method: manual
    - criterion: '**AC-10.** Se preservan las separaciones de delivery, validated coverage, outcome verification, readiness, pending dependencies y blocking issues.'
      status: passed
      evidence: 'Se preservan delivery vs validated coverage vs outcome verification vs readiness vs pending dependencies vs blocking issues (dimensiones e indicadores separados).'
      reference: 'packages/admin/src/components/PlanningInsights.tsx'
      method: manual
    - criterion: '**AC-11.** Los findings repetitivos pueden explorarse por artefacto y desde ellos abrir la revisión contextual relevante sin perder la severidad original.'
      status: passed
      evidence: 'El explorador agrupa findings por artefacto y abre la revisión contextual conservando la severidad canónica original.'
      reference: 'packages/admin/src/components/PlanningInsights.tsx'
      method: manual
    - criterion: '**AC-12.** Cuando una acción carece de corrección automática disponible, el CTA dirige a inspección y no promete reparar o completar.'
      status: passed
      evidence: 'Cuando una señal no tiene destino navegable, el CTA indica inspección (''no linked destination'') y no promete reparar ni completar.'
      reference: 'packages/admin/src/components/NextActions.tsx'
      method: manual
    - criterion: '**AC-13.** En Plan, Epic, Initiative y Work Item abiertos desde Planning se ve claramente la ubicación y una ruta de retorno contextual.'
      status: passed
      evidence: 'En Plan/Epic/Initiative/Work Item abiertos desde Planning, el breadcrumb muestra la ubicación y un enlace de retorno contextual.'
      reference: 'packages/admin/src/components/PlanningBreadcrumb.tsx'
      method: manual
    - criterion: '**AC-14.** Abrir Initiative/Work Item desde una Epic no hace perder el Plan/Epic padre al navegar de regreso.'
      status: passed
      evidence: 'Abrir Initiative/Work Item desde una Epic conserva el Plan/Epic padre; el ''from'' anidado permite regresar al origen (E2E Epic→Initiative→back).'
      reference: 'packages/admin/e2e/planning-action-first.spec.ts'
      method: manual
    - criterion: '**AC-15.** Se recuperan pestaña y contexto relevantes al regresar desde un detalle; el navegador Atrás/Adelante funciona en recorridos probados.'
      status: passed
      evidence: 'El ''from'' incluye el hash de sección, de modo que al regresar se restaura la pestaña/contexto; Atrás/Adelante del navegador funcionan (E2E).'
      reference: 'packages/admin/src/lib/planning-nav.ts'
      method: manual
    - criterion: '**AC-16.** Deep links y recarga de una vista de Plan/Epic/Initiative/Work Item siguen funcionando con o sin contexto previo.'
      status: passed
      evidence: 'Deep links y recarga de Plan/Epic/Initiative/Work Item siguen funcionando con o sin contexto previo (E2E).'
      reference: 'packages/admin/e2e/planning-action-first.spec.ts'
      method: manual
    - criterion: '**AC-17.** No se crean entidades ficticias de Milestone; el explorador muestra milestones embebidos en su Plan.'
      status: passed
      evidence: 'No se crean rutas de Milestone; el breadcrumb muestra el milestone embebido en su Plan (E2E).'
      reference: 'packages/admin/src/components/PlanningBreadcrumb.tsx'
      method: manual
    - criterion: '**AC-18.** Los casos solo-Initiative, Epic independiente de Plan y Work Item independiente navegan correctamente sin jerarquías artificiales.'
      status: passed
      evidence: 'Proyectos solo-Initiative, Epic sin Plan y Work Item independiente navegan sin jerarquías artificiales (tests unitarios + revisión visual de un proyecto sin Plans/Epics).'
      reference: 'packages/admin/src/lib/next-actions.ts'
      method: manual
    - criterion: '**AC-19.** Las rutas globales existentes de Initiative y Work Item permanecen funcionales para accesos ajenos a Planning.'
      status: passed
      evidence: 'Las rutas globales /initiatives/:id y /work-items/:id siguen funcionando para accesos ajenos a Planning (E2E).'
      reference: 'packages/admin/e2e/planning-action-first.spec.ts'
      method: manual
    - criterion: '**AC-20.** Los breadcrumbs, pestañas y CTA ofrecen semántica accesible y navegación por teclado, con foco visible.'
      status: passed
      evidence: 'Breadcrumbs, pestañas y CTA son accesibles por teclado con nombres accesibles y foco visible.'
      reference: 'packages/admin/src/components/PlanningBreadcrumb.tsx'
      method: manual
    - criterion: '**AC-21.** Una acción “Revisar evidencia” conduce a la revisión correspondiente sin registrar evidencia automáticamente.'
      status: passed
      evidence: '''Review evidence'' conduce a la revisión correspondiente sin registrar evidencia automáticamente (E2E cero escrituras).'
      reference: 'packages/admin/src/components/PlanningCompletion.tsx'
      method: manual
    - criterion: '**AC-22.** Las operaciones de evidence/completion conservan intactos los evaluadores, permisos, revisiones y compuertas humanas existentes.'
      status: passed
      evidence: 'Evidence/completion conservan intactos evaluadores, permisos, revisiones y compuertas humanas (sin cambio en Core/admin-server).'
      reference: 'packages/admin/src/components/EvidenceDrawer.tsx'
      method: manual
    - criterion: '**AC-23.** No se modifica ni un artifact canónico de Wasma ni los archivos de entrega como efecto colateral de navegar o consultar.'
      status: passed
      evidence: 'Navegar y consultar no modifica ningún artifact canónico ni archivo de entrega (E2E: cero POST/PATCH/PUT/DELETE).'
      reference: 'packages/admin/e2e/planning-action-first.spec.ts'
      method: manual
    - criterion: '**AC-24.** La interfaz refleja correctamente cuando una Epic tiene delivery completo pero outcomes no verificados y/o aprobación humana pendiente.'
      status: passed
      evidence: 'La interfaz refleja una Epic con delivery completo pero outcomes no verificados y/o aprobación humana pendiente (acción ''Review evidence'' / ''Ready for decision'').'
      reference: 'packages/admin/src/components/PlanningCompletion.tsx'
      method: manual
    - criterion: '**AC-25.** Se aprueba un wireframe navegable de Planning Overview, Diagnostics y recorrido `Plan → Epic → Initiative → Work Item → retorno` **antes de implementar**.'
      status: passed
      evidence: 'Se presentó y aprobó un wireframe navegable (Fase 2) antes de implementar UI.'
      reference: 'knowledge/delivery/work-items/in-progress\WI-088-planning-action-first-experience-contextual-naviga.md'
      method: manual
    - criterion: '**AC-26.** El flujo se valida visualmente en tema oscuro y claro, desktop y viewport móvil de 375 px, sin overflow ni pérdida de información.'
      status: passed
      evidence: 'Validado en tema oscuro y claro, desktop y 375px, sin overflow (overflow=0) ni pérdida de información (revisión visual + E2E).'
      reference: 'packages/admin/e2e/planning-action-first.spec.ts'
      method: manual
    - criterion: '**AC-27.** Tests de componentes/integración y E2E comprueban priorización, estado sin acciones, deep link, navegación y retorno, teclado y cero escrituras no solicitadas.'
      status: passed
      evidence: 'Tests de componentes/integración y E2E cubren priorización, estado sin acciones, deep link, navegación y retorno, teclado y cero escrituras.'
      reference: 'packages/admin/e2e/planning-action-first.spec.ts'
      method: manual
    - criterion: '**AC-28.** Prueba de usabilidad con Wasma: desde Overview se identifica una próxima acción justificada y se llega al lugar correcto para trabajar en un máximo de dos interacciones principales; el diagnóstico completo permanece accesible.'
      status: passed
      evidence: 'Desde el Overview se identifica una próxima acción justificada y se llega al punto de trabajo en dos interacciones (acción → sección), con el diagnóstico completo accesible.'
      reference: 'packages/admin/src/components/NextActions.tsx'
      method: manual
    - criterion: '**AC-29.** Se verifica un fixture con Initiatives y Work Items, pero sin Plans/Epics, y otro con entidades sin asociaciones.'
      status: passed
      evidence: 'Verificado un fixture con Initiatives y Work Items sin Plans/Epics (revisión visual) y entidades sin asociaciones (tests unitarios de prioritizeActions).'
      reference: 'packages/admin/tests/next-actions.test.ts'
      method: manual
    - criterion: '**AC-30.** No se ejecuta `git add`, commit ni push antes de la revisión visual local y autorización humana explícita; se entrega diff y evidencia de tests para aprobación.'
      status: passed
      evidence: 'No se ejecutó commit ni push antes de la revisión visual local y la autorización humana explícita; se entregó diff y evidencia de tests, y se iteró según el feedback de revisión antes de integrar.'
      reference: 'knowledge/delivery/work-items/in-progress\WI-088-planning-action-first-experience-contextual-naviga.md'
      method: manual
---

# WI-088 — Planning Action-First Experience & Contextual Navigation

## 1. Problema y evidencia

Con un proyecto real como Wasma, Planning Overview presenta múltiples indicadores redundantes (p. ej. 49 outcomes pendientes, 57 findings, 9 milestones por revisar, 70/72 Work Items completados, 12/47 referencias validadas), listados de advertencias y colecciones de Plans/Epics/Initiatives. La cantidad de información compite con las tareas realizables. El usuario debe interpretar el grafo, localizar la entidad, abrir otra pantalla y buscar allí el criterio antes de actuar.

La navegación tampoco mantiene una identidad espacial clara: Plan y Epic abren rutas de Planning, pero Initiative y Work Item abren rutas globales; al volver se pierde con frecuencia el Plan, Epic, sección o filtro de origen. En `packages/admin/src/routes/Planning.tsx` el Overview renderiza `Findings`, `PlanningInsights` y colecciones completas; en `PlanningInsights.tsx` se presentan diagnósticos y milestones; `SectionTabs.tsx` administra pestañas de detalle mediante hash. La solución no es simplemente recortar o colapsar listas: es reorganizar el flujo de trabajo.

**Problema de producto:** el usuario ve muchos datos, pero no sabe con claridad **dónde está, qué puede hacer ahora y adónde ir después**.

## 2. Resultado esperado

Convertir Planning en un workspace centrado en tres preguntas:

1. **¿Dónde estoy?** Estado general comprensible, sin confundir delivery, coverage, outcome verification y readiness.
2. **¿Qué sigue?** Máximo tres acciones relevantes y justificadas por el estado canónico, con destino directo.
3. **¿Qué requiere mi decisión?** Acciones humanas, bloqueos resolubles o evidencias por revisar, diferenciadas de dependencias normales.

Una persona debe poder entrar al Overview, identificar una acción importante y abrir el punto específico de trabajo en uno o dos pasos, sin perder su contexto de navegación. La información de diagnóstico completa permanece disponible, aunque no domina la portada.

## 3. Alcance funcional

### 3.1 Planning Overview orientado a acciones

- Reemplazar el protagonismo de las seis tarjetas de métricas y los extensos bloques de diagnóstico por una cabecera compacta con **resumen de estado** y un bloque **Next actions / Qué sigue**.
- Mostrar **hasta tres acciones** por defecto; si no hay acciones sustentadas, indicar el estado real y ofrecer exploración sin inventar trabajo.
- Cada acción debe mostrar: **qué hacer**, **por qué**, **artefacto/criterio afectado** y **CTA contextual** (p. ej. “Revisar evidencia”, “Ver dependencia”, “Abrir Epic”, “Revisar relación”).
- Basarse en progreso, dependencias, hallazgos, readiness y operaciones canónicas ya expuestas por Kaddo. **No afirmar que una decisión humana está pendiente si no se deriva de un criterio, finding o estado verificable**.
- Proponer una política de priorización **explicable y determinista**. Orientación inicial: (1) errores estructurales o referencias rotas resolubles; (2) elementos con precondiciones satisfechas y evidencia/revisión pendiente; (3) decisiones humanas explícitas que bloquean un resultado; (4) trabajos activos próximos. Un bloqueo causado únicamente por una dependencia legítima no se presenta como falla que deba “arreglarse”.
- Cuando un hallazgo carezca de operación directa, el CTA debe abrir el contexto y explicar qué revisar; nunca prometer resolución automática.
- Evitar duplicar listas completas de Plans, Epics e Initiatives en Overview: usar un resumen compacto de la estructura y enlaces a la vista correspondiente.
- Ajustar los textos a un lenguaje de acción y producto; mantener identificadores y términos canónicos visibles cuando aporten trazabilidad.

### 3.2 Diagnósticos bajo demanda, sin ocultarlos

- Crear un acceso claro a **Diagnostics / Insights** desde Overview para consultar métricas avanzadas, filtros, agrupación por artifact y todas las señales.
- Mantener los hallazgos completos, severidades y cantidades precisas; no filtrar silenciosamente condiciones negativas ni sumar métricas semánticamente diferentes.
- Agrupar señales repetitivas por causa/artefacto cuando sea posible: una Epic con outcome sin verificar y dependencia pendiente no debe exigir escanear decenas de filas para entender la próxima acción.
- Conservar las distinciones **delivery vs outcome verification**, **declared coverage vs validated coverage**, **blocking issues vs pending dependencies**, **lifecycle vs readiness** y **evidencia histórica vs evidencia canónica registrada**.
- Las vistas de diagnóstico deben ser explorables desde la página y regresar al contexto de origen.

### 3.3 Navegación contextual persistente

- Establecer una arquitectura de información consistente: `Planning → [Plan] → [Milestone del Plan] → [Epic] → [Initiative] → [Work Item]`, representando el Milestone como elemento **embebido en el Plan**, no como entidad autónoma del Core.
- Añadir breadcrumbs contextuales y/o explorador compacto de estructura para que el usuario identifique relaciones, selección actual y nivel al que puede volver.
- La navegación desde Planning hacia Initiative o Work Item debe preservar un camino de retorno al punto de origen, sin eliminar sus rutas globales existentes.
- Evitar la duplicación de páginas/contratos de Initiative y Work Item. Reutilizar el componente de detalle cuando sea posible, con contexto de Planning opcional, o plantear una solución equivalente justificada en la fase de diseño.
- Mantener y restaurar, cuando se pueda, Plan, Epic, pestaña, filtros, selección del finding y posición relevante. El comportamiento debe ser compatible con enlaces profundos, recarga y botones Atrás/Adelante del navegador.
- Usar rutas/URL estado compatibles con el router actual; no introducir rutas nuevas o parámetros sin especificar pruebas de navegación y enlaces directos.
- Si se abre una Initiative sin Epic, un Epic sin Plan o un Work Item independiente, mostrar la jerarquía real sin inventar padres ni rutas inexistentes.

### 3.4 Acciones directas y navegación desde las señales

- Permitir que acciones de Overview/Insights aterricen, cuando el contrato lo permita, en `Evidence & completion`, el criterio específico o la sección de relación pertinente.
- Las operaciones de **registrar evidencia, verificar y completar** siguen siendo exclusivamente las canónicas, con aprobación humana en las transiciones que la exijan.
- No agregar botones de “Resolve”, “Mark done”, “Approve” ni “Complete” cuyo comportamiento no exista en Core o represente eludir las verificaciones.
- Mantener la accesibilidad de acciones aun cuando el artefacto esté bloqueado, claramente como consulta o revisión cuando no pueda avanzarse.

### 3.5 Diseño sobrio y estados especiales

- Mantener una sola acción primaria por contexto visual; evitar CTAs de crear Plan/Epic duplicados.
- Utilizar disclosure progresivo, jerarquía tipográfica, estado semántico y resúmenes breves; **no añadir más contadores para compensar los existentes**.
- Considerar loading, error, sin datos, sin acciones inmediatas, solo Initiatives, solo Work Items, sin Plan, sin Epic, y grafos de gran tamaño.
- Respetar la identidad visual de Kaddo y sus temas claro/oscuro, teclado, lector de pantalla y vista móvil.

## 4. Fuera de alcance

- Modificar Kaddo Core, `verifyPlan`, `verifyEpic`, `verifyInitiative`, reglas de completion, provenance o contratos de evidencia.
- Alterar los archivos canónicos de Wasma, sus conteos, Work Items, estados o relaciones.
- Automatizar aceptación de ADRs, atribuir decisiones humanas o aprobar hallazgos de manera inferida.
- Introducir un motor nuevo de recomendaciones con telemetría, heurísticas opacas, IA o ranking personalizado.
- Reorganizar globalmente todos los módulos de Admin o crear una nueva taxonomía de entidades.
- Eliminar diagnósticos, esconder errores reales o cambiar la clasificación de severidades para que el dashboard parezca “verde”.

**Regla de alcance:** Si la UI no puede determinar o enlazar una acción con los contratos actuales, documentar la brecha y proponer una solución de Admin. Cambios de Core/admin-server solo con aprobación específica y WI adicional si corresponden.

## 5. Acceptance Criteria

### A. Experiencia orientada a acciones

- **AC-01.** Planning Overview presenta un resumen breve de estado y un bloque visible de próximas acciones antes de los diagnósticos completos.
- **AC-02.** Por defecto muestra entre **0 y 3 acciones** respaldadas por fuentes canónicas; sin acciones demostrables se usa un empty state honesto.
- **AC-03.** Cada acción muestra verbo, artefacto de destino, razón verificable y CTA funcional; no hay controles decorativos.
- **AC-04.** La priorización es determinista, documentada y probada con fixtures: un problema estructural resoluble se distingue de una dependencia pendiente normal.
- **AC-05.** El proyecto Wasma identifica EP-001 como punto de revisión relevante **si sus precondiciones y criterios actuales lo sustentan**; no inventa aprobación humana ya concedida ni presenta un bloqueo normal como error.
- **AC-06.** No se duplican en Overview las listas exhaustivas de Plans, Epics e Initiatives que ya tienen vistas propias.
- **AC-07.** Los accesos de creación no se repiten de forma competitiva en la misma pantalla; una acción principal clara queda disponible.

### B. Diagnósticos confiables y progresivos

- **AC-08.** La totalidad de findings, datos de progreso, filtros y explicaciones siguen accesibles desde Diagnostics/Insights bajo demanda.
- **AC-09.** Las métricas y señales mostradas coinciden con las respuestas canónicas; no se infieren completions ni se silencian findings críticos.
- **AC-10.** Se preservan las separaciones de delivery, validated coverage, outcome verification, readiness, pending dependencies y blocking issues.
- **AC-11.** Los findings repetitivos pueden explorarse por artefacto y desde ellos abrir la revisión contextual relevante sin perder la severidad original.
- **AC-12.** Cuando una acción carece de corrección automática disponible, el CTA dirige a inspección y no promete reparar o completar.

### C. Continuidad de navegación

- **AC-13.** En Plan, Epic, Initiative y Work Item abiertos desde Planning se ve claramente la ubicación y una ruta de retorno contextual.
- **AC-14.** Abrir Initiative/Work Item desde una Epic no hace perder el Plan/Epic padre al navegar de regreso.
- **AC-15.** Se recuperan pestaña y contexto relevantes al regresar desde un detalle; el navegador Atrás/Adelante funciona en recorridos probados.
- **AC-16.** Deep links y recarga de una vista de Plan/Epic/Initiative/Work Item siguen funcionando con o sin contexto previo.
- **AC-17.** No se crean entidades ficticias de Milestone; el explorador muestra milestones embebidos en su Plan.
- **AC-18.** Los casos solo-Initiative, Epic independiente de Plan y Work Item independiente navegan correctamente sin jerarquías artificiales.
- **AC-19.** Las rutas globales existentes de Initiative y Work Item permanecen funcionales para accesos ajenos a Planning.
- **AC-20.** Los breadcrumbs, pestañas y CTA ofrecen semántica accesible y navegación por teclado, con foco visible.

### D. Tareas reales y seguridad

- **AC-21.** Una acción “Revisar evidencia” conduce a la revisión correspondiente sin registrar evidencia automáticamente.
- **AC-22.** Las operaciones de evidence/completion conservan intactos los evaluadores, permisos, revisiones y compuertas humanas existentes.
- **AC-23.** No se modifica ni un artifact canónico de Wasma ni los archivos de entrega como efecto colateral de navegar o consultar.
- **AC-24.** La interfaz refleja correctamente cuando una Epic tiene delivery completo pero outcomes no verificados y/o aprobación humana pendiente.

### E. Calidad y aceptación visual

- **AC-25.** Se aprueba un wireframe navegable de Planning Overview, Diagnostics y recorrido `Plan → Epic → Initiative → Work Item → retorno` **antes de implementar**.
- **AC-26.** El flujo se valida visualmente en tema oscuro y claro, desktop y viewport móvil de 375 px, sin overflow ni pérdida de información.
- **AC-27.** Tests de componentes/integración y E2E comprueban priorización, estado sin acciones, deep link, navegación y retorno, teclado y cero escrituras no solicitadas.
- **AC-28.** Prueba de usabilidad con Wasma: desde Overview se identifica una próxima acción justificada y se llega al lugar correcto para trabajar en un máximo de dos interacciones principales; el diagnóstico completo permanece accesible.
- **AC-29.** Se verifica un fixture con Initiatives y Work Items, pero sin Plans/Epics, y otro con entidades sin asociaciones.
- **AC-30.** No se ejecuta `git add`, commit ni push antes de la revisión visual local y autorización humana explícita; se entrega diff y evidencia de tests para aprobación.

## 6. Fases y checkpoints

### Fase 1 — Auditoría UX + contratos (read-only)

Inspeccionar rutas, estado de tabs/hash, componentes de Overview/Insights, endpoints y tipos de findings. Mapear qué acciones pueden construirse con los contratos existentes y cuáles son solo diagnóstico. Presentar arquitectura de información y matriz `signal → acción → destino → contrato`, con casos de Wasma y de proyectos sin jerarquía completa. **Checkpoint humano:** aprobar alcance y criterio de priorización.

### Fase 2 — Wireframe navegable (sin cambios funcionales)

Diseñar Overview, diagnóstico secundario y navegación contextual; incluir estados vacíos y un recorrido completo Plan → Epic → Initiative → WI → retorno. Validar densidad informativa, copy y accesibilidad. **Checkpoint humano obligatorio:** aprobación visual expresa antes de implementar.

### Fase 3 — Implementación controlada en Admin

Implementar capa de presentación y navegación contextual reutilizando servicios y operaciones actuales. Evitar duplicación de pantallas o de reglas de dominio. Aplicar cambios locales únicamente en rutas/componentes aprobados. No tocar Core/admin-server sin nueva aprobación.

### Fase 4 — Validación funcional y visual

Ejecutar pruebas automáticas, regresiones y revisión manual local sobre Wasma y fixtures de proyectos solo-Initiative/independientes. Presentar capturas o recorrido local, matriz de criterios y diff. **Checkpoint humano:** confirmar que el diseño ayuda a completar tareas sin perder información.

### Fase 5 — Integración, release y cierre (solo tras autorización)

Únicamente después de aprobación explícita: staging limitado, revisión del diff, commit, CI, publicación si procede y cierre del WI con evidencia por AC y Learning en español. No comprometer una release o cambio en producción antes de los gates aplicables.

## 7. Validación mínima y escenarios

| Escenario | Resultado esperado |
|---|---|
| Wasma: 70/72 Work Items completos y outcomes no verificados | La portada distingue entrega de resultados verificados y propone una revisión realizable |
| Wasma: EP-001 sin dependencias previas | Prioridad contextual sin completar por inferencia los cinco criterios |
| Wasma: EP-002..009 con dependencias pendientes | Se muestran como contexto de bloqueo, no como nueve incidentes independientes que deben “arreglarse” |
| Viaje Planning → Plan → Epic → Initiative → Work Item → Atrás | Se mantiene ubicación, pestaña y destino de regreso |
| Abrir enlace directo a Work Item | Continúa funcionando con navegación global y sin contexto de Planning |
| Proyecto con Initiatives pero sin Plans/Epics | No hay navegación falsa ni CTAs de Plan obligatorios |
| Proyecto con solo Work Items independientes | Empty state útil; la capacidad de trabajar sin Planning sigue disponible |
| Fuente sin acciones sustentadas | No se fabrican tareas; se ofrece navegación informativa y Diagnostics |
| Acceso a findings completos | Misma cantidad y severidad canónica, con filtros y detalle disponibles |

## 8. Definition of Done

- AC-01 a AC-30 verificadas con evidencia, referencia y método.
- Wireframe y checkpoint de experiencia aprobados explícitamente.
- Sin cambios de dominio ni de datos canónicos; pruebas existentes de Planning siguen verdes.
- Capturas o demo local sobre Wasma en desktop y móvil, tema claro/oscuro.
- Evidencia del flujo en uno o dos pasos y de regreso contextual.
- CI verde, integración y release solo si aprobadas.
- Learning en español: problema observado, decisiones UX, resultados, límites y mejoras pendientes.

## 9. Ownership y riesgos

**Owner sugerido:** Admin / Frontend; apoyo de Planning para validar semántica, insights y completion.

**Antecedentes:** WI-081 (Execution Insights), WI-082 (provenance/attention), WI-083 (Overview consistency), WI-085 (SectionTabs y progressive disclosure), WI-086 (Milestones Tracking).

**Riesgos y mitigaciones:**

- **Acciones falsas o no verificadas:** exigir fuente canónica y CTA de inspección cuando falte una operación real.
- **Ocultar diagnósticos:** mantener un explorador completo y métricas verificables.
- **Pérdida de deep links o regresión del router:** pruebas explícitas de URL, retorno, historial y rutas globales.
- **Jerarquía obligatoria falsa:** cubrir proyectos sin Plans, sin Epics o con Work Items independientes.
- **Reescribir el mismo evaluador en UI:** exclusivamente derivaciones de presentación; Core sigue siendo fuente de verdad.
- **Aumentar la complejidad visual:** medir interacciones reales, no cantidad de información añadida.

## 10. Resultado de producto

Planning debe dejar de ser un inventario de métricas para convertirse en una experiencia donde el usuario identifica una decisión o una tarea, comprende su contexto y llega al punto de trabajo sin abandonar mentalmente el proyecto. **Menos datos visibles por defecto, ninguna pérdida de verdad y más acciones útiles.**


## 11. Learning

Entregado en v3.144.1 (módulos `admin` y `docs`; sin cambios en Core, CLI ni MCP).

### Problema observado

El Planning Overview competía por atención con seis tarjetas de métricas, bloques de diagnóstico completos y
colecciones de Plans/Epics/Initiatives. El usuario veía muchos datos pero no sabía dónde estaba, qué podía
hacer ni adónde ir; además, la navegación hacia Initiative y Work Item salía del árbol de Planning y perdía el
contexto de origen al volver.

### Decisiones UX (checkpoints aprobados)

- **Fase 1 — política de priorización de acciones (4 niveles):** 1 bloqueo real y corregible, 2 evidencia o
  decisión humana con precondiciones cumplidas, 3 trabajo activo, 4 provenance/calidad de datos; las
  dependencias legítimas son contexto, nunca incidentes. Determinista, sin lógica específica de proyecto.
- **Fase 2 — wireframe navegable** del Overview, Diagnostics y el recorrido Plan→Epic→Initiative→WI→retorno,
  aprobado antes de implementar.
- **Navegación contextual:** un parámetro `from` en la URL (con el hash de sección) conserva el camino de
  retorno; el milestone se muestra embebido en su Plan, sin ruta propia; las rutas globales siguen intactas.

### Resultados

El Overview encabeza con estado compacto y hasta tres acciones canónicas; los diagnósticos completos quedan a
un clic en Diagnostics; abrir una entidad desde Planning conserva el retorno y la pestaña de origen, y la
cadena anidada se despliega paso a paso.

### Iteración por feedback de revisión visual

La primera revisión no se aprobó: una referencia histórica ambigua de `materialized_as` (severidad *warning*)
se mostraba como tarjeta roja de bloqueo de nivel 1, contradiciendo el indicador de cero blocking issues. Se
corrigió haciendo la priorización **consciente de la severidad canónica**: `missing/mismatch` (blocking) son
nivel 1; `ambiguous` (warning) pasa a una nota de **provenance/calidad de datos** discreta que enlaza a
Diagnostics, nunca roja ni crítica. El color de cada acción sigue la severidad: solo un bloqueo real es rojo.
Además, los enlaces internos (Epic→Initiative/WI, Initiative→WI) pasaron a llevar un `from` anidado para
preservar toda la cadena de retorno. Se revalidó con Wasma y con un proyecto sin Plans/Epics.

### Límites honestos

Los diagnósticos conservan la proyección canónica de WI-081/082/083 (progressive disclosure existente); no se
reescribió esa superficie. La validación del caso sin jerarquía se cubre con tests unitarios de la
priorización y revisión visual local, no con un segundo servidor E2E.

### Prevención de recurrencia

Las acciones derivan solo de señales canónicas (attention + readiness) con severidad canónica; una señal sin
operación navegable invita a inspeccionar, nunca promete reparar. El Overview no inventa trabajo ni jerarquías
y nunca presenta como crítico un bloqueo que no lo es.
