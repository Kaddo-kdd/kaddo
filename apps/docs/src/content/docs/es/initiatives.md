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

Una Iniciativa puede contener **Work Item candidates** aún no materializados. Un candidate pendiente
puede **editarse** (se conservan su id, source signals y provenance) o **retirarse** — el retiro
siempre exige una justificación, queda registrado en `removed_candidates`, y el id del candidate
retirado **se jubila, nunca se reutiliza**. Un candidate materializado es de solo lectura aquí;
reconcílialo a través de su Work Item.

Materializar un candidate crea un Work Item draft asociado a la Iniciativa y marca el candidate como
materializado, de modo que la cobertura de planning lo refleja. La materialización es **idempotente**:
repetirla devuelve el mismo Work Item en lugar de crear un duplicado, y si se pierde el puntero hacia
adelante (un fallo parcial) Kaddo lo recupera desde el provenance del Work Item en vez de recrear
trabajo. Un `materialized_as` colgante (el Work Item ya no existe) se reporta como error, nunca se
recrea en silencio.

## Progreso

Kaddo separa dos dimensiones — sin un porcentaje único arbitrario:

- **Planning coverage** — candidates materializados / total.
- **Delivery progress** — Work Items asociados por estado de lifecycle.

## Análisis y completion

`kaddo initiative analyze <id>` hace un análisis de gaps fundamentado: cobertura de success
criteria, candidates pendientes, estado del delivery y findings. Los candidates sugeridos son los
propios candidates pendientes de la Iniciativa (que llevan sus source signals) — Kaddo nunca
inventa trabajo.

La completion es **basada en evidencia y con human gate**, reutilizando el mismo contrato de
verificación que Plans y Epics — no hay un verificador paralelo. La readiness es uno de
`READY_TO_COMPLETE`, `READY_WITH_EXCEPTIONS`, `NEEDS_WORK` o `BLOCKED`. Una Iniciativa está *ready*
solo cuando:

- cada **success criterion** declarado tiene **evidencia de resultado registrada** (`passed`, o
  exceptuado por una excepción aceptada) — un checkbox de Markdown **no** es evidencia;
- no hay candidates pendientes y todo el scope comprometido está entregado;
- el provenance candidate → Work Item está íntegro (una relación rota es `BLOCKED`).

La evidencia se registra por criterio en el frontmatter `outcome_verifications` (misma forma que
Epics/Plans). Un delivery completado cuyo resultado sigue sin verificar permanece en `NEEDS_WORK`. La
completion nunca es una simple transición de estado: `transitionInitiative(... 'completed')` se
rechaza, y `completeInitiative` solo aplica cuando la readiness es `READY_*`, registrando una
`completion_decision` explícita. Kaddo nunca marca una Iniciativa como completada por su cuenta.

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
`kaddo_update_initiative`, `kaddo_add_initiative_candidate`, `kaddo_update_initiative_candidate`,
`kaddo_remove_initiative_candidate`, `kaddo_materialize_initiative_candidate`,
`kaddo_add_initiative_external_link`, `kaddo_record_initiative_evidence`, `kaddo_complete_initiative`.
Registrar evidencia rechaza cualquier criterio que no esté declarado en los success criteria de la
Iniciativa, y la completion está basada en evidencia — no puede forzarse con un resultado sin
verificar. Los agentes pueden analizar, proponer y hacer preview, pero nunca materializan candidates,
registran evidencia ni completan una Iniciativa en silencio.

## Admin

La pantalla **Initiative** de Admin gestiona candidates (crear / editar / retirar-con-justificación /
materializar), muestra el **Completion Review** con verificación de resultado por criterio, permite a
una persona registrar evidencia y ofrece una acción **Complete** con gate. La completion nunca aparece
como un simple botón de estado — es una decisión explícita respaldada por evidencia.

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
