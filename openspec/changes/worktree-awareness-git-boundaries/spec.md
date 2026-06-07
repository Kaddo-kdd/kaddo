# Spec: Worktree Awareness & Git Execution Boundaries

## Detection
- `core/workspace.ts` detects repo root, branch and linked-worktree status from the filesystem;
  never runs git.

## Surfaces
- explain: `## Workspace` (root / worktree yes-no / branch) + warning when in a worktree.
- context: `## Execution Context` (root / branch / worktree).
- understand: implementation workspace + "run Kaddo from this worktree" guidance.

## Git boundaries
- implementation-agent & work-item-agent prompts forbid create/switch branch, create worktree,
  stash, commit, push, merge. May suggest a branch name; human creates/selects the workspace.

## Out of scope
- Auto worktree/branch creation, branch management, GitHub/IDE integration, git automation.

## Acceptance criteria
- **AC1** Kaddo detects when it runs inside a Git worktree.
- **AC2** explain shows the active workspace.
- **AC3** context-pack includes workspace info.
- **AC4** understand warns when work happens in a worktree.
- **AC5** implementation prompts forbid automatic git operations.
- **AC6** Docs define the agents' Git boundaries.
- **AC7** An official worktree guide exists.
- **AC8** Examples cover normal repo and worktree.
