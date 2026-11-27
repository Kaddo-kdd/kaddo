import { spawn, execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'
import type { RegistryInventory } from '@kaddo/cli/core'

const IMAGE = 'node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944'
const execFileAsync = promisify(execFile)
// Fixed code in a pinned image: no project mounts, shell, project configuration or credentials.
// HTTPS verifies the registry certificate; redirects are deliberately not followed.
const QUERY = `
const https = require('node:https');
let input = ''; process.stdin.setEncoding('utf8');
process.stdin.on('data', part => { input += part; if (input.length > 10000000) process.exit(2); });
process.stdin.on('end', () => {
  const req = https.request({ hostname: 'registry.npmjs.org', path: '/-/npm/v1/security/advisories/bulk', method: 'POST', headers: { 'content-type': 'application/json' }, timeout: 30000 }, res => {
    if (res.statusCode !== 200) { res.resume(); process.exitCode = 3; return; }
    let body = ''; res.setEncoding('utf8');
    res.on('data', part => { body += part; if (body.length > 4000000) { req.destroy(); process.exitCode = 4; } });
    res.on('end', () => { if (!process.exitCode) process.stdout.write(body); });
  });
  req.on('timeout', () => req.destroy()); req.on('error', () => { process.exitCode = 5; });
  req.end(input);
});`

/** Send only an already-sanitized inventory to npm from an unmounted disposable container. */
export async function queryIsolatedRegistry(inventory: RegistryInventory): Promise<string> {
  const host = process.platform === 'win32' ? 'npipe:////./pipe/docker_engine' : 'unix:///var/run/docker.sock'
  const name = `kaddo-registry-${randomUUID()}`
  const args = ['--host', host, 'run', '--name', name, '--rm', '-i', '--pull=never', '--network=bridge', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=64', '--memory=256m', '--cpus=1', '--user=65534:65534', '--entrypoint', 'node', IMAGE, '-e', QUERY]
  let result: string
  try {
    result = await new Promise<string>((resolve, reject) => {
      const child = spawn('docker', args, { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
      let stdout = '', settled = false
      const timer = setTimeout(() => { child.kill(); finish(new Error('Registry query timed out.')) }, 45_000)
      function finish(error?: Error) { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(stdout) }
      child.on('error', () => finish(new Error('Registry container unavailable.')))
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', (part: string) => { stdout += part; if (stdout.length > 4_000_000) { child.kill(); finish(new Error('Registry response too large.')) } })
      child.on('close', code => finish(code === 0 ? undefined : new Error('Registry query failed.')))
      child.stdin.on('error', () => finish(new Error('Registry query failed.')))
      child.stdin.end(JSON.stringify(inventory.packages))
    })
  } catch (error) {
    try { await execFileAsync('docker', ['--host', host, 'rm', '--force', name], { timeout: 10_000, windowsHide: true }) } catch { /* best effort */ }
    throw error
  }
  let response: unknown
  try { response = JSON.parse(result) } catch { throw new Error('Invalid registry response.') }
  if (!response || typeof response !== 'object' || Array.isArray(response)) throw new Error('Invalid registry response.')
  const advisories: Record<string, unknown> = Object.create(null)
  for (const [pkg, records] of Object.entries(response)) {
    if (!Object.hasOwn(inventory.packages, pkg) || !Array.isArray(records)) throw new Error('Invalid registry response.')
    for (const record of records) {
      if (!record || typeof record !== 'object' || typeof record.id !== 'number' || typeof record.title !== 'string' || typeof record.vulnerable_versions !== 'string') throw new Error('Invalid registry advisory.')
      advisories[`${pkg}:${record.id}`] = { id: record.id, module_name: pkg, title: record.title, severity: record.severity, url: record.url, vulnerable_versions: record.vulnerable_versions }
    }
  }
  return JSON.stringify({ advisories, kaddoOmitted: inventory.omitted })
}
