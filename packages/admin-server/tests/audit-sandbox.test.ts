import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createAuditSandboxRunner } from '../src/audit-sandbox.js'
import { queryIsolatedRegistry } from '../src/audit-registry.js'

describe('audit sandbox runner', () => {
  it('rejects commands and working directories outside the project before starting Docker', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-sandbox-'))
    try {
      const run = createAuditSandboxRunner(root)
      await expect(run('sh', ['-c', 'id'])).rejects.toThrow('unavailable')
      await expect(run('tsc', ['--noEmit', '--pretty', 'false'], { cwd: os.tmpdir() })).rejects.toThrow('outside project')
    } finally { fs.rmSync(root, { recursive: true, force: true }) }
  })

  it.skipIf(process.env.KADDO_TEST_DOCKER_SANDBOX !== '1')('executes TypeScript and denies host reads, writes and network in a real container', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-sandbox-'))
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-sandbox-outside-'))
    try {
      // mkdtemp creates mode 0700 on Unix, but the container runs unprivileged.
      if (process.platform !== 'win32') { fs.chmodSync(root, 0o755); fs.chmodSync(outside, 0o755) }
      const secret = path.join(outside, 'secret.txt')
      fs.writeFileSync(secret, 'host-only sentinel')
      const require = createRequire(import.meta.url)
      const tsRoot = path.dirname(require.resolve('typescript/package.json'))
      fs.mkdirSync(path.join(root, 'node_modules'), { recursive: true })
      fs.cpSync(tsRoot, path.join(root, 'node_modules', 'typescript'), { recursive: true })
      fs.writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true }, files: ['main.ts'] }))
      fs.writeFileSync(path.join(root, 'main.ts'), 'const value: string = 42\n')
      const run = createAuditSandboxRunner(root)
      const result = await run('tsc', ['--noEmit', '--pretty', 'false'], { cwd: root })
      expect(result.exitCode).not.toBe(0)
      expect(result.stdout).toContain('TS2322')

      // Replace the compiler with a hostile probe inside the disposable project.
      fs.writeFileSync(path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), `
const fs = require('fs'); const net = require('net');
try { fs.readFileSync(${JSON.stringify(secret)}); process.exit(10) } catch {}
try { fs.writeFileSync('/workspace/escape', 'bad'); process.exit(11) } catch {}
const s = net.connect(80, '192.0.2.1');
s.on('connect', () => process.exit(12)); s.on('error', () => process.exit(0));
setTimeout(() => process.exit(13), 5000);
`)
      const probe = await run('tsc', ['--noEmit', '--pretty', 'false'], { cwd: root })
      expect(probe.exitCode).toBe(0)
      expect(fs.existsSync(path.join(root, 'escape'))).toBe(false)
    } finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(outside, { recursive: true, force: true }) }
  }, 180_000)

  it.skipIf(process.env.KADDO_TEST_DOCKER_SANDBOX !== '1')('queries the real registry from a container without project mounts', async () => {
    const result = JSON.parse(await queryIsolatedRegistry({ packages: { lodash: ['4.17.20'] }, omitted: 0 }))
    expect(Object.values(result.advisories).length).toBeGreaterThan(0)
    expect(Object.values(result.advisories).some((a: any) => a.module_name === 'lodash')).toBe(true)
  }, 90_000)
})
