import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage, SessionRecord, PreferenceRecord } from '../src/storage/admin-storage.js'

function fakeStorage(): AdminStorage {
  const sessions = new Map<string, SessionRecord>(); const prefs = new Map<string, string>(); const cache = new Map<string, string>()
  return {
    initialize: async () => {}, close: async () => {},
    sessions: { create: (s) => { sessions.set(s.id, s) }, findById: (id) => sessions.get(id), deleteById: (id) => { sessions.delete(id) }, deleteExpired: () => {} },
    preferences: { get: (k) => prefs.get(k), set: (k, v) => { prefs.set(k, v) }, delete: (k) => { prefs.delete(k) }, all: () => [...prefs.entries()].map(([key, value]) => ({ key, value } as PreferenceRecord)) },
    cache: { get: (k) => cache.get(k), set: (k, v) => { cache.set(k, v) }, delete: (k) => { cache.delete(k) }, clear: () => cache.clear() },
  }
}

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-plan-life-api-'))
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  w('knowledge/delivery/epics/EP-001.md', '---\ntype: epic\nid: EP-001\ntitle: Auth\nstatus: in-progress\noutcome: Ship SSO\nsuccess_criteria:\n  - SSO works\n---\n# E\n')
  return dir
}

describe('admin-server — Planning lifecycle & completion API (WI-078)', () => {
  let dir: string
  let app: Awaited<ReturnType<typeof createAdminServer>>['app']
  let cookie: string

  beforeEach(async () => {
    dir = tmpProject()
    const server = await createAdminServer({ projectDir: dir, storage: fakeStorage() })
    app = server.app
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/session' })
    cookie = (res.headers['set-cookie'] as string).split(';')[0]
  })
  afterEach(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }) })

  function send(method: string, url: string, body?: unknown) {
    const headers: Record<string, string> = { cookie }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers.origin = 'http://127.0.0.1:4173'
    if (body) headers['content-type'] = 'application/json'
    return app.inject({ method: method as never, url, headers, payload: body ? JSON.stringify(body) : undefined })
  }

  it('verify → evidence → verify reflects evidence-based readiness', async () => {
    expect((await send('GET', '/api/v1/admin/planning/epics/EP-001/verify')).json().readiness).toBe('NEEDS_WORK')
    const ev = await send('POST', '/api/v1/admin/planning/epics/EP-001/evidence', { criterion: 'SSO works', status: 'passed', evidence: 'verified' })
    expect(ev.statusCode).toBe(200)
    expect((await send('GET', '/api/v1/admin/planning/epics/EP-001/verify')).json().readiness).toBe('READY_TO_COMPLETE')
  })

  it('AC-21: completing is human-gated — blocked until verified (409 PLANNING_NOT_READY), then records the decision', async () => {
    const blocked = await send('POST', '/api/v1/admin/planning/epics/EP-001/complete', { decidedBy: 'lead' })
    expect(blocked.statusCode).toBe(409)
    expect(blocked.json().error.code).toBe('PLANNING_NOT_READY')
    await send('POST', '/api/v1/admin/planning/epics/EP-001/evidence', { criterion: 'SSO works', status: 'passed', evidence: 'ok' })
    const done = await send('POST', '/api/v1/admin/planning/epics/EP-001/complete', { decidedBy: 'lead', note: 'Reviewed' })
    expect(done.statusCode).toBe(200)
    expect(done.json().status).toBe('completed')
    expect(done.json().completionDecision).toMatchObject({ readiness: 'READY_TO_COMPLETE', decided_by: 'lead' })
  })

  it('transition rejects → completed (schema) but starts/cancels; AC-20 completion never automatic', async () => {
    const bad = await send('POST', '/api/v1/admin/planning/epics/EP-001/transition', { to: 'completed' })
    expect(bad.statusCode).toBe(400)
    const cancel = await send('POST', '/api/v1/admin/planning/epics/EP-001/transition', { to: 'cancelled' })
    expect(cancel.statusCode).toBe(200)
    expect(cancel.json().status).toBe('cancelled')
  })

  it('AC-05: a stale expectedRevision on evidence yields 409 PLANNING_CONFLICT', async () => {
    const rev = (await send('GET', '/api/v1/admin/planning/epics/EP-001')).json().revision
    await send('POST', '/api/v1/admin/planning/epics/EP-001/evidence', { criterion: 'SSO works', status: 'not-verified' })
    const conflict = await send('POST', '/api/v1/admin/planning/epics/EP-001/evidence', { criterion: 'SSO works', status: 'passed', expectedRevision: rev })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json().error.code).toBe('PLANNING_CONFLICT')
  })

  it('security: a completion without the same-origin header is rejected', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/planning/epics/EP-001/complete', headers: { cookie, 'content-type': 'application/json' }, payload: '{}' })
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/epics/EP-001.md'), 'utf8')).toContain('status: in-progress')
  })
})
