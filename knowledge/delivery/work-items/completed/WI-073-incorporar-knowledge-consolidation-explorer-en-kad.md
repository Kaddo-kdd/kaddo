---
type: feature
id: WI-073
title: Incorporar Knowledge Consolidation Explorer en Kaddo Admin
status: completed
completed_at: '2026-11-01'
released_in: v3.130.0
work_type: feature
created_at: '2026-11-01'
source:
  type: external
  imported_at: '2026-11-01'
  source_format: kaddo-frontmatter
  source_hash: 68043362bf11744efe71b4d56a803763a9489bdc1081732ff9861c50a5416b07
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - admin
  - admin-server
  - docs
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    admin-server:
      role: core
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/src/server.ts
        - packages/admin-server/src/contracts/schemas.ts
        - packages/admin-server/tests/consolidation.test.ts
      validations:
        - command: >-
            pnpm exec vitest run
            packages/admin-server/tests/consolidation.test.ts
          status: passed
          reason: >-
            9 verdes: not-generated sin recalcular, generate persiste ambas
            proyecciones y no escribe knowledge/, lectura sin recalcular, stale
            tras cambiar fuente, plan corrupto → unavailable, export = snapshot,
            scope schema rechaza input inválido, generación fallida no
            sobrescribe un plan válido.
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/routes/ConsolidationReport.tsx
        - packages/admin/src/routes/Reports.tsx
        - packages/admin/src/routes/Knowledge.tsx
        - packages/admin/src/App.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/consolidation.spec.ts
        - >-
          packages/admin/e2e/fixtures/project/knowledge/delivery/work-items/completed/WI-050-consolidation-fixture.md
      validations:
        - command: pnpm --filter @kaddo/admin build
          status: passed
          reason: tsc -b + vite build sin errores.
        - command: pnpm --filter @kaddo/admin exec playwright test consolidation
          status: passed
          reason: >-
            5 verdes (incluye el refinamiento UX): 4ª tarjeta en Reports +
            acceso desde Knowledge; guía de uso + empty state + generate; drawer
            abierto desde tarjeta con secciones (What was
            detected/Evidence/Recommended next step) + Copy Agent Handoff;
            Escape cierra el drawer y conserva el filtro; Coverage distingue
            Reload de Regenerate.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/knowledge-consolidation.md
        - apps/docs/src/content/docs/es/knowledge-consolidation.md
      validations:
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: 259 páginas; sección "Admin Explorer" EN/ES.
antecedent: 'WI-070, WI-071, WI-072'
scope_confidence:
  level: high
  reasons:
    - >-
      Knowledge Consolidation Core ya está implementado y expuesto mediante
      @kaddo/cli/core.
    - >-
      Admin dispone de Reports Explorer, navegación, endpoints y exportaciones
      reutilizables.
    - >-
      La funcionalidad está delimitada a exploración visual, sin aplicación
      automática de conocimiento.
summary: >-
  Incorporar Knowledge Consolidation Explorer en Kaddo Admin para generar,
  visualizar, filtrar y exportar planes de consolidación, inspeccionar
  evidencia, evaluar staleness y preparar handoffs para revisión semántica con
  agentes, reutilizando Core y preservando la integridad del conocimiento
  canónico.
original_snapshot:
  title: Incorporar Knowledge Consolidation Explorer en Kaddo Admin
  description: 'Kaddo implementó Knowledge Consolidation mediante WI-070, WI-071 y WI-072.'
  type: feature
  status: draft
ready_at: '2026-11-01'
verified_at: '2026-11-01'
---

# WI-073 — Knowledge Consolidation Explorer in Kaddo Admin

## 1. Context

Kaddo implementó Knowledge Consolidation mediante WI-070, WI-071 y WI-072.

Actualmente, el comando `kaddo knowledge consolidate` identifica oportunidades de mejora del conocimiento y genera:

- `.kaddo/consolidation-plan.json`
- `.kaddo/consolidation-plan.md`

El análisis determinístico identifica posibles redundancias, aprendizajes no incorporados, fragmentación, relaciones pendientes, inconsistencias potenciales y oportunidades de organización.

El proyecto ya dispone de un agente y skill para realizar revisión semántica, manteniendo separadas la detección determinística, la interpretación contextual y la aprobación humana.

