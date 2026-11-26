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

## Flujo de planificación recomendado y guía del siguiente paso

El trabajo se descompone de forma progresiva: **Epic → Initiative → Work Item Candidates → Work Items**. Un
Epic es un resultado mayor; una Initiative organiza un objetivo o frente de trabajo; los Candidates son
propuestas sin materializar; los Work Items son unidades concretas de ejecución.

Kaddo calcula una **recomendación determinista y de solo lectura** del siguiente paso de un Epic —la misma
lógica en Core, expuesta de forma idéntica por el CLI (`kaddo epic progress`), MCP (`kaddo_get_epic_progress`,
en su campo `recommendation`) y Admin (el Overview del Epic)—. Para un **Epic nuevo sin Initiatives ni Work
Items**, el paso recomendado es **crear o asociar una Initiative** y luego definir sus Work Item candidates,
antes de materializar trabajo de implementación —de modo que un agente recomiende organizar el trabajo en vez
de saltar directamente a un Work Item técnico—. La recomendación se adapta al estado real del Epic: definir
candidates cuando una Initiative no tiene, revisar y materializar los candidates pendientes, continuar y
desbloquear el trabajo activo y, para un Epic completado, apuntar a su evidencia en lugar de a trabajo nuevo.

Esta estructura es **opcional, nunca obligatoria**. Un proyecto que coloca Work Items **directamente** bajo un
Epic es un modelo válido, no un error de integridad —la recomendación ofrece las Initiatives como mejora
opcional, y los proyectos que nunca usan Initiatives siguen funcionando igual—. Consultar una recomendación
es de solo lectura: nunca crea ni modifica Epics, Initiatives, candidates ni Work Items, y la materialización
siempre requiere una decisión humana explícita.

## Progreso — separado

El progreso se calcula desde el estado real de los elementos relacionados, nunca un porcentaje único:

- **Planning coverage** — Initiatives y candidatos (materializados vs pendientes).
- **Delivery progress** — Work Items por estado de lifecycle y cuántos están bloqueados.
- **Completion readiness** — criterios de éxito, dependencias bloqueantes y si el trabajo comprometido
  está completo. `meetsCompletionPreconditions` es solo una señal *estructural*; la readiness canónica
  es la evaluación basada en evidencia descrita abajo. **Cerrar un Plan o Epic siempre requiere
  aprobación humana** — un Epic no está "listo" solo porque sus Work Items lo estén; también deben
  verificarse los criterios del resultado.

## Lifecycle y cierre basado en evidencia

Plans y Epics tienen un lifecycle real y con control humano. Kaddo separa **trabajo terminado** (todos
los Work Items hechos) de **resultado alcanzado** (los criterios de éxito verificados con evidencia).

**Transiciones.** `draft`/`planned` → `in-progress` → `completed` / `cancelled`. Iniciar y cancelar son
transiciones ordinarias; **completar es una operación dedicada y protegida** — la transición general
rechaza `→ completed` y remite al comando de cierre. Las transiciones preservan id, relaciones,
frontmatter desconocido y cuerpo Markdown, y usan la misma huella de revisión para concurrencia.

**Verificación de resultado.** Cada criterio de éxito declarado (y cada exit criterion de milestone)
puede registrar una verificación — `status` (passed / failed / not-verified / manual-review-required),
`evidence` (qué demuestra, no solo un checkbox), `reference` (archivo, test, ADR, reporte), `method` y
`verified_by` — almacenada canónicamente en `outcome_verifications` del Plan/Epic y en
`exit_verifications` de cada milestone. La evidencia se asocia al criterio **por su texto**: reordenar
es seguro y **editar un criterio deja obsoleta su evidencia previa** (se muestra, nunca se reasigna en
silencio ni se da por aprobada). Los criterios con texto colisionante deben desambiguarse antes de
atribuir evidencia.

**Completion readiness** es `READY_TO_COMPLETE`, `READY_WITH_EXCEPTIONS`, `NEEDS_WORK` o `BLOCKED`, con
razones y hallazgos. Es conservadora: sin resultado, sin criterios, criterios sin verificar o fallidos,
trabajo comprometido incompleto, referencias inválidas o una dependencia bloqueante impiden estar listo.
Un estado `READY_*` **nunca completa nada** — el cierre es una acción humana explícita que registra un
`completion_decision` (readiness, quién decidió, cuándo y por qué). Una excepción aceptada puede eximir
un criterio concreto (con motivo), pero nunca una dependencia bloqueante, trabajo incompleto, ausencia
de entregables ni un error de integridad.

