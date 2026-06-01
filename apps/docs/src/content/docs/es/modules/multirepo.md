---
title: Módulos multirepo
description: Mapea repos secundarios como módulos vivos de un sistema.
---

Kaddo representa no solo el repo principal de arquitectura, sino también los **repos
secundarios** (frontend, backend, workers, infra…) como módulos vivos del mismo
sistema.

## Dos niveles de descriptor

- **`kaddo module --init`** escribe `architecture/module.yml` — un repo que se
  describe a *sí mismo* como módulo (nombre, dominios, contratos que expone/consume).
  Úsalo dentro de un repo secundario.
- **`kaddo modules map`** escribe `.kaddo/modules.yml` en el **repo de arquitectura** —
  la vista de sistema, donde cada repo secundario se registra y recibe una estructura
  de conocimiento bajo `architecture/modules/<id>/`.

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
architecture/modules/<id>/
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

> Los globs `code:` declaran ownership de forma consistente, pero **`kaddo guard` por
> defecto sigue leyendo solo el `git diff` del repo actual** — todavía no agrega los
> cambios de los repos hermanos. El Guard cross-repo / de workspace es una capacidad
> futura aparte.

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
architecture/modules/
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
  escribe `architecture/<tema>.md` una vez para el sistema. Ver
  [Estándares, seguridad y stack](/es/modules/global-docs/) y
  [Estrategia de Git](/es/modules/git-strategy/).
- **Por módulo** (por repo): `architecture/modules/<id>/*.md`, generados por
  `kaddo modules map`.

> Kaddo nunca escanea los repos secundarios, nunca llama a una API de Git/GitHub y
> nunca ejecuta un escaneo de seguridad. Mapea estructura de forma determinista; tus
> agentes LLM hacen la interpretación.
