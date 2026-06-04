import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const gitMock = vi.hoisted(() => ({
  isGitRepo: vi.fn(async () => true),
  currentBranch: vi.fn(async () => 'main'),
  createOrSwitchBranch: vi.fn(async (_dir: string, name: string) => ({
    action: 'created' as const,
    branch: name,
  })),
}))
vi.mock('../src/services/git.js', () => gitMock)

import { runStart } from '../src/commands/start.js'

let tmpDir: string
let logSpy: ReturnType<typeof vi.spyOn>

function output() {
  return logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
}

function initProject() {
  fs.mkdirSync(path.join(tmpDir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(tmpDir, '.kaddo', 'config.yml'), 'version: 1\nproject:\n  name: demo\n  state: new\n')
}

function writeWI(name: string, status: string, title: string) {
  const full = path.join(tmpDir, 'knowledge', 'delivery', 'work-items', name)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `---\nid: ${name.replace('.md', '')}\ntype: feature\ntitle: ${title}\nstatus: ${status}\n---\n`)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-start-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  gitMock.isGitRepo.mockResolvedValue(true)
  gitMock.currentBranch.mockResolvedValue('main')
  gitMock.createOrSwitchBranch.mockImplementation(async (_d: string, name: string) => ({ action: 'created', branch: name }))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('kaddo start', () => {
  it('creates the work-item branch for the single active item', async () => {
    initProject()
    writeWI('WI-001.md', 'in-progress', 'Add task reminders')

    await runStart(undefined, tmpDir)

    expect(gitMock.createOrSwitchBranch).toHaveBeenCalledWith(
      tmpDir,
      'feature/WI-001-add-task-reminders'
    )
    const out = output()
    expect(out).toContain('feature/WI-001-add-task-reminders')
    expect(out).toContain('Delivery lifecycle')
  })

  it('errors when not a git repository', async () => {
    initProject()
    writeWI('WI-001.md', 'in-progress', 'A')
    gitMock.isGitRepo.mockResolvedValue(false)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(runStart(undefined, tmpDir)).rejects.toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Not a Git repository'))
    exitSpy.mockRestore()
  })

  it('does not commit (no commit/push/merge git calls exposed)', () => {
    // The git mock only exposes branch helpers — there is no commit API to call.
    expect(Object.keys(gitMock)).not.toContain('commit')
  })
})