```bash
kaddo epic start EP-001
kaddo epic evidence EP-001 --criterion "SSO works end to end" --status passed \
  --evidence "Verificado contra Okta/Azure AD" --reference reports/sso.md --method manual --by dev-a
kaddo epic verify EP-001 --json   # readiness de solo lectura
kaddo epic complete EP-001 --by lead   # con control humano; rechaza si no está READY
```

MCP expone lo mismo con `kaddo_verify_plan` / `kaddo_verify_epic` (solo lectura),
`kaddo_record_plan_evidence` / `kaddo_record_epic_evidence`, `kaddo_transition_plan` /
`kaddo_transition_epic` y `kaddo_complete_plan` / `kaddo_complete_epic` (preview → confirm). Un flag
`confirm: true` es un paso de confirmación, **no por sí solo prueba de aprobación humana**.

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

## Admin — Exploración y gestión de Planning

Kaddo Admin incluye una sección **Planning** (`/planning`) para explorar un plan de extremo a extremo:
Plan → milestones → Epics → Initiatives → Work Items, con progreso derivado, bloqueos por dependencia y
responsabilidades declaradas, y enlaces al detalle de Work Item e Initiative.

Desde el mismo espacio también puedes **construir y mantener** la estructura de planificación sin la CLI:

- **Crear un Delivery Plan** (Overview, la pestaña Delivery Plans o el estado vacío) — Kaddo genera el
  id y asigna el estado `draft`.
- **Editar un Plan** (título, objetivo, criterios de éxito, riesgos, dependencias, referencias) y
  **gestionar sus milestones** (agregar, editar, eliminar) desde el detalle del Plan.
- **Crear una Epic** (independiente o bajo un Plan y uno de sus milestones) y **editarla** (resultado,
  plan, milestone, criterios de éxito, dependencias, capacidades relacionadas, decisiones).
- **Asociar, reasignar o retirar una Initiative** en una Epic, y gestionar la misma asociación desde el
  **Planning Context** de la Initiative.

Cada cambio pasa por Core (los mismos contratos que usan la CLI y MCP), de modo que los artifacts
permanecen canónicos e interoperables. Las ediciones son **solo de metadatos**: nunca cambian un estado
de lifecycle, y la finalización de un Plan o Epic siempre queda bajo aprobación humana. Las referencias
se validan (se rechazan dependencias de Epic inválidas o circulares y milestones no definidos en el Plan
seleccionado), un milestone referenciado por una Epic no puede eliminarse ni renombrarse, y una edición
concurrente del mismo artifact se detecta mediante una huella de revisión para no guardar en silencio un
formulario obsoleto.

> Asociar una Initiative con una Epic también está disponible desde la CLI (`kaddo epic associate`) y
> MCP (`kaddo_associate_initiative_epic`).

### Navegación overview-first

Los detalles de Plan, Epic e Initiative son **overview-first, detail-on-demand**. En lugar de una columna
larga, cada página abre en un Overview (identidad, lifecycle, métricas clave y las alertas relevantes) con
**secciones por pestañas** para el resto — Milestones, Epics / Relaciones, Evidence & completion y
Activity. Solo la sección activa se renderiza, y la sección se refleja en la URL para que los enlaces
profundos y back/forward la restauren. Las pestañas se navegan por teclado (flechas, Home/End) con roles y
gestión de foco; nada se oculta — cada sección queda a un clic.

Dentro de esas secciones los datos extensos se revelan de forma progresiva, sin escribir ni recalcular por
consultarlos:

- **Evidence & completion** encabeza con un resumen (readiness, entrega, conteos de criterios, motivos
  críticos) y luego permite filtrar criterios por estado y **seleccionar un milestone a la vez** — los
  milestones no se despliegan todos a la vez. `Record evidence` se mantiene sobre el criterio exacto y
  conserva su milestone, revision guard y estado; completar es siempre una acción humana explícita.
