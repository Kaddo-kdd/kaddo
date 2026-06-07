import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { detectWorkspace, describeWorkspace } from '../src/core/workspace.js'

let tmp: string

function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ws-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('workspace detection (VS-049)', () => {
  it('reports not-a-repo when there is no .git', () => {
    const ws = detectWorkspace(tmp)
    expect(ws).toEqual({ isGitRepo: false, root: null, branch: null, isWorktree: false })
  })

  it('AC1: detects a main checkout (.git directory) and its branch', () => {
    write('.git/HEAD', 'ref: refs/heads/main\n')
    const ws = detectWorkspace(tmp)
    expect(ws.isGitRepo).toBe(true)
    expect(ws.isWorktree).toBe(false)
    expect(ws.branch).toBe('main')
    expect(ws.root).toBe(fs.realpathSync(tmp))
  })

  it('AC1: detects a linked Git worktree (.git file → worktrees/<name>)', () => {
    // Simulate the main repo's per-worktree git dir.
    const wtGitDir = path.join(tmp, 'main', '.git', 'worktrees', 'wi-001')
    fs.mkdirSync(wtGitDir, { recursive: true })
    fs.writeFileSync(path.join(wtGitDir, 'HEAD'), 'ref: refs/heads/feature/wi-001-foundation\n')
    // The worktree checkout: .git is a FILE pointing at that git dir.
    write('wt/.git', `gitdir: ${wtGitDir}\n`)

    const ws = detectWorkspace(path.join(tmp, 'wt'))
    expect(ws.isGitRepo).toBe(true)
    expect(ws.isWorktree).toBe(true)
    expect(ws.branch).toBe('feature/wi-001-foundation')
  })

  it('reports a short sha for detached HEAD', () => {
    write('.git/HEAD', '0123456789abcdef0123456789abcdef01234567\n')
    expect(detectWorkspace(tmp).branch).toBe('0123456789ab')
  })

  it('finds .git by walking up from a subdirectory', () => {
    write('.git/HEAD', 'ref: refs/heads/dev\n')
    fs.mkdirSync(path.join(tmp, 'a', 'b'), { recursive: true })
    expect(detectWorkspace(path.join(tmp, 'a', 'b')).branch).toBe('dev')
  })

  it('describeWorkspace summarizes the workspace', () => {
    expect(describeWorkspace({ isGitRepo: true, root: '/x', branch: 'main', isWorktree: false })).toBe(
      'repository root · branch main'
    )
    expect(
      describeWorkspace({ isGitRepo: true, root: '/x', branch: 'feature/y', isWorktree: true })
    ).toBe('Git worktree · branch feature/y')
    expect(describeWorkspace({ isGitRepo: false, root: null, branch: null, isWorktree: false })).toBe(
      'Not a Git repository'
    )
  })
})
