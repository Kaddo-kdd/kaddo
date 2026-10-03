---
title: Iniciativas
description: Iniciativas — la capa de outcome opcional que conecta la intención de producto con el delivery ejecutable, con lifecycle, candidates, progreso, análisis y trazabilidad externa.
---

Una **Iniciativa** es la **capa de outcome** opcional de Kaddo: conecta la intención de producto con
el delivery ejecutable. Las Iniciativas son artifacts first-class bajo
`knowledge/delivery/initiatives/` (`INI-xxx-*.md`), pero nunca son obligatorias — un Work Item puede
existir y completar todo su lifecycle sin ninguna.

```text
Intención de producto → Iniciativa → WI Candidates → Work Items → … → Verificación → Completion Review
```

## Las Iniciativas son opcionales

Los Work Items standalone siguen funcionando igual que antes:

```bash
kaddo create feature
```

Un Work Item sin `initiative` recorre `draft → ready → in-progress → completed` sin errores
relacionados con Iniciativas. Las Iniciativas agregan trazabilidad cuando la quieres; nunca
bloquean trabajo pequeño, emergente o independiente.

## Lifecycle

```text
candidate → planned → in-progress → completed
```

con estados alternativos `deferred` y `cancelled`. Las Iniciativas materializadas suelen empezar en
`planned`. Las transiciones se validan; la completion tiene **human gate** (ver abajo).

## Relación con el roadmap

El roadmap (`knowledge/delivery/roadmap.md`) sigue siendo la vista estratégica (Now / Next / Later).
Una iniciativa de roadmap (`RM-xxx`) puede **materializarse** en una Iniciativa first-class,
preservando la provenance:

```yaml
source: roadmap
source_id: RM-001
```

El flujo `kaddo create --from roadmap` y toda la provenance `RM-xxx` / `WI-CANDIDATE-xxx` siguen
funcionando sin cambios.

## Asociación de Work Items

Un Work Item se asocia a una Iniciativa mediante metadata explícita:

```yaml
initiative: INI-001
```

La relación es opcional y muchos-a-uno (muchos Work Items → una Iniciativa). Kaddo resuelve la
asociación desde los propios artifacts de Work Item — no hay una segunda lista que mantener
sincronizada.

## Candidates

Una Iniciativa puede contener **Work Item candidates** aún no materializados. Materializar un
candidate crea un Work Item draft asociado a la Iniciativa y marca el candidate como materializado,
de modo que la cobertura de planning lo refleja.

## Progreso

Kaddo separa dos dimensiones — sin un porcentaje único arbitrario:

- **Planning coverage** — candidates materializados / total.
- **Delivery progress** — Work Items asociados por estado de lifecycle.

## Análisis y completion

`kaddo initiative analyze <id>` hace un análisis de gaps fundamentado: cobertura de success
criteria, candidates pendientes, estado del delivery y findings. Los candidates sugeridos son los
propios candidates pendientes de la Iniciativa (que llevan sus source signals) — Kaddo nunca
inventa trabajo.

La completion tiene **human gate**. `kaddo initiative complete <id>` reporta la readiness y pide
confirmación. Una Iniciativa está *ready* solo cuando el scope comprometido está cubierto: sin
candidates pendientes, sin success criteria sin cubrir, y con todos los Work Items asociados
completados. Kaddo detecta scope comprometido sin cubrir **aunque todos los Work Items estén
completados**, y nunca marca una Iniciativa como completada por su cuenta.

## CLI

```bash
kaddo initiative list
kaddo initiative show INI-001
kaddo initiative progress INI-001
kaddo initiative candidates INI-001
kaddo initiative create --title "Authentication Foundation"
kaddo initiative update INI-001 --status in-progress
kaddo initiative materialize INI-001 WI-CANDIDATE-001
kaddo initiative analyze INI-001
kaddo initiative complete INI-001
```

## MCP

Tools de lectura: `kaddo_list_initiatives`, `kaddo_get_initiative`, `kaddo_get_initiative_context`,
`kaddo_get_initiative_progress`, `kaddo_analyze_initiative`,
`kaddo_suggest_initiative_for_external_item`.

Tools de mutación (preview sin `confirm`, aplican con `confirm: true`): `kaddo_create_initiative`,
`kaddo_update_initiative`, `kaddo_add_initiative_candidate`,
`kaddo_materialize_initiative_candidate`, `kaddo_add_initiative_external_link`,
`kaddo_complete_initiative`. Los agentes pueden analizar, proponer y hacer preview, pero nunca
materializan candidates ni completan una Iniciativa en silencio.

## Trazabilidad externa

Una Iniciativa puede mantener referencias provider-neutral a elementos de planificación externos
(epics de Jira, features de Azure DevOps, milestones de GitHub, …):

```yaml
external_links:
  - integration: jira-company
    external_id: AUTH-20
    external_type: epic
    url: https://jira.example/AUTH-20
    external_status: In Progress
```

Una Iniciativa de Kaddo **no** se asume igual a un Epic de Jira — el modelo es provider-neutral. El
`external_status` se almacena como **señal únicamente**: un cambio de estado del elemento externo
(p. ej. el epic pasa a "Done") nunca cambia el lifecycle de la Iniciativa. Kaddo conserva su propio
lifecycle, su análisis de completion y su human gate.

Cuando un Work Item se importa desde una integración y se relaciona claramente con una Iniciativa
(por ejemplo, su epic padre está referenciado por esa Iniciativa), Kaddo puede **sugerir** la
asociación (`kaddo_suggest_initiative_for_external_item`). La asociación requiere confirmación
humana.

## Knowledge Graph

El grafo de conocimiento exportado representa las relaciones de Iniciativa: Iniciativa → capability
(`targets`), Iniciativa → elemento externo (`references_external`), Work Item → Iniciativa
(`belongs_to`) y candidate → Iniciativa (`belongs_to`) / candidate → Work Item (`materialized_as`).
Los consumidores existentes del grafo siguen funcionando; los nodos y edges de Iniciativa son
aditivos.

## Agentes

El **initiative-agent** entiende una Iniciativa, evalúa cobertura, la descompone en candidates
fundamentados y evalúa la completion readiness — sin escribir código, materializar trabajo ni
completar una Iniciativa de forma autónoma. El **backlog-agent** rutea una idea nueva hacia un Work
Item standalone, un candidate bajo una Iniciativa existente, o un nuevo Initiative candidate — sin
forzar que todo quede bajo una Iniciativa.
