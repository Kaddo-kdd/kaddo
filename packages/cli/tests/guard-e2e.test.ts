import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

// Mock the git service so we control the diff without a real repo.
const gitMock = vi.hoisted(() => ({
  isGitRepo: vi.fn(async () => true),
  getModifiedFiles: vi.fn(async () => [] as string[]),
  getModifiedFilesIn: vi.fn(async () => [] as string[]),
  getUntrackedFiles: vi.fn(async () => [] as string[]),
}))

vi.mock('../src/services/git.js', () => gitMock)

import { runGuard } from '../src/commands/guard.js'

let tmpDir: string
let logSpy: ReturnType<typeof vi.spyOn>

function writeArtifact(relPath: string, frontMatter: string) {
  const full = path.join(tmpDir, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `---\n${frontMatter}\n---\n\n# Artifact\n`)
}

function output(): string {
  return logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
}

describe('kaddo guard — end-to-end with real artifacts (VS-012)', () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-guard-e2e-'))
    fs.mkdirSync(path.join(tmpDir, 'knowledge', 'delivery', 'work-items'), { recursive: true })
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    gitMock.isGitRepo.mockResolvedValue(true)
    gitMock.getModifiedFiles.mockResolvedValue([])
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('detects drift against a real artifact that declares ownership', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-001-payments.md',
      'type: feature\nid: WI-001\ntitle: Payments\nknowledge_level: K2\nstatus: in-progress\ndomains:\n  - payments\ncode:\n  - src/payments/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/payments/charge.ts'])

    await runGuard({ interactive: false })
    const out = output()
    expect(out).toContain('Possible knowledge drift')
    expect(out).toContain('WI-001')
    expect(out).toContain('src/payments/charge.ts')
    expect(out).toContain('src/payments/**')
    expect(out).toContain('Suggested action')
  })

  it('does NOT warn when the artifact was also updated in the diff', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-001-payments.md',
      'type: feature\nid: WI-001\ntitle: Payments\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/payments/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue([
      'src/payments/charge.ts',
      'knowledge/delivery/work-items/WI-001-payments.md',
    ])

    await runGuard({ interactive: false })
    const out = output()
    expect(out).not.toContain('Possible knowledge drift')
    expect(out).toContain('All matched artifacts were updated in this diff.')
  })

  it('is silent when no artifact declares ownership', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-002-noown.md',
      'type: feature\nid: WI-002\ntitle: No ownership\nknowledge_level: K1\nstatus: in-progress'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/payments/charge.ts'])

    await runGuard({ interactive: false })
    expect(output()).toBe('')
  })

  it('shows no matches when changed files do not match any glob', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-001-payments.md',
      'type: feature\nid: WI-001\ntitle: Payments\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/payments/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/auth/login.ts'])

    await runGuard({ interactive: false })
    const out = output()
    expect(out).toContain('No artifact ownership matches found.')
    expect(out).not.toContain('Possible knowledge drift')
  })

  it('reports multiple artifacts that match the same change', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-001.md',
      'type: feature\nid: WI-001\ntitle: A\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/payments/**'
    )
    writeArtifact(
      'knowledge/delivery/work-items/WI-002.md',
      'type: spike\nid: WI-002\ntitle: B\nknowledge_level: K3\nstatus: in-progress\ncode:\n  - src/**/charge.ts'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/payments/charge.ts'])

    await runGuard({ interactive: false })
    const out = output()
    expect(out).toContain('WI-001')
    expect(out).toContain('WI-002')
  })

  it('reflects multiple globs in one artifact', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-001.md',
      'type: feature\nid: WI-001\ntitle: A\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/payments/**\n  - src/shared/payment/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/payments/charge.ts'])

    await runGuard({ interactive: false })
    expect(output()).toContain('1/2 globs matched')
  })

  it('normalizes Windows-style paths so they match POSIX globs', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/WI-001.md',
      'type: feature\nid: WI-001\ntitle: A\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/payments/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src\\payments\\charge.ts'])

    await runGuard({ interactive: false })
    expect(output()).toContain('Possible knowledge drift')
  })

  it('VS-060 AC1/AC3/AC4: matches ownership from completed Work Items and shows the ownership scope', async () => {
    writeArtifact(
      'knowledge/delivery/work-items/completed/WI-004.md',
      'type: feature\nid: WI-004\ntitle: Tasks\nknowledge_level: K2\nstatus: completed\ncode:\n  - src/cli/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/cli/program.ts'])

    await runGuard({ interactive: false })
    const out = output()
    expect(out).toContain('Ownership scope:')
    expect(out).toContain('Active and completed Work Items')
    expect(out).toContain('Archived Work Items excluded')
    expect(out).toContain('WI-004')
  })

  it('VS-060 AC2: archived Work Items excluded by default, included with --include-archived', async () => {
    // A non-archived owned artifact keeps guard non-silent; the archived one owns the touched file.
    writeArtifact(
      'knowledge/delivery/work-items/WI-100.md',
      'type: feature\nid: WI-100\ntitle: Active\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/other/**'
    )
    writeArtifact(
      'knowledge/delivery/work-items/archived/WI-009.md',
      'type: feature\nid: WI-009\ntitle: Old\nknowledge_level: K2\nstatus: archived\ncode:\n  - src/legacy/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/legacy/old.ts'])

    await runGuard({ interactive: false })
    const out1 = output()
    expect(out1).toContain('No artifact ownership matches found.') // archived excluded → no match
    expect(out1).not.toContain('WI-009')

    logSpy.mockClear()
    await runGuard({ interactive: false, includeArchived: true })
    const out2 = output()
    expect(out2).toContain('Archived Work Items included')
    expect(out2).toContain('WI-009')
  })

  it('stays non-blocking (does not call process.exit) on drift', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
    writeArtifact(
      'knowledge/delivery/work-items/WI-001.md',
      'type: feature\nid: WI-001\ntitle: A\nknowledge_level: K2\nstatus: in-progress\ncode:\n  - src/payments/**'
    )
    gitMock.getModifiedFiles.mockResolvedValue(['src/payments/charge.ts'])

    await runGuard({ interactive: false })
    expect(exitSpy).not.toHaveBeenCalled()
  })
})
