import { describe, it, expect } from 'vitest'
import { prismaPlugin } from '../src/plugins/prisma.js'
import { openapiPlugin } from '../src/plugins/openapi.js'
import { resolvePlugins, runPlugins, listAvailablePlugins } from '../src/plugins/registry.js'

const noRead = (_path: string): null => null

function makeRead(files: Record<string, string>) {
  return (path: string): string | null => files[path] ?? null
}

describe('prisma plugin', () => {
  it('detects DROP COLUMN in migration SQL', () => {
    const read = makeRead({ 'db/migrations/001_drop.sql': 'ALTER TABLE users DROP COLUMN email;' })
    const signals = prismaPlugin.detect(['db/migrations/001_drop.sql'], read)
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].severity).toBe('critical')
    expect(signals[0].plugin).toBe('prisma')
  })

  it('detects DROP TABLE', () => {
    const read = makeRead({ 'prisma/migrations/001.sql': 'DROP TABLE orders;' })
    const signals = prismaPlugin.detect(['prisma/migrations/001.sql'], read)
    expect(signals.length).toBeGreaterThan(0)
  })

  it('detects RENAME COLUMN', () => {
    const read = makeRead({ 'db/migrations/002.sql': 'ALTER TABLE t RENAME COLUMN old_name TO new_name;' })
    const signals = prismaPlugin.detect(['db/migrations/002.sql'], read)
    expect(signals.length).toBeGreaterThan(0)
  })

  it('ignores non-migration files', () => {
    const read = makeRead({ 'src/services/user.ts': 'DROP COLUMN' })
    const signals = prismaPlugin.detect(['src/services/user.ts'], read)
    expect(signals.length).toBe(0)
  })

  it('returns no signals for safe migrations', () => {
    const read = makeRead({
      'db/migrations/003.sql': 'ALTER TABLE users ADD COLUMN phone TEXT;'
    })
    const signals = prismaPlugin.detect(['db/migrations/003.sql'], read)
    expect(signals.length).toBe(0)
  })

  it('returns no signals when file cannot be read', () => {
    const signals = prismaPlugin.detect(['db/migrations/ghost.sql'], noRead)
    expect(signals.length).toBe(0)
  })

  it('only emits one signal per file', () => {
    const read = makeRead({
      'db/migrations/multi.sql': 'DROP COLUMN a;\nDROP TABLE b;'
    })
    const signals = prismaPlugin.detect(['db/migrations/multi.sql'], read)
    expect(signals.length).toBe(1)
  })
})

describe('openapi plugin', () => {
  it('flags openapi.yaml as info when modified', () => {
    const read = makeRead({ 'openapi.yaml': 'openapi: "3.0.0"\npaths:\n  /users:\n    get: {}' })
    const signals = openapiPlugin.detect(['openapi.yaml'], read)
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].plugin).toBe('openapi')
  })

  it('flags swagger.json when modified', () => {
    const read = makeRead({ 'swagger.json': '{"openapi": "3.0"}' })
    const signals = openapiPlugin.detect(['swagger.json'], read)
    expect(signals.length).toBeGreaterThan(0)
  })

  it('ignores non-api files', () => {
    const read = makeRead({ 'src/api/users.ts': 'export function getUsers() {}' })
    const signals = openapiPlugin.detect(['src/api/users.ts'], read)
    expect(signals.length).toBe(0)
  })

  it('still flags unreadable openapi file', () => {
    const signals = openapiPlugin.detect(['openapi.yaml'], noRead)
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].severity).toBe('info')
  })

  it('detects breaking change pattern in diff-like content', () => {
    const diffContent = '-  /users/{id}:\n-    get:\n+  /persons/{id}:\n+    get:'
    const read = makeRead({ 'openapi.yaml': diffContent })
    const signals = openapiPlugin.detect(['openapi.yaml'], read)
    expect(signals.length).toBeGreaterThan(0)
  })
})

describe('plugin registry', () => {
  it('listAvailablePlugins returns prisma and openapi', () => {
    const names = listAvailablePlugins().map((p) => p.name)
    expect(names).toContain('prisma')
    expect(names).toContain('openapi')
  })

  it('resolvePlugins returns only known plugins', () => {
    const plugins = resolvePlugins(['prisma', 'unknown', 'openapi'])
    expect(plugins.length).toBe(2)
    expect(plugins.map((p) => p.name)).toContain('prisma')
    expect(plugins.map((p) => p.name)).toContain('openapi')
  })

  it('resolvePlugins returns empty array for empty input', () => {
    expect(resolvePlugins([])).toHaveLength(0)
  })

  it('runPlugins aggregates signals from all plugins', () => {
    const plugins = resolvePlugins(['prisma', 'openapi'])
    const read = makeRead({
      'db/migrations/001.sql': 'DROP TABLE users;',
      'openapi.yaml': 'openapi: 3.0',
    })
    const signals = runPlugins(plugins, ['db/migrations/001.sql', 'openapi.yaml'], read)
    expect(signals.length).toBeGreaterThanOrEqual(2)
  })

  it('runPlugins is non-fatal on plugin error', () => {
    const badPlugin = {
      name: 'bad',
      description: 'throws',
      detect: () => { throw new Error('oops') },
    }
    expect(() => runPlugins([badPlugin], ['file.ts'], noRead)).not.toThrow()
  })
})
