---
title: Project Resources
description: Modela sistemas externos (bases de datos, cloud, APIs, colas…) como conocimiento técnico de primera clase y vincúlalos a Work Items por rol. Es conocimiento de solo lectura — Kaddo nunca se conecta a ellos ni guarda secretos.
---

Gran parte de un sistema vive fuera del repositorio — una base de datos Supabase, una cuenta AWS, un
topic de Kafka, una API de terceros. Los **Project Resources** modelan esos sistemas externos como
conocimiento técnico de primera clase, para que humanos y agentes puedan responder: qué sistemas
externos usa el proyecto, por qué, en qué ambientes, cómo se accede y qué límites hay.

Los Project Resources son **conocimiento de solo lectura**. Kaddo nunca se conecta al sistema, nunca
ejecuta una interfaz, y nunca guarda ni resuelve valores de credenciales — solo referencias (el nombre
de una env var o de un secreto).

:::note[Resource ≠ Access Interface ≠ Module]
- Un **resource** es el sistema externo estable (p. ej. "Supabase Main Database").
- Una **access interface** es un mecanismo para alcanzarlo (CLI, MCP, SQL, API, SDK, IaC, Console).
- Un **module** (`affected_modules`) es parte de tu propio código. Los resources son sistemas externos
  — mantenlos separados; no conviertas un servicio en módulo solo para relacionarlo con un Work Item.
:::

## Definir un recurso

Los resources viven bajo `knowledge/tech/resources/` con `type: project-resource`. El mínimo es solo
identidad, tipo y provider; crece solo cuando necesitas interfaces o boundaries.

```markdown
---
type: project-resource
id: RES-supabase-main
title: Supabase Main Database
resource_type: database        # database | cloud | api | queue | storage | repository | platform | service | other
provider: supabase
environments: [development, production]
access_interfaces:
  - type: cli                  # cli | mcp | api | sql | sdk | iac | console | other
    tool: supabase
    purpose: migraciones y desarrollo local
    operations: [migrations, schema-inspection]
  - type: mcp
    provider: Supabase
  - type: sql
    tool: psql
access_boundaries:
  development: [read, write, migrations]
  production: [read]
authentication:
  mode: external
  refs: [SUPABASE_ACCESS_TOKEN]   # solo NOMBRES de referencia — nunca valores
---

# Purpose

Almacena usuarios, proyectos y datos de producto.
```

### Frontera de seguridad

Un recurso **nunca** guarda credenciales. Permitido: el **nombre** de una credencial/env var/secreto,
el mecanismo de auth, un rol requerido, un boundary. No permitido: tokens, passwords, llaves privadas,
connection strings con secretos, credenciales de DB. Kaddo descarta defensivamente cualquier entrada de
`authentication.refs` que parezca un valor (p. ej. `NAME=value`), así un error no filtra nada.

## Vincular resources a Work Items

Un Work Item declara los resources con los que se relaciona, por **rol**, en su frontmatter — separado
de `affected_modules`:

```yaml
affected_modules:
  - api
resources:
  - id: RES-supabase-main
    role: affected        # affected | implementation | validation | delivery
  - id: RES-aws-platform
    role: validation
```

| Rol | Significado |
|---|---|
| `affected` | el estado/config/schema del recurso cambia por el Work Item |
| `implementation` | necesitas interactuar con él para implementar |
| `validation` | lo necesitas para verificar el outcome |
| `delivery` | participa en deployment/release |

Los resources son **opcionales**: un cambio de CSS no necesita ninguno. En refinement, la skill
`work-item-refinement` pregunta si el cambio observa, modifica, valida o despliega sobre un recurso
conocido — sin inventar recursos que no estén respaldados por el conocimiento del proyecto.

## Dónde aparecen los resources

