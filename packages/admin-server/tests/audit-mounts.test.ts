import { describe, expect, it } from 'vitest'
import { nestedLinuxMounts, assertNoNestedMounts } from '../src/audit-mounts.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

describe('nested project mounts', () => {
  it('detects nested bind mounts and decodes escaped paths without confusing siblings', () => {
    const table = [
      '1 0 8:1 / / rw - ext4 /dev/root rw',
      '2 1 8:1 /other /work/project/nested rw - ext4 /dev/root rw',
      '3 1 8:1 /other /work/project/space\\040dir rw - ext4 /dev/root rw',
      '4 1 8:1 /other /work/project-sibling rw - ext4 /dev/root rw',
      '5 1 8:1 /other /work/project rw - ext4 /dev/root rw',
    ].join('\n')
    expect(nestedLinuxMounts('/work/project', table)).toEqual(['/work/project/nested', '/work/project/space dir'])
  })
  it('fails closed for malformed mount records', () => {
    expect(() => nestedLinuxMounts('/work/project', 'not-a-mount-record')).toThrow('Invalid mount table')
  })
  it.skipIf(process.env.KADDO_TEST_MOUNT !== '1' || process.platform !== 'linux')('rejects a real nested bind mount', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mount-test-'))
    const project = path.join(base, 'project'), outside = path.join(base, 'outside'), nested = path.join(project, 'nested')
    fs.mkdirSync(nested, { recursive: true }); fs.mkdirSync(outside)
    let mounted = false
    try {
      fs.writeFileSync(path.join(outside, 'sentinel'), 'external')
      execFileSync('sudo', ['-n', 'mount', '--bind', outside, nested], { stdio: 'pipe' })
      mounted = true
      expect(fs.readFileSync(path.join(nested, 'sentinel'), 'utf8')).toBe('external')
      expect(() => assertNoNestedMounts(project)).toThrow('Nested project mounts')
    } finally {
      if (mounted) execFileSync('sudo', ['-n', 'umount', nested], { stdio: 'pipe' })
      fs.rmSync(base, { recursive: true, force: true })
    }
  })
})
