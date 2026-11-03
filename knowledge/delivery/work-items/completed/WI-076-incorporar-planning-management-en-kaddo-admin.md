---
type: feature
id: WI-076
title: Incorporar Planning Management en Kaddo Admin
status: completed
work_type: feature
created_at: '2026-11-03'
source:
  type: external
  imported_at: '2026-11-03'
  source_format: kaddo-frontmatter
  source_hash: 222caf995d8f66d815f5ac1ce4dad0e0fff6e98c40de8de27ed65a5981d2cabe
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
antecedent: 'WI-074, WI-075'
scope_confidence:
  level: high
  reasons:
    - >-
      Delivery Plans, Epics e Initiatives ya cuentan con modelos canónicos en
      Core.
    - >-
      Core dispone de operaciones para crear Plans y Epics y asociar
      Initiatives.
    - >-
      Admin cuenta con Unified Planning Explorer y patrones de creación de
      Initiatives.
    - >-
      Las operaciones de edición faltantes pueden incorporarse reutilizando los
      contratos de lectura y escritura existentes.
    - >-
      La desvinculación Initiative–Epic ya es posible en Core vía
      updateInitiative({ epic: null }); solo falta exponerla y envolverla.
summary: >-
  Permitir la creación y gestión visual de Delivery Plans y Epics desde Kaddo
  Admin, incluyendo edición de objetivos, milestones, criterios, dependencias y
  asociaciones entre Initiatives y Epics, con validación, confirmación humana y
  persistencia mediante Core, sin duplicar la fuente de verdad.
original_snapshot:
  title: Incorporar Planning Management en Kaddo Admin
  description: >-
    WI-074 incorporó Delivery Plans y Epics como entidades canónicas de
    planificación.
  type: feature
  status: draft
ready_at: '2026-11-03'
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/delivery-planning.ts
        - packages/cli/src/core/delivery-planning-write.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/delivery-planning-management.test.ts
      validations:
        - command: >-
            pnpm vitest run
            packages/cli/tests/delivery-planning-management.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/src/server.ts
        - packages/admin-server/src/contracts/schemas.ts
        - packages/admin-server/tests/planning-management.test.ts
      validations:
        - command: >-
            pnpm vitest run
            packages/admin-server/tests/planning-management.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin-server build
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/lib/api.ts
        - packages/admin/src/components/PlanningManage.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/routes/InitiativeDetail.tsx
        - packages/admin/e2e/planning-management.spec.ts
        - >-
          packages/admin/e2e/fixtures/project/knowledge/delivery/initiatives/INI-052.md
      validations:
        - command: >-
            pnpm --filter @kaddo/admin exec playwright test planning.spec.ts
            planning-management.spec.ts
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
verified_at: '2026-11-03'
completed_at: '2026-11-03'
released_in: v3.133.0
---

# WI-076 — Planning Management in Kaddo Admin

## 1. Context

WI-074 incorporó Delivery Plans y Epics como entidades canónicas de planificación.

WI-075 unificó la experiencia de Planning en Admin, integrando:

- Overview.
- Delivery Plans.
- Epics.
- Initiatives.

Actualmente, los usuarios pueden explorar la planificación y consultar el progreso de los elementos asociados.

Sin embargo, las acciones de creación y gestión no están disponibles de forma consistente desde Admin.

Las Initiatives pueden crearse visualmente, mientras que Delivery Plans y Epics requieren CLI o herramientas MCP.

Core ya dispone de:

- `createDeliveryPlan`.
- `createEpic`.
- `associateInitiativeWithEpic`.

Las operaciones de edición estructurada de Plans y Epics todavía necesitan incorporarse.

## 2. Problem

Los usuarios de Kaddo Admin no pueden construir y mantener un Delivery Plan completo desde la interfaz visual.

Para realizar operaciones como crear un Plan, crear una Epic o asociar una Initiative, deben utilizar CLI o solicitarlo a un agente.

Además, después de crear un Plan o Epic, las opciones actuales de Core no permiten editar estructuradamente todos los elementos necesarios para su gestión.

Esta fragmentación dificulta la adopción de Planning por personas que prefieren trabajar desde Admin.

## 3. Expected Outcome

El usuario podrá:

