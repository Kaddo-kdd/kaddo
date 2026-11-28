import { describe, expect, it } from 'vitest'
import { buildRegistryInventory } from '../src/core/audit-registry-input.js'

describe('registry audit inventory', () => {
  it('extracts only package names and exact versions from npm v3', () => {
    const result = buildRegistryInventory('npm', JSON.stringify({ lockfileVersion: 3, packages: {
      '': { name: 'private-project', secret: 'hidden' },
      'node_modules/example': { version: '1.2.3', resolved: 'https://private.example/token' },
      'node_modules/@scope/name': { version: '2.0.0' },
      'node_modules/local': { link: true, resolved: '../local' },
    } }))
    expect(result).toEqual({ packages: { '@scope/name': ['2.0.0'], example: ['1.2.3'] }, omitted: 1 })
    expect(JSON.stringify(result)).not.toContain('private')
  })
  it('extracts pnpm v9 package identities without metadata or guessed versions', () => {
    const result = buildRegistryInventory('pnpm', `lockfileVersion: '9.0'\npackages:\n  '@scope/name@2.1.0':\n    resolution:\n      tarball: https://private.example/secret\n  'example@1.0.0': {}\n  'odd@file:../outside': {}\n`)
    expect(result).toEqual({ packages: { '@scope/name': ['2.1.0'], example: ['1.0.0'] }, omitted: 1 })
    expect(JSON.stringify(result)).not.toContain('private')
  })
  it('rejects unsupported formats and unbounded input', () => {
    expect(() => buildRegistryInventory('npm', '{"lockfileVersion":1,"packages":{}}')).toThrow('Unsupported')
    expect(() => buildRegistryInventory('pnpm', 'lockfileVersion: 8\npackages: {}')).toThrow('Unsupported')
    expect(() => buildRegistryInventory('npm', ' '.repeat(10 * 1024 * 1024 + 1))).toThrow('limit')
  })
})