- **Activity (colaboración)** muestra primero responsabilidad declarada, disponibilidad Git y conteos, y
  luego una lista acotada de commits y trazabilidad con "show more" — nunca ~100 filas al abrir.
  Responsabilidad declarada y actividad Git observada se mantienen separadas; "0 linked commits" nunca
  implica que no hubo trabajo.
- **Manage milestones** es un índice compacto con edición focalizada de un milestone a la vez (agregar,
  seleccionar, editar, reordenar, quitar), preservando ids, orden y la evidencia de exit criteria
  registrada, con avisos de cambios sin guardar y de conflicto de revisión.
- En el **Overview** de Planning, Planning checks y Milestones & outcomes muestran un resumen acotado con
  "show all", de modo que nunca empujan a Plans/Epics/Initiatives fuera de vista; se reutiliza el
  explorador de findings de WI-082/083, sin duplicarlo.

Un success o exit criterion es canónicamente una cadena. Un artifact histórico que guarda un valor no
textual se **diagnostica como ilegible** (se cuenta, se muestra aparte) en lugar de renderizarse como el
literal `[object Object]` o tratarse como criterio verificado — un valor estructurado con un campo de texto
reconocible se recupera, cualquier otro se omite, y el origen nunca se reescribe.

### Seguimiento de milestones y diagnóstico de calidad de datos

En un Plan, la sección **Milestones** es un índice compacto orientado a decisiones: una fila por hito con su
id, título, Epics vinculadas (cuando una Epic declara `milestone:`) y **verificados / total** tomado del
*mismo* evaluador de completion que usa la pestaña Evidence & completion — nunca un segundo motor ni un
porcentaje de avance. Al seleccionar un hito se expande **uno a la vez** para mostrar sus exit criteria con
el estado que emite Core (`passed`, `failed`, `not-verified`, `manual-review-required`, ambiguo, stale), la
evidencia registrada y las Epics vinculadas. Un hito sin exit criteria se muestra como estado vacío
explícito — nunca se interpreta como `0/0` completo.

Desde un criterio, `Record evidence` abre el **único** drawer de evidencia compartido llevando el plan, el
milestone y el criterio exacto; al guardar, el resultado se actualiza en su lugar y se conserva el mismo
hito, preservando el guard de revisión y el manejo de conflictos `409`. Un enlace
`Review in Evidence & completion →` lleva a la revisión completa mediante el hash de sección existente. El
índice de milestones es de solo lectura: consultar, expandir o filtrar nunca escribe Markdown ni registra
evidencia.

El diagnóstico de ilegibles es **accionable y distinto** de un `not-verified` legítimo: un elemento
ilegible nombra el campo de origen (`milestones[].exit_criteria` o `success_criteria`) y su cantidad, y
pide una corrección en Markdown — se excluye de la verificación, nunca se muestra el objeto crudo y nunca
se convierte en silencio en un criterio válido.

**Procedencia de asociaciones (solo lectura).** Un Work Item pertenece a una Epic por una única resolución
canónica, `workItemsInEpic`: **directa** cuando el Work Item declara `epic:`, o **indirecta** cuando declara
un `initiative:` cuya Initiative declara ese `epic:`. La unión se **deduplica por id**, de modo que un Work
Item alcanzable por ambas rutas se cuenta una sola vez. Los Work Items independientes (sin `epic` ni
`initiative`) y las referencias históricas `materialized_as` ambiguas conservan su clasificación honesta y
**nunca** se vinculan automáticamente, y una relación nunca se infiere de `source`, títulos, orden de un
roadmap ni anotaciones. Para auditar el conjunto exacto de una Epic, se consulta su lista de Relations (ya
deduplicada) o se inspeccionan los campos canónicos; una diferencia de conteo entre un roadmap y la vista
se reconcilia **comparando ids y procedencia**, no asumiendo que un número es el correcto. Para un proyecto
como Wasma esa reconciliación es un paso separado y de solo lectura en ese repositorio — Kaddo diagnostica
y explica, no reescribe asociaciones históricas.

### Overview orientado a acciones y navegación contextual