1. Crear Delivery Plans desde Admin.
2. Crear Epics independientes o asociadas a un Plan.
3. Editar objetivos, resultados y criterios de éxito.
4. Crear, editar y eliminar milestones dentro de un Plan.
5. Configurar dependencias entre Epics.
6. Asociar y reasociar Initiatives a Epics existentes.
7. Retirar una asociación Initiative–Epic cuando corresponda.
8. Consultar las consecuencias de una modificación antes de confirmarla.
9. Visualizar inmediatamente los cambios en Planning.
10. Mantener coherencia con CLI y MCP mediante la misma fuente canónica.

Todas las operaciones deben reutilizar Core.

---

# 4. Delivery Plan Management

## 4.1 Create Delivery Plan

Incorporar el botón:

**+ Create Plan**

Ubicaciones:

- Planning Overview.
- Pestaña Delivery Plans.
- Empty State cuando no existen Plans.

Abrir un formulario mediante modal o drawer, siguiendo el Design System de Kaddo.

Campos iniciales:

| Campo | Obligatorio |
|---|---|
| Title | Sí |
| Objective | No |

El estado inicial será `draft`, utilizando el contrato de Core.

El ID se genera automáticamente mediante `nextPlanId`.

No permitir introducir manualmente el ID ni la ruta del archivo.

Antes de crear, mostrar un resumen de la operación.

Después de confirmar:

- Invocar Admin Server.
- Delegar en `createDeliveryPlan`.
- Actualizar las consultas relacionadas.
- Navegar al detalle del Plan creado.
- Mostrar su estado y próximas acciones disponibles.

## 4.2 Edit Delivery Plan

En Plan Detail agregar:

**Edit Plan**

Permitir modificar:

- Title.
- Objective.
- Success criteria.
- Risks.
- Dependencies.
- References.

Mantener el ID y las relaciones existentes.

No modificar automáticamente las Epics asociadas.

Las actualizaciones deben preservar frontmatter y contenido Markdown que no forme parte de los campos editados.

No reemplazar el documento completo por una representación parcial generada desde el formulario.

## 4.3 Milestone Management

Agregar una sección administrable dentro de Plan Detail.

Acciones:

- Add Milestone.
- Edit Milestone.
- Remove Milestone.

Campos:

```yaml
id: RM-01
title: Foundation
exit_criteria:
  - Architecture baseline approved
  - Initial delivery verified
```

Reglas:

- Los IDs son únicos dentro del Plan.
- No se exige unicidad global.
- Los criterios de salida son editables.
- El orden de presentación debe conservarse.
- No se crea un artifact independiente por milestone.

Si se intenta eliminar o modificar el ID de un milestone referenciado por una Epic:

- Identificar las Epics afectadas.
- Mostrar una advertencia.
- Impedir que queden referencias inválidas.
- No reasignar automáticamente la Epic.

No introducir estado de lifecycle independiente para milestones.

---

# 5. Epic Management

## 5.1 Create Epic

Incorporar:

**+ Create Epic**

Disponible desde:

- Planning Overview.
- Pestaña Epics.
- Plan Detail.

Campos:

| Campo | Obligatorio |
|---|---|
| Title | Sí |
| Expected outcome | No |
| Related Plan | No |
| Milestone | No |

El Plan se selecciona mediante un selector de Plans existentes.

El milestone únicamente estará disponible si se ha seleccionado un Plan que tenga milestones.

El usuario puede crear una Epic independiente.

El estado inicial será `planned`.

Core generará automáticamente su ID mediante `nextEpicId`.

La creación debe reutilizar `createEpic`.

## 5.2 Edit Epic

En Epic Detail agregar:

**Edit Epic**

Permitir modificar:

- Title.
- Expected outcome.
- Related Plan.
- Milestone.
- Success criteria.
- Dependencies.
- Related capabilities.
- Related decisions.

Las dependencias deben seleccionarse entre Epics existentes.

Validar referencias y evitar ciclos.

Cuando el usuario cambie el Plan relacionado, verificar que el milestone siga perteneciendo al Plan seleccionado.

Si no corresponde, solicitar una nueva selección antes de guardar.

No eliminar ni modificar automáticamente las Initiatives y Work Items asociados.

No cambiar el lifecycle durante una edición de metadatos.

---

# 6. Initiative ↔ Epic Association

