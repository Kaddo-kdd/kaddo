---
type: feature
id: WI-064
title: >-
  Incorporar Reports Explorer en Kaddo Admin para visualizar Impact, Drift y
  Savings
status: completed
work_type: feature
created_at: '2026-10-12'
source:
  type: external
  imported_at: '2026-10-12'
  source_format: markdown-frontmatter
  source_hash: 100507cb7ee4c3e5ec6112a751e04d757855838b7bd96fa18fb63c31d38e5667
  inferred: false
generated_by: kaddo-admin
knowledge_level: K2
domains:
  - Product
  - Tech
  - Delivery
scope_confidence:
  level: high
affected_modules:
  - packages/cli/src/core.ts
  - packages/cli/src/core/impact-report.ts
  - packages/cli/src/core/drift-report.ts
  - packages/cli/src/core/savings.ts
  - packages/admin-server/src/core-adapter.ts
  - packages/admin-server/src/server.ts
  - packages/admin-server/src/contracts/schemas.ts
  - packages/admin/src/App.tsx
  - packages/admin/src/components/Sidebar.tsx
  - packages/admin/src/lib/api.ts
  - packages/admin/src/routes/Reports.tsx
  - packages/admin-server/tests/reports.test.ts
code:
  - packages/cli/src/core.ts
  - packages/admin-server/src/core-adapter.ts
  - packages/admin-server/src/server.ts
  - packages/admin-server/src/contracts/schemas.ts
  - packages/admin/src/App.tsx
  - packages/admin/src/components/Sidebar.tsx
  - packages/admin/src/lib/api.ts
  - packages/admin/src/routes/Reports.tsx
  - packages/admin-server/tests/reports.test.ts
summary: >-
  Incorporar Reports Explorer en Kaddo Admin para visualizar Impact, Drift y
  Savings
original_snapshot:
  title: >-
    Incorporar Reports Explorer en Kaddo Admin para visualizar Impact, Drift y
    Savings
  type: feature
  status: draft
ready_at: '2026-10-12'
completed_at: '2026-10-12'
---

# Incorporar Reports Explorer en Kaddo Admin

## Intent

Kaddo dispone de tres reportes consolidados:

- Knowledge Impact Report
- Drift Trend Report
- Estimated Savings Report

Estos reportes se generan mediante CLI y MCP, utilizan contratos Core determinísticos y permiten evaluar conocimiento, consistencia y beneficios estimados.

Actualmente no existe una sección centralizada en Kaddo Admin para explorarlos visualmente.

Se necesita incorporar una sección Reports que permita a usuarios técnicos y no técnicos comprender los resultados, explorar hallazgos, consultar evidencia y exportar los reportes sin ejecutar comandos manualmente.

## Expected Outcome

El usuario podrá:

1. Acceder a Reports desde el sidebar de Admin.
2. Seleccionar Impact, Drift o Savings.
3. Consultar indicadores y hallazgos mediante una interfaz visual.
4. Explorar información detallada y evidencia.
5. Actualizar el reporte con datos del proyecto actual.
6. Exportarlo en Markdown o JSON.
7. Navegar hacia los artifacts relacionados cuando existan rutas disponibles.

Admin debe representar los resultados calculados por Core, no reinterpretarlos mediante reglas propias.

---

## 1. Navigation

Agregar una nueva entrada en el sidebar:

```text
Overview
Knowledge
Work Items
Initiatives
Resources
Deprecations
System
Reports
Integrations
External Items
```

Usar un icono Lucide coherente con la identidad del Admin.

Rutas sugeridas:

```text
/reports
/reports/impact
/reports/drift
/reports/savings
```

Las rutas deben permitir navegación directa y conservar la selección del usuario.

---

## 2. Reports Landing

Crear una vista inicial con tres opciones:

### Impact Report

Description:
Knowledge coverage, delivery evidence, traceability and actionable findings.

### Drift Report

Description:
Current consistency findings, Guard history and knowledge drift trends.

### Savings Report

Description:
Estimated delivery value, assumptions, confidence and projections.

No utilizar emojis ni estilos visuales ajenos al design system de Kaddo.

No calcular obligatoriamente los tres reportes al abrir la página: permitir carga bajo demanda.

---

## 3. Impact Dashboard

Representar visualmente:

### Executive Summary

- Completed Work Items.
- Validation passed.
- Validation pending / not recorded.
- Ownership coverage.
- Graph quality.
- Current actionable findings.

### Delivery Evidence

