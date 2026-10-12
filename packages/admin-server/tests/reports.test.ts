import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage } from '../src/storage/admin-storage.js'

function write(dir: string, rel: string, content: string) { const file = path.join(dir, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content) }
function storage(): AdminStorage { const sessions = new Map<string, any>(); return { initialize: async () => {}, close: async () => {}, sessions: { create: (v: any) => sessions.set(v.id, v), findById: (id: string) => sessions.get(id), deleteById: () => {}, deleteExpired: () => {} }, preferences: { get: () => undefined, set: () => {}, delete: () => {}, all: () => [] }, cache: { get: () => undefined, set: () => {}, delete: () => {}, clear: () => {} } } }

describe('WI-064 — reports endpoints', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-admin-reports-'))
  let app: Awaited<ReturnType<typeof createAdminServer>>['app']
  let cookie = ''
  beforeAll(async () => {
    write(dir, '.kaddo/config.yml', 'version: 1\nproject:\n  name: reports\n  state: pre-ai\n  structure: monorepo\nteam:\n  size: small\n')
    write(dir, 'knowledge/delivery/work-items/completed/WI-001.md', '---\nid: WI-001\ntitle: Done\ntype: feature\nstatus: completed\ncode: [src/a.ts]\n---\n# Done\n\n## Acceptance Criteria\n- ok\n')
    write(dir, 'admin-static/index.html', '<!doctype html><title>Admin</title>')
    const server = await createAdminServer({ projectDir: dir, storage: storage(), staticDir: path.join(dir, 'admin-static') }); app = server.app
    const session = await app.inject({ method: 'GET', url: '/api/v1/admin/session' }); cookie = String(session.headers['set-cookie']).split(';')[0]
  })
  afterAll(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }) })
  const get = (url: string) => app.inject({ method: 'GET', url, headers: { cookie } })

  it('serves the three Core-built reports without writing report files', async () => {
    for (const kind of ['impact', 'drift', 'savings']) {
      const response = await get(`/api/v1/admin/reports/${kind}`)
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.project).toBe('reports')
      expect(body.generated_at).toBeTruthy()
    }
    expect(fs.existsSync(path.join(dir, '.kaddo/reports'))).toBe(false)
  })

  it('exports Core Markdown and JSON in memory', async () => {
    const markdown = await get('/api/v1/admin/reports/impact/export?format=markdown&scope=all')
    expect(markdown.statusCode).toBe(200)
    expect(markdown.headers['content-type']).toContain('text/markdown')
    expect(markdown.body).toContain('# Kaddo Knowledge Impact Report')
    const json = await get('/api/v1/admin/reports/savings/export?format=json')
    expect(JSON.parse(json.body).project).toBe('reports')
    expect(fs.existsSync(path.join(dir, '.kaddo/reports'))).toBe(false)
  })

  it('keeps nested report APIs ahead of the SPA fallback', async () => {
    const response = await get('/api/v1/admin/reports/impact')
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(JSON.parse(response.body).project).toBe('reports')
  })

  it('rejects unsupported report scopes', async () => {
    const response = await get('/api/v1/admin/reports/savings?scope=closed')
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.code).toBe('INVALID_INPUT')
  })
})
