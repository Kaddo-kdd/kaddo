---
title: Módulos multirepo
description: Descubre y mapea repos secundarios como módulos vivos de un sistema.
---

Kaddo representa no solo el repo principal de arquitectura, sino también los **repos
secundarios** (frontend, backend, workers, infra…) como módulos vivos del mismo
sistema.

> **Multirepo vs Knowledge Capsules.** Mapea un repo como módulo cuando tienes acceso y está en
> alcance. Cuando un repo pertenece a otro equipo, tiene acceso restringido o solo necesitas
> contexto de integración, importa una [Knowledge Capsule](/es/knowledge-capsules/) — sin mapeo,
> sin código.

## Roles core y module

Al inicializar un proyecto multirepo, `kaddo init` pregunta por un **rol**
inmediatamente después de seleccionar la estructura multirepo:

- **core**: el repo de arquitectura/orquestador — define el `system.name`, recibe la
  estructura completa de conocimiento (business, product, roadmap, agents, skills) más
  `knowledge/tech/system/system-context.md` y un mapa de módulos.
- **module**: un repo secundario que pertenece a un sistema — recibe solo
  `knowledge/tech/module/module-context.md`, `knowledge/tech/current-state.md` y
  `knowledge/tech/codebase.md`. Sin `business.md`, `product.md`, agentes, skills ni
  `delivery/work-items/`.

El rol y la identidad del sistema se guardan en `.kaddo/config.yml`:

```yaml
# Repo core
project:
  role: core
system:
  name: acme-platform
multirepo:
  role: core
  modules_file: .kaddo/modules.yml
  workspace_roots:
    - '..'

# Repo module
project:
  role: module
multirepo:
  role: module
  parent_system: acme-platform
module:
  id: billing
```

El `system.name` se define explícitamente durante el init del core y es referenciado
por los módulos via `multirepo.parent_system`. El array `workspace_roots` indica a
discovery dónde buscar repositorios hermanos (por defecto `['..']`).

## Descubrimiento de módulos

`kaddo modules discover` escanea los workspace roots buscando repositorios hermanos y
clasifica cada uno:

```bash
kaddo modules discover          # escanear y mostrar resultados (dry run)
kaddo modules discover --apply  # escanear y persistir módulos elegibles
```

Cada repositorio descubierto recibe un estado:

- **configured**: tiene `.kaddo/config.yml` con `role: module` y `parent_system` coincidente.
- **not_configured**: el directorio existe pero Kaddo no está inicializado.
- **invalid**: tiene Kaddo inicializado pero `project.role` no es `module`.
- **foreign_system**: configurado como módulo pero `parent_system` apunta a otro sistema.
- **duplicate**: otro repo ya registró el mismo module id.
- **missing**: previamente registrado en `.kaddo/modules.yml` pero la ruta ya no existe.

Solo los módulos **configured** sin advertencias son elegibles para mapeo. El flag
`--apply` los persiste en `.kaddo/modules.yml` y genera
`knowledge/tech/modules/modules.md`.

## Índice operativo: .kaddo/modules.yml

`.kaddo/modules.yml` es la fuente única de verdad para módulos mapeados:

```yaml
version: 1
system: acme-platform
workspace_roots:
  - '..'
modules:
  - id: billing
    name: Billing
    path: ../acme-billing
    parent_system: acme-platform
    status: configured
    context:
      module: knowledge/tech/module/module-context.md
      current_state: knowledge/tech/current-state.md
      codebase: knowledge/tech/codebase.md
```

## Mapeo de detalles adicionales

`kaddo modules map [path]` registra o actualiza un módulo en `.kaddo/modules.yml` y
genera la estructura de conocimiento bajo `knowledge/tech/modules/<id>/`:

```bash
kaddo modules map              # interactivo — pregunta la ruta
kaddo modules map ../frontend  # directo — mapea el repo dado
```

## Listado y validación

```bash
kaddo modules list     # listado read-only desde .kaddo/modules.yml
kaddo modules validate # verificar que los módulos registrados siguen válidos
```

`kaddo modules list` lee directamente de `.kaddo/modules.yml` — nunca pregunta,
descubre ni escribe. `kaddo modules validate` verifica cada ruta de módulo registrado
y reporta rutas de conocimiento legacy que deben migrarse.