El **Overview** de Planning encabeza con una línea de estado compacta y un bloque **What's next** —hasta tres
acciones canónicas— antes del diagnóstico completo. Cada acción se deriva **solo** de una señal verificable
(un finding de atención o la readiness basada en evidencia de una entidad), muestra un verbo, el artefacto de
destino, una razón canónica y un CTA contextual, y no inventa nada: si ninguna señal es accionable, el bloque
queda honestamente vacío. La prioridad es determinista: **(1)** problemas estructurales resolubles
(referencias rotas o ambiguas), **(2)** revisión de evidencia o de milestone cuando las precondiciones se
cumplen, **(3)** una decisión humana de completion para la que una entidad está lista, **(4)** trabajo activo.
Una **dependencia pendiente legítima se muestra como contexto de bloqueo, nunca como un incidente a
“arreglar”** —una cadena de epics bloqueadas por dependencias se lee como secuenciación, no como una lista de
errores—. Aparece como máximo una acción por artefacto, de modo que un artefacto ruidoso nunca llena la lista.

Los findings completos, las dimensiones separadas, los filtros, la agrupación y el explorador de atención
siguen a un clic bajo **Diagnostics** —nada se oculta ni se suma en un único puntaje—.

Abrir una Epic, Initiative o Work Item **desde Planning** conserva un camino de retorno en la URL (un
parámetro de búsqueda `from`), de modo que un breadcrumb muestra la ubicación canónica —con un **milestone
embebido en su Plan**, no como ruta propia— y un enlace Atrás restaura la pestaña y el filtro de origen
exactos. Como el contexto vive en la URL, los deep links, la recarga y Atrás/Adelante del navegador funcionan,
y las rutas globales `/initiatives/:id` y `/work-items/:id` siguen resolviendo sin contexto de Planning. Un
proyecto sin Plans ni Epics, o un Work Item independiente, muestra su cadena real (más corta) —nunca un padre
inventado—.

## Execution Insights

El **Overview** de Planning presenta además una vista **de solo lectura** de ejecución que convierte las
señales que Core ya calcula en información para decidir, sin inventar métricas ni duplicar reglas de
dominio. Responde *¿cómo vamos?, ¿qué necesita atención?, ¿qué resultados hemos demostrado?* — y nunca
escribe nada.

Mantiene las tres dimensiones **separadas** (sin porcentaje global ni score único de salud):

- **Planning Coverage** — candidates de Initiatives materializados vs total.
- **Delivery Progress** — Work Items **distintos** por estado de lifecycle (deduplicados por id entre
  asociaciones Initiative/Epic/Plan; los Work Items independientes se cuentan aparte, nunca forzados a
  una jerarquía).
- **Outcome Verification** — success criteria declarados vs evidencia registrada (reutilizando el motor
  de verificación de WI-078/WI-079 — sin verificador paralelo), con `passed` / `failed` /
  `not-verified` / `manual-review` / `ambiguous` / `stale` por separado. Un delivery completado cuyo
  outcome no está verificado **no** está terminado.

Tres **indicadores** de atención resumen familias distintas (nunca sumadas): **blocking issues**
(dependencias bloqueadas, relaciones rotas y provenance), **outcome needs verification** y **milestones
needing review** (exit criteria pendientes, fallidos o ambiguos — nunca inferidos del estado del Epic).

Una **Needs attention** lista señales deterministas y explicadas — `dependency`,
`incomplete-delivery`, `pending-candidates` (señal de cobertura, no bloqueo de ejecución),
`unverified-outcome`, `provenance` y `risk` declarado (los riesgos declarados son una categoría separada
de los bloqueos detectados; sin score de riesgo inventado). Cada entrada lleva su artifact, una razón
concreta y un enlace al detalle canónico, y se filtra por tipo de señal y tipo de artifact. La
**completion readiness** (`READY_TO_COMPLETE` / `READY_WITH_EXCEPTIONS` / `NEEDS_WORK` / `BLOCKED`) se
muestra **distinta** del lifecycle `completed` — "ready" significa que puede pedirse aprobación humana,
no que la entidad esté cerrada. Cuando un denominador es cero, la vista muestra "sin datos" en lugar de
un 0% fabricado.

