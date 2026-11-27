import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { ProjectDiscovery, KnowledgeArtifact } from '@kaddo/cli/core'

const execFileAsync = promisify(execFile)
const IMAGE = 'node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944'
export type IsolatedDiscovery = { discovery: ProjectDiscovery; artifacts: KnowledgeArtifact[]; owners: Record<string, string[]>; configured: boolean }

/** All project discovery reads happen inside the container, never via host paths. */
export async function discoverAuditIsolated(dir: string): Promise<IsolatedDiscovery> {
  const root = fs.realpathSync(dir)
  const require = createRequire(import.meta.url)
  const bundle = path.join(path.dirname(require.resolve('@kaddo/cli/core')), 'audit-discover-sandbox.cjs')
  if ([root, bundle].some(value => /[,\r\n]/.test(value))) throw new Error('Unsupported audit sandbox path.')
  const host = process.platform === 'win32' ? 'npipe:////./pipe/docker_engine' : 'unix:///var/run/docker.sock'
  const name = `kaddo-discovery-${randomUUID()}`
  const args = ['--host', host, 'run', '--name', name, '--rm', '--pull=never', '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=128', '--memory=512m', '--cpus=1', '--user=65534:65534', '--mount', `type=bind,src=${root},dst=/workspace,readonly,bind-recursive=disabled`, '--mount', `type=bind,src=${bundle},dst=/audit-discover.cjs,readonly`, '--workdir', '/workspace', '--entrypoint', 'node', IMAGE, '/audit-discover.cjs']
  let stdout: string
  try { ({ stdout } = await execFileAsync('docker', args, { timeout: 120_000, maxBuffer: 16 * 1024 * 1024, windowsHide: true })) }
  catch {
    try { await execFileAsync('docker', ['--host', host, 'rm', '--force', name], { timeout: 10_000, windowsHide: true }) } catch { /* best effort */ }
    throw new Error('Isolated audit discovery failed.')
  }
  let result: IsolatedDiscovery
  try { result = JSON.parse(stdout) } catch { throw new Error('Invalid isolated discovery result.') }
  if (!result || !result.discovery || !Array.isArray(result.discovery.modules) || !Array.isArray(result.artifacts) || !result.owners || typeof result.owners !== 'object' || typeof result.configured !== 'boolean') throw new Error('Invalid isolated discovery result.')
  return result
}
