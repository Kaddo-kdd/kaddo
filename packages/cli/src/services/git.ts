import { execa } from 'execa'
import path from 'node:path'

export type DiffMode = 'staged' | 'unstaged' | 'head'

export async function getModifiedFiles(mode: DiffMode = 'head'): Promise<string[]> {
  try {
    let args: string[]

    if (mode === 'staged') {
      args = ['diff', '--name-only', '--cached']
    } else if (mode === 'unstaged') {
      args = ['diff', '--name-only']
    } else {
      // head: staged + unstaged combined (most useful for guard)
      const [staged, unstaged] = await Promise.all([
        getModifiedFiles('staged'),
        getModifiedFiles('unstaged'),
      ])
      return [...new Set([...staged, ...unstaged])]
    }

    const result = await execa('git', args)
    return result.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Like {@link getModifiedFiles}, but runs Git inside a specific directory.
 * Used by workspace Guard to read diffs from sibling module repositories.
 */
export async function getModifiedFilesIn(dir: string, mode: DiffMode = 'head'): Promise<string[]> {
  try {
    if (mode === 'head') {
      const [staged, unstaged] = await Promise.all([
        getModifiedFilesIn(dir, 'staged'),
        getModifiedFilesIn(dir, 'unstaged'),
      ])
      return [...new Set([...staged, ...unstaged])]
    }
    const args = mode === 'staged' ? ['diff', '--name-only', '--cached'] : ['diff', '--name-only']
    const result = await execa('git', args, { cwd: dir })
    return result.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir })
    return true
  } catch {
    return false
  }
}

/**
 * Absolute path of the Git working-tree root, or null if not in a repo. Used to normalize
 * git-root-relative diff paths to the Kaddo project root when the project is a subfolder (VS-060.1).
 */
export async function getGitRoot(dir: string): Promise<string | null> {
  try {
    const result = await execa('git', ['rev-parse', '--show-toplevel'], { cwd: dir })
    return result.stdout.trim() || null
  } catch {
    return null
  }
}

/** Untracked files not ignored by .gitignore (read-only — never mutates git). VS-052. */
export async function getUntrackedFiles(): Promise<string[]> {
  try {
    const result = await execa('git', ['ls-files', '--others', '--exclude-standard'])
    return result.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export async function getModifiedFilesInCommit(ref = 'HEAD'): Promise<string[]> {
  try {
    const result = await execa('git', ['diff-tree', '--no-commit-id', '-r', '--name-only', ref])
    return result.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

// Read-only collaboration evidence. Arguments are always structured; callers never provide a Git
// command or ref. This service deliberately exposes no mutating Git operation.
export type GitCommitObservation = {
  sha: string
  author: string
  date: string
  subject: string
  files: string[]
}
export type GitBranchObservation = { name: string }
export type GitObservation = {
  availability: 'available' | 'partial' | 'unavailable'
  repository: string | null
  commits: GitCommitObservation[]
  branches: GitBranchObservation[]
  inspectedAt: string
  limit: number
}

export async function observeGit(dir: string, maxCommits = 100, repositoryId?: string): Promise<GitObservation> {
  const limit = Math.max(1, Math.min(maxCommits, 250))
  const inspectedAt = new Date().toISOString()
  try {
    const root = await getGitRoot(dir)
    if (!root) return { availability: 'unavailable', repository: null, commits: [], branches: [], inspectedAt, limit }
    const [log, refs] = await Promise.all([
      execa('git', ['log', `--max-count=${limit}`, '--format=%H%x1f%an%x1f%aI%x1f%s', '--name-only'], { cwd: root, timeout: 5000 }),
      execa('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd: root, timeout: 5000 }),
    ])
    const commits: GitCommitObservation[] = []
    let current: GitCommitObservation | null = null
    for (const line of log.stdout.split(/\r?\n/)) {
      const parts = line.split('\x1f')
      if (parts.length === 4) {
        if (current) commits.push(current)
        current = { sha: parts[0], author: parts[1], date: parts[2], subject: parts[3], files: [] }
      } else if (current && line.trim()) current.files.push(line.trim())
    }
    if (current) commits.push(current)
    return {
      // The display identity is supplied by the caller when a project observes
      // several repositories. A basename alone is ambiguous in a multirepo
      // workspace (for example, two independent `api` folders).
      availability: 'available', repository: repositoryId ?? path.basename(root), commits,
      branches: refs.stdout.split(/\r?\n/).map((name) => name.trim()).filter(Boolean).slice(0, 100).map((name) => ({ name })),
      inspectedAt, limit,
    }
  } catch {
    return { availability: 'partial', repository: null, commits: [], branches: [], inspectedAt, limit }
  }
}
