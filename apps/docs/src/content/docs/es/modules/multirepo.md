---
title: Módulos multirepo
description: Mapea repos secundarios como módulos vivos de un sistema.
---

Kaddo representa no solo el repo principal de arquitectura, sino también los **repos
secundarios** (frontend, backend, workers, infra…) como módulos vivos del mismo
sistema.

> **Multirepo vs Knowledge Capsules.** Mapea un repo como módulo cuando tienes acceso y está en
> alcance. Cuando un repo pertenece a otro equipo, tiene acceso restringido o solo necesitas
> contexto de integración, importa una [Knowledge Capsule](/es/knowledge-capsules/) — sin mapeo,
> sin código.

## Dos niveles de descriptor

- **`kaddo module --init`** escribe `knowledge/module.yml` — un repo que se
  describe a *sí mismo* como módulo (nombre, dominios, contratos que expone/consume).
  Úsalo dentro de un repo secundario.
- **`kaddo modules map`** escribe `.kaddo/modules.yml` en el **repo de arquitectura** —
  la vista de sistema, donde cada repo secundario se registra y recibe una estructura
  de conocimiento bajo `knowledge/tech/modules/<id>/`.

```bash
kaddo modules map    # registrar un repo secundario como módulo (interactivo)
kaddo modules list   # listar módulos mapeados
```

## Mapear un módulo

`kaddo modules map` pide nombre, ruta del repositorio (relativa al repo de
arquitectura), tipo (`frontend` · `backend` · `worker` · `mobile` · `library` ·
`infrastructure` · `data` · `unknown`), tecnología principal, owner y capacidades
relacionadas. Luego:

1. Registra el módulo en `.kaddo/modules.yml` (upsert por id — re-mapear actualiza
   en sitio, nunca duplica).
2. Genera una estructura de conocimiento desde el **registro central de plantillas**
   (los archivos existentes **nunca** se sobrescriben — se reportan como conservados):

```
knowledge/tech/modules/<id>/
  module-design.md
  stack.md
  security.md
  standards.md
  diagrams/.gitkeep
  adrs/.gitkeep
```

Los `.md` generados usan las plantillas oficiales `module-design`, `module-stack`,
`module-security` y `module-standards`, con **front matter prellenado** desde la
metadata del módulo — incluyendo un glob `code:` (`<repoPath>/**`):

```yaml
---
type: module-design
module: storefront-web
name: Storefront Web
status: draft
owner: web-team
repoPath: ../frontend
moduleType: frontend
mainTechnology: Next.js
capabilities:
  - checkout
code:
  - ../frontend/**
---
```

> Los globs `code:` declaran ownership de forma consistente. **`kaddo guard` por defecto
> sigue leyendo solo el `git diff` del repo actual**, pero el opt-in
> `kaddo guard --workspace` también revisa los repos de módulos locales mapeados y matchea
> sus cambios contra estos globs — ver
> [guard → Modo workspace](/es/commands/guard/#modo-workspace-multirepo). Nunca clona ni
> llama a APIs remotas.

## Eficiencia de contexto

En un sistema multirepo, el Repository Exploration Tax se multiplica: un agente debe descubrir
qué repo posee cada capacidad, dónde viven los contratos y qué estándares aplican al sistema.
Kaddo reduce esa exploración mapeando cada repositorio como módulo, manteniendo conocimiento por
módulo bajo `knowledge/tech/modules/<id>/` y mostrando el mapa de módulos en `context` y
`explain`.

## Ejemplo: architecture-repo + frontend + backend + infra

```bash
# en el repo de arquitectura
kaddo init
kaddo modules map   # Frontend  → ../frontend   (frontend, Next.js)
kaddo modules map   # Backend   → ../backend    (backend,  NestJS)
kaddo modules map   # Infra     → ../infra      (infrastructure, Terraform)
kaddo modules list
```

Resultado:

```
.kaddo/modules.yml
knowledge/tech/modules/
  frontend/{module-design,stack,security,standards}.md  diagrams/  adrs/
  backend/ {module-design,stack,security,standards}.md  diagrams/  adrs/
  infra/   {module-design,stack,security,standards}.md  diagrams/  adrs/
```

Las plantillas generadas son deliberadamente ligeras — refina cada una con el agente
de Kaddo correspondiente (`module-design-agent`, `stack-agent`, `security-agent`,
`standards-agent`) en tu LLM, usando `.kaddo/context-pack.md` como input. El front
matter y el checklist de calidad vienen del registro de plantillas, así los artefactos
de módulo se mantienen consistentes con el resto de Kaddo.

## Artefactos globales vs por módulo

- **Globales** (todo el sistema): `kaddo add standards|security|stack|git-strategy`
  escribe `knowledge/tech/<tema>.md` una vez para el sistema. Ver
  [Estándares, seguridad y stack](/es/modules/global-docs/) y
  [Estrategia de Git](/es/modules/git-strategy/).
- **Por módulo** (por repo): `knowledge/tech/modules/<id>/*.md`, generados por
  `kaddo modules map`.

## Roles core y module

Al inicializar un proyecto multirepo, `kaddo init` pregunta por un **rol**:

- **core**: el repo de arquitectura/orquestador — recibe la estructura completa de
  conocimiento (business, product, roadmap, agents, skills) más `system-context.md`
  y un mapa `modules.md`.
- **module**: un repo secundario que pertenece a un sistema — recibe solo
  `module-context.md`, `tech/current-state.md`, `tech/codebase.md` y
  `delivery/work-items/`. Sin `business.md`, `product.md`, agentes ni skills.

El rol se guarda en `project.role` (y `multirepo.role`) en `.kaddo/config.yml`:

```yaml
# Repo core
project:
  role: core
multirepo:
  role: core
  modules_file: knowledge/modules/modules.md

# Repo module
project:
  role: module
multirepo:
  role: module
  parent_system: dotear-platform
module:
  id: loyalty
```

## Contexto de módulo

Cada repo módulo tiene un `knowledge/module/module-context.md` con 9 secciones:

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
`module-context-refinement` guía la refinación.

## Detección de estado de módulos

`kaddo modules list` enriquece cada módulo mapeado con un estado:

- **configured**: el repo del módulo tiene `.kaddo/config.yml` con `role: module`.
- **not configured**: el repo existe pero Kaddo no está inicializado — ejecuta
  `kaddo init` en el repo del módulo.
- **invalid**: el repo tiene Kaddo inicializado pero `project.role` no es `module`.

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
