import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  collectWorkspaceChanges,
  normalizeModulePath,
  type WorkspaceGuardDeps,
} from '../src/services/workspace-guard.js'

let dir: string

function writeModules(yaml: string) {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo', 'modules.yml'), yaml)
}

function makeDir(rel: string) {
  fs.mkdirSync(path.join(dir, rel), { recursive: true })
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ws-guard-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('normalizeModulePath', () => {
  it('joins repo path and changed file as POSIX', () => {
    expect(normalizeModulePath('../frontend', 'src/checkout/checkout.ts')).toBe(
      '../frontend/src/checkout/checkout.ts'
    )
  })
  it('normalizes Windows separators and trailing slashes', () => {
    expect(normalizeModulePath('../frontend/', 'src\\checkout.ts')).toBe(
      '../frontend/src/checkout.ts'
    )
  })
})

describe('collectWorkspaceChanges', () => {
  const modulesYaml = [
    'version: 1',
    'modules:',
    '  - id: storefront-web',
    '    repoPath: frontend-repo',
    '    type: frontend',
    '  - id: missing-mod',
    '    repoPath: ../nope-does-not-exist',
    '    type: worker',
  ].join('\n')

  it('returns empty scan when no modules.yml exists', async () => {
    const scan = await collectWorkspaceChanges(dir)
    expect(scan.changedFiles).toEqual([])
    expect(scan.modulesChecked).toBe(0)
    expect(scan.modulesSkipped).toBe(0)
  })

  it('collects and normalizes changes from a valid module repo, skips missing ones', async () => {
    writeModules(modulesYaml)
    makeDir('frontend-repo')

    const deps: WorkspaceGuardDeps = {
      isGitRepo: async () => true,
      getModifiedFilesIn: async () => ['src/checkout/checkout.ts'],
    }
    const scan = await collectWorkspaceChanges(dir, 'head', deps)

    expect(scan.modulesChecked).toBe(1)
    expect(scan.changedFiles).toHaveLength(1)
    expect(scan.changedFiles[0].normalizedPath).toBe('frontend-repo/src/checkout/checkout.ts')
    expect(scan.changedFiles[0].source).toBe('workspace-module')
    expect(scan.changedFiles[0].repoId).toBe('storefront-web')

    // missing-mod does not exist → skipped
    expect(scan.modulesSkipped).toBe(1)
    expect(scan.skippedModules[0].id).toBe('missing-mod')
    expect(scan.skippedModules[0].reason).toBe('path does not exist')
  })

  it('skips a module path that exists but is not a git repo', async () => {
    writeModules(
      ['version: 1', 'modules:', '  - id: web', '    repoPath: frontend-repo', '    type: frontend'].join('\n')
    )
    makeDir('frontend-repo')
    const deps: WorkspaceGuardDeps = {
      isGitRepo: async () => false,
      getModifiedFilesIn: async () => ['x.ts'],
    }
    const scan = await collectWorkspaceChanges(dir, 'head', deps)
    expect(scan.modulesChecked).toBe(0)
    expect(scan.skippedModules[0].reason).toBe('not a git repository')
  })
})