Mostrar distribución de estados de validación con gráficos compactos y accesibles.

No interpretar `not recorded` como failed.

### Knowledge Health

Mostrar Business, Product, Tech y Delivery según aplicabilidad y madurez declarada.

### Key Findings

Tabla navegable con:

- Classification.
- Priority.
- Status.
- Source.
- Affected artifact.
- Explanation.
- Suggested action.

Agregar filtros locales por clasificación y prioridad.

### Additional Details

Incluir las métricas de Graph, trazabilidad, coverage y completitud histórica.

El legacy score debe aparecer únicamente como indicador deprecado, sin protagonismo visual.

Mantener acceso al reporte detallado.

---

## 4. Drift Dashboard

Representar:

### Current Findings

- Consistency violations.
- Coverage gaps.
- Review hints.
- Historical drift.

Separar claramente findings actuales de tendencias históricas.

### Findings Explorer

Tabla o lista con:

- Classification.
- Priority.
- Source.
- Affected artifacts.
- Evidence.
- Suggested action.

### Guard History

Cuando exista historial:

- Recorded runs.
- Open / resolved findings.
- Trend direction.
- Hotspots.
- Available observation period.

Cuando no exista:

```text
No Guard history recorded.

Run:
kaddo guard --record
```

No representar una gráfica de tendencia con datos inexistentes.

### Deprecation Consistency

Mostrar:

- Plans discovered.
- Plans evaluated.
- Plans without targets.
- Structural findings.

Preservar la distinción entre validación estructural y verificación operativa.

---

## 5. Savings Dashboard

Presentar dos resultados separados:

### Historical Estimate

- Estimated hours.
- Estimated monetary value.
- Assumptions source.
- Confidence.

### Monthly Projection

- Projected hours per month.
- Projected monetary value.
- Scenario assumptions.

No sumar valores correspondientes a horizontes distintos.

### Estimate Breakdown

Presentar componentes como:

- Context preparation.
- Review effort.
- Clarification reduction.
- Onboarding.
- Architecture discovery.
- Drift prevention.

Cada componente debe mostrar su fórmula y evidencia disponible.

### Calibration

Mostrar:

- Default/custom assumptions.
- Calibrated/uncalibrated state.
- Calibration opportunities.
- Limitations.

Incluir una advertencia visible de que los resultados estimados no constituyen ahorros medidos ni ROI comprobado.

No implementar edición de `.kaddo/savings.yml` desde Admin en este WI.

---

## 6. Admin Server Integration

Exponer los builders existentes mediante el Core público de Kaddo.

Puntos de partida:

```text
buildImpactReport()
buildDriftReport()
buildSavingsReport()
```

Verificar y agregar los exports necesarios en:

```text
packages/cli/src/core.ts
```

Actualmente los builders existen en los módulos internos, pero deben estar disponibles a Admin a través del contrato público.

Crear endpoints de solo lectura:

```http
GET /api/v1/admin/reports/impact
GET /api/v1/admin/reports/drift
GET /api/v1/admin/reports/savings
```

Soportar únicamente los parámetros que aplican a cada reporte.

Por ejemplo:

```text
Impact:
scope=all|active

Savings:
scope=all|active

Drift:
sin scope adicional mientras Core no lo soporte
```

Permitir exportación en JSON y Markdown mediante una representación o endpoint controlado.

Reglas:

- Usar el proyecto activo del Admin Server.
- No aceptar rutas arbitrarias del filesystem.
- No ejecutar procesos shell para generar reportes.
- No duplicar cálculos dentro del backend Admin.
- Preservar las validaciones de sesión y origen existentes.
- Mantener los endpoints de consulta sin efectos secundarios.
- No escribir archivos automáticamente al consultar o actualizar un reporte.

---

## 7. Report Refresh

Agregar una acción:

```text
Refresh report
```

Esta acción debe recalcular el reporte seleccionado a partir del estado actual del proyecto.

No confundir `Refresh` con persistir una nueva versión histórica.

Mostrar:

- Generated at.
- Project.
- Mode/state.
- Scope, cuando aplique.

Evitar recalcular los tres reportes simultáneamente por cada navegación.

Usar React Query con claves que incorporen el tipo de reporte y sus parámetros.

---

## 8. Export

Permitir exportación de:

```text
Markdown
JSON
```

Reutilizar los renderizadores y serializadores Core.

El archivo exportado debe conservar la misma semántica del reporte consultado, incluyendo scope y nivel de detalle cuando corresponda.

