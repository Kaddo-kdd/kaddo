# Tasks: Worktree Awareness & Git Execution Boundaries

## Phase 1 — Detection & surfaces
- [x] `core/workspace.ts` (detectWorkspace / describeWorkspace, filesystem-based).
- [x] explain: `## Workspace` + worktree warning.
- [x] context: `workspace` field + `## Execution Context`.
- [x] understand: worktree guidance.
- [x] implementation-agent + work-item-agent prompts: Git/worktree boundaries.
- [x] Tests (detection main/worktree/detached/subdir; explain/context sections; prompt boundaries).

## Phase 2 — Docs (EN/ES)
- [x] Worktrees guide (repo-root vs worktree examples + flow diagram) + sidebar entry.
- [x] git-strategy: Git execution boundaries note + worktree link.

## Validation
- [x] vitest run (431 passing)
- [x] build (cli + docs)