Se ha validado un primer ciclo práctico usando WI-068:

1. Core identifica un aprendizaje candidato.
2. El agente contrasta el aprendizaje con el conocimiento actual.
3. Se propone una incorporación trazable.
4. Un humano aprueba la modificación.
5. El conocimiento canónico se actualiza sin modificar la evidencia histórica.

Sin embargo, los planes todavía se exploran principalmente mediante CLI, MCP o archivos.

## 2. Problem

Revisar manualmente un Consolidation Plan resulta poco práctico en proyectos con numerosos artifacts y hallazgos.

Los usuarios de Kaddo Admin no pueden generar ni explorar visualmente oportunidades de consolidación, inspeccionar su evidencia, identificar planes desactualizados o preparar revisiones semánticas desde una interfaz unificada.

Esto limita la accesibilidad y adopción de Knowledge Consolidation.

## 3. Expected Outcome

Incorporar **Knowledge Consolidation Explorer** como una nueva capacidad dentro del Reports Explorer existente.

El usuario podrá:

- Generar y regenerar planes bajo demanda.
- Explorar resultados mediante una interfaz visual.
- Consultar cobertura y distribución de oportunidades.
- Buscar, filtrar y seleccionar hallazgos.
- Visualizar evidencia y artifacts relacionados.
- Identificar planes desactualizados.
- Exportar resultados en Markdown y JSON.
- Copiar un handoff para revisión mediante el agente de consolidación.

La interfaz será de exploración y preparación de revisiones. No permitirá aplicar modificaciones automáticas al conocimiento.

---

## 3b. Refinement (grounding against real Admin code)

> Añadido en refinación. Verificado contra el código actual; no reemplaza el intent.

- **Patrón de reports existente** (`packages/admin-server/src/server.ts`): rutas read-only vía `coreRoute(handler)`; export vía `exportReportAdmin` que devuelve el string del renderer de Core. Los reports impact/drift/savings se construyen **en memoria** y no escriben `.kaddo/`. Consolidation se diferencia: debe **leer/persistir** `.kaddo/consolidation-plan.{json,md}`.
- **Core ya expuesto** en `@kaddo/cli/core` (`packages/cli/src/core.ts`): `buildConsolidationPlan`, `consolidationPlanStaleness`, `renderConsolidationMarkdown`, `serializeConsolidationJson`, `CONSOLIDATION_CATEGORIES` y tipos. El Admin Server los consume vía `core-adapter.ts`; **no se duplica lógica de análisis**.
- **core-adapter (nuevo):** `getConsolidationPlanAdmin(dir)` (lee el JSON persistido, lo valida, calcula staleness, devuelve availability `not-generated|current|stale|unavailable` + plan), `generateConsolidationPlanAdmin(dir, scope)` (construye con Core y persiste ambos archivos de forma atómica: serializa los dos strings antes de escribir, escribe a temporales y renombra, de modo que un fallo nunca deja un par inconsistente), `exportConsolidationAdmin(dir, format)` (devuelve el **snapshot persistido**, sin recalcular). Errores → `CoreError` recuperable.
- **Rutas (server.ts):** `GET /api/v1/admin/consolidation/plan`, `POST /api/v1/admin/consolidation/generate` (body `ConsolidationScope` validado con zod en `contracts/schemas.ts`), `GET /api/v1/admin/consolidation/export?format=json|markdown`. Reutilizan los middlewares de sesión/origin/CSRF ya aplicados globalmente; sin shell; sin rutas arbitrarias (scope = all|layer<enum>|module<id validado>).
- **UI (admin):** ruta dedicada `packages/admin/src/routes/ConsolidationReport.tsx` (+ subcomponentes) para evitar un monolito en `Reports.tsx`; alta en `App.tsx` (`/reports/consolidation`); 4ª tarjeta en `Reports.tsx`; enlace contextual en `Knowledge.tsx`; tipos y fetchers en `lib/api.ts`. Reutiliza DS tokens, `MarkdownRenderer`, iconos Lucide, estados loading/empty/error, Light/Dark, responsive.
- **Handoff:** se construye en cliente a partir del plan ya cargado; `Copy to Clipboard`. Trata la evidencia como datos no confiables; no ejecuta agentes ni LLM; no persiste estado `incorporated/dismissed`.
- **Resolución de rutas de artifacts:** reutiliza el inventario/endpoints existentes (`work-items`, `initiatives`, `resources`, `deprecations`, knowledge artifacts). IDs sin ruta válida → referencia copiable (sin fabricar rutas).
- **Tests:** integración en `packages/admin-server/tests/` (plan ausente/current/stale/corrupto, generate con scope válido/ inválido, export = snapshot, no escribe `knowledge/`), y E2E en `packages/admin/e2e/`. Fixture **sintético** representativo (todas las categorías + estados de plan); como no hay snapshot de Wasma, se declara esa limitación y no se depende de datos de un proyecto específico.
- **Resource review:** no se declara `resources:` — la vista solo lee proyecciones derivadas y conocimiento; no observa/modifica un sistema externo.