La exportación debe permitir una descarga desde el navegador sin escribir necesariamente en `.kaddo/reports/`.

No introducir exportación PDF en este WI.

---

## 9. Drill-down and Navigation

Cuando existan relaciones válidas, permitir navegar desde un finding hacia:

- Work Item detail.
- Knowledge artifact.
- Project Resource.
- Deprecation Plan.
- System Map.

Ejemplo:

```text
Impact
  ↓
Finding: WI-061 missing ownership
  ↓
Open WI-061
```

No crear enlaces a pantallas o artifacts inexistentes.

Los findings sin una ruta resoluble deben conservar su explicación y referencia textual.

---

## 10. Visual Design

La nueva sección debe respetar la identidad visual actual de Kaddo Admin.

Reutilizar:

- Colores y tokens existentes.
- Tipografía.
- Cards.
- Tablas.
- Estados vacíos.
- Badges semánticos.
- Iconografía Lucide.
- MarkdownRenderer, cuando sea apropiado.

Preferir visualizaciones pequeñas y orientadas a interpretación.

Evitar:

- Dashboards recargados.
- Emojis decorativos.
- Gráficas sin evidencia.
- Puntuaciones de impacto inventadas.
- Indicadores financieros presentados como ahorros demostrados.
- Duplicación completa del Markdown dentro de cada tarjeta.

La vista estructurada debe ser la experiencia principal; el Markdown completo puede ofrecerse como vista secundaria.

---

## 11. Loading and Empty States

Manejar:

- Loading.
- Refreshing.
- Error.
- No Work Items.
- No Graph evidence.
- No Guard history.
- No Savings calibration.
- Not Applicable.
- Unknown.

Un estado sin datos no debe representarse automáticamente como cero o como un proyecto saludable.

---

## 12. Compatibility

Mantener intactos:

```bash
kaddo impact
kaddo drift
kaddo savings
```

Y sus recursos/herramientas MCP.

Admin es una nueva interfaz sobre los mismos reportes.

No convertir Admin en una fuente de verdad adicional.

---

## Out of Scope

- Modificar fórmulas de Impact, Drift o Savings.
- Crear nuevos indicadores de productividad.
- Implementar historial persistente de reportes.
- Generar reportes automáticamente mediante cron.
- Ejecutar Guard desde Admin.
- Editar savings.yml.
- Crear dashboards en servicios cloud.
- Integrar servicios de BI externos.
- Exportar PDF.
- Introducir LLM para interpretar o recalcular indicadores.
- Agregar almacenamiento nuevo.

---

## Acceptance Criteria

- [x] AC-01: Reports aparece en el sidebar y permite acceder a las tres vistas.
- [x] AC-02: Impact, Drift y Savings utilizan los builders Core existentes.
- [x] AC-03: Admin Server expone contratos de consulta seguros y tipados.
- [x] AC-04: Impact presenta delivery evidence, knowledge health y findings accionables.
- [x] AC-05: Drift distingue findings actuales de tendencias históricas y respeta estados Unknown.
- [x] AC-06: Savings separa estimación histórica y proyección mensual y muestra confianza y supuestos.
- [x] AC-07: Los datos representados son consistentes con CLI/MCP para el mismo proyecto y scope.
- [x] AC-08: El usuario puede actualizar individualmente cada reporte.
- [x] AC-09: El usuario puede exportar el reporte en Markdown y JSON.
- [x] AC-10: Los findings permiten navegación hacia artifacts existentes cuando sea posible.
- [x] AC-11: Las vistas funcionan en light/dark mode y distintos tamaños de pantalla.
- [x] AC-12: Loading, error, Unknown y Not Applicable tienen estados visuales apropiados.
- [x] AC-13: La navegación y los cálculos no modifican artifacts canónicos ni generan archivos sin solicitud explícita.
- [x] AC-14: Existen pruebas de integración Admin Server/Core y pruebas de visualización para estados importantes.
- [x] AC-15: La documentación de Admin se actualiza en EN/ES.
- [x] AC-16: La interfaz se ejecuta y revisa localmente antes de aprobar su commit.

---

## Validation

Probar con el propio proyecto Kaddo.

Datos de referencia de la última ejecución:

```text
54 completed WIs
22 validation passed
7 Graph hints
6 coverage gaps
1 review hint
2 Deprecation Plans
No Guard history
Savings confidence: Low
```

Comprobar que Admin refleja esos resultados cuando el proyecto conserva el mismo estado.

También probar:

