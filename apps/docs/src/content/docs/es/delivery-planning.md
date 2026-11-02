---
title: Planificación de Entregas
description: Organiza entregas complejas con Delivery Plans y Epics — artifacts canónicos opcionales sobre Initiatives y Work Items, con milestones, responsabilidades declaradas, dependencias y progreso verificable. Core es la única fuente de lógica; el cierre siempre requiere aprobación humana.
---

Roadmap, Initiatives y Work Items cubren estrategia, agrupación y ejecución. **Delivery Planning** añade
dos artifacts canónicos opcionales para coordinar entregas complejas sin esconder milestones y
responsabilidades en Markdown ad-hoc:

- un **Delivery Plan** (`PLAN-xxx`) — cómo una intención estratégica se vuelve fases, con milestones,
  criterios de salida, dependencias, criterios de éxito y riesgos;
- un **Epic** (`EP-xxx`) — un resultado amplio que abarca varios Work Items o frentes de trabajo.

:::note[Opcional y retrocompatible]
Plans y Epics son totalmente opcionales. Una Initiative puede existir sin Epic, un Work Item sin
Initiative, y un proyecto sin plans/epics sigue funcionando igual que antes. Nada se migra
automáticamente.
:::

## Modelo

```text
Roadmap
   └── Delivery Plan (PLAN-xxx)
         └── Milestone (RM-xx)
               └── Epic (EP-xxx)
                     └── Initiative (INI-xxx)
                           └── Work Items
```

Las asociaciones se declaran en **un solo sentido** y nunca se duplican: `initiative.epic → EP`,
`epic.plan` + `epic.milestone → PLAN/RM`, `work_item.epic` opcional. Un Epic o Plan **deriva** sus
Initiatives y Work Items — nunca almacena una lista (sin segundo estado de verdad). Los milestones son
checkpoints definidos dentro del Plan (id, título, criterios de salida); no tienen estado de lifecycle
propio.

## Progreso — separado

El progreso se calcula desde el estado real de los elementos relacionados, nunca un porcentaje único:

- **Planning coverage** — Initiatives y candidatos (materializados vs pendientes).
- **Delivery progress** — Work Items por estado de lifecycle y cuántos están bloqueados.
- **Completion readiness** — criterios de éxito, dependencias bloqueantes y si el trabajo comprometido
  está completo. `meetsCompletionPreconditions` nunca es positivo sin entregables reales ni criterios
  declarados. **Cerrar un Plan o Epic siempre requiere aprobación humana** — un Epic no está "listo"
  solo porque sus Work Items lo estén; también deben verificarse los criterios del resultado.

## Responsabilidad

Una Initiative puede declarar `owners` y `contributors` — metadatos de planificación, nunca
autorización y nunca inferidos de Git. Kaddo distingue **Declared Responsibility** (estos campos) de
**Observed Git Activity** (una capacidad futura, de solo lectura; no implementada aquí).

## Dependencias

`depends_on` relaciona Epics con Epics (y reutiliza el `depends_on` de Work Items). Core valida el grafo
de planificación de forma determinística: referencias inexistentes, ciclos, milestones duplicados y
dependencias pendientes (bloqueantes). Una dependencia nunca cambia el lifecycle de otro elemento.

## CLI

```bash
kaddo plan list
kaddo plan show PLAN-001
kaddo plan progress PLAN-001
kaddo plan create

kaddo epic list
kaddo epic show EP-001
kaddo epic progress EP-001
kaddo epic create
kaddo epic associate EP-001 INI-010
```

## MCP

Lectura: `kaddo_list_plans`, `kaddo_get_plan`, `kaddo_get_plan_progress`, `kaddo_list_epics`,
`kaddo_get_epic`, `kaddo_get_epic_progress`, `kaddo_validate_planning`. Mutaciones
(`kaddo_create_plan`, `kaddo_create_epic`, `kaddo_associate_initiative_epic`) siguen el patrón
preview/confirm y escriben solo bajo `knowledge/delivery/`.

## Admin — Planning Explorer

Kaddo Admin incluye una sección **Planning** (`/planning`) para explorar un plan de extremo a extremo:
Plan → milestones → Epics → Initiatives → Work Items, con progreso derivado, bloqueos por dependencia y
responsabilidades declaradas, y enlaces al detalle de Work Item e Initiative. Es una superficie de
exploración — nunca aplica cambios ni cierra un Plan o Epic automáticamente.

## Knowledge Graph

Plans, milestones y Epics aparecen como nodos del grafo; las relaciones declaradas se vuelven aristas
`belongs_to` (epic→plan, milestone→plan, initiative→epic) y `depends_on` entre Epics — solo relaciones
declaradas, nunca inferidas.
