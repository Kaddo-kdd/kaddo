---
type: feature
id: WI-074
title: Introducir Delivery Plans y Epics como estructura de planificación en Kaddo
status: completed
completed_at: '2026-11-02'
released_in: v3.131.0
work_type: feature
created_at: '2026-11-01'
source:
  type: external
  imported_at: '2026-11-01'
  source_format: kaddo-frontmatter
  source_hash: 1e58a368b1196b253ad3fc61b365996af264a236dee8634b3d070e9255716040
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
        - packages/cli/src/core/initiative.ts
        - packages/cli/src/core/initiative-write.ts
        - packages/cli/src/core/graph.ts
        - packages/cli/src/core.ts
        - packages/cli/src/commands/plan.ts
        - packages/cli/src/index.ts
        - packages/cli/src/agents/responsibility.ts
        - packages/cli/tests/delivery-planning.test.ts
      validations:
        - command: pnpm exec vitest run packages/cli/tests/delivery-planning.test.ts
          status: passed
          reason: >-
            15 verdes: modelo Plan/Epic, progreso Planning/Delivery/Readiness
            separado, human-gated, validación de referencias/ciclos/milestones,
            5 invariantes aprobados (doble conteo, unicidad milestone, readiness
            sin entregables/criterios, persistencia epic/owners/contributors, RM
            sin duplicación de estado) y nodos/aristas de grafo (AC-14).
    mcp:
      role: module
      status: completed
      changed_paths:
        - packages/mcp/src/planning.ts
        - packages/mcp/src/server.ts
        - packages/mcp/tests/planning.test.ts
      validations:
        - command: pnpm exec vitest run packages/mcp/tests/planning.test.ts
          status: passed
          reason: 5 verdes — read + create/associate con preview/confirm y validación.
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin-server/src/server.ts
      validations:
        - command: pnpm --filter @kaddo/admin-server build
          status: passed
          reason: >-
            endpoints /planning, /planning/plans/:id, /planning/epics/:id
            (read-only).
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/App.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/src/components/Sidebar.tsx
        - packages/admin/e2e/planning.spec.ts
        - >-
          packages/admin/e2e/fixtures/project/knowledge/delivery/plans/PLAN-001.md
        - packages/admin/e2e/fixtures/project/knowledge/delivery/epics/EP-001.md
        - packages/admin/e2e/fixtures/project/knowledge/delivery/epics/EP-002.md
        - >-
          packages/admin/e2e/fixtures/project/knowledge/delivery/initiatives/INI-050.md
      validations:
        - command: pnpm --filter @kaddo/admin exec playwright test planning
          status: passed
          reason: >-
            3 verdes: lista Plans/Epics + bloqueo por dependencia; navegación
            Plan→milestones→Epic→Initiatives/WIs con readiness human-gated y
            responsables declarados; nav Planning en sidebar.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/delivery-planning.md
        - apps/docs/src/content/docs/es/delivery-planning.md
        - apps/docs/astro.config.mjs
      validations:
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: 261 páginas; página Delivery Planning EN/ES.
scope_confidence:
  level: medium
  reasons:
    - >-
      El modelo actual dispone de Roadmap, Initiatives y Work Items, pero carece
      de una estructura completa de planificación de múltiples entregables.
    - >-
      Wasma evidencia la necesidad de representar milestones, epics y subfrentes
      sin depender de convenciones documentales.
    - >-
      Deben validarse las decisiones de jerarquía, retrocompatibilidad y
      relaciones antes de implementar los nuevos contratos.
summary: >-
  Evolucionar Kaddo desde un modelo centrado principalmente en Roadmap,
  Initiatives y Work Items hacia un sistema estructurado de planificación de
  entregables complejos. El objetivo es permitir que equipos y agentes organicen
  resultados, responsabilidades y dependencias, manteni…
