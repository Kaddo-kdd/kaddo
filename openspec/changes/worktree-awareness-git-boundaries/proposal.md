# Proposal: Worktree Awareness & Git Execution Boundaries (VS-049)

## Why

During `todoApp` validation, some agents work in a **Git worktree** instead of the current
checkout. That splits reality: Kaddo runs `scan`/`guard`/`explain` in the repo root while the
agent edits files in the worktree, so the two observe different states and `scan`, `guard`,
`owners suggest`, `context` and `explain` lose reliability.

## What

1. **Worktree awareness** — deterministic, filesystem-based detection (no git execution): repo
   root, current branch, and whether the active working tree is a linked worktree.
2. Surface the execution context everywhere so every command/agent shares one reality:
   - `explain` → `## Workspace` (root / worktree yes-no / branch + a warning when in a worktree).
   - `context` → `## Execution Context` (root / branch / worktree).
   - `understand` → current implementation workspace + "run Kaddo from this worktree" guidance.
3. **Git execution boundaries** — implementation-agent and work-item-agent prompts forbid
   creating/switching branches, creating worktrees, stashing, committing, pushing or merging.
   Agents may *suggest* a branch name; the human creates/selects the workspace. If a workspace
   change is needed, the agent stops and asks the human.
4. Docs + a worktree guide + Visual Guide diagram + repo-root vs worktree examples.

## Impact

- Knowledge, code and Kaddo artifacts reflect the same operative reality.
- Kaddo still never mutates git. Out of scope: auto worktree/branch creation, GitHub/IDE
  integration, any git automation.
