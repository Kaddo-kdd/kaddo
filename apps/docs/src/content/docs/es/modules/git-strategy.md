---
title: Estrategia de Git
description: Un flujo de Git recomendado y personalizable para el sistema.
---

```bash
kaddo add git-strategy
```

Instala dos archivos:

- `knowledge/tech/git-strategy.md` — la estrategia legible para humanos.
- `.kaddo/git.yml` — el descriptor procesable por máquina.

## Estrategia por defecto

**GitHub Flow + Conventional Commits + SemVer.**

```txt
feature/<work-item-id>-<slug>      feat(scope): mensaje      vMAJOR.MINOR.PATCH
bugfix/<work-item-id>-<slug>       fix(scope): mensaje
hotfix/<work-item-id>-<slug>       docs(scope): mensaje
spike/<work-item-id>-<slug>        chore(scope): mensaje
```

Las notas de release se generan a partir de los Work Items de Kaddo +
Conventional Commits.

## Personalización

El valor por defecto es una **recomendación**, no una regla. Edita `.kaddo/git.yml`
para cambiar de estrategia — `github-flow`, `gitflow`, `trunk-based` o `custom` — y
ajustar el naming de ramas, la convención de commits y el patrón de tags.

```yaml
strategy: github-flow
branchNaming:
  pattern: "{type}/{workItemId}-{slug}"
commits:
  convention: conventional-commits
  requireWorkItemReference: true
tags:
  strategy: semver
  pattern: "v{version}"
```

## Otras estrategias

Copia una de estas en `.kaddo/git.yml` como punto de partida y ajusta los patrones a
cómo trabaja realmente tu equipo. Todos los campos son descriptivos — Kaddo los lee como
documentación, no actúa sobre ellos.

### Git Flow

`main`/`develop` de larga duración con ramas `release/*` y `hotfix/*`.

```yaml
strategy: gitflow
branchNaming:
  pattern: "{type}/{workItemId}-{slug}"
  mainBranch: main
  developBranch: develop
  releasePrefix: release/
  hotfixPrefix: hotfix/
commits:
  convention: conventional-commits
  requireWorkItemReference: true
tags:
  strategy: semver
  pattern: "v{version}"
release:
  notesFrom:
    - work-items
    - conventional-commits
```

### Trunk-based

Ramas de vida corta integradas en un único trunk; los releases se taggean desde el trunk.

```yaml
strategy: trunk-based
branchNaming:
  pattern: "{workItemId}-{slug}"
  mainBranch: main
  maxBranchLifetimeDays: 2
commits:
  convention: conventional-commits
  requireWorkItemReference: true
tags:
  strategy: semver
  pattern: "v{version}"
release:
  notesFrom:
    - conventional-commits
```

### Custom

Trae tus propias convenciones — para equipos que no siguen un modelo con nombre.

```yaml
strategy: custom
branchNaming:
  pattern: "{team}/{workItemId}-{slug}"
commits:
  convention: custom
  requireWorkItemReference: false
tags:
  strategy: calver
  pattern: "{YYYY}.{MM}.{patch}"
release:
  notesFrom:
    - work-items
```

> Kaddo **no** impone la estrategia en CI, y nunca crea ramas ni tags por ti. Refina
> la estrategia con el `git-strategy-agent` en tu LLM.
