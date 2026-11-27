import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runAuditAdmin } from '../src/audit-adapter.js'
import { discoverProject, discoverKnowledge } from '@kaddo/cli/core'

describe('discovery race probe', () => {
  it('does not read a substituted external directory when using a discovery snapshot', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-race-project-'))
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-race-outside-'))
    const config = path.join(root, '.kaddo', 'config.yml')
    const originalReaddir = fs.readdirSync
    let swapped = false, outsideRead = false
    try {
      fs.mkdirSync(path.join(root, '.kaddo'))
      fs.writeFileSync(config, 'project:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
      fs.writeFileSync(path.join(root, 'package.json'), '{"name":"test"}')
      fs.mkdirSync(path.join(outside, 'external-domain'))
      const snapshot = { discovery: discoverProject(root), artifacts: discoverKnowledge(root), owners: {}, configured: true }
      vi.spyOn(fs, 'readdirSync').mockImplementation(((dir: any, ...args: any[]) => {
        if (String(dir) === path.join(root, 'src') && swapped) outsideRead = true
        return (originalReaddir as any)(dir, ...args)
      }) as typeof fs.readdirSync)
      await runAuditAdmin(root, { requestId: '29d7b0cb-34c0-4e7a-a260-165670f44476' }, async (command) => ({ stdout: command === 'tsc' ? '' : '{"advisories":{}}', stderr: '', exitCode: 0 }), async () => {
        swapped = true
        fs.symlinkSync(outside, path.join(root, 'src'), process.platform === 'win32' ? 'junction' : 'dir')
        return snapshot
      })
      expect(swapped).toBe(true)
      expect(outsideRead).toBe(false)
    } finally {
      vi.restoreAllMocks()
      if (fs.existsSync(path.join(root, 'src'))) fs.unlinkSync(path.join(root, 'src'))
      fs.rmSync(root, { recursive: true, force: true })
      fs.rmSync(outside, { recursive: true, force: true })
    }
  })
})
