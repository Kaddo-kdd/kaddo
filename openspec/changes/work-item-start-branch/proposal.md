# Proposal: kaddo start — create the work-item branch

## Problem

VS-035 only *suggested* the branch name; developers could keep working on the default
branch and accidentally push to `main`. The intended behavior: when development on a Work
Item begins, Kaddo should **create the branch automatically** (per the project's Git
strategy), so work never lands on `main` by accident. Commits must remain fully manual.

## Proposed Change

Add `kaddo start [work-item-id]`: it resolves the target Work Item (the given id, or the
single active one), computes the branch name from `.kaddo/git.yml` (`branchNaming.pattern`,
default `{type}/{workItemId}-{slug}`) and **creates/switches to that branch** — the only
Git action Kaddo performs. It is non-destructive: no commits, no pushes, no merges, no
history change. The delivery lifecycle and `understand` now start with `kaddo start`.

This revises the earlier guarantee: Kaddo **creates the work-item branch**, but **never
commits, pushes or merges** (not even with confirmation).

## Out of Scope

Commits, pushes, merges, tags; remote operations; anything that changes history.

## Success Criteria

`kaddo start` creates/switches to the work-item branch from the Git strategy; it never
commits/pushes/merges; docs and examples reflect the new step and guarantee; tests + build
pass.
