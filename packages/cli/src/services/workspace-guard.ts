// Workspace Guard collector (VS workspace-guard-multirepo).
//
// Opt-in: gathers changed file paths from local sibling repositories registered as
// mapped modules in `.kaddo/modules.yml`, normalizing them to workspace-relative paths
// (e.g. `../frontend/src/checkout.ts`) so the existing Guard analyzer can match them
// against artifact `code:` globs. Deterministic: only Git diff *paths* are read — never
// source contents — and no remote APIs are ever called.

import { exists, join } from '../utils/fs.js'
import { isGitRepo, getModifiedFilesIn, type DiffMode } from './git.js'
import { loadMappedModules } from './mapped-modules.js'

export type ChangedFileSource = 'current' | 'workspace-module'

export type WorkspaceChangedFile = {
  repoId: string
  repoPath: string
  path: string
  normalizedPath: string
  source: ChangedFileSource
}

export type SkippedModule = {
  id: string
  repoPath: string
  reason: string
}

export type WorkspaceScan = {
  enabled: true
  changedFiles: WorkspaceChangedFile[]
  modulesChecked: number
  modulesSkipped: number
  skippedModules: SkippedModule[]
}

export type WorkspaceGuardDeps = {
  isGitRepo: (dir: string) => Promise<boolean>
  getModifiedFilesIn: (dir: string, mode: DiffMode) => Promise<string[]>
}

const defaultDeps: WorkspaceGuardDeps = { isGitRepo, getModifiedFilesIn }

/** Join a module repo path with a changed file path, normalized to POSIX separators. */
export function normalizeModulePath(repoPath: string, changed: string): string {
  const base = repoPath.replace(/\\/g, '/').replace(/\/+$/, '')
  const file = changed.replace(/\\/g, '/').replace(/^\/+/, '')
  return base ? `${base}/${file}` : file
}

/**
 * Collect changed files from each mapped module's local repo. Missing paths, non-Git
 * folders and diff failures are skipped (reported), never fatal.
 */
export async function collectWorkspaceChanges(
  dir: string,
  mode: DiffMode = 'head',
  deps: WorkspaceGuardDeps = defaultDeps
): Promise<WorkspaceScan> {
  const modules = loadMappedModules(dir)
  const changedFiles: WorkspaceChangedFile[] = []
  const skippedModules: SkippedModule[] = []
  let modulesChecked = 0

  for (const mod of modules) {
    const repoPath = mod.repoPath
    if (!repoPath) {
      skippedModules.push({ id: mod.id, repoPath: '', reason: 'no repo path' })
      continue
    }
    const abs = join(dir, repoPath)
    if (!exists(abs)) {
      skippedModules.push({ id: mod.id, repoPath, reason: 'path does not exist' })
      continue
    }
    if (!(await deps.isGitRepo(abs))) {
      skippedModules.push({ id: mod.id, repoPath, reason: 'not a git repository' })
      continue
    }

    let files: string[]
    try {
      files = await deps.getModifiedFilesIn(abs, mode)
    } catch {
      skippedModules.push({ id: mod.id, repoPath, reason: 'git diff failed' })
      continue
    }

    modulesChecked++
    for (const f of files) {
      changedFiles.push({
        repoId: mod.id,
        repoPath,
        path: f.replace(/\\/g, '/'),
        normalizedPath: normalizeModulePath(repoPath, f),
        source: 'workspace-module',
      })
    }
  }

  return {
    enabled: true,
    changedFiles,
    modulesChecked,
    modulesSkipped: skippedModules.length,
    skippedModules,
  }
}
