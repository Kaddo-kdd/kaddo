---
title: Git strategy
description: A recommended, customizable Git workflow for the system.
---

```bash
kaddo add git-strategy
```

Installs two files:

- `knowledge/tech/git-strategy.md` — the human-readable strategy.
- `.kaddo/git.yml` — the machine-readable descriptor.

## Default strategy

**GitHub Flow + Conventional Commits + SemVer.**

```txt
feature/<work-item-id>-<slug>      feat(scope): message      vMAJOR.MINOR.PATCH
bugfix/<work-item-id>-<slug>       fix(scope): message
hotfix/<work-item-id>-<slug>       docs(scope): message
spike/<work-item-id>-<slug>        chore(scope): message
```

Release notes are sourced from Kaddo Work Items + Conventional Commits.

## Work Items & delivery

Branch and commit conventions tie to the Work Item you are delivering:

- Branch: `feature/WI-001-<slug>` (or `bugfix/` · `hotfix/` · `spike/` · `chore/`).
- Commit: `feat(scope): message` (`fix:` for bugfix/hotfix, `chore:` for spike/chore).
- **Before committing, run `kaddo guard`** to detect possible knowledge drift.

`kaddo understand` suggests the branch and commit for an active Work Item — but Kaddo
**never** creates branches, commits or merges. See the
[Work Item delivery lifecycle](/workflow/#work-item-delivery-lifecycle).

## Agent Git boundaries

Agents may **suggest** branch names, commit messages and a Git strategy — but they must **not**
create or switch branches, create worktrees, stash, commit, push or merge. The human executes any
Git state change. If an agent works in a Git worktree, run all Kaddo commands from that workspace.
See [Worktrees & Git boundaries](/worktrees/).

## Customization

The default is a **recommendation**, not a rule. Edit `.kaddo/git.yml` to switch
strategy — `github-flow`, `gitflow`, `trunk-based` or `custom` — and adjust branch
naming, commit convention and tag pattern.

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

## Other strategies

Copy one of these into `.kaddo/git.yml` as a starting point and adjust the patterns to
match how your team actually works. All fields are descriptive — Kaddo reads them as
documentation, it does not act on them.

### Git Flow

Long-lived `main`/`develop` with `release/*` and `hotfix/*` branches.

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

Short-lived branches merged into a single trunk; releases are tagged off the trunk.

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

Bring your own conventions — for teams that do not follow a named model.

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

> The Kaddo CLI does **not** enforce the strategy in CI and **never touches git**. Branch
> creation is part of the implementing agent's protocol (`work-item-agent`): it creates the
> branch before work and commits only with your confirmation. Refine the strategy with the
> `git-strategy-agent` in your LLM.
