import { execa } from 'execa'

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

/** Current branch name, or null if it cannot be determined. */
export async function currentBranch(dir: string): Promise<string | null> {
  try {
    const result = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: dir })
    const name = result.stdout.trim()
    return name || null
  } catch {
    return null
  }
}

export async function branchExists(dir: string, name: string): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`], { cwd: dir })
    return true
  } catch {
    return false
  }
}

export type BranchResult = { action: 'created' | 'switched' | 'already'; branch: string }

/**
 * Create the branch and switch to it; if it already exists, just switch; if already on it,
 * report 'already'. This is a non-destructive Git action (no commits, no history change).
 */
export async function createOrSwitchBranch(dir: string, name: string): Promise<BranchResult> {
  const current = await currentBranch(dir)
  if (current === name) return { action: 'already', branch: name }
  if (await branchExists(dir, name)) {
    await execa('git', ['switch', name], { cwd: dir })
    return { action: 'switched', branch: name }
  }
  await execa('git', ['switch', '-c', name], { cwd: dir })
  return { action: 'created', branch: name }
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