original_snapshot:
  title: Introducir Delivery Plans y Epics como estructura de planificación en Kaddo
  description: >-
    Evolucionar Kaddo desde un modelo centrado principalmente en Roadmap,
    Initiatives y Work Items hacia un sistema estructurado de planificación de
    entregables complejos. El objetivo es permitir que equipos y agentes
    organicen resultados, responsabilidades y dependencias, manteni…
  type: feature
  status: draft
ready_at: '2026-11-01'
verified_at: '2026-11-02'
---

# WI-074 — Delivery Planning Foundation

## 1. Intent

Evolucionar Kaddo desde un modelo centrado principalmente en Roadmap, Initiatives y Work Items hacia un sistema estructurado de planificación de entregables complejos.
El objetivo es permitir que equipos y agentes organicen resultados, responsabilidades y dependencias, manteniendo trazabilidad entre la intención de producto y el trabajo implementado.
Kaddo debe facilitar tanto la planificación inicial como la evolución del plan durante la implementación.

## 2. Problem

Actualmente:

- El Roadmap ofrece una visión estratégica principalmente documental.
- Las Initiatives agrupan resultados, candidatos y Work Items.
- Los Work Items ofrecen un lifecycle detallado de ejecución.
- No existe un contrato específico para agrupar múltiples resultados bajo un Epic.
- Las fases, milestones y decisiones de entrega pueden quedar embebidos en Markdown.
- La responsabilidad de diferentes personas o equipos no queda representada de manera uniforme.
- No existe una proyección consolidada de la ejecución completa de un plan en Admin.

El roadmap de Agent Native, posteriormente Wasma, ilustra estas limitaciones.
Sus bloques RM-01 a RM-08, subiniciativas INIT-xx-xx y Work Items AN-xxx permitieron construir una hoja de ruta técnicamente rigurosa, pero parte de su coordinación terminó representada en estructuras documentales particulares.
Se requiere un modelo explícito sin perder la flexibilidad de Kaddo.

## 3. Expected Outcome

El usuario podrá:

1. Definir un Delivery Plan con objetivos y milestones.
2. Crear Epics que representen entregables significativos.
3. Asociar Initiatives existentes a los Epics.
4. Asignar responsables y colaboradores declarados a las Initiatives.
5. Relacionar Work Items con Initiatives y Epics.
6. Definir dependencias entre los elementos de planificación.
7. Visualizar progreso y cobertura derivados de los Work Items reales.
8. Identificar trabajo pendiente, bloqueado o sin responsable.
9. Explorar el plan desde Kaddo Admin.
10. Preservar los workflows existentes sin exigir nuevos artifacts para tareas pequeñas.

## 4. Conceptual Model

```text
Roadmap
   |
   +-- Delivery Plan (PLAN-xxx)
         |
         +-- Milestone (RM-xx)
               |
               +-- Epic (EP-xxx)
                     |
                     +-- Initiative (INI-xxx)
                           |
                           +-- Work Items
```

Las asociaciones serán opcionales.
Una Initiative podrá existir sin Epic y un Work Item podrá existir sin Initiative, como actualmente.
Los milestones serán checkpoints definidos dentro del Plan, no necesariamente artifacts independientes.
No introducir jerarquías ilimitadas ni permitir relaciones circulares.

### Delivery Plan

Responsabilidad: definir cómo una intención estratégica se traduce en fases de entrega, con dependencias, criterios de salida y alcance. Debe incluir: ID y título, objetivo, estado, alcance y exclusiones, milestones, dependencias, criterios de éxito, riesgos, referencias al conocimiento que lo fundamenta.

### Epic

Responsabilidad: representar un resultado suficientemente amplio para necesitar diferentes Work Items o frentes de trabajo. Debe incluir: ID y título, resultado esperado, estado, plan y milestone relacionados cuando existan, criterios de éxito, dependencias, evidencia de entrega, referencias a decisiones y capacidades.

### Initiative

Mantener el modelo actual de Initiative, agregando asociaciones opcionales: Epic relacionado, responsables declarados, colaboradores declarados, alcance específico de la Initiative.
No duplicar en el Epic la lista de Work Items que ya puede derivarse de las Initiatives.

