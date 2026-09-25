---
title: Integraciones
description: Conecta Kaddo con sistemas de trabajo externos (GitHub Issues, Jira, Azure DevOps, Linear, …) mediante una Integration Adapter Foundation agnóstica del proveedor — sin convertir ningún sistema externo en la fuente de verdad.
---

Muchos equipos capturan primero sus solicitudes en un sistema externo — GitHub Issues, Jira, Azure
DevOps, Linear. La **Integration Adapter Foundation** de Kaddo conecta con esos sistemas a través de
una única frontera agnóstica del proveedor y normaliza lo que encuentra en un modelo neutral que
Kaddo puede consumir.

La regla que rige todo aquí:

> Las herramientas externas pueden **originar** trabajo y **aportar** contexto. Kaddo normaliza esa
> información, conserva su trazabilidad y mantiene su **propio Work Item como fuente de verdad** para
> el desarrollo.

```text
Sistema de trabajo externo
        ↓
Integration Adapter        (normaliza los datos del proveedor)
        ↓
External Work Item normalizado
        ↓
Import Preview             (solo lectura)
        ↓
Confirmación humana
        ↓
Kaddo Core                 (crea un Draft canónico)
        ↓
Work Item canónico         ← la fuente de verdad
```

## Integration Adapters vs Agent Adapters

Kaddo usa la palabra *adapter* en dos lugares no relacionados. Mantenlos distintos:

| | Proyecta hacia | Ejemplos |
|---|---|---|
| **Agent Adapters** | archivos nativos de agentes | `AGENTS.md`, `CLAUDE.md` |
| **Integration Adapters** | sistemas de trabajo externos | GitHub, Jira, Azure DevOps, Linear |

Esta página trata de los **Integration Adapters**.

## Arquitectura

```text
                 @kaddo/core           (dominio: Work Items, Knowledge, Graph)
                      ▲
                      │ modelo normalizado
                      │
              @kaddo/integrations      (contrato · registry · modelos · config · errores)
                      ▲
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       GitHub        Jira    Azure DevOps    (adapters concretos futuros)
```

- **`@kaddo/core` es agnóstico del proveedor.** Nunca importa un SDK de vendor ni conoce campos de
  GitHub, tipos de issue de Jira o estados de Linear.
- **`@kaddo/integrations`** posee el contrato de adapter, el registry, los modelos normalizados, el
  modelo de configuración y de referencias a secretos, el modelo de errores/estado, el mapeo del
  import preview y un adapter de referencia. **No** contiene reglas de dominio de Work Items,
  semántica del Graph ni reglas de lifecycle — eso vive en Core.
- El **integration service** (en la capa CLI/Admin) es el único lugar donde las lecturas externas
  cruzan hacia Core, y el único lugar donde un import materializa un Work Item.

## Contrato del adapter

```ts
interface IntegrationAdapter {
  readonly id: string
  readonly metadata: IntegrationAdapterMetadata
  readonly capabilities: IntegrationCapabilities
  verifyConnection(context): Promise<ConnectionResult>
  listWorkItems(request): Promise<ExternalWorkItemPage>   // paginado
  getWorkItem(request): Promise<ExternalWorkItem | null>
}
```

Los adapters **no** se asumen equivalentes. Cada uno declara sus **capabilities** para que la UI
pueda preguntar *"¿qué puede hacer este adapter?"* en vez de asumir que todo está soportado. La
línea base de VS-102 exige `verifyConnection`, `list`, `read` e `import`; `write`, `statusSync`,
`comments` y `webhooks` son capacidades futuras.

Los proveedores se resuelven mediante un **registry** — nunca con un `switch (provider)` hardcoded.
Agregar un proveedor es un registro, no un cambio en Core, Admin o MCP.

## Modelo normalizado

Cada elemento del proveedor se convierte en un `ExternalWorkItem` neutral — *lo que Kaddo necesita*,
no una copia fiel del modelo del proveedor. El detalle específico puede viajar en `rawMetadata` pero
nunca domina.

Cada elemento tiene una **identidad externa** estable — `integration + externalId` — usada para la
detección de duplicados y el linking. Nunca depende del título visible.

## Configuración y secretos

Declara integraciones en `.kaddo/integrations.yml`. La configuración solo lleva cómo **encontrar**
una credencial, nunca la credencial en sí:

