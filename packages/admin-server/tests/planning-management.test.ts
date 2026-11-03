import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createAdminServer } from '../src/server.js'
import type { AdminStorage, SessionRecord, PreferenceRecord } from '../src/storage/admin-storage.js'

function fakeStorage(): AdminStorage {
  const sessions = new Map<string, SessionRecord>()
  const prefs = new Map<string, string>()
  const cache = new Map<string, string>()
  return {
    initialize: async () => {},
    close: async () => {},
    sessions: {
      create: (s) => { sessions.set(s.id, s) },
      findById: (id) => sessions.get(id),
      deleteById: (id) => { sessions.delete(id) },
      deleteExpired: () => {},
    },
    preferences: {
      get: (k) => prefs.get(k),
      set: (k, v) => { prefs.set(k, v) },
      delete: (k) => { prefs.delete(k) },
      all: () => [...prefs.entries()].map(([key, value]) => ({ key, value } as PreferenceRecord)),
    },
    cache: {
      get: (k) => cache.get(k),
      set: (k, v) => { cache.set(k, v) },
      delete: (k) => { cache.delete(k) },
      clear: () => cache.clear(),
    },
  }
}

function tmpProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-plan-api-'))
  const w = (rel: string, c: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), c) }
  w('.kaddo/config.yml', 'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
  // A standalone Initiative to associate from Admin.
  w('knowledge/delivery/initiatives/INI-010.md', '---\ntype: initiative\nid: INI-010\ntitle: Host-side Workers\nstatus: in-progress\nowners:\n  - developer-a\n---\n# I\n')
  return dir
}

describe('admin-server — Planning Management API (WI-076)', () => {
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
  afterEach(async () => {
    await app.close()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  function send(method: string, url: string, body?: unknown) {
    const headers: Record<string, string> = { cookie }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers.origin = 'http://127.0.0.1:4173'
    if (body) headers['content-type'] = 'application/json'
    return app.inject({ method: method as any, url, headers, payload: body ? JSON.stringify(body) : undefined })
  }

  it('AC-01/AC-13: creates a Delivery Plan (Core generates the id, status draft)', async () => {
    const res = await send('POST', '/api/v1/admin/planning/plans', { title: 'Roadmap', objective: 'Ship' })
    expect(res.statusCode).toBe(200)
    const { id } = res.json()
    expect(id).toBe('PLAN-001')
    const detail = await send('GET', `/api/v1/admin/planning/plans/${id}`)
    expect(detail.json().status).toBe('draft')
    expect(detail.json().objective).toBe('Ship')
    expect(typeof detail.json().revision).toBe('string')
  })

  it('AC-04/AC-05: edits a Plan and manages milestones', async () => {
    const id = (await send('POST', '/api/v1/admin/planning/plans', { title: 'Roadmap' })).json().id
    const res = await send('PATCH', `/api/v1/admin/planning/plans/${id}`, {
      objective: 'Deliver the roadmap',
      milestones: [{ id: 'RM-01', title: 'Foundation', exitCriteria: ['Baseline approved'] }],
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().objective).toBe('Deliver the roadmap')
    expect(res.json().milestones).toHaveLength(1)
    expect(res.json().status).toBe('draft') // lifecycle untouched (AC-18)
  })

  it('AC-02/AC-08: creates Epics and rejects invalid dependencies', async () => {
    const a = (await send('POST', '/api/v1/admin/planning/epics', { title: 'A' })).json()
    expect(a.id).toBe('EP-001')
    await send('POST', '/api/v1/admin/planning/epics', { title: 'B' })
    const bad = await send('PATCH', '/api/v1/admin/planning/epics/EP-001', { dependsOn: ['EP-999'] })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.code).toBe('PLANNING_WRITE')
    const ok = await send('PATCH', '/api/v1/admin/planning/epics/EP-001', { dependsOn: ['EP-002'] })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().dependsOn).toEqual(['EP-002'])
  })

  it('VS-03: rejects an Epic whose milestone does not belong to its Plan', async () => {
    const planId = (await send('POST', '/api/v1/admin/planning/plans', { title: 'P' })).json().id
    await send('PATCH', `/api/v1/admin/planning/plans/${planId}`, { milestones: [{ id: 'RM-01' }] })
    const res = await send('POST', '/api/v1/admin/planning/epics', { title: 'E', plan: planId, milestone: 'RM-99' })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('PLANNING_WRITE')
  })

  it('AC-09/AC-11/VS-09: associates then disassociates an Initiative without touching it', async () => {
    const epicId = (await send('POST', '/api/v1/admin/planning/epics', { title: 'E' })).json().id
    const assoc = await send('POST', `/api/v1/admin/planning/epics/${epicId}/initiatives`, { initiativeId: 'INI-010' })
    expect(assoc.statusCode).toBe(200)
    let epic = await send('GET', `/api/v1/admin/planning/epics/${epicId}`)
    expect(epic.json().initiatives.map((i: { id: string }) => i.id)).toContain('INI-010')

    const remove = await send('DELETE', `/api/v1/admin/planning/epics/${epicId}/initiatives/INI-010`)
    expect(remove.statusCode).toBe(200)
    epic = await send('GET', `/api/v1/admin/planning/epics/${epicId}`)
    expect(epic.json().initiatives).toHaveLength(0)
    // Removing an association the Initiative no longer has is rejected, not silently applied.
    const again = await send('DELETE', `/api/v1/admin/planning/epics/${epicId}/initiatives/INI-010`)
    expect(again.statusCode).toBe(400)
  })

  it('AC-15/VS-10: a stale expectedRevision yields 409 PLANNING_CONFLICT', async () => {
    const id = (await send('POST', '/api/v1/admin/planning/plans', { title: 'P' })).json().id
    const stale = (await send('GET', `/api/v1/admin/planning/plans/${id}`)).json().revision
    await send('PATCH', `/api/v1/admin/planning/plans/${id}`, { objective: 'changed' })
    const conflict = await send('PATCH', `/api/v1/admin/planning/plans/${id}`, { objective: 'mine', expectedRevision: stale })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json().error.code).toBe('PLANNING_CONFLICT')
  })

  it('security: a planning write without the same-origin header is rejected', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/admin/planning/plans',
      headers: { cookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ title: 'X' }),
    })
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    // No Plan artifact was created by the rejected request.
    expect(fs.existsSync(path.join(dir, 'knowledge/delivery/plans'))).toBe(false)
  })
})