1. Proyecto nuevo sin Work Items.
2. Proyecto POC con capas opcionales.
3. Proyecto Legacy con Deprecations.
4. Proyecto con Guard history.
5. Proyecto sin supuestos Savings calibrados.
6. Exportaciones Markdown y JSON.
7. Navegación entre findings y artifacts.
8. Cambio de scope cuando corresponda.

La comparación debe considerar el mismo snapshot lógico del proyecto, ya que un cambio en los artifacts puede modificar los totales.

---

## Implementation Guidance

Archivos principales:

```text
packages/admin/src/App.tsx
packages/admin/src/components/Sidebar.tsx
packages/admin/src/lib/api.ts

packages/admin-server/src/server.ts
packages/admin-server/src/core-adapter.ts
packages/admin-server/src/contracts/schemas.ts

packages/cli/src/core.ts

packages/cli/src/core/impact-report.ts
packages/cli/src/core/drift-report.ts
packages/cli/src/core/savings.ts
```

Crear componentes para Reports dentro de la estructura actual de Admin.

No modificar los builders salvo que sea indispensable para exponer correctamente sus contratos públicos.

## Refinement Notes

- `@kaddo/cli/core` ya es el contrato público que consume Admin Server; los builders y sus tipos
  se expondrán desde ese módulo, sin shelling-out ni acceso a rutas arbitrarias.
- Admin Server debe adaptar y validar la respuesta con schemas Zod antes de entregarla a la UI;
  los endpoints de reportes serán `GET` y la actualización será una invalidación/refetch local,
  nunca una escritura de artefactos.
- Admin ya usa TanStack Router y React Query. Las rutas `/reports`, `/reports/impact`,
  `/reports/drift` y `/reports/savings` conservarán navegación directa; cada query incluirá el
  tipo de reporte y el scope aplicable.
- Las exportaciones se construirán en memoria con los renderizadores/serializadores Core y se
  descargarán desde el navegador; no deberán crear archivos bajo `.kaddo/reports/`.
- La navegación desde hallazgos se habilitará únicamente para identificadores con ruta existente
  (por ejemplo Work Items, Resources y Deprecation Plans); las demás referencias serán texto.
- La validación incluirá pruebas Admin Server para los tres contratos, pruebas de UI para estados
  loading/error/unknown y una revisión local en light, dark y ancho reducido.

## Definition of Done

- Reports integrado en Admin.
- Impact, Drift y Savings navegables visualmente.
- Evidencia y findings interpretados correctamente.
- Exportaciones funcionales.
- Tests aprobados.
- Documentación actualizada.
- Consistencia verificada con los outputs CLI.
- UI revisada localmente en light/dark y responsive.
- Implementation Evidence registrada.

## Commit Gate

No realizar commit ni push automáticamente al finalizar la implementación.

Primero:

1. Ejecutar build y tests.
2. Levantar Kaddo Admin localmente.
3. Revisar visual y funcionalmente Reports.
4. Presentar el resultado para revisión humana antes de un commit.

## Implementation Evidence

- Se expusieron los builders y renderizadores públicos de Impact, Drift y Savings desde
  `@kaddo/cli/core`; Admin Server los usa directamente, sin shell ni escrituras de reportes.
- Reports añade rutas directas, carga bajo demanda con React Query, refresh individual, exportación
  Markdown/JSON en memoria y enlaces únicamente para IDs navegables de Work Items, Resources y
  Deprecation Plans.
- La interfaz distingue validaciones pendientes/no registradas, falta de Guard history, verificación
  estructural de deprecations y estimaciones de Savings de métricas medidas.
- Se corrigió el orden de registro de rutas estáticas para que el fallback SPA no capture
  `/api/v1/admin/reports/*`.

## Validation Results

- Build: `pnpm --filter @kaddo/admin build` y `pnpm --filter @kaddo/cli build` exitosos.
- Tests: `packages/admin-server/tests/reports.test.ts` y
  `packages/admin/tests/work-items-presentation.test.ts` — 18 pruebas aprobadas.
- Revisión local: `kaddo admin --port 4174 --no-open`; Impact, Drift y Savings devolvieron datos
  de `kaddo`, con exportación, navegación y temas System/Light/Dark comprobados.
- Visualizaciones: se añadieron gráficos compactos y accesibles para distribución de validación,
  clasificación de findings, actividad Guard disponible y períodos separados de Savings; la
  revisión local confirmó su presencia y mantuvo el tema del sistema como selección final.
