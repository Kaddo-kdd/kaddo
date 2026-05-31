import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { loadOwners, resolveAffectedOwners, collectMatchedDomains } from '../src/services/owners.js'

function makeProject(configContent: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'kaddo-owners-'))
  mkdirSync(join(dir, '.kaddo'), { recursive: true })
  writeFileSync(join(dir, '.kaddo', 'config.yml'), configContent)
  return dir
}

describe('loadOwners', () => {
  let dir: string

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns empty map when no owners key in config', () => {
    dir = makeProject('project: test\nversion: "1"\n')
    expect(loadOwners(dir)).toEqual({})
  })

  it('returns empty map when config does not exist', () => {
    dir = mkdtempSync(join(tmpdir(), 'kaddo-owners-empty-'))
    expect(loadOwners(dir)).toEqual({})
  })

  it('parses owners from config', () => {
    dir = makeProject('project: test\nowners:\n  payments:\n    - alice\n    - bob\n  orders:\n    - carol\n')
    const owners = loadOwners(dir)
    expect(owners.payments).toEqual(['alice', 'bob'])
    expect(owners.orders).toEqual(['carol'])
  })

  it('handles single string owner (not array)', () => {
    dir = makeProject('project: test\nowners:\n  payments: alice\n')
    const owners = loadOwners(dir)
    expect(owners.payments).toEqual(['alice'])
  })
})

describe('resolveAffectedOwners', () => {
  const ownerMap = {
    payments: ['alice', 'bob'],
    orders: ['carol'],
    auth: ['dave'],
  }

  it('returns owners for matched domains', () => {
    const result = resolveAffectedOwners(['payments'], ownerMap)
    expect(result).toHaveLength(1)
    expect(result[0].domain).toBe('payments')
    expect(result[0].owners).toEqual(['alice', 'bob'])
  })

  it('returns multiple domain matches', () => {
    const result = resolveAffectedOwners(['payments', 'orders'], ownerMap)
    expect(result).toHaveLength(2)
  })

  it('skips domains with no owners configured', () => {
    const result = resolveAffectedOwners(['unknown-domain'], ownerMap)
    expect(result).toHaveLength(0)
  })

  it('returns empty for empty domain list', () => {
    expect(resolveAffectedOwners([], ownerMap)).toHaveLength(0)
  })

  it('returns empty when owner map is empty', () => {
    expect(resolveAffectedOwners(['payments'], {})).toHaveLength(0)
  })
})

describe('collectMatchedDomains', () => {
  it('deduplicates domains across multiple artifacts', () => {
    const domains = collectMatchedDomains([
      ['payments', 'auth'],
      ['payments'],
      ['orders'],
    ])
    expect(domains).toHaveLength(3)
    expect(domains).toContain('payments')
    expect(domains).toContain('auth')
    expect(domains).toContain('orders')
  })

  it('returns empty for empty input', () => {
    expect(collectMatchedDomains([])).toHaveLength(0)
  })

  it('ignores empty domain strings', () => {
    const domains = collectMatchedDomains([['', 'payments'], ['']])
    expect(domains).toContain('payments')
    expect(domains).not.toContain('')
  })

  it('handles artifacts with no domains', () => {
    const domains = collectMatchedDomains([[], [], ['orders']])
    expect(domains).toEqual(['orders'])
  })
})
