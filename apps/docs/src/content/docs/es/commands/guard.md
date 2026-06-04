---
title: kaddo guard
description: Revisa si el código modificado tiene artefactos relacionados sin actualizar.
---

```bash
kaddo guard              # revisa archivos staged + unstaged del repo actual
kaddo guard --staged     # revisa solo archivos staged
kaddo guard --ci         # salida JSON para CI/PR, no bloqueante
kaddo guard --workspace  # también revisa repos de módulos locales mapeados (multirepo, opt-in)
```

Guard Lite lee el `git diff`, encuentra artefactos con globs `code:` que coinciden,
y muestra un **FYI no bloqueante** si el artefacto no se actualizó en el mismo diff.

```
Touched files:
  - src/payments/payments.service.ts

  ⚠ Possible knowledge drift: WI-001 (feature, K2)
    Changed code matching this artifact:
      - src/payments/payments.service.ts
    Declared ownership:
      - src/payments/**
    WI-001 was not updated in this diff.
    Evidence: 1/1 globs matched · artifact K2 · domain: payments
    Suggested action: review WI-001 and update it if the behavior changed,
    or ignore this artifact below if the change does not affect the knowledge.
```

## Declarar propiedad

Guard solo actúa sobre la **propiedad declarada**: nunca adivina qué artefacto posee un
archivo. Agrega globs `code:` al front matter del artefacto (incluidos los Work Items):

```yaml
---
type: feature
id: WI-001
knowledge_level: K2
code:
  - src/payments/**
  - src/shared/payment/**
---
```

- Si un archivo modificado coincide con un glob **y** el artefacto no se actualizó → FYI de drift.
- Si el artefacto también se modificó en el mismo diff → sin FYI (el conocimiento siguió sincronizado).
- Si ningún artefacto declara propiedad → Guard es **silencioso** por defecto. Sin ruido el primer día.

Guard es **informativo y no bloqueante**: nunca falla tu comando ni el CI, y **no hace
inferencias** — solo coincidencia determinista de globs.

## Modo workspace (multirepo)

Por defecto Guard revisa **solo el repo actual**. En un workspace multirepo, los
artefactos de módulo pueden poseer código en repos hermanos vía globs como
`code: ["../frontend/**"]`. Actívalo con `--workspace`:

```bash
kaddo guard --workspace
kaddo guard --workspace --ci
```

En modo workspace Guard lee `.kaddo/modules.yml`, corre `git diff` **dentro de cada repo
de módulo local mapeado**, normaliza las rutas cambiadas (ej. `../frontend/src/checkout.ts`)
y las matchea contra los globs `code:` de los artefactos — emitiendo el mismo FYI no
bloqueante cuando un artefacto de módulo no se actualizó.

```
Workspace mode enabled.
Checking mapped modules from .kaddo/modules.yml.
  Modules checked: 3 · skipped: 1
  ↷ skipped worker (../worker) — not a git repository

  ⚠ Possible knowledge drift: knowledge/tech/modules/storefront-web/module-design.md
    Changed code matching this artifact:
      - ../frontend/src/checkout/checkout.ts
    Declared ownership:
      - ../frontend/**
```

Los módulos cuya ruta no existe, no es un repo Git, o cuyo diff falla se **omiten con un
aviso** — nunca son fatales. El JSON de `--workspace --ci` agrega un objeto `workspace`
(`modulesChecked`, `modulesSkipped`, `skippedModules`).

> El Guard de workspace solo lee **rutas de archivos cambiados** de repos locales. Nunca
> lee contenido fuente, nunca clona y nunca llama a una API de Git/GitHub. `kaddo guard`
> sin `--workspace` se comporta exactamente como antes.