Actualmente la asociación existe en Core, pero no está disponible visualmente en Admin.

Agregar acciones de gestión de asociaciones.

## 6.1 Associate Initiative

En Epic Detail incorporar:

**+ Associate Initiative**

Mostrar un selector de Initiatives existentes.

Priorizar visualmente las Initiatives sin Epic.

Permitir buscar por:

- ID.
- Title.
- Status.

Antes de confirmar, mostrar:

- Initiative seleccionada.
- Epic destino.
- Asociación anterior, si existe.
- Consecuencia esperada sobre la organización del trabajo.

La asociación debe reutilizar `associateInitiativeWithEpic`.

El campo canónico permanece en `initiative.epic`.

No crear una lista paralela de Initiatives dentro de Epic.

## 6.2 Reassign Initiative

Si una Initiative ya pertenece a otra Epic, permitir solicitar una reasignación explícita.

Mostrar:

```text
Current Epic: EP-001
New Epic: EP-002
```

Requerir confirmación.

No interpretar la reasignación como un cambio de lifecycle.

No modificar automáticamente Work Items.

Antes de aplicar, validar que las relaciones resultantes sean consistentes.

## 6.3 Remove Association

Permitir desvincular una Initiative de su Epic actual.

La operación debe:

- Eliminar únicamente la relación `initiative.epic`.
- Conservar la Initiative.
- Conservar sus Work Items.
- Preservar owners y contributors.
- Mantener el lifecycle original.

Si Core no dispone de una operación explícita de desvinculación, implementarla reutilizando el mecanismo de actualización de Initiatives, con validación y sin sobrescribir otros campos.

## 6.4 Initiative Detail

Incorporar una sección:

**Planning Context**

Mostrar:

- Epic asociada, cuando exista.
- Plan derivado de esa Epic.
- Milestone, cuando corresponda.
- Acción para asociar, cambiar o retirar la asociación.

No mostrar asociaciones inexistentes.

---

# 7. Core Integration

## 7.1 Existing Operations

Reutilizar:

```typescript
createDeliveryPlan()
createEpic()
associateInitiativeWithEpic()
```

No implementar escrituras directas a Markdown desde Admin Server.

## 7.2 Required Core Extensions

Incorporar operaciones de actualización controlada cuando sean necesarias:

```typescript
updateDeliveryPlan()
updateEpic()
```

Estas operaciones deben:

- Validar IDs y referencias.
- Preservar metadatos desconocidos.
- Preservar secciones Markdown no editadas.
- Evitar sobrescrituras accidentales.
- Mantener compatibilidad con artifacts existentes.
- No modificar entidades relacionadas silenciosamente.
- Reutilizar las reglas de `validatePlanningGraph`.

Separar edición de metadatos y transiciones de lifecycle.

No introducir nuevos estados ni alterar las transiciones existentes.

## 7.3 Concurrency and Data Integrity

Las escrituras deben contemplar modificaciones concurrentes entre CLI, Admin, agentes o ediciones manuales.

Utilizar una revisión o fingerprint del artifact para prevenir sobrescrituras de documentos modificados desde su lectura.

Ante conflicto, informar al usuario y permitir recargar.

No guardar silenciosamente una versión obsoleta del formulario.

---

# 8. Admin Server

Agregar endpoints de escritura al API de Planning existente.

Contrato propuesto:

```http
POST  /api/v1/admin/planning/plans
PATCH /api/v1/admin/planning/plans/:id

POST  /api/v1/admin/planning/epics
PATCH /api/v1/admin/planning/epics/:id

POST   /api/v1/admin/planning/epics/:id/initiatives
DELETE /api/v1/admin/planning/epics/:id/initiatives/:initiativeId
```

La reasignación puede reutilizar la operación de asociación con confirmación explícita.

Los endpoints de Plan y Epic deben soportar actualizaciones de milestones y criterios mediante sus contratos tipados.

## Validation

Agregar schemas Zod para:

- Create Plan.
- Update Plan.
- Milestone.
- Create Epic.
- Update Epic.
- Initiative Association.

No aceptar rutas de archivos desde el cliente.

Mantener:

- Session validation.
- Same-origin/CSRF.
- Input validation.
- Errores estructurados.
- Uso de Core Adapter.

No duplicar la lógica de negocio.