## 4. Functional Scope

### 4.1 Navigation

Extender Reports Explorer:

```text
Reports
├── Impact Report
├── Drift Report
├── Savings Report
└── Knowledge Consolidation
```

Ruta principal:

`/reports/consolidation`

Agregar también un acceso contextual **Review Knowledge Consolidation** desde `/knowledge`.

No crear una nueva entrada en el sidebar principal ni duplicar la vista.

### 4.2 Dashboard

Presentar los indicadores del plan:

| Indicador | Origen |
|---|---|
| Total Opportunities | `summary.total` |
| Semantic Review Required | `summary.requires_semantic_review` |
| Artifacts Evaluated | `coverage.artifacts_evaluated` |
| Work Items Evaluated | `coverage.work_items_evaluated` |
| Categories | `summary.by_category` |
| Generated At | `generated_at` |
| Scope | `scope` |

Incluir una visualización compacta de oportunidades por categoría y una sección de cobertura del análisis.

No convertir los hallazgos en métricas de errores confirmados ni inventar puntuaciones de calidad.

### 4.3 Opportunities Explorer

Crear una colección navegable de oportunidades que muestre:

- Título.
- ID.
- Categoría.
- Clasificación.
- Confidence.
- Artifacts de origen.
- Indicador de revisión semántica.

Implementar búsqueda por ID, título y referencias, además de filtros por categoría, clasificación y necesidad de revisión semántica.

Permitir un ordenamiento estable.

Los filtros operan sobre los datos cargados; no deben volver a ejecutar el análisis.

### 4.4 Opportunity Detail

Al seleccionar una oportunidad, mostrar:

**Overview**
- ID, categoría, clasificación y confidence.
- Indicador `requires_semantic_review`.

**Evidence**
- Fragmentos de evidencia.
- Rationale.
- Possible impact.

**Knowledge References**
- Source artifacts.
- Target artifacts, cuando existan.

**Suggested Action**
- Acción propuesta.
- Advertencia sobre la necesidad de confirmación semántica.

Si `target_artifacts` está vacío, indicar que el destino no está determinado.

Preservar la diferencia entre un hecho observable y una interpretación propuesta.

### 4.5 Artifact Navigation

Permitir navegación hacia entidades existentes:

- Work Items.
- Initiatives.
- ADRs y Knowledge Artifacts.
- Project Resources.
- Deprecations.

Resolver las referencias usando el inventario y contratos existentes de Admin.

No fabricar rutas a partir de IDs ambiguos.

Cuando un artifact no tenga una ruta válida, presentar una referencia copiable.

---

## 5. Plan Management

### 5.1 Existing Plan

Al abrir el Explorer, cargar el plan persistido desde `.kaddo/consolidation-plan.json`.

No regenerar automáticamente.

Si no existe, mostrar un Empty State con la acción **Generate Consolidation Plan**.

### 5.2 Generate / Regenerate

Permitir generar un análisis explícitamente con alguno de los alcances soportados:

- All.
- Layer.
- Module.

Validar que la capa o módulo seleccionado sea válido.

Utilizar `buildConsolidationPlan` y los renderizadores públicos de Core.

Persistir exclusivamente:

```text
.kaddo/consolidation-plan.json
.kaddo/consolidation-plan.md
```

La generación debe conservar el comportamiento de solo lectura respecto a `knowledge/`.