- **CLI**: `kaddo resources list` y `kaddo resources get <id>` (con `--json`). Solo lectura, sin secretos.
- **MCP**: los tools `kaddo_list_resources` y `kaddo_get_resource` devuelven lo mismo, sin secretos.
- **Implementation Handoff**: una sección "Relevant Resources" lista solo los resources del Work Item
  con su rol, purpose, interfaces y boundaries. **Informa** al agente — nunca conecta ni ejecuta nada,
  y una interfaz declarada no significa que esté instalada o conectada.
- **Knowledge Graph**: un recurso es un nodo `project-resource`; los roles del Work Item producen
  aristas `affects`, `uses`, `validates_with` y `delivers_through`, con provenance desde el Work Item.
- **Descripción del proyecto**: `tech/current-state.md` o `tech/codebase.md` pueden listar resources
  brevemente para explicar la arquitectura, sin duplicar la definición completa:

  ```markdown
  ## External Resources

  - RES-supabase-main — base de datos principal de la aplicación
  - RES-aws-platform — infraestructura de runtime
  ```

## Evidence

La Implementation Evidence puede referenciar validaciones hechas sobre un recurso — por ejemplo
"migración aplicada en development" o "schema esperado verificado". La evidencia describe la
**validación**, nunca el contenido del recurso: ni registros de base de datos, ni dumps de queries, ni
valores de credenciales, ni tokens.

## Gestionar recursos (crear, actualizar, eliminar)

No hace falta escribir el Markdown a mano. Los recursos se pueden crear, actualizar y eliminar desde el
CLI, el Admin o un LLM vía MCP — todos convergen en un único contrato de Core, así que las reglas son
las mismas en todas partes, y el artifact bajo `knowledge/tech/resources/` sigue siendo la fuente de
verdad.

**CLI:**

```bash
kaddo resources create --title "Supabase Main" --type database --provider supabase   # o sin flags, interactivo
kaddo resources update RES-supabase-main --purpose "Base de datos principal de la app"
kaddo resources delete RES-supabase-main      # lista qué lo referencia y pide confirmación (--yes para saltarla)
```

**MCP / LLM:** los tools `kaddo_create_resource`, `kaddo_update_resource` y `kaddo_delete_resource`
siguen un flujo preview-luego-confirm: sin `confirm` devuelven un preview (y, para delete, qué lo
referencia) y no escriben nada; con `confirm: true` Core persiste el cambio. El agente propone; un
humano confirma. El architecture-agent también puede sugerir **candidatos** a recurso a partir del
conocimiento existente — nunca los crea en silencio.

**Admin:** la sección **Resources** lista recursos (agrupados por scope) y permite crear, inspeccionar,
editar y eliminar. Al eliminar, primero muestra qué lo referencia; esas referencias nunca se eliminan
automáticamente.

Eliminar un recurso solo borra su propio artifact — las entradas `resources:` de los Work Items que lo
apuntaban quedan intactas.

## Scope multirepo

En un proyecto multirepo un recurso puede declarar un **scope de ownership** — el sistema completo, o un
módulo concreto — sin mover su artifact fuera del repo core (el catálogo canónico siempre vive en
`knowledge/tech/resources/`):

```yaml
scope:
  type: module
  module: orders-api
```

Un recurso system-scoped puede ser **usado por** varios módulos sin duplicarse — eso es una dependencia,
distinta del ownership:

```yaml
scope:
  type: system
modules: [orders-api, billing-worker]
```

Los ids de módulo se validan contra `.kaddo/modules.yml` cuando existe (los módulos desconocidos se
señalan, no se aceptan en silencio). En el Knowledge Graph esto produce aristas
`module ──depends_on──→ resource`, y el Admin agrupa los recursos por scope y muestra los compartidos
como "used by" sus módulos.

## Qué no es

Los Project Resources son conocimiento, no ejecución. Kaddo no ejecuta comandos CLI, no se conecta a
Supabase o AWS, no instala MCP servers, no corre SQL, no provisiona infraestructura, no guarda
credenciales ni gestiona un secrets manager. Para proveedores externos de *delivery/work-management*
(Jira, GitHub Issues, Azure DevOps) mira [Integraciones](/es/integrations/) — es un concepto distinto.