---

# 9. Planning UI

## 9.1 Navigation

Conservar la estructura de WI-075:

```text
Planning
├── Overview
├── Delivery Plans
├── Epics
└── Initiatives
```

No crear otra entrada de sidebar.

## 9.2 Actions

| Vista | Acción |
|---|---|
| Overview | Create Plan / Create Epic |
| Delivery Plans | Create Plan |
| Plan Detail | Edit Plan / Manage Milestones / Create Epic |
| Epics | Create Epic |
| Epic Detail | Edit Epic / Associate Initiative |
| Initiative Detail | Manage Epic Association |

## 9.3 Interaction Patterns

Preferir drawers o modales para operaciones simples.

Para formularios largos, utilizar secciones agrupadas que permitan editar sin saturar la pantalla.

Mantener visibles:

- Save.
- Cancel.
- Validation errors.

Mostrar confirmación antes de reasignaciones, desvinculaciones o eliminación de milestones referenciados.

Actualizar automáticamente la vista después de guardar, sin necesidad de recargar la página completa.

## 9.4 Empty States

Cuando no existan Plans:

**No Delivery Plans yet**

"Delivery Plans organize milestones and Epics. They are optional — you can start with Initiatives or create a Plan to organize a larger roadmap."

Acción: **Create Plan**

Cuando no existan Epics:

**No Epics yet**

"Epics organize related Initiatives and Work Items around a larger outcome."

Acción: **Create Epic**

Cuando un Epic no tenga Initiatives:

**No Initiatives associated**

Acción: **Associate Initiative**

No forzar la creación de la jerarquía completa.

---

# 10. Human Control and Lifecycle

La gestión visual no debe modificar las reglas actuales de aprobación humana.

Este WI permite crear y editar elementos de planificación y sus asociaciones.

No implementar el cierre automático de Plans o Epics.

Las condiciones de Completion Readiness continúan calculándose en Core.

El estado de un Epic no cambia automáticamente cuando se completan sus Work Items.

Las dependencias tampoco modifican el lifecycle de otras entidades.

Las transiciones de estado de Plans y Epics quedan fuera de esta primera versión de gestión visual, salvo que exista un contrato de transición explícito y aprobado por separado.

---

# 11. Compatibility

Preservar:

- Plan y Epic Core.
- CLI `kaddo plan` y `kaddo epic`.
- MCP planning tools.
- Initiative lifecycle.
- Work Item lifecycle.
- Knowledge Graph.
- Asociaciones opcionales.
- Contratos de WI-074.
- Unified Planning Experience de WI-075.

Los artifacts creados desde Admin deben ser legibles por CLI/MCP y viceversa.

No crear metadatos exclusivos de Admin.

No introducir una base de datos de planificación.

---

# 12. Out of Scope

No implementar:

- Git Collaboration Evidence.
- Asignación automática de responsables.
- Generación de Epics mediante IA.
- Planes creados automáticamente desde Roadmap.
- Ejecución autónoma del roadmap.
- Eliminación de Plans o Epics completos.
- Nuevos estados de lifecycle.
- Cierre automático.
- Gantt.
- Kanban.
- Drag-and-drop para reorganización.
- Importación masiva de roadmap.
- Gestión de usuarios.
- Integraciones externas.
- Migraciones automáticas de iniciativas existentes.

---

## Acceptance Criteria

