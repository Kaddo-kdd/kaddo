# Reconciliación read-only de asociaciones Epic → Work Item (Wasma)

> Diagnóstico de solo lectura producido por WI-086. No modifica ningún archivo del proyecto Wasma.
> Su objetivo es explicar la ruta canónica de asociación y entregar hallazgos para la **Etapa B** de
> reconciliación, que es trabajo separado en el repositorio de Wasma.

## 1. Ruta canónica de asociación

Un Work Item pertenece a una Epic por una única resolución, `workItemsInEpic(dir, epicId)`:

- **Directa** — el Work Item declara `epic: <EP>`.
- **Indirecta** — el Work Item declara `initiative: <INI>` y esa Initiative declara `epic: <EP>`.

La unión de ambas rutas se **deduplica por id**: un Work Item alcanzable por las dos vías se cuenta una sola
vez. No se infiere pertenencia desde `source`, títulos, orden del roadmap ni anotaciones históricas. Los
Work Items sin `epic` ni `initiative` son **independientes** y nunca se vinculan automáticamente. Las
referencias `materialized_as` ambiguas se conservan como tales (relación 1:1 intacta) y no se reasignan.

## 2. Procedimiento de inspección (local, read-only)

Para auditar el conjunto exacto de una Epic sin escribir nada:

1. Listar los Work Items con `epic:` igual a la Epic (ruta directa).
2. Listar las Initiatives con `epic:` igual a la Epic; para cada una, los Work Items con ese `initiative:`
   (ruta indirecta).
3. Unir por id y deduplicar. El resultado es el conjunto canónico; compararlo con el conteo esperado por id,
   no por cantidad.
4. Clasificar cada diferencia: id presente solo en una fuente, id duplicado por ambas rutas (correcto, se
   cuenta una vez), Work Item independiente contado por error, o referencia `materialized_as` ambigua.

En el Admin, la lista **Relations & delivery** de la Epic ya muestra este conjunto deduplicado; sirve para
contrastar visualmente el resultado del procedimiento.

## 3. Reconciliación EP-005 / EP-008

Expectativas previas reportadas: **7/11** para EP-005/EP-008; la vista mostró **6/12**. Una diferencia de
conteos **no prueba por sí misma un defecto de Kaddo**: hay que comparar ids y procedencia. Ninguno de los
dos conteos se asume correcto de antemano.

Completar la tabla ejecutando el procedimiento de la §2 localmente contra Wasma (los ids reales no se
copian a este repositorio, para no filtrar conocimiento privado):

| Epic | Id esperado | Id efectivo (canónico) | Procedencia (directa/indirecta/ambas) | ¿Duplicado resuelto? | Nota |
|---|---|---|---|---|---|
| EP-005 | _(pendiente)_ | _(pendiente)_ | _(pendiente)_ | _(pendiente)_ | _(pendiente)_ |
| EP-008 | _(pendiente)_ | _(pendiente)_ | _(pendiente)_ | _(pendiente)_ | _(pendiente)_ |

Para cada fila, registrar: ids presentes solo en la expectativa, ids presentes solo en el conjunto canónico,
ids alcanzados por ambas rutas (se cuentan una vez) y cualquier Work Item independiente o referencia
ambigua que explique la diferencia.

## 4. Hallazgos para la Etapa B (Wasma)

- La corrección de asociaciones mal declaradas (si las hubiera) se realiza **en el repositorio de Wasma**,
  editando el `epic:`/`initiative:` del Work Item correspondiente, con evidencia.
- La corrección de exit/success criteria no textuales (mapas YAML) también es trabajo de Wasma: convertir
  el valor a una cadena canónica en el Markdown de origen. Kaddo los diagnostica como ilegibles; no los
  repara automáticamente.
- Este WI no modifica los 79 Work Items, el roadmap, los milestones ni las Initiatives de Wasma.
