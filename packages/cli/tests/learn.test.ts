import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { findWorkItemFile, updateWorkItemFile } from '../src/commands/learn.js'

let dir: string

function write(rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

const IN_PROGRESS_WI = `---
type: bugfix
id: WI-025
title: "Show the full canonical Markdown definition"
status: in-progress
source:
  type: manual
  inferred: false
---

## Problem

The admin cannot see the canonical Markdown.

## Learning

_What did we learn from this change? Update after completion._
`

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-learn-'))
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('kaddo learn — lifecycle discovery', () => {
  it('finds a Work Item that lives in in-progress/', () => {
    write('knowledge/delivery/work-items/in-progress/WI-025-canonical.md', IN_PROGRESS_WI)

    const found = findWorkItemFile(dir, 'WI-025')
    expect(found).not.toBeNull()
    expect(found!.replace(/\\/g, '/')).toContain('/work-items/in-progress/WI-025-canonical.md')
  })

  it('completes a Work Item located in in-progress/ and moves it to completed/', () => {
    const inProgressPath = path.join(
      dir,
      'knowledge/delivery/work-items/in-progress/WI-025-canonical.md'
    )
    write('knowledge/delivery/work-items/in-progress/WI-025-canonical.md', IN_PROGRESS_WI)

    const filePath = findWorkItemFile(dir, 'WI-025')!
    const finalPath = updateWorkItemFile(filePath, 'The Markdown had to be rebuilt from the AST.')

    // File moved out of in-progress/ into completed/, keeping its name.
    expect(fs.existsSync(inProgressPath)).toBe(false)
    expect(finalPath.replace(/\\/g, '/')).toContain('/work-items/completed/WI-025-canonical.md')
    expect(fs.existsSync(finalPath)).toBe(true)

    const raw = fs.readFileSync(finalPath, 'utf-8')
    expect(raw).toContain('status: completed')
    expect(raw).not.toMatch(/status: in-progress/)
    expect(raw).toMatch(/completed_at:.*\d{4}-\d{2}-\d{2}/)
    expect(raw).toContain('The Markdown had to be rebuilt from the AST.')
    expect(raw).not.toContain('_What did we learn from this change?')
  })

  it('updates a Work Item in place when it already lives in completed/', () => {
    const completedPath = path.join(
      dir,
      'knowledge/delivery/work-items/completed/WI-025-canonical.md'
    )
    write(
      'knowledge/delivery/work-items/completed/WI-025-canonical.md',
      IN_PROGRESS_WI.replace('status: in-progress', 'status: completed')
    )

    const filePath = findWorkItemFile(dir, 'WI-025')!
    const finalPath = updateWorkItemFile(filePath, 'Learned in place.')

    expect(finalPath).toBe(completedPath)
    expect(fs.existsSync(completedPath)).toBe(true)
    expect(fs.readFileSync(finalPath, 'utf-8')).toContain('Learned in place.')
  })
})
