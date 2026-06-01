---
title: Git strategy
description: A recommended, customizable Git workflow for the system.
---

```bash
kaddo add git-strategy
```

Installs two files:

- `architecture/git-strategy.md` — the human-readable strategy.
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

> Kaddo does **not** enforce the strategy in CI, and never creates branches or tags
> for you. Refine the strategy with the `git-strategy-agent` in your LLM.