### Work Item

Mantener su lifecycle actual. Conservar el campo `initiative` existente y habilitar una relación opcional con Epic cuando un WI no necesite Initiative intermedia.
No exigir la pertenencia a un Plan o Epic como condición para crear, refinar, verificar o completar un WI.

## 4b. Refinement & Architectural Design (Phase 1)

> Añadido en refinación. Fundamentado contra el código real; el diseño se presenta antes de modificar contratos canónicos (requisito del WI).

### Decisiones de diseño (grounded en `packages/cli/src/core/initiative.ts`)

- **Plan y Epic reflejan el contrato de Initiative, no lo reinventan.** El modelo de Initiative ya
  provee el patrón completo: `parseX` (gray-matter, `type` discriminante, id obligatorio), `discoverX`
  (lee el directorio, ordena por id), `getX`, `nextXId`, y `computeXProgress` con **Planning y Delivery
  separados**. Plan (`type: delivery-plan`, `knowledge/delivery/plans/`) y Epic (`type: epic`,
  `knowledge/delivery/epics/`) se implementan igual, en un módulo Core nuevo `delivery-planning.ts`.
- **Lifecycle human-gated.** Igual que Initiative (`INITIATIVE_TRANSITIONS`, completion gated por el
  caller), Plan y Epic tienen su propia máquina de estados y su cierre requiere aprobación humana
  (AC-08). Core nunca cierra un Epic automáticamente aunque sus WIs estén completos (los criterios de
  éxito del resultado también se verifican).
- **Relaciones opcionales, un solo sentido, sin segundo estado de verdad (AC-15).** La pertenencia se
  declara "hacia arriba": `initiative.epic` → EP, `epic.plan` + `epic.milestone` → PLAN/RM,
  `work_item.epic` opcional. El Epic **no** lista sus Initiatives ni WIs (se derivan). Los milestones
  viven dentro del Plan (no son artifacts).
- **Progreso derivado (AC-06/07):** `computePlanProgress` / `computeEpicProgress` reutilizan
  `associatedWorkItems` y `computeInitiativeProgress`; mantienen **Planning Coverage** vs **Delivery
  Progress** vs **Completion Readiness** separados, sin porcentaje único ni peso igual por WI.
- **Dependencias y ciclos (AC-09):** validación determinística de `depends_on` (Epic↔Epic,
  Initiative↔Initiative) reutilizando el patrón de WI `depends_on`: referencias inexistentes, ciclos
  (DFS), dependencias pendientes, trabajo bloqueado por entregables no completados. Nunca cambia el
  lifecycle de otro elemento.
- **Ownership (AC-04):** `initiative.owners` / `initiative.contributors` como metadatos de
  planificación (listas de strings libres), sin autenticación ni autorización. Se distingue
  `Declared Responsibility` de `Observed Git Activity`; esta última es solo un **contrato conceptual**
  (tipos/campos documentados) — **no se implementa observación Git en este WI** (AC-17).
- **Retrocompatibilidad (AC-05/13):** no se toca el lifecycle de Work Items ni el campo `initiative`;
  se añade `work_item.epic` opcional. Proyectos sin plans/epics siguen igual (los `discoverX` devuelven
  `[]` si el directorio no existe). Sin migración automática.
- **Knowledge Graph (AC-14):** se añaden nodos `delivery-plan`/`epic` y aristas declaradas
  (`plan──has_milestone``…``epic──in_plan→plan`, `initiative──in_epic→epic`, `*──depends_on→*`) en
  `core/graph.ts`, sin inventar conexiones; graph-hints señala relaciones opcionales ausentes.

### Entry points reales (verificados)