- [x] AC-01: es posible crear Delivery Plans desde Admin.
- [x] AC-02: es posible crear Epics independientes o asociadas a un Plan.
- [x] AC-03: los formularios validan campos y referencias antes de persistir.
- [x] AC-04: Plan Detail permite editar objetivos, criterios, riesgos y referencias.
- [x] AC-05: Plan Detail permite agregar, editar y retirar milestones.
- [x] AC-06: un milestone referenciado no puede eliminarse silenciosamente.
- [x] AC-07: Epic Detail permite editar resultado, criterios, dependencias y relaciones.
- [x] AC-08: las dependencias inválidas o circulares son rechazadas.
- [x] AC-09: el usuario puede asociar una Initiative a una Epic desde Admin.
- [x] AC-10: el usuario puede reasignar una Initiative con confirmación explícita.
- [x] AC-11: el usuario puede retirar una asociación sin eliminar la Initiative ni sus Work Items.
- [x] AC-12: Initiative Detail presenta su contexto de Planning y las acciones correspondientes.
- [x] AC-13: todas las mutaciones reutilizan Core; Admin no escribe directamente artifacts.
- [x] AC-14: los archivos conservan su contenido y metadatos no editados.
- [x] AC-15: se previenen sobrescrituras por modificaciones concurrentes.
- [x] AC-16: los cambios aparecen inmediatamente en Planning Overview y vistas de detalle.
- [x] AC-17: CLI/MCP pueden leer correctamente los artifacts creados y editados desde Admin.
- [x] AC-18: no existen modificaciones automáticas del lifecycle.
- [x] AC-19: proyectos sin Plans ni Epics siguen funcionando.
- [x] AC-20: existen pruebas Core, Admin Server y E2E para los flujos de creación, edición y asociación.
- [x] AC-21: los formularios funcionan en Light/Dark y dispositivos móviles.
- [x] AC-22: documentación EN/ES actualizada.
- [x] AC-23: implementación validada localmente antes de cualquier commit.

---

# 14. Validation Scenarios

## VS-01 — Create Plan

Crear un Delivery Plan desde Admin.

Verificar:

- Artifact canónico creado.
- ID automático.
- Status `draft`.
- Visible en Planning.
- Legible mediante CLI.

## VS-02 — Create Epic

Crear una Epic asociada a un Plan y milestone existentes.

Verificar:

- Referencias válidas.
- Estado inicial `planned`.
- Navegación desde el Plan.
- Compatibilidad MCP.

## VS-03 — Invalid Milestone

Intentar crear o editar una Epic con un milestone que no pertenece al Plan.

Resultado esperado: operación rechazada sin modificar artifacts.

## VS-04 — Edit Plan

Actualizar objetivo, criterios y milestones.

Verificar preservación del contenido ajeno a los campos editados.

## VS-05 — Referenced Milestone

Intentar eliminar un milestone utilizado por una Epic.

Resultado esperado: advertencia y operación rechazada sin reasignación explícita.

## VS-06 — Edit Epic

Modificar outcome, criterios y dependencias.

Verificar validación de referencias y ciclos.

## VS-07 — Associate Initiative

Asociar una Initiative existente a una Epic.

Verificar:

- Relación registrada en `initiative.epic`.
- Epic Detail actualizado.
- Initiative Detail actualizado.
- Work Items sin cambios.

## VS-08 — Reassign Initiative

Mover una Initiative de EP-001 a EP-002.

Verificar:

- Confirmación explícita.
- Desaparición de la asociación anterior.
- Aparición de la nueva asociación.
- Sin alteraciones del lifecycle.

## VS-09 — Remove Association

Desvincular una Initiative de su Epic.

Verificar:

- La Initiative permanece.
- Sus Work Items permanecen.
- Owners/contributors se conservan.
- Planning muestra la Initiative como independiente.

## VS-10 — Concurrent Modification

Modificar el artifact externamente mientras el formulario está abierto.

Resultado esperado: conflicto controlado, sin sobrescritura silenciosa.

## VS-11 — Legacy Project

Abrir un proyecto que únicamente tiene Initiatives y Work Items.

Verificar que no requiere crear Plans ni Epics.

## VS-12 — End-to-End

Construir manualmente desde Admin:

```text
Delivery Plan
   ↓
Milestone
   ↓
Epic
   ↓
Existing Initiative
   ↓
Existing Work Item
```

Verificar navegación, relaciones, progreso y persistencia.

---

# 15. Implementation Sequence

## Phase 1 — Contracts and Core

- Revisar operaciones existentes.
- Implementar edición segura de Plans y Epics.
- Incorporar desvinculación controlada de Initiatives.
- Validar referencias e integridad.
- Agregar pruebas de regresión.

## Phase 2 — Admin Server

- Extender Core Adapter.
- Incorporar schemas de escritura.
- Implementar endpoints.
- Validar sesión y seguridad.
- Agregar pruebas de integración.

## Phase 3 — Admin UI

- Formularios Create Plan y Create Epic.
- Edición de Plan y Epic.
- Gestión visual de milestones.
- Asociación y reasignación de Initiatives.
- Gestión del contexto de Planning en Initiative Detail.
- Actualización de consultas después de guardar.

