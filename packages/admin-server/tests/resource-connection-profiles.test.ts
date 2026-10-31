import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { ResourceCreateSchema } from '../src/contracts/schemas.js'
import { createResourceAdmin, getResourceDetailAdmin } from '../src/core-adapter.js'

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-res-cp-'))
  const cfg = ['project:', '  name: t', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n')
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), cfg, 'utf-8')
  return dir
}

describe('admin-server — Resource connection profiles (WI-069)', () => {
  let dir: string
  beforeEach(() => { dir = tmpProject() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('ResourceCreateSchema accepts non-secret connection profiles', () => {
    const parsed = ResourceCreateSchema.safeParse({
      title: 'Orders DB', resourceType: 'database',
      connectionProfiles: [{ environment: 'production', interface: 'sql', coordinates: [{ key: 'host', value: 'db.example.com' }] }],
    })
    expect(parsed.success).toBe(true)
  })

  it('round-trips profiles through create + detail', () => {
    createResourceAdmin(dir, {
      title: 'Orders DB', resourceType: 'database',
      connectionProfiles: [{ environment: 'production', coordinates: [{ key: 'host', value: 'db.example.com' }, { key: 'port', value: '5432' }] }],
    })
    const detail = getResourceDetailAdmin(dir, 'RES-orders-db')
    expect(detail.connectionProfiles[0].coordinates).toEqual([
      { key: 'host', value: 'db.example.com' },
      { key: 'port', value: '5432' },
    ])
  })

  it('rejects a secret coordinate with a value-free error (AC-13, AC-14)', () => {
    let message = ''
    try {
      createResourceAdmin(dir, {
        title: 'Leaky', resourceType: 'database',
        connectionProfiles: [{ coordinates: [{ key: 'password', value: 'hunter2-is-a-secret' }] }],
      })
    } catch (e) {
      message = (e as Error).message
    }
    expect(message).toMatch(/looks like a secret/i)
    expect(message).not.toContain('hunter2')
    expect(fs.existsSync(path.join(dir, 'knowledge/tech/resources/leaky.md'))).toBe(false)
  })
})
