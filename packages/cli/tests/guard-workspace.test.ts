import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

// Control git for both the current repo and sibling module repos.
const gitMock = vi.hoisted(() => ({
  isGitRepo: vi.fn(async () => true),
  getModifiedFiles: vi.fn(async () => [] as string[]),
  getModifiedFilesIn: vi.fn(async () => [] as string[]),
  getUntrackedFiles: vi.fn(async () => [] as string[]),
  getGitRoot: vi.fn(async () => null),
}))
vi.mock('../src/services/git.js', () => gitMock)

import { runGuard } from '../src/commands/guard.js'

let tmpDir: string
let logSpy: ReturnType<typeof vi.spyOn>

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function output(): string {
  return logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
}

function writeModuleArtifact() {
  write(
    'knowledge/tech/modules/storefront-web/module-design.md',
    '---\ntype: module-design\nmodule: storefront-web\nrepoPath: frontend-repo\ncode:\n  - frontend-repo/**\n---\n\n# Storefront Web — Design\n'
  )
}

function writeModulesYml() {
  write(
    '.kaddo/modules.yml',
    [
      'version: 1',
      'modules:',
      '  - id: storefront-web',
      '    repoPath: frontend-repo',
      '    type: frontend',
    ].join('\n')
  )
  fs.mkdirSync(path.join(tmpDir, 'frontend-repo'), { recursive: true })
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-guard-ws-'))
  fs.mkdirSync(path.join(tmpDir, 'knowledge'), { recursive: true })
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  gitMock.isGitRepo.mockResolvedValue(true)
  gitMock.getModifiedFiles.mockResolvedValue([])
  gitMock.getModifiedFilesIn.mockResolvedValue([])
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('kaddo guard --workspace (VS workspace-guard-multirepo)', () => {
  it('default guard ignores sibling repo changes', async () => {
    writeModuleArtifact()
    writeModulesYml()
    gitMock.getModifiedFiles.mockResolvedValue([]) // current repo clean
    gitMock.getModifiedFilesIn.mockResolvedValue(['src/checkout/checkout.ts'])

    await runGuard({ interactive: false }) // no --workspace
    expect(output()).toContain('no modified files detected')
    expect(output()).not.toContain('Possible knowledge drift')
  })

  it('workspace guard detects drift in a sibling repo', async () => {
    writeModuleArtifact()
    writeModulesYml()
    gitMock.getModifiedFiles.mockResolvedValue([])
    gitMock.getModifiedFilesIn.mockResolvedValue(['src/checkout/checkout.ts'])

    await runGuard({ interactive: false, workspace: true })
    const out = output()
    expect(out).toContain('Workspace mode enabled')
    expect(out).toContain('Possible knowledge drift')
    expect(out).toContain('frontend-repo/src/checkout/checkout.ts')
    expect(out).toContain('frontend-repo/**')
  })

  it('suppresses the warning when the module artifact also changed', async () => {
    writeModuleArtifact()
    writeModulesYml()
    // current repo touched the artifact itself; sibling repo touched code
    gitMock.getModifiedFiles.mockResolvedValue([
      'knowledge/tech/modules/storefront-web/module-design.md',
    ])
    gitMock.getModifiedFilesIn.mockResolvedValue(['src/checkout/checkout.ts'])

    await runGuard({ interactive: false, workspace: true })
    expect(output()).not.toContain('Possible knowledge drift')
  })

  it('--workspace --ci includes workspace metadata', async () => {
    writeModuleArtifact()
    writeModulesYml()
    gitMock.getModifiedFilesIn.mockResolvedValue(['src/checkout/checkout.ts'])

    await runGuard({ ci: true, workspace: true })
    const json = JSON.parse(output())
    expect(json.workspace.enabled).toBe(true)
    expect(json.workspace.modulesChecked).toBe(1)
    expect(json.findings[0].matched_files).toContain('frontend-repo/src/checkout/checkout.ts')
    expect(json.findings[0].ownership).toContain('frontend-repo/**')
  })

  it('reports skipped modules without failing', async () => {
    writeModuleArtifact()
    write(
      '.kaddo/modules.yml',
      ['version: 1', 'modules:', '  - id: gone', '    repoPath: ../gone', '    type: worker'].join('\n')
    )
    gitMock.getModifiedFiles.mockResolvedValue(['knowledge/x.md'])

    await runGuard({ ci: true, workspace: true })
    const json = JSON.parse(output())
    expect(json.workspace.modulesSkipped).toBe(1)
    expect(json.workspace.skippedModules[0].id).toBe('gone')
  })
})