## Contexto de módulo

Cada repo módulo tiene un `knowledge/tech/module/module-context.md` con 9 secciones:

1. Module identity
2. Responsibility
3. Boundaries
4. Exposed interfaces
5. Dependencies
6. Consumers
7. Local rules
8. Risks
9. Open questions

El `module-context-agent` refina este artefacto; el skill
`module-context-refinement` guía la refinación. Instala el agente en el repo
**core** con `kaddo add agents` — los repos módulo no instalan agentes ni skills
directamente.

### Ruta de proyecto del módulo

Los repos módulo siguen una ruta de 7 pasos (en lugar de la ruta completa de 16 pasos del core):

1. Habilitar Kaddo
2. Escanear repositorio
3. Refinar contexto de módulo
4. Describir estado actual
5. Mapear codebase
6. Validar conocimiento del módulo
7. Listo para orquestación del core

### Capas de conocimiento en módulos

Para repos módulo, las capas de conocimiento se evalúan diferente:

| Capa | Estado |
|---|---|
| Business | No aplica — gestionado por el core |
| Product | No aplica — gestionado por el core |
| Tech | Se evalúa normalmente (module-context + current-state + codebase) |
| Delivery | Gestionado por el core |

Los repos módulo nunca crean business, product, roadmap ni Work Items.
`kaddo add agents` y `kaddo add skills` están bloqueados en repos módulo.

> **Soporte de rutas legacy.** Kaddo también lee `knowledge/module/module-context.md`
> (la ruta pre-VS-093) si la nueva ruta no existe. Ejecuta `kaddo modules validate`
> para detectar rutas legacy y obtener recomendaciones de migración.

## Rutas de conocimiento

Todo el conocimiento multirepo vive bajo `knowledge/tech/`:

| Artefacto | Ruta |
|---|---|
| Contexto de sistema (core) | `knowledge/tech/system/system-context.md` |
| Mapa de módulos (core) | `knowledge/tech/modules/modules.md` |
| Contexto de módulo (module) | `knowledge/tech/module/module-context.md` |
| Diseño por módulo (core) | `knowledge/tech/modules/<id>/module-design.md` |

## Eficiencia de contexto

En un sistema multirepo, el Repository Exploration Tax se multiplica: un agente debe descubrir
qué repo posee cada capacidad, dónde viven los contratos y qué estándares aplican al sistema.
Kaddo reduce esa exploración mapeando cada repositorio como módulo, manteniendo conocimiento por
módulo bajo `knowledge/tech/modules/<id>/` y mostrando el mapa de módulos en `context` y
`explain`.

## Ejemplo: architecture-repo + frontend + backend + infra

```bash
# en el repo de arquitectura
kaddo init                        # seleccionar multirepo → core, definir system name
kaddo modules discover --apply    # encuentra ../frontend, ../backend, ../infra
kaddo modules map ../frontend     # agregar metadata detallada
kaddo modules list
```

## Artefactos globales vs por módulo

- **Globales** (todo el sistema): `kaddo add standards|security|stack|git-strategy`
  escribe `knowledge/tech/<tema>.md` una vez para el sistema. Ver
  [Estándares, seguridad y stack](/es/modules/global-docs/) y
  [Estrategia de Git](/es/modules/git-strategy/).
- **Por módulo** (por repo): `knowledge/tech/modules/<id>/*.md`, generados por
  `kaddo modules map`.

## Work Items y módulos afectados

El front matter de los Work Items incluye `affected_modules: []`. Cuando un WI
apunta a módulos específicos, se listan:

```yaml
affected_modules:
  - loyalty
  - billing
```

El context pack incluye el module-context de los módulos afectados, y el handoff de
understand sugiere una estrategia de branch por módulo.

## Alcances de exportación de Capsule

```bash
kaddo capsule export                  # capsule a nivel de proyecto (por defecto)
kaddo capsule export --scope system   # incluye resúmenes de todos los módulos mapeados
kaddo capsule export --module loyalty # capsule para un módulo específico
```

> Kaddo nunca escanea los repos secundarios, nunca llama a una API de Git/GitHub y
> nunca ejecuta un escaneo de seguridad. Mapea estructura de forma determinista; tus
> agentes LLM hacen la interpretación.