```yaml
integrations:
  - id: github-dotear
    adapter: github
    enabled: true
    config:
      owner: trycatch-tv
      repository: dotear
    credentials:
      token_env: GITHUB_TOKEN     # una referencia — se resuelve solo en runtime
    secrets:
      apiKey: github-dotear.apiKey   # VS-103: se resuelve vía SecretProvider
```

Un secreto inline (`token: ghp_…`) es **rechazado** por la validación. Los secretos se resuelven
desde el entorno solo durante la ejecución y **nunca** aparecen en Work Items, Knowledge, el Graph,
context packs, la API de Admin, la salida de MCP, logs ni telemetría.

### Gestión de secretos (VS-103)

Kaddo soporta dos mecanismos para la gestión de secretos:

1. **Variables de entorno** (VS-102): las credenciales referencian una variable vía
   `token_env: NOMBRE_VAR`.
2. **SecretProvider** (VS-103): los secretos se almacenan en `.kaddo/.secrets.json` (gitignored,
   nunca committed) mediante una interfaz `SecretProvider` pluggable. El YAML almacena solo una
   referencia lógica (e.g. `github-dotear.apiKey`), nunca el valor.

Un **CompositeResolver** intenta primero el SecretProvider local y luego las variables de entorno.
Ambos mecanismos funcionan juntos — los secretos locales tienen prioridad, las variables de entorno
sirven de fallback.

Admin muestra los secretos como **"Configurado"** o **"No configurado"** — los valores nunca se
envían de vuelta al navegador después de almacenarlos. Los adapters declaran qué secretos necesitan
vía los metadatos `secretSchema`, pero nunca saben dónde ni cómo se almacenan.

## Gestión desde Admin

Kaddo Admin provee gestión CRUD completa de integraciones — sin necesidad de editar el YAML a mano:

- **Crear** — elige un tipo de adapter, llena formularios dinámicos generados a partir del
  `configSchema` y `secretSchema` del adapter, y guarda.
- **Editar** — actualiza la configuración o reemplaza secretos de una integración existente.
- **Eliminar** — elimina una integración y sus secretos almacenados.
- **Habilitar / Deshabilitar** — activa o desactiva una integración sin eliminar su configuración.
- **Verificar** — prueba la conexión con un solo clic.

Los formularios dinámicos se generan desde los metadatos del adapter — no hay formularios hardcoded
por proveedor. El archivo YAML sigue siendo la única fuente de verdad: Admin lee y escribe
`.kaddo/integrations.yml` directamente, y CLI y Admin siempre ven el mismo estado.

## Estado y conexión

Dos ejes que nunca deben confundirse: el **estado de conexión de la integración** y el **estado del
lifecycle de un Work Item**. `verifyConnection()` distingue *"adapter instalado"* de *"integración
realmente utilizable"*:

```text
configured · available · unavailable · unauthorized · invalid-config · disabled
```

Los errores se normalizan (`INTEGRATION_UNAUTHORIZED`, `INTEGRATION_RATE_LIMITED`,
`INTEGRATION_TIMEOUT`, `INTEGRATION_UNAVAILABLE`, …). Los mensajes crudos del proveedor nunca se
exponen.

## Semántica del import

Leer no es importar. Ver `EXT-001` **no** crea un Work Item — el import es una acción explícita y
confirmada por una persona:

1. El **preview** (solo lectura) muestra el origen, el captured intent y *"No project files have been
   modified yet."*
2. **Confirmas.** Tú eliges el **tipo** de Work Item Kaddo — nunca se infiere del tipo externo.
3. El **import** reutiliza `createWorkItem` de Core y produce un **Draft** (sin importar el estado
   externo). El origen externo se registra como **provenance**, no como la verdad:

   ```yaml
   source:
     type: external
     provider: github
     integration: github-dotear
     id: "231"
     url: https://github.com/trycatch-tv/dotear/issues/231
   ```

Reimportar la misma identidad externa no crea un duplicado — Kaddo devuelve el Work Item existente.
Tras el import, el refinamiento y el análisis de impacto ocurren sobre el Work Item **Kaddo**, y este
sigue funcionando aunque el proveedor externo deje de estar disponible.

## CLI

```bash
kaddo integrations list                       # integraciones configuradas + capabilities
kaddo integrations status                     # verifica cada una y reporta el estado de conexión
kaddo integrations verify <id>                # verifica una integración
kaddo integrations work-items <id>            # lista elementos externos (paginado)
kaddo integrations work-item <id> <ext-id>    # lee un elemento externo
kaddo integrations import <id> <ext-id> --type <feature|fix|…>   # preview → confirmación → Draft
```

