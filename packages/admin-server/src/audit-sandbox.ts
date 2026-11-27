import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { CommandRunner } from '@kaddo/cli/core'

// A digest pins the multi-platform image; --pull=never prevents implicit network access.
const IMAGE = 'node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944'
const execFileAsync = promisify(execFile)

/**
 * Docker runner for the fixed TypeScript analyzer. It exposes only the project,
 * read-only, and disables network. Dependency audits require registry access and
 * are deliberately reported as failed by the orchestrator, not as clean results.
 * The Docker daemon must be local and the pinned image preinstalled by the operator.
 */
export function createAuditSandboxRunner(projectDir: string): CommandRunner {
  const root = fs.realpathSync(projectDir)
  if (root.includes(',') || root.includes('\n') || root.includes('\r')) throw new Error('Unsupported project path for sandbox mount.')
  const host = process.platform === 'win32' ? 'npipe:////./pipe/docker_engine' : 'unix:///var/run/docker.sock'
  return async (command: string, args: string[], options?: { cwd?: string }) => {
    if (command !== 'tsc' || JSON.stringify(args) !== JSON.stringify(['--noEmit', '--pretty', 'false'])) {
      throw new Error('Analyzer unavailable in the isolated runner.')
    }
    const cwd = fs.realpathSync(options?.cwd ?? root)
    const relative = path.relative(root, cwd)
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Analyzer working directory outside project.')
    const workdir = relative ? `/workspace/${relative.split(path.sep).join('/')}` : '/workspace'
    const name = `kaddo-audit-${randomUUID()}`
    const dockerArgs = ['--host', host, 'run', '--name', name, '--rm', '--pull=never', '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=128', '--memory=512m', '--cpus=1', '--user=65534:65534', '--mount', `type=bind,src=${root},dst=/workspace,readonly,bind-recursive=disabled`, '--workdir', workdir, '--entrypoint', 'node', IMAGE, '/workspace/node_modules/typescript/bin/tsc', ...args]
    try {
      const result = await execFileAsync('docker', dockerArgs, { timeout: 120_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true })
      return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 }
    } catch (error) {
      const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; killed?: boolean; code?: string | number }
      if (typeof failure.code !== 'number' || failure.killed || failure.code === 125 || failure.code === 126 || failure.code === 127) {
        // docker run may have started a container before its client timed out.
        try { await execFileAsync('docker', ['--host', host, 'rm', '--force', name], { timeout: 10_000, windowsHide: true }) } catch { /* best effort; report the original failure */ }
        throw new Error('Isolated analyzer could not start or timed out.')
      }
      return { stdout: failure.stdout ?? '', stderr: failure.stderr ?? '', exitCode: failure.code }
    }
  }
}