```text
packages/cli/src/core/delivery-planning.ts   # NUEVO — Plan + Epic: parse/discover/get/next/progress/validate
packages/cli/src/core/initiative.ts          # extender: campos epic/owners/contributors (opcionales)
packages/cli/src/core/graph.ts               # nodos/aristas plan/epic/milestone
packages/cli/src/core.ts                     # re-exports
packages/cli/src/commands/plan.ts            # NUEVO — kaddo plan list|show|progress|create
packages/cli/src/commands/epic.ts            # NUEVO — kaddo epic list|show|progress|create
packages/cli/src/index.ts                    # registrar grupos plan/epic
packages/mcp/src/*.ts + server.ts            # tools lectura + create (preview/confirm)
packages/admin-server/src/core-adapter.ts + server.ts + contracts/schemas.ts  # endpoints read + progress
packages/admin/src/routes/* + App.tsx + lib/api.ts   # Planning Explorer MVP (reutiliza patrón Initiatives)
apps/docs/src/content/docs/(es/)delivery-planning.md # docs EN/ES
knowledge/agents|skills                      # extender roadmap/initiative/work-item agents (no crear nuevos)
```

### Secuencia (respeta el Commit Gate)

Phase 2 Core (modelo + validación + progreso + tests) → Phase 3 CLI/MCP → Phase 4 Admin MVP → Phase 5
verificación (retrocompat, fixtures de Wasma, Light/Dark/responsive, docs) → presentación visual y
aprobación. **Sin commit/push/tag/release hasta aprobación explícita.**

## 5. Canonical Artifacts

Propuesta de nuevas ubicaciones:

```text
knowledge/delivery/
├── roadmap.md
├── plans/
│   └── PLAN-001.md
├── epics/
│   └── EP-001.md
├── initiatives/
│   └── INI-001.md
└── work-items/
    ├── draft/
    ├── ready/
    ├── in-progress/
    └── completed/
```

Ejemplo ilustrativo de Plan:

```yaml
type: delivery-plan
id: PLAN-001
title: Wasma Technical Roadmap
status: in-progress
milestones:
  - id: RM-08
    title: Performance & Concurrency
    exit_criteria:
      - Benchmark evidence reviewed
      - Worker isolation verified
```

Ejemplo ilustrativo de Epic:

```yaml
type: epic
id: EP-001
title: Runtime Performance & Concurrency
status: in-progress
plan: PLAN-001
milestone: RM-08
related_capabilities:
  - Independent Runtime Execution
```

Ejemplo de asociación desde Initiative:

```yaml
type: initiative
id: INI-010
title: Host-side Workers
epic: EP-001
owners:
  - developer-a
contributors:
  - developer-b
```

Los ejemplos ilustran el modelo esperado y no autorizan migrar los archivos actuales de Wasma.
Las convenciones finales deben seguir los parsers, validaciones y estilos actuales de Kaddo.

## 6. Planning and Delivery Progress

El progreso debe calcularse a partir de relaciones y evidencia existente. Distinguir al menos:

**Planning Coverage:** Initiatives identificadas, Work Item candidates pendientes, candidatos materializados, entregables sin definición suficiente.

**Delivery Progress:** Work Items por estado, Work Items bloqueados, Work Items completados, dependencias pendientes.

**Completion Readiness:** criterios de éxito cubiertos, trabajo comprometido completado, evidencia suficiente, dependencias críticas resueltas, pendientes de aprobación humana.

No convertir automáticamente todos estos indicadores en un porcentaje único.
No asumir que todos los Work Items tienen igual esfuerzo.
No considerar una Epic completada simplemente porque todos sus Work Items fueron cerrados: los criterios de aceptación del resultado también deben verificarse.
La finalización de Plans y Epics estará sujeta a aprobación humana.

## 7. Ownership and Collaboration

Permitir registrar responsabilidades explícitas en Initiatives. Distinguir: Owner (responsable principal o equipo coordinador), Contributors (colaboradores declarados), Unassigned (no se ha registrado responsable).
Estos campos son metadatos de planificación, no mecanismos de autorización.
No exigir una persona responsable en todos los proyectos. Los campos deben poder utilizarse en proyectos individuales, comunitarios o empresariales.
Diseñar los contratos para admitir múltiples colaboradores, sin imponer autenticación ni gestión de usuarios corporativos.