Los comandos de solo lectura soportan `--json`. El import siempre hace preview y pide confirmación
antes de que Core cree algo.

## MCP

`@kaddo/mcp` expone herramientas de solo lectura — `kaddo_integrations_list`,
`kaddo_integrations_status`, `kaddo_integrations_work_items`, `kaddo_integrations_work_item`. Leer un
elemento externo mediante MCP nunca materializa un Work Item Kaddo; el import sigue siendo una acción
confirmada por una persona.

## Adapter de referencia (mock)

Kaddo incluye un adapter **`mock`** determinístico y offline que ejercita todo el contrato — registry,
conexión, listado, paginación, lectura, normalización y simulación de errores — sin red ni
credenciales. Es la referencia contra la que validar un adapter custom.

```yaml
integrations:
  - id: mock-work-source
    adapter: mock
    enabled: true
    config:
      simulate: available   # o unauthorized · rate-limited · unavailable · timeout
```

## Crear un adapter custom

1. **Implementa** el contrato `IntegrationAdapter`.
2. **Declara** tus capabilities con honestidad.
3. **Normaliza** los datos del proveedor a `ExternalWorkItem` (los extras en `rawMetadata`).
4. **Registra** el adapter en el registry.
5. **Valida** la configuración; referencia los secretos por variable de entorno, nunca los guardes.
6. **Nunca** escribas artifacts de Kaddo directamente — devuelve datos normalizados y deja que el
   integration service y Core sean dueños de la materialización.

## Descubrimiento y Filtrado de Work Items Externos

VS-104 agrega **descubrimiento** — la capacidad de consultar todas las integraciones habilitadas y ver
sus work items externos en una vista unificada, sin importar ninguno. Es la capa de "explorar antes de
actuar".

### Descubrimiento

`discoverExternalWorkItems` consulta en paralelo cada integración habilitada que soporte `list`.
Los fallos parciales se aíslan: si una integración falla, las demás devuelven sus resultados.

```bash
kaddo integrations discover                        # descubrir items de todas las integraciones
kaddo integrations discover --types Bug,Feature    # filtrar por tipo
kaddo integrations discover --search billing       # búsqueda de texto
```

Admin expone la vista **External Items**, que muestra los items agrupados por integración con badges
de tipo, indicadores de estado, etiquetas y asignados. Cada item tiene una acción **Import** (el mismo
flujo de confirmación humana de VS-102) y un enlace **Open** a la URL del proveedor.

**Cargar más** — el endpoint de descubrimiento soporta paginación por cursor por integración. Cuando
una integración reporta `hasMore`, la UI muestra un botón **Load more** debajo de la sección de esa
integración. Al hacer clic, obtiene la siguiente página usando el cursor de la integración y agrega
los resultados.

### Filtros de Integración vs Filtros de UI

Los filtros vienen en dos sabores:

| | Persistidos en YAML | Se aplica a |
|---|---|---|
| **Filtros de Integración** | Sí — `.kaddo/integrations.yml` | Cada consulta a esta integración |
| **Filtros de UI** | No — temporales, solo del lado del cliente | La sesión de descubrimiento actual |

