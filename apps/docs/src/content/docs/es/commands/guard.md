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

## Archivos untracked

Guard lee el diff de Git (archivos modificados/staged), así que los archivos nuevos que Git todavía
no trackea son invisibles para él. Cuando hay archivos untracked, Guard imprime un **FYI no
bloqueante** para que un mensaje de "no modified files detected" no te confunda:

```text
Untracked files detected (3):
  - package.json
  - src/index.ts
  - tsconfig.json
Guard may not fully evaluate these files until they are tracked. (FYI — non-blocking)
```

Trackea los archivos (`git add`) para que Guard pueda relacionarlos con el ownership de artefactos.

## Descubrimiento unificado

Guard descubre los artefactos de conocimiento mediante el mismo servicio compartido que
`explain`, `context`, `understand` y `owners suggest`, de modo que todos los comandos ven
exactamente los mismos artefactos. Los Work Items se descubren recursivamente en las subcarpetas
del lifecycle (`draft/`, `ready/`, `in-progress/`, …) y se reconocen por su front matter, no por su
ruta ni su nombre de archivo.

## Registrar historial (`--record`)

Por defecto Guard no escribe nada. `kaddo guard --record` persiste la ejecución en
`.kaddo/history/guard-runs.jsonl` (+ un resumen) para que [`kaddo drift`](/es/drift-report/) reporte
tendencias de drift con el tiempo y alimente `kaddo impact` / `kaddo savings`. Registra solo rutas,
ids de artefactos y warnings — nunca autores de git ni datos personales — y nunca bloquea, edita
código/conocimiento ni ejecuta git.

## Alcance de ownership de Guard

Guard matchea ownership desde Work Items **activos y completados** — el trabajo completado sigue
siendo dueño de su código, así que tocarlo debe seguir mostrando el conocimiento relacionado. Los
Work Items **archived** se **excluyen por defecto** (agrega `--include-archived` para incluirlos).
Otros artefactos (ADRs, etc.) siempre se consideran. Guard imprime el scope usado:

```text
Ownership scope:
- Active and completed Work Items
- Archived Work Items excluded
```

Cuando no hay matches, Guard explica dónde buscó:

```text
No artifact ownership matches found.

Note:
Guard checks ownership from active and completed Work Items.
Run `kaddo explain` to inspect ownership coverage.
```

En modo `--ci` / `--json` el scope se emite como `ownership_scope { included, excluded }`.

### Normalización de paths al root del proyecto

Los globs `code:` siempre son relativos al **root del proyecto Kaddo**, pero Git reporta paths
relativos al **root de Git**. Cuando el proyecto es una subcarpeta del repo, Guard normaliza cada
archivo tocado antes de comparar — así `todoApp/src/cli/program.ts` (Git) matchea
`src/cli/program.ts` (ownership). Los archivos fuera del proyecto se ignoran (sin matches falsos).
`\` y `/` se tratan igual, en Windows y Unix. La salida `--json` incluye un mapeo `normalized_files`
(`raw_path` → `project_path`) y `files_outside_project`.

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