## Phase 4 — Verification

- Builds y pruebas.
- E2E.
- Dogfooding con un proyecto de prueba representativo de Wasma.
- Validación Light/Dark/mobile.
- Pruebas de interoperabilidad CLI/MCP.
- Documentación EN/ES.

---

# 15b. Refinement Notes — Core surface (reuse map)

Verificado contra el código actual (`packages/cli/src/core/delivery-planning.ts`,
`delivery-planning-write.ts`, `initiative-write.ts`):

**Ya existe (reutilizar, no reimplementar):**

- `createDeliveryPlan(dir, { title, status?, objective? })` → `draft` por defecto, ID vía `nextPlanId`.
- `createEpic(dir, { title, status?, outcome?, plan?, milestone? })` → `planned` por defecto, valida
  plan/milestone, ID vía `nextEpicId`.
- `associateInitiativeWithEpic(dir, initiativeId, epicId)` → valida ambos, delega en
  `updateInitiative({ epic })`. Sirve también para **reasignar** (sobrescribe `initiative.epic`).
- `updateInitiative(dir, id, { epic: null })` → **ya elimina** `initiative.epic` preservando el resto.
  La desvinculación se envuelve, no se inventa.
- `validatePlanningGraph(dir)` → referencias inválidas, ciclos de Epics, dependencias pendientes,
  milestones duplicados. Reutilizar tras cada escritura.

**Core a incorporar (escritura controlada, sin lifecycle):**

- `updateDeliveryPlan(dir, id, patch, opts?)` — patch de `title`, `objective`, `successCriteria`,
  `risks`, `dependsOn`, `references`, `milestones`. Nunca toca `status`. Preserva body Markdown y
  claves de frontmatter desconocidas. Valida referencias (reutiliza reglas de `validatePlanningGraph`).
- `updateEpic(dir, id, patch, opts?)` — patch de `title`, `outcome`, `plan`, `milestone`,
  `successCriteria`, `dependsOn`, `relatedCapabilities`, `decisions`. Nunca toca `status`. Si cambia
  `plan`, revalida que `milestone` pertenezca al nuevo Plan. Rechaza dependencias inválidas/cíclicas.
- `disassociateInitiativeFromEpic(dir, initiativeId)` — envoltorio explícito sobre
  `updateInitiative({ epic: null })` con validación de existencia.
- **Fingerprint de concurrencia:** `revisionOf(content)` (hash corto del archivo). Las lecturas de
  detalle exponen `revision`; `update*` aceptan `expectedRevision` opcional y lanzan
  `PlanningConflictError` si el archivo cambió desde su lectura (AC-15 / VS-10). Sin versión obsoleta
  guardada en silencio.

**Milestones (AC-05, AC-06, VS-05):** viven en `plan.milestones` (`{ id, title, exit_criteria }`).
`updateDeliveryPlan` gestiona add/edit/remove. Antes de eliminar o renombrar un milestone, detectar
Epics que lo referencian (`epic.milestone`) y **rechazar** la operación si quedarían referencias
inválidas (sin reasignación automática).

**Admin Server:** nuevos handlers de escritura en el router de planning sobre `coreRoute`/`writeHandler`,
schemas Zod, sin rutas de archivo desde el cliente, reutilizando el Core Adapter (AC-13). Nunca escribe
Markdown directamente.

**Admin UI:** drawers/modales del Design System; reutiliza patrones de creación de Initiatives;
refresco de react-query tras guardar; sin nueva entrada de sidebar.

# 16. Definition of Done

WI-076 estará listo cuando sea posible construir y mantener una estructura de planificación desde Admin sin utilizar CLI ni agentes.

La implementación debe demostrar:

- Creación manual de Plans.
- Creación manual de Epics.
- Administración de milestones.
- Edición segura.
- Asociación de Initiatives.
- Persistencia canónica.
- Navegación integrada.
- Compatibilidad con CLI/MCP.
- Control humano de operaciones.
- Ausencia de cambios automáticos del lifecycle.

La solución debe conservar el principio local-first y evitar duplicar información.

---

# 17. Commit Gate

**No realizar commit, push, tag ni release sin aprobación explícita.**

Antes de solicitar autorización:

