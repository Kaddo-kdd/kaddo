# Proposal: Work-item branch creation in the implementing agent

## Problem

After VS-035, the delivery lifecycle only *suggested* a branch; developers could keep
working on the default branch and push to `main` by accident. The intended behavior: when
development on a Work Item begins, **a branch is created first** (per the project's Git
strategy) so work never lands on `main`. Commits must remain manual.

## Decision

This is **not** a new CLI command. The Kaddo CLI stays deterministic and **never touches
git**. Instead, branch creation is a **configuration in the agent that builds the Work
Item** — the `work-item-agent` prompt now specifies the delivery protocol the implementing
agent (e.g. in Claude Code / Cursor) must follow:

1. **Branch first** — create a branch from the Git strategy (`.kaddo/git.yml`
   `branchNaming.pattern`, default `feature/<id>-<slug>`; also bugfix/hotfix/spike) before
   changing code.
2. Implement → `kaddo scan` → `kaddo owners suggest` → `kaddo guard` → update knowledge.
3. **Commit only with explicit human confirmation.** Never commit, push or merge on its own.

`kaddo understand`'s delivery lifecycle reflects this (branch first, commit only with
confirmation), and the docs make clear the CLI never runs git.

## Out of Scope

A `kaddo start` command (rejected), auto-commit, push, merge, tags, remote operations.

## Success Criteria

The `work-item-agent` prompt configures branch-first + commit-only-with-confirmation; the
CLI never touches git; docs/examples reflect the agent-driven protocol; tests + build pass.