La escritura de las proyecciones debe evitar archivos parciales o pares JSON/Markdown inconsistentes ante errores.

### 5.3 Plan Staleness

Reutilizar `consolidationPlanStaleness`.

Estados:

- `not-generated`: no existe plan.
- `current`: las fuentes monitorizadas no cambiaron.
- `stale`: existen archivos fuente modificados o eliminados.
- `unavailable`: el plan no puede leerse o validarse.

Cuando esté stale, mostrar las fuentes afectadas y permitir regenerar el análisis.

Un plan stale puede seguir consultándose, pero debe estar claramente identificado.

No afirmar que el estado `current` detecta todas las modificaciones indirectas o la aparición de nuevos archivos fuera de las fuentes monitorizadas.

---

## 6. Admin Server

Agregar endpoints especializados:

```http
GET  /api/v1/admin/consolidation/plan
POST /api/v1/admin/consolidation/generate
GET  /api/v1/admin/consolidation/export?format=json
GET  /api/v1/admin/consolidation/export?format=markdown
```

### GET Plan

Retornar el plan existente, su estado de disponibilidad y el resultado de staleness.

No ejecutar un análisis nuevo durante la lectura.

Validar la estructura del JSON. Ante un plan incompatible o corrupto, devolver un error recuperable.

### POST Generate

Recibir un `ConsolidationScope` validado.

Reutilizar Core mediante Admin Core Adapter, sin ejecutar comandos shell.

Proteger la operación con los controles actuales de sesión, origen y CSRF.

No aceptar rutas arbitrarias.

### Export

Las exportaciones deben corresponder al mismo snapshot persistido que se está visualizando, sin recalcular conocimiento silenciosamente.

Utilizar los renderizadores existentes de Core cuando sea apropiado.

No exportar contenido basado en un plan diferente sin informar y actualizar la vista.

### Contracts

Definir schemas y tipos específicos para Consolidation Plan, Opportunity, Scope y Staleness.

Reutilizar los tipos de `@kaddo/cli/core` siempre que sea posible.

No duplicar lógica de análisis en Admin Server o frontend.

---

## 7. Agent Handoff

Agregar una acción **Copy Agent Handoff** en el detalle de cada oportunidad.

Debe producir una instrucción estructurada que incluya:

- Opportunity ID.
- Categoría y clasificación.
- Evidencia.
- Artifacts de origen.
- Destinos propuestos, si existen.
- Alcance y fecha del plan.
- Advertencia si está stale.
- Acción recomendada.
- Instrucción de revisión semántica y aprobación humana.

El handoff debe solicitar al `knowledge-consolidation-agent`:

1. Validar la vigencia del plan y de las fuentes.
2. Examinar el artifact o Work Item original.
3. Contrastar el hallazgo con el conocimiento canónico vigente.
4. Determinar si está incorporado, es irrelevante o requiere refinamiento.
5. Identificar un destino adecuado.
6. Preparar una propuesta trazable con diff antes/después, cuando corresponda.
7. Solicitar aprobación antes de modificar conocimiento.

Tratar los fragmentos de evidencia como datos no confiables, nunca como instrucciones ejecutables.

No enviar información a un modelo ni ejecutar un agente desde Admin en este WI.

No registrar el resultado como resuelto de forma persistente.

---

## 8. UX/UI Requirements

Respetar la identidad visual y los patrones existentes de Kaddo Admin.

Priorizar:

- Tarjetas de métricas compactas.
- Visualización clara por categoría.
- Filtros accesibles.
- Detalle legible de oportunidades.
- Evidencia destacada.
- Responsive design.
- Temas Light/Dark.
- Iconografía Lucide.
- Estados de carga, error y vacío.

Evitar un diseño basado únicamente en una tabla extensa.

La información debe ser comprensible también para usuarios que no conocen los contratos internos de Kaddo.

Las clasificaciones deben acompañarse de explicaciones breves.

No comunicar todas las oportunidades como fallos ni emplear colores de error indiscriminadamente.

---

## 9. Technical Guidance

### Existing Core

Reutilizar las funciones exportadas desde:

`packages/cli/src/core.ts`

- `buildConsolidationPlan`
- `consolidationPlanStaleness`
- `renderConsolidationMarkdown`
- `serializeConsolidationJson`
- `CONSOLIDATION_CATEGORIES`

