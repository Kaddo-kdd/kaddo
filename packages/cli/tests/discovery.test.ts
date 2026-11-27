import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  discoverProject, serializeDiscovery, parseDiscovery,
} from '../src/core/discovery.js'

// WI-091 (EP-001/INI-001, AUD-C2) — the Discover step: a pure, read-only inventory of stack, workspace
// modules, dependencies, configuration presence and existing knowledge, honest about what it cannot read.

let dir: string

function write(rel: string, content: string) {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function fixtureMonorepo() {
  write('tsconfig.json', '{}')
  write('pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n')
  write('pnpm-lock.yaml', 'lockfileVersion: 9\n')
  write('eslint.config.js', 'export default []\n')
  write('vitest.config.ts', 'export default {}\n')
  write('.github/workflows/ci.yml', 'name: ci\n')
  write('package.json', JSON.stringify({ name: 'root', devDependencies: { typescript: '^5', vitest: '^2' } }))
  write('packages/cli/package.json', JSON.stringify({ name: '@acme/cli', dependencies: { commander: '^12' }, devDependencies: { vitest: '^2' } }))
  write('packages/core/package.json', JSON.stringify({ name: '@acme/core', dependencies: { zod: '^3' } }))
  // An existing knowledge artifact so the inventory is non-empty.
  write('knowledge/delivery/work-items/ready/WI-001-sample.md',
    '---\ntype: feature\nid: WI-001\ntitle: Sample\nstatus: ready\n---\n\n# Sample\n')
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-discovery-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('project discovery (WI-091)', () => {
  it('detects the monorepo layout: package manager and workspace modules with their paths (AC-02)', () => {
    fixtureMonorepo()
    const d = discoverProject(dir, { createdAt: 't' })
    expect(d.stack.language).toBe('typescript')
    expect(d.stack.packageManager).toBe('pnpm')
    expect(d.stack.workspace).toBe(true)
    expect(d.modules.map((m) => `${m.name}@${m.path}`).sort()).toEqual([
      '@acme/cli@packages/cli',
      '@acme/core@packages/core',
    ])
    expect(d.modules.every((m) => m.role === 'packages')).toBe(true)
  })

  it('collects dependencies per module and root, without network (AC-03)', () => {
    fixtureMonorepo()
    const d = discoverProject(dir, { createdAt: 't' })
    expect(d.dependencies['.'].devDependencies).toEqual(['typescript', 'vitest'])
    expect(d.dependencies['packages/cli']).toEqual({ dependencies: ['commander'], devDependencies: ['vitest'] })
    expect(d.dependencies['packages/core'].dependencies).toEqual(['zod'])
  })

  it('reports configuration presence as present/absent, never guessed (AC-04)', () => {
    fixtureMonorepo()
    expect(discoverProject(dir, { createdAt: 't' }).configs).toEqual({
      typescript: true, lint: true, test: true, ci: true,
    })
    // A bare project: every flag false, not inferred.
    const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-bare-'))
    try {
      fs.writeFileSync(path.join(bare, 'package.json'), '{"name":"x"}')
      expect(discoverProject(bare, { createdAt: 't' }).configs).toEqual({
        typescript: false, lint: false, test: false, ci: false,
      })
    } finally { fs.rmSync(bare, { recursive: true, force: true }) }
  })

  it('inventories existing knowledge as light references (type, id, path) (AC-05)', () => {
    fixtureMonorepo()
    const d = discoverProject(dir, { createdAt: 't' })
    const wi = d.knowledge.find((k) => k.id === 'WI-001')
    expect(wi).toBeDefined()
    expect(wi).toMatchObject({ type: 'feature', id: 'WI-001', layer: 'delivery' })
    expect(wi!.path).toBe('knowledge/delivery/work-items/ready/WI-001-sample.md')
  })

  it('records anything it cannot read in limitations, never silently (AC-06)', () => {
    fixtureMonorepo()
    // Corrupt one module manifest.
    fs.writeFileSync(path.join(dir, 'packages', 'core', 'package.json'), '{ not valid json')
    const d = discoverProject(dir, { createdAt: 't' })
    expect(d.limitations.join(' ')).toMatch(/packages\/core\/package\.json/)
    // The module is still listed (name falls back to the directory); the failure is surfaced, not hidden.
    expect(d.modules.some((m) => m.path === 'packages/core')).toBe(true)
  })

  it('serializes deterministically and round-trips (AC-07)', () => {
    fixtureMonorepo()
    const d = discoverProject(dir, { createdAt: 't' })
    const json = serializeDiscovery(d)
    expect(serializeDiscovery(parseDiscovery(json))).toBe(json)
    expect(parseDiscovery(json)).toEqual(d)
  })

  it('a project with no workspace yields zero modules and workspace=false (AC-02 boundary)', () => {
    write('package.json', JSON.stringify({ name: 'solo', dependencies: { left: '^1' } }))
    write('tsconfig.json', '{}')
    const d = discoverProject(dir, { createdAt: 't' })
    expect(d.stack.workspace).toBe(false)
    expect(d.modules).toEqual([])
    expect(d.dependencies['.'].dependencies).toEqual(['left'])
  })

  it('is exported from the Core barrel, reusable by CLI/MCP/Admin (AC-08)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.discoverProject).toBe('function')
    expect(typeof core.serializeDiscovery).toBe('function')
    expect(typeof core.parseDiscovery).toBe('function')
  })

  it('discovers this very repository: the 5 workspace packages and a non-empty knowledge inventory (AC-02/AC-05)', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const d = discoverProject(repoRoot, { createdAt: 't' })
    const names = d.modules.map((m) => m.name)
    for (const pkg of ['@kaddo/cli', '@kaddo/admin', '@kaddo/admin-server', '@kaddo/mcp', '@kaddo/integrations']) {
      expect(names).toContain(pkg)
    }
    expect(d.stack.packageManager).toBe('pnpm')
    expect(d.knowledge.length).toBeGreaterThan(0)
  })
})
