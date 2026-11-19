#!/usr/bin/env node
// WI-087 — packaged-artifact smoke test for @kaddo/mcp.
//
// A green `tsup` build is NOT evidence that the PUBLISHED package runs: the ESM bundle regression
// (`Dynamic require of "child_process"`) passed build and publish but died at startup when installed from
// npm. This test validates the distributable artifact, not the source tree:
//
//   1. build @kaddo/cli + @kaddo/mcp
//   2. `pnpm pack` both (pnpm rewrites `workspace:*` to the real version, as publish does)
//   3. install the two tarballs into a throwaway dir OUTSIDE the monorepo (real registry deps resolved too)
//   4. run the installed `kaddo-mcp` binary against a throwaway Kaddo project
//   5. open a real MCP stdio session: initialize → tools/list → resources/list → read one real resource
//   6. close cleanly and remove the temp environment
//
// It fails on import errors, missing dependencies, a broken handshake, or an unexpected exit — the exact
// failure modes a source-only test cannot see. stdout stays reserved for the MCP protocol; this harness and
// the server both log to stderr.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..', '..')
const isWin = process.platform === 'win32'

function log(m) { process.stderr.write(`[smoke] ${m}\n`) }
function run(cmd, args, opts = {}) {
  log(`$ ${cmd} ${args.join(' ')}`)
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', shell: isWin, ...opts })
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-smoke-'))
let ok = false
try {
  // 1. Build the two packages that make up the published artifact.
  run('pnpm', ['--filter', '@kaddo/cli', '--filter', '@kaddo/mcp', 'build'], { cwd: repoRoot })

  // 2. Pack both. pnpm rewrites `workspace:*` to the concrete version, exactly as `pnpm publish` does.
  const packDir = path.join(work, 'tarballs')
  fs.mkdirSync(packDir, { recursive: true })
  run('pnpm', ['--filter', '@kaddo/cli', 'pack', '--pack-destination', packDir], { cwd: repoRoot })
  run('pnpm', ['--filter', '@kaddo/mcp', 'pack', '--pack-destination', packDir], { cwd: repoRoot })
  const find = (re) => {
    const f = fs.readdirSync(packDir).find((n) => re.test(n))
    if (!f) throw new Error(`tarball not found: ${re}`)
    return path.join(packDir, f)
  }
  const cliTgz = find(/^kaddo-cli-.*\.tgz$/)
  const mcpTgz = find(/^kaddo-mcp-.*\.tgz$/)
  log(`packed: ${path.basename(cliTgz)}, ${path.basename(mcpTgz)}`)

  // 3. Install the tarballs into an isolated app OUTSIDE the monorepo — no workspace node_modules in scope.
  //    The CLI tarball satisfies the MCP's pinned `@kaddo/cli` version; other deps come from the registry.
  const app = path.join(work, 'app')
  fs.mkdirSync(app, { recursive: true })
  fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({
    name: 'kaddo-mcp-smoke', private: true, version: '0.0.0', type: 'module',
    dependencies: { '@kaddo/cli': `file:${cliTgz}`, '@kaddo/mcp': `file:${mcpTgz}` },
  }, null, 2) + '\n')
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error'], { cwd: app })

  const binary = path.join(app, 'node_modules', '@kaddo', 'mcp', 'dist', 'index.js')
  if (!fs.existsSync(binary)) throw new Error(`installed binary missing: ${binary}`)

  // 4. A throwaway Kaddo project with at least one real knowledge artifact to read back.
  const proj = path.join(work, 'project')
  fs.mkdirSync(path.join(proj, 'knowledge', 'product'), { recursive: true })
  fs.mkdirSync(path.join(proj, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(proj, '.kaddo', 'config.yml'), 'version: 1\nproject:\n  name: smoke\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  fs.writeFileSync(path.join(proj, 'knowledge', 'README.md'), '# Knowledge\n\nSmoke project knowledge root.\n')
  fs.writeFileSync(path.join(proj, 'knowledge', 'product', 'vision.md'), '# Vision\n\nSmoke test product vision.\n')

  // 5. Real MCP stdio session driven by the SDK client (dev tooling), against the INSTALLED binary.
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js')

  const transport = new StdioClientTransport({ command: process.execPath, args: [binary], cwd: proj })
  const client = new Client({ name: 'kaddo-mcp-smoke', version: '0.0.0' })

  await withTimeout(client.connect(transport), 30_000, 'initialize handshake')     // AC-04
  log('initialize ✓ (MCP session open)')

  const tools = await withTimeout(client.listTools(), 15_000, 'tools/list')         // AC-05
  if (!tools.tools?.length) throw new Error('tools/list returned no tools')
  log(`tools/list ✓ (${tools.tools.length} tools)`)

  const resources = await withTimeout(client.listResources(), 15_000, 'resources/list')
  if (!resources.resources?.length) throw new Error('resources/list returned no resources')
  log(`resources/list ✓ (${resources.resources.length} resources)`)

  const target = resources.resources[0]
  const read = await withTimeout(client.readResource({ uri: target.uri }), 15_000, 'resources/read')
  if (!read.contents?.length) throw new Error(`resources/read returned no contents for ${target.uri}`)
  log(`resources/read ✓ (${target.uri})`)

  // 6. Clean shutdown — the transport ends the child process.
  await withTimeout(client.close(), 10_000, 'close')
  log('session closed ✓')
  ok = true
} catch (err) {
  log(`FAILED: ${err?.stack || err}`)
} finally {
  try { fs.rmSync(work, { recursive: true, force: true }) } catch { /* best effort */ }
}

if (!ok) {
  log('smoke test FAILED — the packaged @kaddo/mcp artifact is not runnable.')
  process.exit(1)
}
log('smoke test PASSED — packaged @kaddo/mcp installs, starts and serves MCP over stdio.')

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms: ${label}`)), ms).unref?.()),
  ])
}
