// Workspace / Git worktree awareness (VS-049).
//
// Deterministic, filesystem-based detection of the active working tree — no git execution, no
// mutation. Lets every Kaddo command report the SAME execution context (repo root, branch, and
// whether we are inside a linked Git worktree) so knowledge, code and artifacts never describe
// two different realities.

import { dirname, resolve, basename } from 'node:path'
import { exists, isFile, readFile, join } from '../utils/fs.js'

export type WorkspaceInfo = {
  /** True when a .git entry was found walking up from the start directory. */
  isGitRepo: boolean
  /** The active working-tree root (directory that contains the .git entry), or null. */
  root: string | null
  /** Current branch name, or null (detached HEAD reports the short sha). */
  branch: string | null
  /** True when the active working tree is a LINKED git worktree (not the main checkout). */
  isWorktree: boolean
}

/** Walk up from `startDir` to the first directory containing a `.git` entry. */
function findGitEntry(startDir: string): { dir: string; gitPath: string } | null {
  let cur = resolve(startDir)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const g = join(cur, '.git')
    if (exists(g)) return { dir: cur, gitPath: g }
    const parent = dirname(cur)
    if (parent === cur) return null
    cur = parent
  }
}

function readBranch(gitDir: string): string | null {
  try {
    const head = readFile(join(gitDir, 'HEAD')).trim()
    const m = head.match(/^ref:\s*refs\/heads\/(.+)$/)
    if (m) return m[1].trim()
    // Detached HEAD: HEAD holds a raw sha — report a short form.
    return head ? head.slice(0, 12) : null
  } catch {
    return null
  }
}

/**
 * Detect the active workspace deterministically from the filesystem.
 *
 * A linked git worktree has `.git` as a FILE containing `gitdir: <path-to>/.git/worktrees/<name>`,
 * whereas the main checkout has `.git` as a DIRECTORY. We never run git.
 */
export function detectWorkspace(startDir: string): WorkspaceInfo {
  const found = findGitEntry(startDir)
  if (!found) return { isGitRepo: false, root: null, branch: null, isWorktree: false }

  const { dir, gitPath } = found
  if (!isFile(gitPath)) {
    // Main checkout: .git is a directory.
    return { isGitRepo: true, root: dir, branch: readBranch(gitPath), isWorktree: false }
  }

  // Linked worktree: .git is a file pointing at the per-worktree git dir.
  let gitDir = gitPath
  const m = readFile(gitPath).match(/gitdir:\s*(.+)/)
  if (m) gitDir = m[1].trim()
  const isWorktree = basename(dirname(gitDir)) === 'worktrees'
  return { isGitRepo: true, root: dir, branch: readBranch(gitDir), isWorktree }
}

/** One-line human summary of the workspace, e.g. for explain/understand. */
export function describeWorkspace(ws: WorkspaceInfo): string {
  if (!ws.isGitRepo) return 'Not a Git repository'
  const kind = ws.isWorktree ? 'Git worktree' : 'repository root'
  return `${kind}${ws.branch ? ` · branch ${ws.branch}` : ''}`
}
