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

## Work Items y entrega

Las convenciones de rama y commit se atan al Work Item que estás entregando:

- Rama: `feature/WI-001-<slug>` (o `bugfix/` · `hotfix/` · `spike/` · `chore/`).
- Commit: `feat(scope): mensaje` (`fix:` para bugfix/hotfix, `chore:` para spike/chore).
- **Antes de commitear, corre `kaddo guard`** para detectar posible knowledge drift.

`kaddo understand` sugiere la rama y el commit para un Work Item activo — pero Kaddo
**nunca** crea ramas, commits ni merges. Ver el
[ciclo de entrega de un Work Item](/es/workflow/#ciclo-de-entrega-de-un-work-item).

## Límites de Git de los agentes

Los agentes pueden **sugerir** nombres de rama, mensajes de commit y una estrategia de Git — pero
**no** deben crear o cambiar de rama, crear worktrees, hacer stash, commit, push ni merge. El humano
ejecuta cualquier cambio de estado de Git. Si un agente trabaja en un Git worktree, ejecuta todos
los comandos de Kaddo desde ese workspace. Ver [Worktrees y límites de Git](/es/worktrees/).

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

> El CLI de Kaddo **no** impone la estrategia en CI y **nunca toca git**. La creación de la
> rama es parte del protocolo del agente que implementa (`work-item-agent`): crea la rama
> antes del trabajo y commitea solo con tu confirmación. Refina la estrategia con el
> `git-strategy-agent` en tu LLM.