Los filtros de integración definen el *alcance* de lo que Kaddo consulta del proveedor (ej. "solo bugs
de la etiqueta `backend`"). Los filtros de UI refinan aún más en tiempo de ejecución (ej. "solo los
asignados a Alice").

Ambos comparten la misma forma `ExternalWorkItemFilters`:

```yaml
integrations:
  - id: github-dotear
    adapter: github
    enabled: true
    filters:
      statuses:
        - Open
        - In Progress
      labels:
        - backend
```

El servicio los fusiona antes de llamar al adapter — los campos del overlay (UI) tienen prioridad
sobre los campos base (integración) cuando están presentes.

### Capacidades de Filtrado

Cada adapter declara qué campos de filtro soporta vía `filterCapabilities` en sus metadatos. Admin
usa esto para renderizar solo los controles de filtro que el adapter puede manejar — los filtros no
soportados no se muestran, no se ignoran silenciosamente.

## Configuración de Integraciones Dirigida por Proveedor

VS-103A introduce un flujo de creación **dirigido por el proveedor**: en lugar de llenar manualmente
campos específicos del adapter, Admin genera todo el formulario a partir de los metadatos del
adapter — sin lógica hardcoded por proveedor.

### Catálogo de Proveedores

El flujo de creación comienza con una **grilla visual** de proveedores disponibles, obtenida
directamente del Integration Registry. Cada tarjeta muestra el ícono, nombre, descripción y
capabilities del adapter. Al seleccionar un proveedor se pasa al paso de configuración.

Agregar un nuevo adapter al registry lo hace aparecer automáticamente en el catálogo — sin cambios
en Admin.

### Formularios basados en esquema

Cada adapter declara un `configSchema` y `secretSchema` en sus metadatos. Admin renderiza un
formulario dinámico a partir de estos esquemas en tiempo de ejecución. Tipos de campo soportados:

| Tipo | Se renderiza como |
|---|---|
| `string` | Input de texto |
| `url` | Input de URL (con validación) |
| `password` | Input enmascarado |
| `number` | Input numérico |
| `boolean` | Checkbox |
| `select` | Dropdown con `options` |
| `multi-select` | Botones de toggle con `options` |

Cada campo lleva `required`, `label`, `description`, `placeholder`, `options` y `defaultValue`.
La validación se ejecuta contra el esquema antes de guardar — verificación de campos requeridos,
formato de URL, coerción de tipos, pertenencia a opciones.

### Verificar al crear

El flujo de creación incluye un paso **Verificar y Guardar**: tras llenar la configuración y los
secretos, la integración se crea, se configuran los secretos y `verifyConnection` se ejecuta
automáticamente. Si la verificación falla, la integración se elimina y se muestra el error — así
no quedan integraciones rotas.

### Íconos de proveedor

Los adapters declaran un campo `icon` en sus metadatos. Admin lo mapea a un ícono visual vía
`ProviderIcon` — un mapeo simple basado en emojis que es extensible sin assets externos.

### Múltiples instancias

El mismo adapter puede respaldar múltiples integraciones — cada una con configuración, secretos y
estado de conexión independientes. Por ejemplo, dos integraciones GitHub apuntando a distintos
repositorios.

### Adapter no disponible

Si un adapter ya no está registrado pero su configuración persiste, Admin muestra la integración
con una etiqueta "Adapter no disponible" y oculta el botón Verificar. La configuración se preserva
— el adapter puede re-registrarse después sin perder datos.

## Importación de Work Items Externos y Entrega a Refinamiento

VS-105 añade una acción de **importación** iniciada por el usuario que convierte un External Work Item
descubierto en un Draft Work Item nativo de Kaddo — preservando la proveniencia completa y una
instantánea original del estado externo al momento de la importación.

### Pipeline de importación

1. **Verificación de habilitación** — si la integración está deshabilitada, la importación se rechaza inmediatamente.
2. **Lock concurrente** — un lock en proceso previene dos importaciones simultáneas del mismo ítem
   (protege contra la condición de carrera TOCTOU entre verificación de duplicados y creación del Work Item).
3. El usuario selecciona un ítem externo en la vista de descubrimiento y elige un tipo de Work Item Kaddo.
4. Kaddo re-lee el ítem desde el adapter para asegurar frescura.
5. Se ejecuta verificación de duplicados contra `integrationId#externalId` — si ya fue importado, se
   retorna el Work Item existente (importación idempotente, no se crea duplicado).
6. Se crea un Draft Work Item a través del boundary estándar `createWorkItem` del Core.

El pipeline es **neutral al proveedor**: una vez normalizado a `ExternalWorkItem`, el Core no tiene
conocimiento del proveedor original.

### Instantánea original

Al momento de la importación, el título, descripción, tipo, estado, etiquetas, asignado y timestamps
del ítem externo se capturan como `original_snapshot` en el frontmatter del Work Item. Esta
instantánea es inmutable — registra cómo lucía el ítem externo cuando fue importado,
independientemente de cambios posteriores en cualquier lado.

### Proveniencia

Cada Work Item importado lleva trazabilidad completa en sus metadatos `source`:

| Campo | Valor |
|---|---|
| `type` | `external` |
| `provider` | Id del adapter (ej. `mock`, `github`) |
| `integration` | Id de integración Kaddo |
| `id` | Id del ítem externo |
| `url` | Enlace al ítem externo |
| `imported_at` | Timestamp ISO de importación |
| `external_updated_at` | Última actualización del ítem externo al importar |

### Badge de importado en descubrimiento

Tras importar un ítem, la vista de descubrimiento muestra un badge **Imported** con un enlace al Work
Item de Kaddo. El botón Import se oculta para ítems ya importados.

### Proveniencia enriquecida en detalle de Work Item

La vista de detalle del Work Item muestra una sección **External provenance** (proveedor, ID externo,
integración, timestamps y un enlace "Open in provider") y una sección **Original snapshot** (título,
descripción, tipo, estado, etiquetas, asignado).

### Entrega a refinamiento

Los Work Items importados entran al pipeline de refinamiento estándar de Kaddo. La instantánea y la
proveniencia sobreviven al refinamiento — no existe lógica de refinamiento específica por proveedor.

### Resiliencia

- Eliminar la integración fuente **no** afecta a los Work Items importados.
- Si el adapter deja de estar disponible, los Work Items importados siguen funcionando.
- La importación es una **instantánea única**, no sincronización continua.

## Jira Adapter (VS-106)

El primer adapter de producción conecta Kaddo con **Jira Cloud** usando email + API Token (Basic Auth).
Es completamente neutral al proveedor desde la perspectiva de Kaddo — Admin, Core y el pipeline de
refinamiento no necesitan lógica específica de Jira.

### Configuración

```yaml
integrations:
  - id: my-jira
    adapter: jira
    enabled: true
    config:
      baseUrl: https://mycompany.atlassian.net
      email: user@example.com
    secrets:
      apiToken: my-jira.apiToken
```

| Campo | Tipo de esquema | Requerido | Descripción |
|---|---|---|---|
| `baseUrl` | `url` | Sí | URL de la instancia Jira Cloud |
| `email` | `string` | Sí | Email de la cuenta Atlassian |
| `apiToken` | `password` (secreto) | Sí | Jira API Token (nunca se almacena en YAML) |

### Capabilities

| Capability | Soportado |
|---|---|
| `list` | Sí |
| `read` | Sí |
| `import` | Sí |
| `write` | No (futuro) |

### Generación de JQL a partir de filtros

El adapter traduce los `ExternalWorkItemFilters` normalizados a JQL automáticamente:

| Campo de filtro | Cláusula JQL |
|---|---|
| `projects` | `project IN (...)` |
| `types` | `issuetype IN (...)` |
| `statuses` | `status IN (...)` |
| `labels` | `labels IN (...)` |
| `assignees` | `assignee IN (...)` |
| `updatedAfter` | `updated >= "..."` |
| `search` | `(summary ~ "..." OR description ~ "...")` |
| `providerQuery` | JQL crudo agregado directamente |

Los valores se escapan correctamente. Cuando no se proporcionan filtros, el adapter usa por defecto
`updated >= -30d ORDER BY updated DESC` (el endpoint de búsqueda mejorada de Jira requiere JQL acotado).

La capability `providerQuery` se etiqueta como **"JQL"** en Admin, para que los usuarios sepan que
pueden escribir Jira Query Language crudo cuando los filtros normalizados no son suficientes.

### ADF a Markdown

Jira Cloud almacena las descripciones en **Atlassian Document Format** (ADF) — una estructura JSON
enriquecida. El adapter convierte ADF a Markdown en el momento de la normalización para que el resto
de Kaddo trabaje con texto plano.

Nodos ADF soportados: `doc`, `paragraph`, `heading` (niveles 1–6), `bulletList`, `orderedList`,
`listItem`, `blockquote`, `codeBlock` (con lenguaje), `rule`, `hardBreak`, `text` con marks
(`strong`, `em`, `code`, `strike`). Los nodos de media se omiten de forma segura.

### Normalización de errores

| Estado HTTP | Código de error de integración |
|---|---|
| 400 (JQL) | `INVALID_QUERY` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 410 | `UNAVAILABLE` |
| 429 | `RATE_LIMITED` |
| 500+ | `UNAVAILABLE` |
| AbortError | `TIMEOUT` |

Una respuesta 400 cuyo cuerpo contiene palabras clave de JQL/query/field se mapea a `INVALID_QUERY`
para que la UI pueda mostrar un mensaje específico sobre la sintaxis de filtros. Otros errores 400
caen a `PROVIDER_ERROR`.

### Filtro de proyectos

VS-106 añade un campo `projects` al modelo de filtros normalizado (`ExternalWorkItemFilters`). Este
es un concepto común entre proveedores (Jira tiene proyectos, GitHub tiene repos, Azure DevOps tiene
proyectos) y evita que los usuarios recurran a `providerQuery` para filtrar por proyecto básico.

## Fuera de alcance (se construye sobre esta foundation)

La sincronización bidireccional, el polling, los webhooks,
la sincronización de estado/comentarios/adjuntos, el push o la actualización de issues externos y la
UI de OAuth externo **no** forman parte de la foundation. Se construyen encima — sin rediseñar el
modelo de integración.