En el Overview la cola es un **resumen compacto** — como máximo cinco hallazgos o grupos al inicio, con
el total honesto de hallazgos y de artifacts afectados — de modo que Delivery Plans, Epics e Initiatives
permanecen visibles. **View all findings** abre un **explorador de atención** de solo lectura (un drawer
in situ, sin nueva navegación) que filtra por tipo de señal, tipo de artifact y severidad, agrupa por
artifact sin perder los hallazgos individuales y mantiene los conteos honestos al filtrar. Cada hallazgo
muestra su artifact, un diagnóstico, un `impact` y un **siguiente paso** concreto (`Review Initiative`,
`Inspect reference`, `Review outcome evidence`…) — una acción de revisión, nunca una reparación
automática. No hay dismiss, resolver ni cambio de estado.

### Diagnóstico de provenance

El `materialized_as` de un candidate es una referencia **1:1** — exactamente un Work Item id canónico.
Core clasifica cada una (reutilizando el motor de WI-078/WI-079, sin verificador paralelo) en lugar de
comparar la cadena completa:

- **válida** — resuelve a un Work Item existente y asociado de forma consistente;
- **faltante** — un id canónico único que no existe → defecto de integridad **bloqueante**;
- **mismatch** — el Work Item existe pero pertenece a otra Initiative → **bloqueante**;
- **ambigua (histórica)** — un valor que no es un único id canónico (p. ej. una cadena compuesta como
  `AN-005, AN-006, AN-007`) → una **advertencia**, nunca presentada como un Work Item faltante.

Una referencia ambigua **no se reescribe, divide ni migra**, y reconocer su forma no la marca como
validada: no cuenta como cobertura validada y mantiene la Initiative fuera de `READY` (`NEEDS_WORK`)
hasta inspeccionarla. Los defectos reales de faltante/mismatch siguen bloqueando. `materialized_as`
permanece 1:1 — esto es un diagnóstico, no un cambio de contrato.

**Cobertura honesta.** Planning Coverage distingue la materialización **declarada** (`materialized`, el
campo está puesto) de las referencias **validadas** (`validated`, la referencia resuelve). Cuando
difieren, el Overview muestra ambas ("41 declared · 38 validated") con `unresolved = materialized −
validated`; una referencia declarada nunca se presenta como integridad verificada.

La proyección se sirve de solo lectura en `GET /api/v1/admin/planning/insights`.

### Métricas consistentes y jerarquía Initiative-first

El resumen de estado de Planning y Execution Insights leen **una** proyección de entrega deduplicada
(`computePlanningDelivery`), de modo que un Work Item se cuenta una sola vez por id entre relaciones
solapadas y las cifras no pueden contradecirse. Los Work Items bloqueados por una dependencia sin terminar
—**incluidos los asociados directamente a una Initiative sin Epic** (la suma anterior, solo por Epics,
informaba 0 en proyectos Initiative-first)— se mantienen distintos de `Blocking issues`, que son *hallazgos*
de integridad y dependencia; el Overview orientado a acciones muestra el conteo de bloqueados en su línea de
estado y el desglose completo bajo Diagnostics. Los Work Items independientes son un universo aparte,
mostrado de forma distinta y nunca forzado a una jerarquía.

Cuando hay referencias declaradas no resueltas, la cobertura destaca la cifra **validada**
(`validated / totalCandidates`) y mantiene visible la declarada como detalle — una referencia declarada
nunca se presenta como integridad verificada. `Lifecycle` (el estado persistido, p. ej. `completed`) y
`Current evidence review` (la readiness actual) se muestran como hechos **distintos**; un `completed`
persistido cuyas comprobaciones actuales no se satisfacen se etiqueta como *historical evidence gap* —
contexto, nunca una reapertura ni un recálculo. Bajo Diagnostics, el resumen de Needs Attention agrupa por
**artifact** (como máximo cinco artifacts distintos, cada uno con su conteo de hallazgos) mientras los
totales globales siguen exactos, y el detalle de readiness se pliega tras un resumen compacto. Un proyecto
sin Plans ni Epics nunca se fuerza a una jerarquía: el Overview encabeza con sus próximas acciones reales y
un resumen compacto de estructura ("Organized with Initiatives — Plans and Epics are optional"), y las
acciones de crear siguen disponibles.

## Knowledge Graph

Plans, milestones y Epics aparecen como nodos del grafo; las relaciones declaradas se vuelven aristas
`belongs_to` (epic→plan, milestone→plan, initiative→epic) y `depends_on` entre Epics — solo relaciones
declaradas, nunca inferidas.