## 8. Dependencies

Soportar relaciones explícitas entre Epics e Initiatives, reutilizando `depends_on` en Work Items. Core debe detectar: referencias inexistentes, dependencias circulares, dependencias pendientes, trabajo bloqueado por entregables no completados.
No inferir automáticamente dependencias semánticas entre artifacts.
Una dependencia no debe producir cambios silenciosos en el lifecycle de otro elemento.

## 9. CLI and MCP

Incorporar una primera superficie de consulta y gestión que reutilice Core. CLI sugerido:

```bash
kaddo plan list
kaddo plan show PLAN-001
kaddo plan progress PLAN-001
kaddo plan create

kaddo epic list
kaddo epic show EP-001
kaddo epic progress EP-001
kaddo epic create
```

Permitir asociar una Initiative existente con una Epic, usando validación del estado y referencias.
Agregar herramientas MCP equivalentes para lectura y operaciones explícitamente confirmadas.
Las herramientas deben respetar los mecanismos existentes de preview/confirmación y controles de mutación.
No crear agentes nuevos que sustituyan al roadmap-agent, initiative-agent o work-item-agent. Extender sus responsabilidades e instrucciones.

## 10. Admin — Planning Explorer MVP

Crear una primera superficie de planificación en Kaddo Admin. Propuesta de navegación:

```text
Planning
  ├── Roadmap
  ├── Delivery Plans
  ├── Epics
  └── Initiatives
```

Antes de agregar una entrada de primer nivel, evaluar si puede reutilizarse la navegación actual de Initiatives y Roadmap.
La experiencia debe permitir: consultar un Delivery Plan, visualizar sus milestones, explorar Epics por milestone, consultar las Initiatives asociadas, mostrar sus Work Items y estados reales, mostrar responsables declarados, identificar dependencias y bloqueos, navegar hacia Work Item Detail, consultar cobertura y readiness.
La primera versión puede utilizar tarjetas y vistas de detalle. No es necesario desarrollar un Gantt completo ni un canvas de planificación editable.

## 11. Git Collaboration — Architectural Preparation

Este WI debe establecer el contrato conceptual necesario para una integración posterior con Git, sin implementar todavía un nuevo observador de repositorios.
La futura integración permitirá mostrar: branches vinculadas a Work Items, commits relacionados, autores y contribuidores observados, última actividad registrada, referencias a PRs cuando estén disponibles, repositorios involucrados.
El modelo distinguirá obligatoriamente: **Declared Responsibility** (asignaciones explícitas) y **Observed Git Activity** (evidencia de contribución).
No inferir que el autor de un commit es automáticamente el owner. No marcar Work Items como completados por encontrar commits o merges. No utilizar Git para cambiar estados automáticamente.
La observación deberá ser read-only y requerirá revisar la política arquitectónica actual de Kaddo sobre operaciones Git. No incorporar esa integración en el código de WI-074.

## 12. Legacy Compatibility

Preservar compatibilidad con: Roadmap Markdown actual, `RM-xxx`, Initiatives `INI-xxx`, Candidate Work Items, campo `initiative` de Work Items, lifecycle y completion gate existentes, CLI y herramientas MCP anteriores, Knowledge Graph y Graph Hints existentes.
No migrar automáticamente proyectos existentes. Los planes y Epics deben ser adoptables progresivamente. Un proyecto antiguo debe seguir funcionando sin ningún cambio documental.

## 13. Wasma Dogfooding

Utilizar Wasma como caso de validación arquitectónica. Comprobar que el modelo puede representar: plan técnico de construcción, milestones RM-01 a RM-08, bloques de trabajo como Performance & Concurrency, frentes de benchmarking/optimización/workers, Work Items asociados, dependencias entre entregables, decisiones de no adopción como el warm pool genérico, evidencia técnica y criterios de cierre separados del estado de implementación.
Crear primero fixtures o una propuesta de mapeo. No modificar el conocimiento canónico de Wasma sin aprobación humana. La prueba debe demostrar que la información se puede representar estructuralmente sin copiar todo el roadmap a cada Epic o Initiative.