1. Presentar el diff de Core y contratos.
2. Ejecutar builds y suite de pruebas.
3. Levantar Kaddo Admin localmente.
4. Demostrar creación de Plan.
5. Demostrar gestión de milestones.
6. Demostrar creación y edición de Epic.
7. Demostrar asociación, reasignación y desvinculación de Initiative.
8. Validar interoperabilidad con CLI y MCP.
9. Verificar Light/Dark/mobile.
10. Confirmar que no se alteraron artifacts históricos ni estados de lifecycle.
11. Presentar los archivos modificados y resultados de validación.
12. Solicitar aprobación final.

No publicar cambios ni cerrar el Work Item antes de esa aprobación.

## Guiding Principle

> Personas y agentes deben poder construir y mantener la misma planificación, mediante diferentes interfaces, utilizando una única fuente canónica y conservando siempre el control humano sobre los cambios.

## Learning

Capturado al cerrar WI-076 (liberado en v3.133.0).

- **La mitad del contrato de escritura ya existía; el trabajo fue exponerlo, no inventarlo.** `createDeliveryPlan`,
  `createEpic` y `associateInitiativeWithEpic` ya estaban en Core, y la desvinculación Initiative–Epic
  era posible vía `updateInitiative({ epic: null })`. Revisar el código antes de diseñar evitó
  reimplementar y mantuvo una sola fuente de verdad: solo se añadieron `updateDeliveryPlan`,
  `updateEpic` y el envoltorio explícito `disassociateInitiativeFromEpic`. **Por qué:** la tentación de
  "añadir una API de escritura" habría duplicado reglas que ya vivían en Core.

- **Editar metadatos y transicionar lifecycle son operaciones distintas y deben separarse en el contrato.**
  `update*` nunca toca `status`; las transiciones siguen su camino humano-gated. Esto se verificó en
  Core, en la API (el `status` no cambia tras un PATCH) y en E2E (editar una Epic la deja en
  `in-progress`). Mezclarlas habría permitido cerrar un Plan/Epic desde un formulario de edición.

- **La concurrencia se resuelve en el borde de escritura con una huella de revisión, no con bloqueos.**
  `revisionOf` (hash corto del archivo) se expone en las lecturas de detalle; `update*` acepta
  `expectedRevision` y lanza `PlanningConflictError` → HTTP 409. Reutilizó el patrón ya presente en los
  Work Items, de modo que CLI, Admin, agentes y ediciones manuales no se pisan en silencio.

- **Detach silencioso = pérdida de información; hazlo explícito.** Quitar el Plan de una Epic también
  elimina su milestone (un milestone sin Plan no tiene sentido). El Core ya lo hacía en cascada, pero la
  UI lo ocultaba; el review final pidió un aviso explícito ("Removing the Plan will also remove this
  Epic's milestone association (RM-01)") con su regresión E2E. **Clave:** una cascada correcta en datos
  todavía necesita visibilidad en la interfaz.

- **Las pruebas de escritura E2E contaminan el estado compartido; aíslalas con fixtures propios.** Las
  specs de Admin comparten un proyecto temporal por corrida. Asociar la `INI-051` del fixture rompía la
  spec de solo-lectura que la esperaba independiente; la solución fue un fixture dedicado (`INI-052`) y
  leer los ids generados desde la URL en vez de fijarlos. **Por qué:** las pruebas de lectura y de
  escritura conviven en un mismo servidor.

### Interoperabilidad y límites

- Los artifacts creados/editados desde Admin son canónicos: `kaddo plan list` y `kaddo epic show` los
  leen, y MCP usa las mismas funciones de Core. Admin nunca escribe Markdown directamente — todo pasa
  por Core (AC-13).
- Sin migración, sin asociación automática, sin nuevos estados de lifecycle, sin cierre automático. La
  asociación Initiative↔Epic, antes solo en CLI/MCP, ahora también es visual (Epic Detail y el Planning
  Context de la Initiative).

### Deuda conocida (fuera de alcance de WI-076)

- `packages/admin/e2e/integrations.spec.ts` ("browse external work items and import one as a Draft")
  es intermitentemente inestable (timeout al pulsar "Browse work items"); pasa al reintentar. No está
  relacionado con WI-076 (flujo de integraciones externas). Pendiente de estabilizar en un WI aparte.