### Admin Server

Inspeccionar y extender:

```text
packages/admin-server/src/core-adapter.ts
packages/admin-server/src/server.ts
packages/admin-server/src/contracts/schemas.ts
```

### Admin UI

Inspeccionar y extender:

```text
packages/admin/src/routes/Reports.tsx
packages/admin/src/routes/Knowledge.tsx
packages/admin/src/App.tsx
packages/admin/src/lib/api.ts
```

Crear componentes o una ruta específica para Consolidation cuando favorezca mantenibilidad.

No introducir un componente monolítico en `Reports.tsx`.

### Tests

Extender las pruebas pertinentes en:

```text
packages/admin-server/tests/
packages/admin/e2e/
```

Utilizar fixtures representativos con oportunidades de todas las categorías y estados de plan.

No depender exclusivamente de datos de producción o de archivos locales de un proyecto específico.

---

## 10. Out of Scope

No implementar:

- Aplicación automática de propuestas.
- Editor de conocimiento desde oportunidades.
- Persistencia de decisiones `incorporated` o `dismissed`.
- Comparación semántica ejecutada en Admin.
- Ejecución de agentes o llamadas LLM.
- Nuevas heurísticas de redundancia o Learning.
- Cambios en los contratos CLI/MCP existentes.
- Creación automática de Work Items.
- Scoring de calidad del conocimiento.
- Sistema de historiales de consolidación.
- Nuevas métricas de ahorro o productividad.
- Rediseño general de Reports o del sidebar.

---

## 11. Acceptance Criteria

- [x] AC-01: Knowledge Consolidation aparece como cuarta opción de Reports Explorer.
- [x] AC-02: la ruta `/reports/consolidation` y el acceso desde Knowledge funcionan.
- [x] AC-03: se puede visualizar un plan previamente generado sin recalcularlo.
- [x] AC-04: el Dashboard presenta las métricas y cobertura del plan correctamente.
- [x] AC-05: las oportunidades pueden buscarse, filtrarse y ordenarse.
- [x] AC-06: cada oportunidad muestra evidencia, clasificación, confidence, fuentes e impacto.
- [x] AC-07: las referencias a artifacts utilizan rutas existentes y seguras, con fallback copiable.
- [x] AC-08: se puede generar y regenerar explícitamente un plan utilizando un scope válido.
- [x] AC-09: la generación solo escribe las proyecciones derivadas permitidas.
- [x] AC-10: el estado stale se detecta y se presenta correctamente, incluyendo sus limitaciones.
- [x] AC-11: Markdown y JSON pueden exportarse sin recalcular ni mezclar snapshots.
- [x] AC-12: Copy Agent Handoff genera instrucciones completas, trazables y listas para revisión.
- [x] AC-13: no se ejecutan LLMs ni se aplican propuestas desde Admin.
- [x] AC-14: los endpoints cumplen los controles existentes de seguridad, sesión y validación.
- [x] AC-15: existen estados apropiados para plan ausente, vacío, stale, corrupto y error de generación.
- [x] AC-16: la UI mantiene compatibilidad con Light/Dark y resoluciones móviles.
- [x] AC-17: existen pruebas unitarias, de integración y E2E para los flujos críticos.
- [x] AC-18: la documentación de Admin y Knowledge Consolidation está actualizada en inglés y español.
- [x] AC-19: el dogfooding demuestra que `knowledge/` permanece intacto.
- [x] AC-20: la vista ha sido inspeccionada visualmente en local y aprobada antes de cualquier commit.

### UX Refinement (integrado en WI-073)