## 14. Out of Scope

- Motor Git de observación automática.
- Descubrimiento remoto de PRs.
- Sincronización con GitHub Projects, Jira o Azure DevOps.
- Asignaciones automáticas mediante Git.
- Autocompletar Epics por porcentaje.
- Ejecución autónoma de planes.
- Sistema de usuarios y permisos.
- Gantt avanzado.
- Estimaciones automáticas de esfuerzo.
- Dependencias inferidas por IA.
- Migración automática de proyectos existentes.
- Reemplazar la planificación técnica por Work Item.
- Cambios al lifecycle canónico de Work Items.

## 15. Acceptance Criteria

- [x] AC-01: existe un modelo canónico de Delivery Plan con milestones y criterios de salida.
- [x] AC-02: existe un modelo canónico de Epic con resultado, estado, dependencias y relaciones.
- [x] AC-03: una Initiative puede asociarse opcionalmente con una Epic.
- [x] AC-04: una Initiative puede declarar owners y contributors sin inferirlos de Git.
- [x] AC-05: los Work Items existentes conservan sus asociaciones y lifecycle.
- [x] AC-06: el progreso de Plan y Epic se deriva del estado real de sus elementos relacionados.
- [x] AC-07: Planning Coverage y Delivery Progress permanecen separados.
- [x] AC-08: la finalización de Plan y Epic requiere validación y aprobación humana.
- [x] AC-09: se validan referencias, dependencias y ciclos.
- [x] AC-10: existen comandos CLI y herramientas MCP de consulta y gestión compatibles con Core.
- [x] AC-11: Admin permite navegar del Plan a los milestones, Epics, Initiatives y Work Items.
- [x] AC-12: Admin muestra responsables declarados, bloqueos y progreso verificable.
- [x] AC-13: proyectos sin Plans ni Epics conservan sus funcionalidades actuales.
- [x] AC-14: Knowledge Graph representa las nuevas relaciones sin inventar conexiones.
- [x] AC-15: los cambios no producen un segundo estado de verdad ni duplican listas derivables.
- [x] AC-16: existe una prueba con fixtures basados en la estructura de Wasma.
- [x] AC-17: los contratos futuros de actividad Git distinguen responsabilidad de contribución, sin implementar observación en este WI.
- [x] AC-18: las pruebas Core, CLI, MCP, Admin Server y E2E cubren los flujos críticos.
- [x] AC-19: la documentación EN/ES y agentes/skills afectados están actualizados.
- [x] AC-20: la implementación se presenta visualmente en local antes de realizar cualquier commit.

## 16. Implementation Sequence

**Phase 1 — Architectural Design:** definir el modelo de entidades, relaciones, lifecycle, compatibilidad y reglas de progreso. Documentar las decisiones relevantes mediante ADR si la evaluación técnica lo requiere. Presentar el diseño antes de modificar contratos canónicos.

**Phase 2 — Core:** implementar lectores, validación, escrituras controladas, relaciones, dependencias y proyecciones de progreso. Agregar pruebas determinísticas.

**Phase 3 — CLI and MCP:** exponer las capacidades mediante interfaces compatibles, sin duplicar lógica.

**Phase 4 — Admin MVP:** implementar navegación, consulta de planes, Epics y progreso, reutilizando el diseño actual.

**Phase 5 — Verification:** probar retrocompatibilidad, fixtures de Wasma, estados de completitud, enlaces y seguridad. Actualizar documentación y presentar la implementación.

## 17. Definition of Done

