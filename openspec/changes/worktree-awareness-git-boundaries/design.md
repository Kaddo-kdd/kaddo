# Design: Worktree Awareness & Git Execution Boundaries

## Detection — `core/workspace.ts` (filesystem, no git execution)

```ts
type WorkspaceInfo = { isGitRepo: boolean; root: string | null; branch: string | null; isWorktree: boolean }
detectWorkspace(startDir): WorkspaceInfo
describeWorkspace(ws): string
```

- Walk up from `startDir` to the first `.git` entry.
- **Main checkout**: `.git` is a directory → `isWorktree=false`; branch from `<root>/.git/HEAD`.
- **Linked worktree**: `.git` is a FILE `gitdir: <main>/.git/worktrees/<name>` → `isWorktree=true`;
  branch from `<gitdir>/HEAD`. Detached HEAD reports a short sha.

Kept synchronous and side-effect free so the existing sync `explain`/`context` builders stay sync,
and so it is fully testable with temp dirs. Consistent with "Kaddo never runs git".

## Surfaces

- `ProjectExplanation.workspace` → `## Workspace` section + worktree warning (AC2).
- `ContextPack.workspace` → `## Execution Context` section (AC3).
- `understand` prints the implementation workspace + guidance when in a worktree (AC4).

## Git boundaries (prompts)

implementation-agent and work-item-agent gain explicit rules: never run git; do not create/switch
branches, create worktrees, stash, commit, push or merge; work only in the current workspace; if a
workspace/branch change is needed, stop and ask the human. Agents may still *suggest* a branch name
(implementation-agent), but the human creates and selects it (AC5).

## Docs

Worktree guide (AC7) with repo-root vs worktree examples (AC8); Visual Guide diagram; git-strategy,
workflow and manifesto note the boundaries (AC6).

## Compatibility

Additive. No git mutation. Existing flows unchanged when not in a worktree (sections still render,
reporting the repo root).