- [x] UX-01: seleccionar una oportunidad muestra inmediatamente su detalle en un drawer visible.
- [x] UX-02: el detalle ya no aparece al final de la colección.
- [x] UX-03: cerrar el drawer conserva filtros y posición de la lista.
- [x] UX-04: el drawer funciona correctamente en desktop y móvil (full-screen).
- [x] UX-05: controles accesibles — Escape, cierre, foco al abrir y restauración al cerrar, backdrop.
- [x] UX-06: las tarjetas presentan información resumida y escaneable (fuente + categoría + clasificación).
- [x] UX-07: guía "How to use Knowledge Consolidation" (colapsable, 3 pasos).
- [x] UX-08: las seis categorías tienen descripciones comprensibles (tooltip/ícono de info).
- [x] UX-09: classification, confidence y semantic review se explican ("Understanding findings").
- [x] UX-10: el drawer diferencia evidencia, impacto y siguiente acción en secciones legibles.
- [x] UX-11: Copy Agent Handoff conserva su funcionamiento.
- [x] UX-12: Reload y Regenerate se distinguen claramente en Coverage.
- [x] UX-13: los tests E2E verifican apertura, cierre (Escape), filtros y persistencia.
- [x] UX-14: estilos y componentes respetan Light/Dark y la identidad de Kaddo.

---

## 12. Validation Scenarios

### VS-01 — Plan existente

Dado un proyecto con Consolidation Plan generado:

- La vista carga correctamente.
- Presenta el scope y timestamp originales.
- No ejecuta el análisis al navegar.
- No modifica archivos.

### VS-02 — Plan inexistente

Dado un proyecto sin plan:

- Se presenta un Empty State.
- Se ofrece la acción Generate.
- No hay errores inesperados ni ejecución automática.

### VS-03 — Generación

Dado un alcance válido:

- Se ejecuta el builder Core.
- Se persisten las dos proyecciones.
- La vista presenta el nuevo plan.
- `knowledge/` permanece sin cambios.

### VS-04 — Staleness

Dado un plan cuyas fuentes han cambiado:

- Se muestra el estado stale.
- Se muestran las fuentes afectadas.
- El plan anterior continúa consultable.
- El usuario puede regenerarlo voluntariamente.

### VS-05 — Learning no incorporado

Dado un Work Item con Learning candidato:

- Se presenta la evidencia.
- El destino puede aparecer como unresolved.
- El handoff exige revisión semántica y aprobación.
- No se modifica el Work Item.

### VS-06 — Learning ya incorporado

Dado el caso real de WI-068, cuyo aprendizaje fue incorporado a `knowledge/tech/codebase.md`:

- El Explorer representa fielmente el candidato que Core pueda seguir produciendo.
- No afirma que el aprendizaje definitivamente está pendiente de incorporar.
- El handoff solicita verificar si ya existe en conocimiento vigente.
- No modifica el estado del candidato automáticamente.

### VS-07 — Redundancia potencial

Dado un par de artifacts con contenido compartido:

- Se muestra la evidencia del solapamiento.
- Se identifica como posible redundancia.
- No se presenta como duplicación semántica confirmada.

### VS-08 — Exportaciones

Dado un plan cargado:

- JSON y Markdown conservan el mismo alcance, evidencia y timestamp.
- Ninguna exportación recalcula el análisis.

### VS-09 — Seguridad

- Se rechaza un scope inválido.
- Se rechaza una operación POST sin controles de origen/sesión apropiados.
- No es posible leer archivos arbitrarios.
- Una generación fallida no sobrescribe irreversiblemente un plan válido.

### VS-10 — Visual Validation

Comprobar:

- Desktop.
- Mobile.
- Light theme.
- Dark theme.
- Filtros.
- Detalle.
- Empty State.
- Stale State.
- Agent Handoff.
- Generación y exportaciones.

---

## 13. Implementation Plan

### Phase 1 — API and Contracts

- Definir contratos de Consolidation Plan para Admin.
- Incorporar lectura del plan persistido.
- Incorporar staleness.
- Incorporar generación explícita con scope validado.
- Incorporar exportaciones.
- Crear pruebas de integración.

### Phase 2 — Reports Explorer

- Agregar navegación.
- Implementar Dashboard y métricas.
- Agregar distribución por categoría.
- Implementar filtros y búsqueda.
- Implementar Opportunity Detail.
- Conectar referencias navegables.

### Phase 3 — Agent Handoff

- Implementar generación de handoff.
- Incluir fuentes, evidencia y contexto.
- Incorporar Copy to Clipboard.
- Validar que el handoff no invente conclusiones o destinos.

### Phase 4 — Validation

- Ejecutar builds y tests.
- Ejecutar E2E.
- Probar con un plan real de Kaddo.
- Probar con un fixture representativo de Wasma.
- Validar integridad del conocimiento canónico.
- Revisar la UI en local.
- Actualizar documentación EN/ES.
- Presentar evidencia antes del commit.