WI-074 estará listo para completar cuando Kaddo pueda representar un plan complejo mediante artifacts estructurados y navegarlo desde Admin, sin depender de convenciones Markdown particulares. Debe demostrar que: un plan puede contener varias fases, una fase puede agrupar Epics, una Epic puede agrupar trabajo de varias Initiatives, diferentes personas pueden tener responsabilidades declaradas, los Work Items conservan trazabilidad completa, el progreso y los bloqueos se derivan de evidencia existente, la aprobación humana sigue gobernando el cierre, los proyectos actuales continúan funcionando.

## 18. Commit Gate

No realizar commit, push, tag ni release sin aprobación explícita. Antes de solicitar autorización:

1. Presentar el modelo de datos y las decisiones arquitectónicas.
2. Mostrar los contratos y pruebas de retrocompatibilidad.
3. Ejecutar builds y suite completa.
4. Levantar Admin localmente.
5. Demostrar el flujo Plan → Epic → Initiative → Work Item.
6. Mostrar los indicadores de progreso.
7. Mostrar un caso con dependencias y bloqueos.
8. Validar Light/Dark y responsive.
9. Presentar el diff y los archivos modificados.
10. Solicitar aprobación del resultado.

No completar el Work Item ni iniciar release sin autorización.

## Future Work

Después de validar esta foundation, proponer Work Items separados para:

- **Git Collaboration Evidence:** visibilidad de branches, commits, contribuidores y actividad local, con reconciliación opcional de fuentes remotas y sin modificar estados automáticamente.
- **Roadmap Planning Workspace:** planificación visual avanzada, edición guiada de fases y Epics, dependencias, distribución de trabajo entre personas y revisión de entrega desde Admin.

Estos desarrollos deben utilizar los contratos de WI-074 y no crear un sistema de gestión de proyectos paralelo.

---

## Learning

Liberado en v3.131.0. Delivery Plans + Epics como capa de planificación opcional sobre Initiatives y Work Items, con CLI, MCP, Admin Explorer, grafo y docs.

- **Reflejar un contrato existente acelera y da consistencia.** Plan y Epic se construyeron espejando el modelo de Initiative (`parse/discover/get/nextId/computeProgress`, lifecycle human-gated). Eso mantuvo el estilo de parsers/validaciones y evitó un segundo sistema de gestión de proyectos.
- **Un solo sentido + derivación evita el segundo estado de verdad.** La pertenencia se declara "hacia arriba" (`initiative.epic`, `epic.plan/milestone`, `work_item.epic`) y los agregados (Epics/Initiatives/WIs de un Plan) se derivan; nadie almacena listas. El invariante de "doble conteo" se resolvió deduplicando en `workItemsInEpic` (un WI que pertenece por epic y por initiative cuenta una vez).
- **La readiness debe resistir el vacío.** `meetsCompletionPreconditions` nunca es positivo sin entregables reales ni criterios declarados, y el cierre siempre exige aprobación humana. Un Epic no está "listo" por cerrar sus WIs: los criterios del resultado también se verifican.
- **Declared vs Observed es una decisión de contrato, no de implementación.** Se añadieron `owners`/`contributors` como metadatos de planificación y se documentó la distinción con la futura "Observed Git Activity", pero no se implementó observación Git ni inferencia de responsables (AC-17) — evita acoplar planificación con evidencia de commits.
- **El grafo refleja, no inventa.** Solo se añaden aristas declaradas (`belongs_to`/`depends_on`); `addEdge` no crea nodos fantasma, así que una referencia inválida queda como relación colgante que la validación determinística señala.
- **Validación visual multi-tema desde el inicio.** Light/Dark/mobile se verificaron con capturas; el flujo Plan→Milestone→Epic→Initiative→WI y el bloqueo por dependencia (EP-001←EP-002) se demostraron sin modificar conocimiento canónico (fixtures temporales fuera del repo, fixtures de Wasma solo en `e2e/`).

**Conocimiento a vigilar:** la foundation habilita dos WIs futuros fuera de alcance — Git Collaboration Evidence (observación read-only) y Roadmap Planning Workspace (edición visual) — que deben reutilizar estos contratos, no duplicarlos.
