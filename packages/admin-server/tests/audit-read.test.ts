import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage } from '../src/storage/admin-storage.js'

function storage(): AdminStorage { const sessions = new Map<string, any>(); return { initialize: async () => {}, close: async () => {}, sessions: { create: (v: any) => sessions.set(v.id, v), findById: (id: string) => sessions.get(id), deleteById: () => {}, deleteExpired: () => {} }, preferences: { get: () => undefined, set: () => {}, delete: () => {}, all: () => [] }, cache: { get: () => undefined, set: () => {}, delete: () => {}, clear: () => {} } } }
describe('Audit read API', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-audit-api-'))
  let app: Awaited<ReturnType<typeof createAdminServer>>['app']; let cookie = ''
  let calls = 0
  let gate: Promise<void> | undefined; let onStarted: (() => void) | undefined
  beforeAll(async () => {
    fs.mkdirSync(path.join(dir, '.kaddo', 'audits'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.kaddo', 'config.yml'), 'project:\n  name: fixture\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
    fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"fixture"}')
    fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
    fs.mkdirSync(path.join(dir, 'packages', 'cli'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'packages', 'cli', 'package.json'), '{"name":"@test/cli"}')
    const run = { id: 'AUD-001', createdAt: '2026-01-01T00:00:00Z', scope: { kind: 'project' }, status: 'partial', tools: [{ name: 'tsc', status: 'failed' }], coverage: { complete: false, evaluated: [], notEvaluated: ['tsc'] }, findings: [{ id: 'AF-0000000000000001', category: 'types', title: 'issue', description: '', evidence: 'observed', provenance: 'tsc', severity: 'high', confidence: 'confirmed', status: 'open', recommendation: 'review', references: {} }], limitations: [] }
    fs.writeFileSync(path.join(dir, '.kaddo', 'audits', 'AUD-001.json'), JSON.stringify(run))
    fs.mkdirSync(path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft', 'WI-001.md'), '---\nid: WI-001\ntitle: Fix\ntype: feature\nstatus: draft\n---\n# Fix\n')
    fs.mkdirSync(path.join(dir, 'static')); fs.writeFileSync(path.join(dir, 'static', 'index.html'), 'Admin')
    app = (await createAdminServer({ projectDir: dir, storage: storage(), staticDir: path.join(dir, 'static'), auditRunner: async (command) => { calls++; onStarted?.(); if (gate) await gate; return { stdout: command === 'tsc' ? '' : '{"advisories":{}}', stderr: '', exitCode: 0 } } })).app
    cookie = String((await app.inject({ method: 'GET', url: '/api/v1/admin/session' })).headers['set-cookie']).split(';')[0]
  })
  afterAll(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }) })
  it('requires a session and returns partial coverage through shared Core', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits' })).statusCode).toBe(401)
    const headers = { cookie }
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits', headers })).json()).toHaveLength(1)
    const detail = await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001', headers })
    expect(detail.json().run.coverage.complete).toBe(false)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001/plan', headers })).json().coverage.complete).toBe(false)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audit-comparison?before=AUD-001&after=AUD-001', headers })).statusCode).toBe(200)
  })
  it('rejects malformed IDs and filters', async () => {
    const headers = { cookie }
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/not-an-id', headers })).statusCode).toBe(400)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001?pathPrefix=..%2Fsecret', headers })).statusCode).toBe(400)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001?pathPrefix=C%3A%5Csecret', headers })).statusCode).toBe(400)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-999', headers })).statusCode).toBe(404)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001?module=missing', headers })).statusCode).toBe(400)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001?status=resolved', headers })).json().findings).toHaveLength(0)
    expect((await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001?status=open', headers })).json().findings).toHaveLength(1)
  })
  it('requires session, same origin, confirmation and a fresh revision to link', async () => {
    const file = path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft', 'WI-001.md')
    const original = fs.readFileSync(file, 'utf8')
    const payload = { runId: 'AUD-001', findingId: 'AF-0000000000000001', workItemId: 'WI-001', expectedRevision: createHash('sha256').update(original).digest('hex'), confirmed: true }
    const url = '/api/v1/admin/audit-links'
    expect((await app.inject({ method: 'POST', url, payload, headers: { cookie } })).statusCode).toBe(403)
    expect((await app.inject({ method: 'POST', url, payload: { ...payload, confirmed: false }, headers: { cookie, origin: 'http://127.0.0.1:4173' } })).statusCode).toBe(400)
    expect(fs.readFileSync(file, 'utf8')).toBe(original)
    const headers = { cookie, origin: 'http://127.0.0.1:4173' }
    expect((await app.inject({ method: 'POST', url, payload, headers })).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url, payload, headers })).statusCode).toBe(409)
  })
  it('executes once with explicit confirmation and reuses the stored result', async () => {
    const url = '/api/v1/admin/audits/run', headers = { cookie, origin: 'http://127.0.0.1:4173' }
    const payload = { requestId: '460de81d-d5a8-42ab-84c2-f697f2fac284', confirmed: true }
    expect((await app.inject({ method: 'POST', url, payload: { ...payload, confirmed: false }, headers })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url, payload, headers: { cookie } })).statusCode).toBe(403)
    expect((await app.inject({ method: 'POST', url, payload, headers: { origin: 'http://127.0.0.1:4173' } })).statusCode).toBe(401)
    const invalidId = '3a792ccb-c3b9-44b4-b55e-386a0db011ca'
    expect((await app.inject({ method: 'POST', url, payload: { requestId: invalidId, confirmed: true, paths: ['../outside'] }, headers })).statusCode).toBe(400)
    expect(fs.existsSync(path.join(dir, '.kaddo', 'audit-requests', `${invalidId}.json`))).toBe(false)
    expect(calls).toBe(0)
    const first = await app.inject({ method: 'POST', url, payload, headers })
    expect(first.statusCode, first.body).toBe(200)
    expect(first.json().reused).toBe(false)
    expect(calls).toBe(2)
    const replay = await app.inject({ method: 'POST', url, payload, headers })
    expect(replay.statusCode, replay.body).toBe(200)
    expect(replay.json().reused).toBe(true)
    expect(replay.json().run.id).toBe(first.json().run.id)
    expect(calls).toBe(2)
    expect((await app.inject({ method: 'POST', url, payload: { ...payload, paths: ['src'] }, headers })).statusCode).toBe(409)
    expect(fs.existsSync(path.join(dir, 'knowledge', 'tech', 'audits'))).toBe(false)
  })
  it('rejects overlapping runs, including retry of the same request', async () => {
    let release!: () => void
    gate = new Promise<void>(resolve => { release = resolve })
    const started = new Promise<void>(resolve => { onStarted = resolve })
    const url = '/api/v1/admin/audits/run', headers = { cookie, origin: 'http://127.0.0.1:4173' }
    const payload = { requestId: '9ff664ab-4520-4bf6-a776-ffcd7e7d07dd', confirmed: true }
    const first = app.inject({ method: 'POST', url, payload, headers })
    await started
    try {
      expect((await app.inject({ method: 'POST', url, payload, headers })).statusCode).toBe(409)
      expect((await app.inject({ method: 'POST', url, payload: { ...payload, requestId: '88a0bb4b-49ea-4b9c-b689-4ab15959e183' }, headers })).statusCode).toBe(409)
    } finally { release(); gate = undefined; onStarted = undefined }
    expect((await first).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url, payload: { ...payload, requestId: '88a0bb4b-49ea-4b9c-b689-4ab15959e183' }, headers })).statusCode).toBe(409)
  })
  it('reports partial coverage for module and unsupported path scopes', async () => {
    const url = '/api/v1/admin/audits/run', headers = { cookie, origin: 'http://127.0.0.1:4173' }
    const before = calls
    const moduleRun = await app.inject({ method: 'POST', url, headers, payload: { requestId: 'a4d64284-d1fa-402c-8d47-df79f3029335', confirmed: true, module: ['@test/cli'] } })
    expect(moduleRun.statusCode, moduleRun.body).toBe(200)
    expect(moduleRun.json().run).toMatchObject({ status: 'partial', scope: { kind: 'module', modules: ['@test/cli'] }, coverage: { complete: false } })
    expect(calls).toBe(before + 1)
    const pathRun = await app.inject({ method: 'POST', url, headers, payload: { requestId: '4ad9a1da-9e7c-4ab7-b607-4bd4533090af', confirmed: true, paths: ['packages/cli/src'] } })
    expect(pathRun.statusCode, pathRun.body).toBe(200)
    expect(pathRun.json().run).toMatchObject({ status: 'partial', scope: { kind: 'paths' }, coverage: { complete: false } })
    expect(calls).toBe(before + 1)
  })
  it('rejects knowledge directories that resolve outside the project', async () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-outside-'))
    const linked = path.join(dir, 'knowledge', 'external')
    try {
      fs.symlinkSync(outside, linked, process.platform === 'win32' ? 'junction' : 'dir')
      const response = await app.inject({ method: 'GET', url: '/api/v1/admin/audits/AUD-001', headers: { cookie } })
      expect(response.statusCode).toBe(500)
      expect(response.body).not.toContain(outside)
    } finally {
      if (fs.existsSync(linked)) fs.unlinkSync(linked)
      fs.rmSync(outside, { recursive: true, force: true })
    }
  })
  it.skipIf(process.env.KADDO_TEST_DOCKER_SANDBOX === '1')('fails closed without an isolated runner and does not create a request marker', async () => {
    const server = (await createAdminServer({ projectDir: dir, storage: storage(), staticDir: path.join(dir, 'static') })).app
    try {
      const session = String((await server.inject({ method: 'GET', url: '/api/v1/admin/session' })).headers['set-cookie']).split(';')[0]
      const requestId = 'dec4576f-3365-4802-865d-39b6c7e13820'
      const response = await server.inject({ method: 'POST', url: '/api/v1/admin/audits/run', headers: { cookie: session, origin: 'http://127.0.0.1:4173' }, payload: { requestId, confirmed: true } })
      expect(response.statusCode).toBe(503)
      expect(response.json().error.code).toBe('AUDIT_ISOLATION_UNAVAILABLE')
      expect(fs.existsSync(path.join(dir, '.kaddo', 'audit-requests', `${requestId}.json`))).toBe(false)
    } finally { await server.close() }
  })
})