---

## 14. Definition of Done

WI-073 estará listo para completar cuando:

1. Knowledge Consolidation sea navegable desde Admin.
2. Los planes puedan generarse, consultarse y exportarse.
3. Las oportunidades puedan explorarse individualmente.
4. La evidencia y las referencias sean visibles y comprensibles.
5. El estado de vigencia del plan esté representado correctamente.
6. Los handoffs puedan copiarse para revisión por agentes.
7. Core permanezca como única fuente de análisis determinístico.
8. No existan modificaciones automáticas del conocimiento.
9. Las pruebas y builds estén en verde.
10. La interfaz esté validada visualmente.
11. Se registre la evidencia de implementación y validación.

---

## 15. Commit Gate — Mandatory

**No realizar commit, push, tag ni release hasta recibir aprobación explícita.**

Antes de solicitar aprobación:

- Ejecutar builds y suite de pruebas.
- Levantar Kaddo Admin localmente.
- Generar y visualizar un Consolidation Plan real.
- Mostrar capturas de la vista principal, detalle, filtros y estado stale.
- Validar modo Light y Dark.
- Demostrar exportaciones y Copy Agent Handoff.
- Confirmar que `knowledge/` permanece sin modificaciones por el análisis.
- Presentar el listado de archivos modificados y el diff.
- Registrar resultados y limitaciones conocidas.

Detenerse al finalizar la validación local y presentar los resultados.

No cerrar el WI, crear release ni publicar cambios sin una nueva autorización explícita.

---

## Future Evolution

Una vez validado Knowledge Consolidation Explorer, considerar un WI separado para:

**Semantic Consolidation Review Workspace**

Esta evolución permitirá evaluar propuestas del agente, registrar decisiones humanas, identificar aprendizajes ya incorporados y preparar modificaciones trazables.

No implementar esta evolución como parte de WI-073.

## Guiding Principle

> Kaddo Admin debe hacer comprensibles las oportunidades de mejora del conocimiento, sin confundir evidencia determinística con conclusiones semánticas ni reemplazar la aprobación humana.

---

## Learning

Liberado en v3.130.0. Explorer de Knowledge Consolidation en Admin + refinamiento UX integrado.

- **Reutilizar la frontera determinística en una superficie nueva.** Admin solo lee/persiste las
  proyecciones derivadas (`.kaddo/consolidation-plan.{json,md}`) vía core-adapter; Core sigue siendo la
  única fuente de análisis. La persistencia atómica (serializar ambos strings antes de escribir, temp +
  rename) evita pares JSON/Markdown inconsistentes ante errores.
- **El bundle de Core stale es un riesgo real de validación en dev.** El `kaddo admin` usa una copia
  bundled de admin-server dentro de `cli/dist`; si no se reconstruye en orden (admin-server → cli) el
  server corre un Core viejo y los conteos divergen (se vio 114/72 vs 106/64). Con build completo fresco
  y restart, Admin y CLI coinciden exactamente. Lección: para validar paridad CLI/Admin, reconstruir
  todo y reiniciar el server antes de comparar.
- **UX: el detalle pertenece a un drawer, no al final de la página.** Mover el detalle a un panel lateral
  (full-screen en móvil) con foco gestionado, Escape y restauración de foco mejora la navegación sin
  perder scroll ni filtros. Las tarjetas se vuelven escaneables mostrando fuente + categoría +
  clasificación, y el detalle extenso vive en el drawer.
- **Explicabilidad sin cambiar el modelo.** Guía de uso, tooltips de categoría y "Understanding findings"
  comunican qué es cada señal (observed vs suggested vs semantic review vs confidence) sin presentar
  ninguna categoría como defecto confirmado y sin tocar reglas de clasificación.
- **Reload ≠ Regenerate.** Separar "re-leer el plan guardado" de "re-ejecutar el análisis" evita que el
  usuario crea que son equivalentes.

**Conocimiento a vigilar:** el Explorer es de exploración/preparación; la evolución (Semantic
Consolidation Review Workspace) queda fuera de alcance. No se persiste estado `incorporated/dismissed`
ni se ejecutan agentes desde Admin.
