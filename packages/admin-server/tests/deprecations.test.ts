import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage } from '../src/storage/admin-storage.js'
import { DeprecationsListSchema, DeprecationTargetResponseSchema } from '../src/contracts/schemas.js'

function write(dir: string, rel: string, content: string) { const file = path.join(dir, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content) }
function storage(): AdminStorage { const sessions = new Map<string, any>(); return { initialize: async () => {}, close: async () => {}, sessions: { create: (v: any) => sessions.set(v.id, v), findById: (id: string) => sessions.get(id), deleteById: () => {}, deleteExpired: () => {} }, preferences: { get: () => undefined, set: () => {}, delete: () => {}, all: () => [] }, cache: { get: () => undefined, set: () => {}, delete: () => {}, clear: () => {} } } }

describe('WI-053 — Deprecation Admin endpoints', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-admin-deprecations-'))
  let app: Awaited<ReturnType<typeof createAdminServer>>['app']
  let cookie = ''
  beforeAll(async () => {
    write(dir, '.kaddo/config.yml', 'project:\n  name: admin\n  state: legacy\n  structure: monorepo\nteam:\n  size: small\n')
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', ['---', 'id: DEP-001', 'type: deprecation-plan', 'title: Retire legacy', 'targets:', '  - id: DEP-TGT-001', '    type: database-object', '    locator: dbo.Legacy', '    lifecycle: production-ready', '    environments:', '      development: removed', '      test: removed', '      production: active', '---', ''].join('\n'))
    const server = await createAdminServer({ projectDir: dir, storage: storage() })
    app = server.app
    const session = await app.inject({ method: 'GET', url: '/api/v1/admin/session' })
    cookie = String(session.headers['set-cookie']).split(';')[0]
  })
  afterAll(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }) })
  const get = (url: string) => app.inject({ method: 'GET', url, headers: { cookie } })

  it('serves the Core-derived summary, environment matrix, and target detail', async () => {
    const list = await get('/api/v1/admin/deprecations')
    expect(list.statusCode).toBe(200)
    const listBody = DeprecationsListSchema.parse(JSON.parse(list.body))
    expect(listBody.plans[0].summary).toMatchObject({ targets: 1, devTestRemoved: 1, productionPending: 1 })
    const target = await get('/api/v1/admin/deprecations/DEP-001/targets/DEP-TGT-001')
    expect(target.statusCode).toBe(200)
    const targetBody = DeprecationTargetResponseSchema.parse(JSON.parse(target.body))
    expect(targetBody.target.environment.perEnvironment).toMatchObject({ development: 'removed', test: 'removed', production: 'active' })
  })

  it('returns 404 for unknown plans and 400 for invalid identifiers', async () => {
    expect((await get('/api/v1/admin/deprecations/DEP-404')).statusCode).toBe(404)
    expect((await get('/api/v1/admin/deprecations/DEP%5Cinvalid')).statusCode).toBe(400)
  })
})
