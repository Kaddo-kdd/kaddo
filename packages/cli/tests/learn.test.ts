import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import matter from 'gray-matter'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-learn-')) }

const WI = [
  '---', 'id: WI-100', 'title: Example', 'type: feature', 'status: in-progress', '---',
  '', '# Example', '', '## Current behavior', '', 'Something.', '',
].join('\n')

describe('kaddo learn — lifecycle-aware completion (fix)', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('completedPathFor maps an in-progress subdir path to completed/', async () => {
    const { completedPathFor } = await import('../src/commands/learn.js')
    const inProgress = path.join(dir, 'knowledge/delivery/work-items/in-progress/WI-100.md')
    const expected = path.join(dir, 'knowledge/delivery/work-items/completed/WI-100.md')
    expect(completedPathFor(inProgress)).toBe(expected)
  })

  it('completedPathFor leaves a legacy flat path untouched', async () => {
    const { completedPathFor } = await import('../src/commands/learn.js')
    const flat = path.join(dir, 'knowledge/delivery/work-items/WI-100.md')
    expect(completedPathFor(flat)).toBe(flat)
  })

  it('completes a WI living in in-progress/ and moves it to completed/', async () => {
    const { updateWorkItemFile } = await import('../src/commands/learn.js')
    const src = path.join(dir, 'knowledge/delivery/work-items/in-progress/WI-100.md')
    fs.mkdirSync(path.dirname(src), { recursive: true })
    fs.writeFileSync(src, WI, 'utf-8')

    const finalPath = updateWorkItemFile(src, 'The projection hid some sections.')

    // Moved to completed/, original gone.
    expect(finalPath).toBe(path.join(dir, 'knowledge/delivery/work-items/completed/WI-100.md'))
    expect(fs.existsSync(src)).toBe(false)
    expect(fs.existsSync(finalPath)).toBe(true)

    const { data, content } = matter(fs.readFileSync(finalPath, 'utf-8'))
    expect(data.status).toBe('completed')
    expect(data.completed_at).toBeTruthy()
    expect(content).toContain('## Learning')
    expect(content).toContain('The projection hid some sections.')
  })
})
